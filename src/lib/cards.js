import { isTransferTx } from './utils';

/**
 * Modelo contable de tarjetas de crédito
 * ──────────────────────────────────────
 * · Consumo con tarjeta: el gasto real, ya incluido en "Gastos".
 * · Pago de tarjeta: traspaso desde una cuenta bancaria hacia la tarjeta.
 *   NO es un gasto nuevo — liquida consumos que ya se contaron. Contarlo
 *   como gasto duplicaría el dinero.
 *
 * Por eso el pago se reporta aparte y nunca se suma a Gastos.
 */

const PAYMENT_HINTS = ['pago de tarjeta', 'pago tarjeta', 'pago tc'];

function txText(tx) {
  return `${tx.Descripción || ''} ${tx.Comercio || ''} ${tx.revision_motivo || ''}`.toLowerCase();
}

/** Nombre de la tarjeta mencionada en el texto de la transacción, si lo hay. */
function cardFromText(tx, cardNames) {
  const text = txText(tx);
  return cardNames.find(name => name && text.includes(name.toLowerCase())) || null;
}

/** ¿El texto sugiere que es un pago de tarjeta? (traspasos de una sola pata) */
function looksLikeCardPayment(tx, cardNames) {
  const text = txText(tx);
  return PAYMENT_HINTS.some(h => text.includes(h)) || !!cardFromText(tx, cardNames);
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
  const seen = new Set();

  for (const t of transactions) {
    const monto = Number(t.Monto) || 0;
    const isCardAccount = cards.has(t.Cuenta);

    if (isTransferTx(t)) {
      const contraparte = t.traspaso_contraparte;
      // Pata que sale del banco hacia una tarjeta, o pata que entra a la tarjeta
      const definite = (isCardAccount && monto > 0)
        || (!isCardAccount && monto < 0 && contraparte && cards.has(contraparte));
      // Traspaso de una sola pata (el banco no notifica el ingreso):
      // se reconoce por el texto de la transacción
      const probable = !definite && !isCardAccount && monto < 0 && !contraparte
        && looksLikeCardPayment(t, cardNames);

      if (definite || probable) {
        // Los dos lados de un mismo traspaso comparten traspaso_id: contar una vez
        const key = t.traspaso_id ? `p:${t.traspaso_id}` : `s:${t.id}`;
        if (!seen.has(key)) {
          seen.add(key);
          pagoTxs.push(t);
          if (probable) sinConfirmarTxs.push(t);
          // Sin contraparte se intenta identificar la tarjeta por el texto
          const target = isCardAccount
            ? t.Cuenta
            : (contraparte || cardFromText(t, cardNames) || 'Sin identificar');
          ensure(target).pagoTxs.push(t);
        }
      }
      // Un traspaso nunca es consumo
      continue;
    }

    if (monto < 0 || t.Tipo === 'Gasto') {
      if (isCardAccount) {
        consumoTxs.push(t);
        ensure(t.Cuenta).consumoTxs.push(t);
      } else {
        directoTxs.push(t);
      }
    }
  }

  return { consumoTxs, pagoTxs, directoTxs, sinConfirmarTxs, porTarjeta };
}

const sumAbs = (txs) => txs.reduce((a, t) => a + Math.abs(Number(t.Monto) || 0), 0);

export function computeCardMetrics(transactions = [], cardNames = []) {
  const c = classifyCardTransactions(transactions, cardNames);

  return {
    consumo: sumAbs(c.consumoTxs),
    pagos: sumAbs(c.pagoTxs),
    pagosSinConfirmar: sumAbs(c.sinConfirmarTxs),
    gastoDirecto: sumAbs(c.directoTxs),
    consumoTxs: c.consumoTxs,
    pagoTxs: c.pagoTxs,
    directoTxs: c.directoTxs,
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
