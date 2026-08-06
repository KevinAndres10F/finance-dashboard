import { useState, useMemo, useCallback } from 'react';
import {
  buildPeriods, resolvePeriod, filterByPeriod, previousPeriod,
  periodMonths, isCurrentMonth, availableYearsFrom,
} from '../lib/period';

const KEY = 'finance-period';

function loadSelection() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : { id: 'current-month' };
  } catch {
    return { id: 'current-month' };
  }
}

/**
 * Estado del selector de período, persistido en localStorage y compartido
 * entre pestañas (cada una lo lee al montarse).
 */
export function usePeriod(transactions = []) {
  const [selection, setSelectionState] = useState(loadSelection);

  const setSelection = useCallback((next) => {
    setSelectionState(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* storage lleno o bloqueado */ }
  }, []);

  const periods = useMemo(
    () => buildPeriods(availableYearsFrom(transactions)),
    [transactions]
  );

  const period = useMemo(() => resolvePeriod(periods, selection), [periods, selection]);

  const periodTxs = useMemo(() => filterByPeriod(transactions, period), [transactions, period]);

  const prev = useMemo(() => previousPeriod(period), [period]);
  const prevTxs = useMemo(
    () => (prev ? filterByPeriod(transactions, prev) : []),
    [transactions, prev]
  );

  return {
    periods,
    selection,
    setSelection,
    period,
    periodTxs,
    prevTxs,
    hasPrev: !!prev,
    months: periodMonths(period, transactions),
    isCurrentMonth: isCurrentMonth(period),
  };
}
