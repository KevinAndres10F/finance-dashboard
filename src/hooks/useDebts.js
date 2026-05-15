import { useState, useCallback, useMemo } from 'react';

const KEY = 'finance-debts';

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
}
function save(list) { localStorage.setItem(KEY, JSON.stringify(list)); }

export function useDebts() {
  const [debts, setDebts] = useState(load);

  const addDebt = useCallback((d) => {
    const debt = {
      id: Date.now() + Math.random(),
      name: d.name,
      kind: d.kind || 'credit_card',
      balance: Number(d.balance) || 0,
      apr: Number(d.apr) || 0,
      minPayment: Number(d.minPayment) || 0,
      dueDay: Number(d.dueDay) || 1,
      createdAt: new Date().toISOString(),
    };
    const next = [...debts, debt];
    setDebts(next); save(next);
    return debt;
  }, [debts]);

  const updateDebt = useCallback((id, patch) => {
    const next = debts.map(d => d.id === id ? { ...d, ...patch } : d);
    setDebts(next); save(next);
  }, [debts]);

  const removeDebt = useCallback((id) => {
    const next = debts.filter(d => d.id !== id);
    setDebts(next); save(next);
  }, [debts]);

  const totals = useMemo(() => {
    const totalBalance = debts.reduce((s, d) => s + Number(d.balance || 0), 0);
    const totalMinPayment = debts.reduce((s, d) => s + Number(d.minPayment || 0), 0);
    const weightedApr = totalBalance > 0
      ? debts.reduce((s, d) => s + (Number(d.apr || 0) * Number(d.balance || 0)), 0) / totalBalance
      : 0;
    return { totalBalance, totalMinPayment, weightedApr, count: debts.length };
  }, [debts]);

  return { debts, addDebt, updateDebt, removeDebt, totals };
}

/**
 * Simulador de pago de deudas: snowball (menor balance primero) o avalanche (mayor APR primero).
 * Aplica el pago mínimo a todas y el extra a la deuda objetivo. Cuando una deuda se paga,
 * su pago mínimo + el extra se redirige a la siguiente.
 */
export function simulateDebtPayoff(debts, extraMonthly, strategy = 'avalanche') {
  if (!debts.length) return { months: 0, totalInterest: 0, schedule: [], byDebt: {} };

  const ordered = [...debts]
    .map(d => ({ id: d.id, name: d.name, balance: Number(d.balance), apr: Number(d.apr), minPayment: Number(d.minPayment) }))
    .filter(d => d.balance > 0);

  const sortFn = strategy === 'snowball'
    ? (a, b) => a.balance - b.balance
    : (a, b) => b.apr - a.apr;

  let months = 0;
  let totalInterest = 0;
  const schedule = [];
  const byDebt = Object.fromEntries(ordered.map(d => [d.id, { interestPaid: 0, paidOffMonth: null }]));

  while (ordered.some(d => d.balance > 0.005) && months < 600) {
    months++;
    let monthInterest = 0;

    // Devengar interés mensual a cada deuda activa
    for (const d of ordered) {
      if (d.balance <= 0) continue;
      const interest = (d.balance * (d.apr / 100)) / 12;
      d.balance += interest;
      byDebt[d.id].interestPaid += interest;
      totalInterest += interest;
      monthInterest += interest;
    }

    // Aplicar pagos mínimos
    let extraAvail = extraMonthly;
    for (const d of ordered) {
      if (d.balance <= 0) continue;
      const pay = Math.min(d.minPayment, d.balance);
      d.balance -= pay;
      // si el pago mínimo cubre más que el balance, el sobrante alimenta el extra
      const overflow = d.minPayment - pay;
      if (overflow > 0) extraAvail += overflow;
    }

    // Aplicar extra a la deuda objetivo según estrategia
    const active = ordered.filter(d => d.balance > 0).sort(sortFn);
    let extraLeft = extraAvail;
    for (const target of active) {
      if (extraLeft <= 0) break;
      const pay = Math.min(extraLeft, target.balance);
      target.balance -= pay;
      extraLeft -= pay;
    }

    // Marcar deudas pagadas
    for (const d of ordered) {
      if (d.balance <= 0.005 && byDebt[d.id].paidOffMonth === null) {
        byDebt[d.id].paidOffMonth = months;
      }
    }

    schedule.push({
      month: months,
      totalBalance: ordered.reduce((s, d) => s + Math.max(0, d.balance), 0),
      monthInterest,
    });
  }

  return { months, totalInterest, schedule, byDebt };
}
