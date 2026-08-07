import { isTransferTx } from './utils';

/**
 * Modelo contable de tarjetas de crédito
 * ──────────────────────────────────────
 * · Consumo con tarjeta: el gasto real, ya incluido en "Gastos".
 * · Pago de tarjeta: dinero que sale del banco hacia la tarjeta. NO es un
 *   gasto nuevo — liquida consumos que ya se contaron cuando se hicieron.
 *   Sumarlo a Gastos duplicaría el dinero.
 *
 * IMPORTANTE: la detección no puede depender solo de es_traspaso. En la BD
 * hay pagos de tarjeta sin esa marca; si se tratan como gasto corriente se
 * duplican contra su consumo. Por eso se reconocen también por contraparte,
 * por texto explícito y por categoría Transferencias + nombre de tarjeta.
 */

const PAYMENT_HINTS = ['pago de tarjeta', 'pago tarjeta', 'pago tc', 'pago tarj'];

function txText(tx) {
  return `${tx.Descripción || ''} ${tx.Comercio || ''} ${tx.revision_motivo || ''}`.toLowerCase();
}

/** Nombre de la tarjeta mencionada en el texto de la transacción, si lo hay. */
function cardFromText(tx, cardNames) {
  const text = txText(tx);
  return cardNames.find(name => name && text.includes(name.toLowerCase())) || null;
}

function hasPaymentHint(tx) {
  const text = txText(tx);
  return PAYMENT_HINTS.some(h => text.includes(h));
}

/**
 * ¿Esta transacción es el pago de una tarjeta de crédito?
 * Funciona con o sin la marca es_traspaso.
 */
export function isCardPaymentTx(tx, cardNames = []) {
  if (!cardNames.length) return false;
  const cards = new Set(cardNames);
  const monto = Number(tx.Monto) || 0;

  // En la propia tarjeta: solo el abono que entra es un pago.
  // Un cargo hecho CON la tarjeta es consumo, nunca pago.
  if (cards.has(tx.Cuenta)) return monto > 0;

  // Desde una cuenta que no es tarjeta, solo cuentan las salidas
  if (monto >= 0) return false;

  // 1. Contraparte explícita: la señal más fiable
  if (tx.traspaso_contraparte && cards.has(tx.traspaso_contraparte)) return true;
  // 2. Texto inequívoco ("pago de tarjeta …")
  if (hasPaymentHint(tx)) return true;
  // 3. Movimiento interno declarado + el texto nombra una tarjeta
  if ((tx.es_traspaso || tx.Categoría === 'Transferencias') && cardFromText(tx, cardNames)) return true;

  return false;
}

/**
 * Movimientos que no son gasto ni ingreso real: traspasos entre cuentas
 * propias y pagos de tarjeta. Es el filtro que usan Gastos, Ingresos y
 * Top Categorías para no duplicar dinero.
 */
export function isInternalMovement(tx, cardNames = []) {
  return isTransferTx(tx) || isCardPaymentTx(tx, cardNames);
}

/**
 * Reparte las transacciones del período en consumo con tarjeta, pago de
 * tarjeta y gasto directo. Devuelve las transacciones además de los totales
 * para poder desglosarlas al hacer clic en una métrica.
 *
 * @param {Array} transactions transacciones ya filtradas por período
 * @param {Array<string>} cardNames nombres de cuentas tipo tarjeta de crédito
 */
export function classifyCardTransactions(transactions = [], cardNames = []) {
  const cards = new Set(cardNames);
  const porTarjeta = {};
  const ensure = (name) => (porTarjeta[name] ||= { name, consumoTxs: [], pagoTxs: [] });

  const consumoTxs = [];
  const pagoTxs = [];
  const directoTxs = [];
  const sinConfirmarTxs = [];
  const sinMarcarTxs = [];
  const seen = new Set();

  for (const t of transactions) {
    const monto = Number(t.Monto) || 0;
    const isCardAccount = cards.has(t.Cuenta);
    const contraparte = t.traspaso_contraparte;

    // 1. Pago de tarjeta — se detecta con o sin la marca es_traspaso
    if (isCardPaymentTx(t, cardNames)) {
      // Los dos lados de un mismo pago comparten traspaso_id: contar una vez
      const key = t.traspaso_id ? `p:${t.traspaso_id}` : `s:${t.id}`;
      if (!seen.has(key)) {
        seen.add(key);
        pagoTxs.push(t);
        // Sin contraparte explícita la atribución sale del texto: es inferida
        const hasExplicitTarget = isCardAccount || (contraparte && cards.has(contraparte));
        if (!hasExplicitTarget) sinConfirmarTxs.push(t);
        // Pagos que la BD no marcó como traspaso: son los que se duplicaban
        if (!t.es_traspaso) sinMarcarTxs.push(t);

        const target = isCardAccount
          ? t.Cuenta
          : (contraparte && cards.has(contraparte) ? contraparte : (cardFromText(t, cardNames) || 'Sin identificar'));
        ensure(target).pagoTxs.push(t);
      }
      continue;
    }

    // 2. Los demás traspasos (entre cuentas propias) no son gasto ni consumo
    if (isTransferTx(t)) continue;

    // 3. Gasto real: con tarjeta o directo
    if (monto < 0 || t.Tipo === 'Gasto') {
      if (isCardAccount) {
        consumoTxs.push(t);
        ensure(t.Cuenta).consumoTxs.push(t);
      } else {
        directoTxs.push(t);
      }
    }
  }

  return { consumoTxs, pagoTxs, directoTxs, sinConfirmarTxs, sinMarcarTxs, porTarjeta };
}

const sumAbs = (txs) => txs.reduce((a, t) => a + Math.abs(Number(t.Monto) || 0), 0);

export function computeCardMetrics(transactions = [], cardNames = []) {
  const c = classifyCardTransactions(transactions, cardNames);

  return {
    consumo: sumAbs(c.consumoTxs),
    pagos: sumAbs(c.pagoTxs),
    pagosSinConfirmar: sumAbs(c.sinConfirmarTxs),
    pagosSinMarcar: sumAbs(c.sinMarcarTxs),
    pagosSinMarcarCount: c.sinMarcarTxs.length,
    gastoDirecto: sumAbs(c.directoTxs),
    consumoTxs: c.consumoTxs,
    pagoTxs: c.pagoTxs,
    directoTxs: c.directoTxs,
    sinMarcarTxs: c.sinMarcarTxs,
    porTarjeta: Object.values(c.porTarjeta)
      .map(e => ({
        name: e.name,
        consumo: sumAbs(e.consumoTxs),
        pagos: sumAbs(e.pagoTxs),
        txCount: e.consumoTxs.length,
        consumoTxs: e.consumoTxs,
        pagoTxs: e.pagoTxs,
      }))
      .sort((a, b) => (b.consumo + b.pagos) - (a.consumo + a.pagos)),
    hasCards: cardNames.length > 0,
  };
}

/** Serie mensual de consumo vs pago, para el gráfico comparativo. */
export function cardMonthlySeries(transactions = [], cardNames = []) {
  const byMonth = {};
  for (const t of transactions) {
    const ym = t.Fecha?.slice(0, 7);
    if (!ym) continue;
    (byMonth[ym] ||= []).push(t);
  }
  return Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([ym, txs]) => {
      const m = computeCardMetrics(txs, cardNames);
      return {
        month: new Date(ym + '-02').toLocaleDateString('es', { month: 'short', year: '2-digit' }),
        ym,
        Consumo: +m.consumo.toFixed(2),
        Pagos: +m.pagos.toFixed(2),
      };
    });
}
