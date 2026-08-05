import { useState, useMemo, useCallback, useEffect } from 'react';
import { supabase, isAuthError } from '../lib/supabase';
import { fechaLocal } from '../lib/utils';

const KEY = 'finance-accounts';
const HISTORY_KEY = 'finance-networth-history';

export const ACCOUNT_TYPES = [
  { id: 'checking',    label: 'Corriente',        kind: 'asset',     icon: 'wallet' },
  { id: 'savings',     label: 'Ahorros',          kind: 'asset',     icon: 'piggy' },
  { id: 'cash',        label: 'Efectivo',         kind: 'asset',     icon: 'banknote' },
  { id: 'investment',  label: 'Inversión',        kind: 'asset',     icon: 'trending' },
  { id: 'crypto',      label: 'Criptomonedas',    kind: 'asset',     icon: 'bitcoin' },
  { id: 'realestate',  label: 'Inmueble',         kind: 'asset',     icon: 'home' },
  { id: 'retirement',  label: 'Jubilación',       kind: 'asset',     icon: 'shield' },
  { id: 'other_asset', label: 'Otro activo',      kind: 'asset',     icon: 'circle' },
  { id: 'credit_card', label: 'Tarjeta crédito',  kind: 'liability', icon: 'card' },
  { id: 'loan',        label: 'Préstamo',         kind: 'liability', icon: 'file' },
  { id: 'mortgage',    label: 'Hipoteca',         kind: 'liability', icon: 'home' },
  { id: 'other_debt',  label: 'Otra deuda',       kind: 'liability', icon: 'circle' },
];

const TIPO_CUENTA_MAP = {
  corriente: 'checking',
  ahorros: 'savings',
  tarjeta_credito: 'credit_card',
  efectivo: 'cash',
  inversion: 'investment',
};

const CREDIT_CARD_PATTERNS = ['tc', 'tarjeta', 'diners', 'visa', 'mastercard', 'amex'];

function inferAccountType(name) {
  const lower = name.toLowerCase();
  if (CREDIT_CARD_PATTERNS.some(p => lower.includes(p))) return 'credit_card';
  return 'checking';
}

function inferKind(name) {
  const type = inferAccountType(name);
  return ACCOUNT_TYPES.find(t => t.id === type)?.kind || 'asset';
}

function loadLocal() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
}
function saveLocal(list) { localStorage.setItem(KEY, JSON.stringify(list)); }

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; } catch { return []; }
}
function saveHistory(h) { localStorage.setItem(HISTORY_KEY, JSON.stringify(h)); }

export function useAccounts(transactions = []) {
  const [sbAccounts, setSbAccounts] = useState([]);
  const [sbError, setSbError]       = useState(null);
  const [localAccounts, setLocalAccounts] = useState(loadLocal);
  const [history, setHistory]       = useState(loadHistory);

  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('finanzas_personales_cuentas')
        .select('*');
      if (cancelled) return;
      if (error) {
        if (isAuthError(error)) {
          setSbError('sin permisos de lectura en cuentas');
        } else {
          setSbError(error.message);
        }
        return;
      }
      setSbAccounts(data || []);
    })();
    return () => { cancelled = true; };
  }, []);

  const accounts = useMemo(() => {
    const distinctAccounts = new Set();
    for (const t of transactions) {
      if (t.Cuenta) distinctAccounts.add(t.Cuenta);
    }

    const sbMap = {};
    for (const a of sbAccounts) {
      sbMap[a.nombre || a.cuenta || ''] = a;
    }

    const movementsByAccount = {};
    for (const t of transactions) {
      const acc = t.Cuenta || 'Principal';
      if (!movementsByAccount[acc]) movementsByAccount[acc] = 0;
      movementsByAccount[acc] += Number(t.Monto) || 0;
    }

    const merged = [];
    for (const name of distinctAccounts) {
      const sb = sbMap[name];
      const saldoInicial = sb ? Number(sb.saldo_inicial || 0) : 0;
      const rawTipo = sb?.tipo_cuenta || '';
      const tipoCuenta = TIPO_CUENTA_MAP[rawTipo] || (ACCOUNT_TYPES.some(t => t.id === rawTipo) ? rawTipo : inferAccountType(name));
      const kind = ACCOUNT_TYPES.find(t => t.id === tipoCuenta)?.kind || inferKind(name);
      const movements = movementsByAccount[name] || 0;
      const balance = saldoInicial + movements;
      const hasSaldoInicial = sb ? saldoInicial !== 0 : false;

      merged.push({
        id: sb?.id || `derived:${name}`,
        name,
        type: tipoCuenta,
        kind,
        saldoInicial,
        movements,
        balance,
        hasSaldoInicial,
        includeInNetWorth: sb?.incluir_patrimonio ?? true,
        institution: sb?.institucion || '',
        currency: sb?.moneda || 'USD',
      });
    }

    const derivedNames = new Set(merged.map(a => a.name));
    for (const la of localAccounts) {
      if (!derivedNames.has(la.name)) {
        merged.push({
          ...la,
          kind: ACCOUNT_TYPES.find(t => t.id === la.type)?.kind || 'asset',
          saldoInicial: Number(la.balance || 0),
          movements: movementsByAccount[la.name] || 0,
          balance: Number(la.balance || 0) + (movementsByAccount[la.name] || 0),
          hasSaldoInicial: Number(la.balance || 0) !== 0,
          includeInNetWorth: la.includeInNetWorth ?? true,
        });
      }
    }

    return merged;
  }, [transactions, sbAccounts, localAccounts]);

  const totals = useMemo(() => {
    const included = accounts.filter(a => a.includeInNetWorth);
    const assets = included
      .filter(a => a.kind === 'asset')
      .reduce((s, a) => s + a.balance, 0);
    const liabilities = included
      .filter(a => a.kind === 'liability')
      .reduce((s, a) => s + Math.abs(a.balance), 0);
    return { assets, liabilities, netWorth: assets - liabilities };
  }, [accounts]);

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
    const next = [...localAccounts, acc];
    setLocalAccounts(next); saveLocal(next);
    return acc;
  }, [localAccounts]);

  const updateAccount = useCallback((id, patch) => {
    const next = localAccounts.map(a => a.id === id ? { ...a, ...patch } : a);
    setLocalAccounts(next); saveLocal(next);
  }, [localAccounts]);

  const removeAccount = useCallback((id) => {
    const next = localAccounts.filter(a => a.id !== id);
    setLocalAccounts(next); saveLocal(next);
  }, [localAccounts]);

  useEffect(() => {
    if (accounts.length === 0) return;
    const today = fechaLocal(new Date());
    const month = today.slice(0, 7);
    const last = history[history.length - 1];
    if (last?.month === month) {
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

  return { accounts, addAccount, updateAccount, removeAccount, totals, history, sbError };
}
