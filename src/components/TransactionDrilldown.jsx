import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, TrendingDown, Download, ArrowUpDown, Repeat } from 'lucide-react';
import { cn, fmtMoney } from '../lib/utils';

/**
 * Panel lateral con el detalle de las transacciones detrás de una métrica.
 * Se abre al hacer clic en un KPI, una categoría o una tarjeta.
 */
export function TransactionDrilldown({ open, title, subtitle, transactions = [], currency = 'USD', onClose }) {
  const [sortBy, setSortBy] = useState('amount');

  // Cerrar con Escape y bloquear el scroll del fondo mientras está abierto
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  const sorted = useMemo(() => {
    const list = [...transactions];
    if (sortBy === 'amount') {
      list.sort((a, b) => Math.abs(Number(b.Monto)) - Math.abs(Number(a.Monto)));
    } else {
      list.sort((a, b) => (b.Fecha || '').localeCompare(a.Fecha || ''));
    }
    return list;
  }, [transactions, sortBy]);

  const total = useMemo(
    () => transactions.reduce((a, t) => a + Math.abs(Number(t.Monto) || 0), 0),
    [transactions]
  );

  const exportCSV = () => {
    const headers = ['Fecha', 'Descripción', 'Categoría', 'Cuenta', 'Tipo', 'Monto'];
    const rows = sorted.map(t => [t.Fecha, t.Descripción, t.Categoría, t.Cuenta, t.Tipo, t.Monto]);
    const csv = [headers, ...rows]
      .map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    link.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.csv`;
    link.click();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50"
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
            role="dialog"
            aria-label={title}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-[30rem] max-w-full z-50 flex flex-col glass border-l border-slate-200/80 dark:border-white/15"
          >
            {/* Cabecera */}
            <div className="p-5 border-b border-slate-200/80 dark:border-white/15">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate">{title}</h3>
                  {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
                </div>
                <button onClick={onClose} aria-label="Cerrar"
                  className="p-1.5 -mr-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/40 dark:hover:bg-white/10 shrink-0">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center justify-between gap-2 mt-3">
                <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
                  {fmtMoney(total, currency)}
                </p>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {transactions.length} transacci{transactions.length === 1 ? 'ón' : 'ones'}
                </span>
              </div>

              {transactions.length > 0 && (
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={() => setSortBy(s => s === 'amount' ? 'date' : 'amount')}
                    className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-white/10 transition-colors"
                  >
                    <ArrowUpDown className="w-3.5 h-3.5" />
                    {sortBy === 'amount' ? 'Por monto' : 'Por fecha'}
                  </button>
                  <button
                    onClick={exportCSV}
                    className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-white/10 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    CSV
                  </button>
                </div>
              )}
            </div>

            {/* Lista */}
            <div className="flex-1 overflow-y-auto px-2 py-1">
              {sorted.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-12">
                  Sin transacciones en este grupo
                </p>
              ) : (
                <div className="divide-y divide-slate-100/80 dark:divide-slate-700/40">
                  {sorted.map((t, i) => <DrilldownRow key={t.id ?? i} tx={t} currency={currency} />)}
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function DrilldownRow({ tx, currency }) {
  const isExpense = tx.Tipo === 'Gasto' || tx.Monto < 0;
  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center shrink-0',
        isExpense ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-500' : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500'
      )}>
        {isExpense ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{tx.Descripción || '—'}</p>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
          <span className="truncate">{tx.Categoría}</span>
          <span>·</span>
          <span className="whitespace-nowrap">{tx.Fecha}</span>
          {tx.Cuenta && <><span>·</span><span className="truncate">{tx.Cuenta}</span></>}
          {tx.es_traspaso && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-indigo-50/80 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 whitespace-nowrap">
              <Repeat className="w-2.5 h-2.5" />
              {tx.traspaso_contraparte ? `→ ${tx.traspaso_contraparte}` : 'sin confirmar'}
            </span>
          )}
        </div>
      </div>
      <span className={cn('text-sm font-bold shrink-0 tabular-nums whitespace-nowrap',
        isExpense ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
      )}>
        {isExpense ? '-' : '+'}{fmtMoney(Math.abs(tx.Monto), currency)}
      </span>
    </div>
  );
}
