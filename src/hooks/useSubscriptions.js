import { useState, useCallback, useMemo } from 'react';

const KEY = 'finance-subscriptions';
const IGNORED_KEY = 'finance-subscriptions-ignored';

function load(k, fallback) {
  try { return JSON.parse(localStorage.getItem(k)) || fallback; } catch { return fallback; }
}
function save(k, v) { localStorage.setItem(k, JSON.stringify(v)); }

/**
 * Detecta suscripciones / cobros recurrentes a partir del historial de transacciones.
 * Heurística: misma descripción + monto similar (±5%) repetido en al menos 2 meses distintos.
 * Se permite añadir manualmente y marcar/descartar suscripciones detectadas.
 */
export function useSubscriptions(transactions = []) {
  const [manual, setManual]   = useState(() => load(KEY, []));
  const [ignored, setIgnored] = useState(() => load(IGNORED_KEY, []));

  const detected = useMemo(() => {
    const groups = {};
    for (const t of transactions) {
      const isExpense = t.Tipo === 'Gasto' || Number(t.Monto) < 0;
      if (!isExpense) continue;
      const desc = String(t.Descripción || '').trim().toLowerCase();
      if (!desc) continue;
      if (!groups[desc]) groups[desc] = [];
      groups[desc].push({ amount: Math.abs(Number(t.Monto || 0)), date: t.Fecha, category: t.Categoría });
    }

    const items = [];
    for (const [desc, occs] of Object.entries(groups)) {
      if (occs.length < 2) continue;
      // months únicos
      const months = new Set(occs.map(o => o.date?.slice(0, 7)).filter(Boolean));
      if (months.size < 2) continue;
      // monto medio + variación
      const avg = occs.reduce((s, o) => s + o.amount, 0) / occs.length;
      const within = occs.filter(o => Math.abs(o.amount - avg) / avg <= 0.10);
      if (within.length / occs.length < 0.6) continue;

      // estimar próxima fecha de cobro
      const sorted = occs.map(o => o.date).filter(Boolean).sort();
      const lastDate = sorted[sorted.length - 1];
      const monthsCount = months.size;
      const cadence = monthsCount >= 2 ? 'monthly' : 'unknown';
      const next = lastDate ? estimateNext(lastDate) : null;

      const id = `auto:${desc}`;
      if (ignored.includes(id)) continue;

      items.push({
        id,
        name: prettify(desc),
        amount: +avg.toFixed(2),
        category: occs[0].category || 'Suscripción',
        cadence,
        nextDate: next,
        lastDate,
        occurrences: occs.length,
        source: 'auto',
      });
    }
    return items.sort((a, b) => b.amount - a.amount);
  }, [transactions, ignored]);

  const all = useMemo(() => {
    const m = manual.map(s => ({ ...s, source: 'manual' }));
    return [...m, ...detected];
  }, [manual, detected]);

  const monthlyTotal = useMemo(() => all.reduce((s, x) => {
    const m = x.cadence === 'yearly' ? x.amount / 12 : x.amount;
    return s + m;
  }, 0), [all]);

  const addManual = useCallback((data) => {
    const sub = {
      id: 'manual:' + (Date.now() + Math.random()),
      name: data.name,
      amount: Number(data.amount) || 0,
      category: data.category || 'Suscripción',
      cadence: data.cadence || 'monthly',
      nextDate: data.nextDate || null,
      notes: data.notes || '',
    };
    const next = [...manual, sub];
    setManual(next); save(KEY, next);
  }, [manual]);

  const removeManual = useCallback((id) => {
    const next = manual.filter(s => s.id !== id);
    setManual(next); save(KEY, next);
  }, [manual]);

  const ignore = useCallback((id) => {
    const next = [...ignored, id];
    setIgnored(next); save(IGNORED_KEY, next);
  }, [ignored]);

  const unignore = useCallback((id) => {
    const next = ignored.filter(x => x !== id);
    setIgnored(next); save(IGNORED_KEY, next);
  }, [ignored]);

  const upcomingBills = useMemo(() => {
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now();
    const items = all
      .map(s => ({ ...s, nextDate: s.nextDate || (s.lastDate ? estimateNext(s.lastDate) : null) }))
      .filter(s => s.nextDate)
      .map(s => ({ ...s, daysUntil: Math.ceil((new Date(s.nextDate).getTime() - now) / 86400000) }))
      .filter(s => s.daysUntil >= -1 && s.daysUntil <= 60)
      .sort((a, b) => a.daysUntil - b.daysUntil);
    return items;
  }, [all]);

  return { detected, manual, all, monthlyTotal, upcomingBills, addManual, removeManual, ignore, unignore, ignored };
}

function estimateNext(lastDate) {
  const d = new Date(lastDate);
  if (isNaN(d.getTime())) return null;
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 10);
}

function prettify(s) {
  return s.replace(/\b\w/g, c => c.toUpperCase()).slice(0, 60);
}
