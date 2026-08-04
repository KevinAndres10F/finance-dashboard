import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

/* ─── Currency formatting ──────────────────────────────────────── */
const CURRENCY_DEFAULTS = {
  USD: { symbol: '$',  locale: 'en-US' },
  EUR: { symbol: '€',  locale: 'es-ES' },
  MXN: { symbol: '$',  locale: 'es-MX' },
  COP: { symbol: '$',  locale: 'es-CO' },
  ARS: { symbol: '$',  locale: 'es-AR' },
  GBP: { symbol: '£',  locale: 'en-GB' },
  BRL: { symbol: 'R$', locale: 'pt-BR' },
};

export function getCurrencyConfig(code = 'USD') {
  return CURRENCY_DEFAULTS[code] || CURRENCY_DEFAULTS.USD;
}

export function fmtMoney(value, currency = 'USD', { sign = false, decimals = 2 } = {}) {
  const cfg = getCurrencyConfig(currency);
  const n = Number(value) || 0;
  const formatted = Math.abs(n).toLocaleString(cfg.locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  const prefix = sign ? (n >= 0 ? '+' : '-') : (n < 0 ? '-' : '');
  return `${prefix}${cfg.symbol}${formatted}`;
}

/* ─── Stable transaction id ────────────────────────────────────── */
export function txKey(t, idx = 0) {
  if (t.id) return String(t.id);
  return `${t.Fecha || ''}|${t.Descripción || ''}|${t.Monto || 0}|${t.Categoría || ''}|${idx}`;
}

/* ─── Timezone-correct date helpers (America/Guayaquil = UTC-5) ── */
const _dtf = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Guayaquil', year: 'numeric', month: '2-digit', day: '2-digit' });

export function fechaLocal(ts) {
  if (!ts) return '';
  return _dtf.format(typeof ts === 'string' ? new Date(ts) : ts);
}

export function mesLocal(ts) {
  return fechaLocal(ts).slice(0, 7);
}

/* ─── Date utilities ───────────────────────────────────────────── */
export function daysBetween(a, b) {
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return Math.round(ms / 86400000);
}

export function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export function fmtDate(d, locale = 'es') {
  if (!d) return '';
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
}
