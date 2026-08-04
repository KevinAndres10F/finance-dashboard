import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { fechaLocal, mesLocal } from '../lib/utils';

const TABLE = 'finanzas_personales_transacciones';
const PAGE_SIZE = 1000;

function toFrontend(row) {
  return {
    id: row.id,
    Fecha: fechaLocal(row.fecha),
    Mes: mesLocal(row.fecha),
    Descripción: row.descripcion ?? '',
    Comercio: row.comercio ?? '',
    Monto: Number(row.monto) || 0,
    Categoría: row.categoria ?? 'Otros',
    Cuenta: row.cuenta ?? 'Principal',
    Tipo: row.tipo ?? 'Gasto',
    origen: row.origen ?? '',
    necesita_revision: !!row.necesita_revision,
    revision_motivo: row.revision_motivo ?? '',
  };
}

async function fetchAllPages() {
  const all = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('activo', true)
      .order('fecha', { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return all;
}

export function useFinanzas() {
  const [transacciones, setTransacciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cargar = useCallback(async () => {
    if (!supabase) {
      setError('Supabase no configurado. Revisa VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchAllPages();
      setTransacciones(rows.map(toFrontend));
    } catch (err) {
      setError(err.message);
      setTransacciones([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const addTransaction = useCallback(async (tx) => {
    if (!supabase) return { success: false, error: 'Supabase no configurado' };
    setError(null);
    const monto = tx.Tipo === 'Gasto' ? -Math.abs(Number(tx.Monto)) : Math.abs(Number(tx.Monto));
    const fecha = tx.Fecha || fechaLocal(new Date());
    const { error: err } = await supabase.from(TABLE).insert([{
      fecha,
      mes: tx.Mes || mesLocal(new Date()),
      descripcion: tx.Descripción || tx.Descripcion || '',
      comercio: tx.Comercio || tx.Descripción || '',
      monto,
      categoria: tx.Categoría || tx.Categoria || 'Otros',
      cuenta: tx.Cuenta || 'Principal',
      tipo: tx.Tipo || 'Gasto',
      origen: 'Web Manual',
    }]);
    if (err) { setError(err.message); return { success: false, error: err.message }; }
    await cargar();
    return { success: true };
  }, [cargar]);

  const updateTransaction = useCallback(async (id, patch) => {
    if (!supabase) return;
    const mapped = {};
    if (patch.Fecha !== undefined) mapped.fecha = patch.Fecha;
    if (patch.Descripción !== undefined) mapped.descripcion = patch.Descripción;
    if (patch.Monto !== undefined) mapped.monto = Number(patch.Monto);
    if (patch.Categoría !== undefined) mapped.categoria = patch.Categoría;
    if (patch.Cuenta !== undefined) mapped.cuenta = patch.Cuenta;
    if (patch.Tipo !== undefined) mapped.tipo = patch.Tipo;
    if (patch.Comercio !== undefined) mapped.comercio = patch.Comercio;
    if (Object.keys(mapped).length === 0) return;
    const { error: err } = await supabase.from(TABLE).update(mapped).eq('id', id);
    if (err) { setError(err.message); return; }
    await cargar();
  }, [cargar]);

  const deleteTransaction = useCallback(async (id) => {
    if (!supabase) return;
    const { error: err } = await supabase.from(TABLE).update({ activo: false }).eq('id', id);
    if (err) { setError(err.message); return; }
    await cargar();
  }, [cargar]);

  const importTransactions = useCallback(async (rows) => {
    if (!supabase) return 0;
    const inserts = rows.map(r => ({
      fecha: r.Fecha || fechaLocal(new Date()),
      mes: r.Mes || mesLocal(new Date()),
      descripcion: r.Descripción || r.Descripcion || '',
      comercio: r.Comercio || r.Descripción || '',
      monto: r.Tipo === 'Gasto' ? -Math.abs(Number(r.Monto)) : Math.abs(Number(r.Monto)),
      categoria: r.Categoría || r.Categoria || 'Otros',
      cuenta: r.Cuenta || 'Principal',
      tipo: r.Tipo || 'Gasto',
      origen: 'Web Import',
    }));
    const { error: err } = await supabase.from(TABLE).insert(inserts);
    if (err) { setError(err.message); return 0; }
    await cargar();
    return inserts.length;
  }, [cargar]);

  const transactions = transacciones;

  const reviewCount = useMemo(
    () => transactions.filter(t => t.necesita_revision).length,
    [transactions]
  );

  const stats = useMemo(() => {
    const currentMonth = mesLocal(new Date());
    const currentMonthTxs = transactions.filter(t => t.Fecha?.startsWith(currentMonth));

    const income = currentMonthTxs
      .filter(t => t.Tipo === 'Ingreso' || t.Monto > 0)
      .reduce((acc, curr) => acc + Math.abs(Number(curr.Monto)), 0);
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
    reviewCount,
    refresh: cargar,
  };
}
