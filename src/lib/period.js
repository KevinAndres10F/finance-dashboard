import { mesLocal } from './utils';

/* ─── Aritmética sobre claves de mes 'YYYY-MM' ─────────────────── */
export function addMonthsKey(ym, n) {
  const [y, m] = ym.split('-').map(Number);
  const total = y * 12 + (m - 1) + n;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  return `${ny}-${String(nm).padStart(2, '0')}`;
}

export function monthsBetween(startYm, endYm) {
  const [ys, ms] = startYm.split('-').map(Number);
  const [ye, me] = endYm.split('-').map(Number);
  return (ye * 12 + me) - (ys * 12 + ms) + 1;
}

export function monthLabel(ym, { long = false } = {}) {
  const d = new Date(ym + '-02');
  return d.toLocaleDateString('es', { month: long ? 'long' : 'short', year: 'numeric' });
}

/**
 * Un período es { id, label, start, end } donde start/end son claves 'YYYY-MM'
 * inclusivas. start === null significa "desde el principio".
 */
export function buildPeriods(availableYears = []) {
  const now = mesLocal(new Date());
  const currentYear = now.slice(0, 4);

  const periods = [
    { id: 'current-month', label: 'Este mes',        start: now, end: now },
    { id: 'last-month',    label: 'Mes anterior',    start: addMonthsKey(now, -1), end: addMonthsKey(now, -1) },
    { id: 'last-3',        label: 'Últimos 3 meses', start: addMonthsKey(now, -2), end: now },
    { id: 'last-6',        label: 'Últimos 6 meses', start: addMonthsKey(now, -5), end: now },
    { id: 'last-12',       label: 'Últimos 12 meses', start: addMonthsKey(now, -11), end: now },
  ];

  const years = [...new Set([currentYear, ...availableYears])].sort((a, b) => b.localeCompare(a));
  for (const y of years) {
    periods.push({ id: `year-${y}`, label: `Año ${y}`, start: `${y}-01`, end: `${y}-12` });
  }

  periods.push({ id: 'all', label: 'Todo el histórico', start: null, end: null });
  return periods;
}

export function resolvePeriod(periods, selection) {
  if (selection?.id === 'custom') {
    const start = selection.start || null;
    const end = selection.end || mesLocal(new Date());
    return {
      id: 'custom',
      label: start ? `${monthLabel(start)} — ${monthLabel(end)}` : `Hasta ${monthLabel(end)}`,
      start, end,
    };
  }
  return periods.find(p => p.id === selection?.id) || periods[0];
}

/** Filtra transacciones por el período (comparación lexicográfica sobre 'YYYY-MM'). */
export function filterByPeriod(transactions, period) {
  if (!period || (!period.start && !period.end)) return transactions;
  return transactions.filter(t => {
    const ym = t.Fecha?.slice(0, 7);
    if (!ym) return false;
    if (period.start && ym < period.start) return false;
    if (period.end && ym > period.end) return false;
    return true;
  });
}

/** Período inmediatamente anterior, del mismo largo, para comparativas. */
export function previousPeriod(period) {
  if (!period?.start || !period?.end) {
    // "Todo": no hay un anterior comparable
    return null;
  }
  const len = monthsBetween(period.start, period.end);
  return {
    id: `${period.id}-prev`,
    label: 'período anterior',
    start: addMonthsKey(period.start, -len),
    end: addMonthsKey(period.start, -1),
  };
}

/** Nº de meses que abarca el período (para promedios mensuales). */
export function periodMonths(period, transactions = []) {
  if (period?.start && period?.end) return monthsBetween(period.start, period.end);
  const keys = transactions.map(t => t.Fecha?.slice(0, 7)).filter(Boolean).sort();
  if (keys.length === 0) return 1;
  return monthsBetween(keys[0], keys[keys.length - 1]);
}

/** True si el período es exactamente el mes en curso (habilita métricas diarias). */
export function isCurrentMonth(period) {
  const now = mesLocal(new Date());
  return period?.start === now && period?.end === now;
}

export function availableYearsFrom(transactions = []) {
  return [...new Set(transactions.map(t => t.Fecha?.slice(0, 4)).filter(Boolean))]
    .sort((a, b) => b.localeCompare(a));
}
