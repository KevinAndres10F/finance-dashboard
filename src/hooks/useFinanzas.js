import { useState, useEffect, useMemo } from 'react';

const API_URL = "https://script.google.com/macros/s/AKfycbwvT2nZBMTsFi3do4b1rMzQstVxcQkJQNPZy7NGmdpxDUZG8QaUZmdpwHH6-m_NwROe/exec";

const LOCAL_TX_KEY = 'finance-local-transactions';
const LOCAL_DELETED_KEY = 'finance-deleted-tx-keys';
const LOCAL_OVERRIDES_KEY = 'finance-tx-overrides';

function loadLocal(k, fallback) {
  try { return JSON.parse(localStorage.getItem(k)) || fallback; } catch { return fallback; }
}
function saveLocal(k, v) { localStorage.setItem(k, JSON.stringify(v)); }

function txStableKey(t, idx = 0) {
  if (t.id) return String(t.id);
  return `${t.Fecha || ''}|${t.Descripción || ''}|${t.Monto || 0}|${t.Categoría || ''}|${idx}`;
}

export function useFinanzas() {
    const [remote, setRemote] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [localTxs, setLocalTxs] = useState(() => loadLocal(LOCAL_TX_KEY, []));
    const [deletedKeys, setDeletedKeys] = useState(() => loadLocal(LOCAL_DELETED_KEY, []));
    const [overrides, setOverrides] = useState(() => loadLocal(LOCAL_OVERRIDES_KEY, {}));

    const fetchTransactions = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error('Error fetching data');
            const text = await response.text();
            const rawData = JSON.parse(text);
            const normalizedData = rawData.map(item => ({
                ...item,
                Categoría: item.Categoría || item.Categoria || 'Otros',
                Descripción: item.Descripción || item.Descripcion || '',
                Monto: Number(item.Monto) || 0,
                Tipo: item.Tipo || 'Gasto',
                Fecha: item.Fecha || '',
                Cuenta: item.Cuenta || 'Principal'
            }));
            setRemote(normalizedData);
        } catch (err) {
            console.error("Error cargando datos:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const addTransaction = async (transaction) => {
        setError(null);
        const finalTx = {
            ...transaction,
            Fecha: transaction.Fecha || new Date().toISOString().split('T')[0],
        };

        const payload = {
            monto: finalTx.Monto,
            tipo: finalTx.Tipo,
            descripcion: finalTx.Descripción,
            comercio: finalTx.Descripción,
            categoria: finalTx.Categoría,
            cuenta: finalTx.Cuenta,
        };

        // Optimistic update local
        const localId = 'local:' + (Date.now() + Math.random());
        const optimistic = { ...finalTx, id: localId, _local: true };
        const nextLocal = [...localTxs, optimistic];
        setLocalTxs(nextLocal); saveLocal(LOCAL_TX_KEY, nextLocal);

        try {
            await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify(payload),
            });
            return { success: true };
        } catch (err) {
            console.error("Error guardando:", err);
            setError(err.message);
            return { success: false, error: err.message };
        }
    };

    const updateTransaction = (key, patch) => {
        // Para tx remotas: guardar override por key
        // Para tx locales: actualizar directamente la lista
        if (String(key).startsWith('local:')) {
            const next = localTxs.map(t => t.id === key ? { ...t, ...patch } : t);
            setLocalTxs(next); saveLocal(LOCAL_TX_KEY, next);
            return;
        }
        const nextOv = { ...overrides, [key]: { ...(overrides[key] || {}), ...patch } };
        setOverrides(nextOv); saveLocal(LOCAL_OVERRIDES_KEY, nextOv);
    };

    const deleteTransaction = (key) => {
        if (String(key).startsWith('local:')) {
            const next = localTxs.filter(t => t.id !== key);
            setLocalTxs(next); saveLocal(LOCAL_TX_KEY, next);
            return;
        }
        const next = [...new Set([...deletedKeys, key])];
        setDeletedKeys(next); saveLocal(LOCAL_DELETED_KEY, next);
    };

    const importTransactions = (rows) => {
        const stamped = rows.map(r => ({
            ...r,
            id: 'local:' + (Date.now() + Math.random()),
            _local: true,
            _imported: true,
        }));
        const next = [...localTxs, ...stamped];
        setLocalTxs(next); saveLocal(LOCAL_TX_KEY, next);
        return stamped.length;
    };

    useEffect(() => { fetchTransactions(); }, []);

    /* ── Combinar remoto + local con overrides + deletes ── */
    const transactions = useMemo(() => {
        const out = [];
        remote.forEach((t, idx) => {
            const k = txStableKey(t, idx);
            if (deletedKeys.includes(k)) return;
            const ov = overrides[k];
            out.push({ ...t, id: k, ...(ov || {}) });
        });
        for (const t of localTxs) out.push(t);
        return out;
    }, [remote, localTxs, deletedKeys, overrides]);

    const stats = useMemo(() => {
        const currentMonth = new Date().toISOString().slice(0, 7);
        const currentMonthTxs = transactions.filter(t => t.Fecha?.startsWith(currentMonth));

        const income = currentMonthTxs
            .filter(t => t.Tipo === 'Ingreso' || t.Monto > 0)
            .reduce((acc, curr) => acc + Number(curr.Monto), 0);
        const expenses = currentMonthTxs
            .filter(t => t.Tipo === 'Gasto' || t.Monto < 0)
            .reduce((acc, curr) => acc + Math.abs(Number(curr.Monto)), 0);
        const balance = income - expenses;

        const expensesByCategory = currentMonthTxs
            .filter(t => t.Tipo === 'Gasto' || t.Monto < 0)
            .reduce((acc, curr) => {
                const cat = curr.Categoría || 'Otros';
                acc[cat] = (acc[cat] || 0) + Math.abs(Number(curr.Monto));
                return acc;
            }, {});
        const chartData = Object.entries(expensesByCategory).map(([name, value]) => ({ name, value }));
        return { income, expenses, balance, chartData };
    }, [transactions]);

    const categories = useMemo(() => {
        const defaults = ['Comida', 'Transporte', 'Entretenimiento', 'Salud', 'Servicios', 'Suscripción', 'Hogar', 'Educación', 'Salario', 'Inversión', 'Otros'];
        const fromTxs = transactions.map(t => t.Categoría).filter(Boolean);
        return [...new Set([...defaults, ...fromTxs])].sort();
    }, [transactions]);

    return {
        transactions,
        loading,
        error,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        importTransactions,
        stats,
        categories,
        refresh: fetchTransactions
    };
}
