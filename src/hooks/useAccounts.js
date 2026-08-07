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

// Inverso: tipo del frontend → valor de tipo_cuenta en la BD.
// Tipos sin equivalente en español se guardan con su id tal cual
// (el mapeo de lectura ya acepta ids que existen en ACCOUNT_TYPES).
const REVERSE_TIPO_MAP = {
  checking: 'corriente',
  savings: 'ahorros',
  credit_card: 'tarjeta_credito',
  cash: 'efectivo',
  investment: 'inversion',
};

function toDbTipo(frontType) {
  return REVERSE_TIPO_MAP[frontType] || frontType;
}

function isWritePermissionError(err) {
  if (!err) return false;
  const code = String(err.code || '');
  const msg = err.message || '';
  return code === '42501' || msg.includes('permission denied') || isAuthError(err);
}

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

const CUENTAS_TABLE = 'finanzas_personales_cuentas';

export function useAccounts(transactions = []) {
  const [sbAccounts, setSbAccounts] = useState([]);
  const [sbError, setSbError]       = useState(null);
  const [writeError, setWriteError] = useState(null);
  const [localAccounts, setLocalAccounts] = useState(loadLocal);
  const [history, setHistory]       = useState(loadHistory);

  const fetchSbAccounts = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from(CUENTAS_TABLE)
      .select('*');
    if (error) {
      if (isAuthError(error)) {
        setSbError('sin permisos de lectura en cuentas');
      } else {
        setSbError(error.message);
      }
      return;
    }
    // activa=false son cuentas eliminadas (soft-delete); null cuenta como activa
    setSbAccounts((data || []).filter(a => a.activa !== false));
  }, []);

  useEffect(() => { fetchSbAccounts(); }, [fetchSbAccounts]);

  const handleWriteError = useCallback((err) => {
    if (isWritePermissionError(err)) {
      setWriteError('Sin permisos de escritura en la base de datos — los cambios no se guardaron');
    } else {
      setWriteError(err.message || 'Error al guardar');
    }
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
      // Deuda real de pasivos: -(saldo_inicial + movimientos), nunca negativa.
      // Math.abs(movimientos acumulados) inventaría deuda con el gasto histórico.
      const debt = kind === 'liability' ? Math.max(0, -balance) : 0;

      merged.push({
        id: sb?.id || `derived:${name}`,
        isSupabase: !!sb,
        name,
        type: tipoCuenta,
        kind,
        saldoInicial,
        movements,
        balance,
        debt,
        hasSaldoInicial,
        includeInNetWorth: sb?.incluir_patrimonio ?? true,
        institution: sb?.institucion || '',
        currency: sb?.moneda || 'USD',
      });
    }

    const derivedNames = new Set(merged.map(a => a.name));
    for (const la of localAccounts) {
      if (!derivedNames.has(la.name)) {
        const kind = ACCOUNT_TYPES.find(t => t.id === la.type)?.kind || 'asset';
        const balance = Number(la.balance || 0) + (movementsByAccount[la.name] || 0);
        merged.push({
          ...la,
          isSupabase: false,
          kind,
          saldoInicial: Number(la.balance || 0),
          movements: movementsByAccount[la.name] || 0,
          balance,
          debt: kind === 'liability' ? Math.max(0, -balance) : 0,
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
      .reduce((s, a) => s + a.debt, 0);
    return { assets, liabilities, netWorth: assets - liabilities };
  }, [accounts]);

  // patch del frontend → columnas de finanzas_personales_cuentas
  const toDbPatch = (patch) => {
    const db = {};
    if (patch.name !== undefined) db.nombre = patch.name;
    if (patch.type !== undefined) db.tipo_cuenta = toDbTipo(patch.type);
    if (patch.saldoInicial !== undefined) db.saldo_inicial = Number(patch.saldoInicial) || 0;
    if (patch.institution !== undefined) db.institucion = patch.institution;
    if (patch.includeInNetWorth !== undefined) db.incluir_patrimonio = !!patch.includeInNetWorth;
    if (patch.currency !== undefined) db.moneda = patch.currency;
    return db;
  };

  const addLocalAccount = useCallback((data) => {
    const acc = {
      id: Date.now() + Math.random(),
      name: data.name,
      type: data.type || 'checking',
      balance: Number(data.saldoInicial ?? data.balance) || 0,
      institution: data.institution || '',
      currency: data.currency || 'USD',
      includeInNetWorth: data.includeInNetWorth ?? true,
      createdAt: new Date().toISOString(),
    };
    const next = [...localAccounts, acc];
    setLocalAccounts(next); saveLocal(next);
    return acc;
  }, [localAccounts]);

  const addAccount = useCallback(async (data) => {
    setWriteError(null);
    if (supabase) {
      const { error } = await supabase.from(CUENTAS_TABLE).insert([{
        nombre: data.name,
        tipo_cuenta: toDbTipo(data.type || 'checking'),
        saldo_inicial: Number(data.saldoInicial ?? data.balance) || 0,
        institucion: data.institution || '',
        incluir_patrimonio: data.includeInNetWorth ?? true,
        moneda: data.currency || 'USD',
        activa: true,
      }]);
      if (!error) {
        await fetchSbAccounts();
        return;
      }
      handleWriteError(error);
    }
    // fallback: guardar en localStorage para no perder el dato
    addLocalAccount(data);
  }, [addLocalAccount, fetchSbAccounts, handleWriteError]);

  const updateAccount = useCallback(async (id, patch) => {
    setWriteError(null);
    const isSb = sbAccounts.some(a => a.id === id);
    if (isSb && supabase) {
      const db = toDbPatch(patch);
      if (Object.keys(db).length === 0) return;
      const { error } = await supabase.from(CUENTAS_TABLE).update(db).eq('id', id);
      if (error) { handleWriteError(error); return; }
      await fetchSbAccounts();
      return;
    }
    const next = localAccounts.map(a => a.id === id
      ? { ...a, ...patch, ...(patch.saldoInicial !== undefined ? { balance: Number(patch.saldoInicial) || 0 } : {}) }
      : a);
    setLocalAccounts(next); saveLocal(next);
  }, [sbAccounts, localAccounts, fetchSbAccounts, handleWriteError]);

  // Soft-delete: nunca .delete() — no existen policies de DELETE por diseño
  const removeAccount = useCallback(async (id) => {
    setWriteError(null);
    const isSb = sbAccounts.some(a => a.id === id);
    if (isSb && supabase) {
      const { error } = await supabase.from(CUENTAS_TABLE).update({ activa: false }).eq('id', id);
      if (error) { handleWriteError(error); return; }
      await fetchSbAccounts();
      return;
    }
    const next = localAccounts.filter(a => a.id !== id);
    setLocalAccounts(next); saveLocal(next);
  }, [sbAccounts, localAccounts, fetchSbAccounts, handleWriteError]);

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

  return { accounts, addAccount, updateAccount, removeAccount, totals, history, sbError, writeError };
}
