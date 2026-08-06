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
 * @param {Array} transactions transacciones ya filtradas por período
 * @param {Array<string>} cardNames nombres de cuentas tipo tarjeta de crédito
 */
export function computeCardMetrics(transactions = [], cardNames = []) {
  const cards = new Set(cardNames);
  const porTarjeta = {};
  const ensure = (name) => (porTarjeta[name] ||= { name, consumo: 0, pagos: 0, txCount: 0 });

  let consumo = 0;
  let pagos = 0;
  let gastoDirecto = 0;
  let pagosSinConfirmar = 0;
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
          const amount = Math.abs(monto);
          pagos += amount;
          if (probable) pagosSinConfirmar += amount;
          // Sin contraparte se intenta identificar la tarjeta por el texto
          const target = isCardAccount
            ? t.Cuenta
            : (contraparte || cardFromText(t, cardNames) || 'Sin identificar');
          ensure(target).pagos += amount;
        }
      }
      // Un traspaso nunca es consumo
      continue;
    }

    if (monto < 0 || t.Tipo === 'Gasto') {
      const amount = Math.abs(monto);
      if (isCardAccount) {
        consumo += amount;
        const e = ensure(t.Cuenta);
        e.consumo += amount;
        e.txCount += 1;
      } else {
        gastoDirecto += amount;
      }
    }
  }

  return {
    consumo,
    pagos,
    pagosSinConfirmar,
    gastoDirecto,
    porTarjeta: Object.values(porTarjeta).sort((a, b) => (b.consumo + b.pagos) - (a.consumo + a.pagos)),
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
