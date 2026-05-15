import { useState, useMemo, useCallback, useEffect } from 'react';

const KEY = 'finance-accounts';
const HISTORY_KEY = 'finance-networth-history';

export const ACCOUNT_TYPES = [
  { id: 'checking',    label: 'Corriente',     kind: 'asset',     icon: 'wallet' },
  { id: 'savings',     label: 'Ahorros',       kind: 'asset',     icon: 'piggy' },
  { id: 'cash',        label: 'Efectivo',      kind: 'asset',     icon: 'banknote' },
  { id: 'investment',  label: 'Inversión',     kind: 'asset',     icon: 'trending' },
  { id: 'crypto',      label: 'Criptomonedas', kind: 'asset',     icon: 'bitcoin' },
  { id: 'realestate',  label: 'Inmueble',      kind: 'asset',     icon: 'home' },
  { id: 'retirement',  label: 'Jubilación',    kind: 'asset',     icon: 'shield' },
  { id: 'other_asset', label: 'Otro activo',   kind: 'asset',     icon: 'circle' },
  { id: 'credit_card', label: 'Tarjeta crédito', kind: 'liability', icon: 'card' },
  { id: 'loan',        label: 'Préstamo',      kind: 'liability', icon: 'file' },
  { id: 'mortgage',    label: 'Hipoteca',      kind: 'liability', icon: 'home' },
  { id: 'other_debt',  label: 'Otra deuda',    kind: 'liability', icon: 'circle' },
];

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
}
function save(list) { localStorage.setItem(KEY, JSON.stringify(list)); }

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; } catch { return []; }
}
function saveHistory(h) { localStorage.setItem(HISTORY_KEY, JSON.stringify(h)); }

export function useAccounts() {
  const [accounts, setAccounts] = useState(load);
  const [history, setHistory]   = useState(loadHistory);

  const addAccount = useCallback((data) => {
    const acc = {
      id: Date.now() + Math.random(),
      name: data.name,
      type: data.type || 'checking',
      balance: Number(data.balance) || 0,
      institution: data.institution || '',
      currency: data.currency || 'USD',
      includeInNetWorth: data.includeInNetWorth ?? true,
      createdAt: new Date().toISOString(),
    };
    const next = [...accounts, acc];
    setAccounts(next); save(next);
    return acc;
  }, [accounts]);

  const updateAccount = useCallback((id, patch) => {
    const next = accounts.map(a => a.id === id ? { ...a, ...patch } : a);
    setAccounts(next); save(next);
  }, [accounts]);

  const removeAccount = useCallback((id) => {
    const next = accounts.filter(a => a.id !== id);
    setAccounts(next); save(next);
  }, [accounts]);

  const totals = useMemo(() => {
    const included = accounts.filter(a => a.includeInNetWorth);
    const assets = included
      .filter(a => ACCOUNT_TYPES.find(t => t.id === a.type)?.kind === 'asset')
      .reduce((s, a) => s + Number(a.balance || 0), 0);
    const liabilities = included
      .filter(a => ACCOUNT_TYPES.find(t => t.id === a.type)?.kind === 'liability')
      .reduce((s, a) => s + Math.abs(Number(a.balance || 0)), 0);
    return { assets, liabilities, netWorth: assets - liabilities };
  }, [accounts]);

  // Snapshot histórico mensual del net worth
  useEffect(() => {
    if (accounts.length === 0) return;
    const today = new Date().toISOString().slice(0, 10);
    const month = today.slice(0, 7);
    const last = history[history.length - 1];
    if (last?.month === month) {
      // actualiza el snapshot del mes en curso
      if (last.netWorth !== totals.netWorth) {
        const next = [...history];
        next[next.length - 1] = { month, date: today, ...totals };
        setHistory(next); saveHistory(next);
      }
    } else {
      const next = [...history, { month, date: today, ...totals }].slice(-36);
      setHistory(next); saveHistory(next);
    }
  }, [totals.netWorth, totals.assets, totals.liabilities, accounts.length]);

  return { accounts, addAccount, updateAccount, removeAccount, totals, history };
}
