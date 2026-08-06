import { useState, useMemo } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import {
  TrendingDown, TrendingUp, Search, Filter, Download, X, ChevronLeft, ChevronRight,
  Edit2, Tag as TagIcon, CheckCircle2, StickyNote, AlertCircle, Repeat
} from 'lucide-react';
import { cn, fmtMoney, parseMotivos } from '../lib/utils';
import { useSettings } from '../hooks/useSettings';
import { useTransactionMeta } from '../hooks/useTransactionMeta';
import { TransactionEditModal } from './TransactionEditModal';

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const selectCls = "h-9 px-3 rounded-xl text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-400/50 bg-white/85 dark:bg-slate-800/75 backdrop-blur-sm border border-slate-200/80 dark:border-white/10 text-slate-800 dark:text-slate-200";

export function TransactionList({ transactions, categories, categoryNames = [], updateTransaction, deleteTransaction, reviewCount = 0 }) {
  const { settings } = useSettings();
  const txMeta = useTransactionMeta();
  const now = new Date();

  const [filterYear,     setFilterYear]     = useState(String(now.getFullYear()));
  const [filterMonth,    setFilterMonth]    = useState(String(now.getMonth() + 1));
  const [searchTerm,     setSearchTerm]     = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterType,     setFilterType]     = useState('all');
  const [filterTag,      setFilterTag]      = useState('all');
  const [filterReviewed,  setFilterReviewed]  = useState('all');
  const [filterRevision,  setFilterRevision]  = useState('all');
  const [showFilters,     setShowFilters]     = useState(false);
  const [editing,         setEditing]         = useState(null);

  const availableYears = useMemo(() => {
    const years = [...new Set(transactions.map(t => t.Fecha?.slice(0, 4)).filter(Boolean))]
      .sort((a, b) => b.localeCompare(a));
    if (!years.includes(String(now.getFullYear()))) years.unshift(String(now.getFullYear()));
    return years;
  }, [transactions]);

  const allCats = useMemo(() => {
    const fromTxs = transactions.map(t => t.Categoría).filter(Boolean);
    const merged = new Set([...categoryNames, ...fromTxs]);
    return [...merged].sort();
  }, [transactions, categoryNames]);

  const allTags = useMemo(() => {
    const set = new Set();
    transactions.forEach((t, i) => {
      const m = txMeta.get(t, i);
      m.tags?.forEach(tag => set.add(tag));
    });
    return [...set].sort();
  }, [transactions, txMeta]);

  const indexed = useMemo(() => transactions.map((t, idx) => ({ t, idx, meta: txMeta.get(t, idx) })),
    [transactions, txMeta]);

  const filtered = useMemo(() => {
    return indexed
      .filter(({ t, meta }) => {
        const fecha = t.Fecha || '';
        const tYear  = fecha.slice(0, 4);
        const tMonth = String(parseInt(fecha.slice(5, 7), 10));
        if (filterYear !== 'all' && tYear !== filterYear) return false;
        if (filterMonth !== 'all' && tMonth !== filterMonth) return false;
        if (searchTerm) {
          const s = searchTerm.toLowerCase();
          const inText = t.Descripción?.toLowerCase().includes(s) || t.Categoría?.toLowerCase().includes(s);
          const inNotes = meta.notes?.toLowerCase().includes(s);
          const inTags = meta.tags?.some(tag => tag.toLowerCase().includes(s));
          if (!inText && !inNotes && !inTags) return false;
        }
        if (filterCategory !== 'all' && t.Categoría !== filterCategory) return false;
        if (filterType !== 'all' && t.Tipo !== filterType) return false;
        if (filterTag !== 'all' && !meta.tags?.includes(filterTag)) return false;
        if (filterReviewed === 'yes' && !meta.reviewed) return false;
        if (filterReviewed === 'no'  &&  meta.reviewed) return false;
        if (filterRevision === 'yes' && !t.necesita_revision) return false;
        if (filterRevision === 'no'  &&  t.necesita_revision) return false;
        return true;
      })
      .sort((a, b) => (b.t.Fecha || '').localeCompare(a.t.Fecha || ''));
  }, [indexed, filterYear, filterMonth, searchTerm, filterCategory, filterType, filterTag, filterReviewed, filterRevision]);

  const periodSummary = useMemo(() => {
    const income   = filtered.filter(({ t }) => t.Tipo === 'Ingreso' || t.Monto > 0)
      .reduce((a, { t }) => a + Math.abs(Number(t.Monto)), 0);
    const expenses = filtered.filter(({ t }) => t.Tipo === 'Gasto' || t.Monto < 0)
      .reduce((a, { t }) => a + Math.abs(Number(t.Monto)), 0);
    return { income, expenses, balance: income - expenses };
  }, [filtered]);

  const navigateMonth = (dir) => {
    if (filterMonth === 'all' || filterYear === 'all') return;
    let m = parseInt(filterMonth, 10) + dir;
    let y = parseInt(filterYear, 10);
    if (m < 1) { m = 12; y -= 1; }
    if (m > 12) { m = 1;  y += 1; }
    setFilterMonth(String(m));
    setFilterYear(String(y));
  };

  const exportToCSV = () => {
    const headers = ['Fecha', 'Descripción', 'Categoría', 'Tipo', 'Cuenta', 'Monto', 'Tags', 'Notas', 'Revisada'];
    const rows = filtered.map(({ t, meta }) => [
      t.Fecha, t.Descripción, t.Categoría, t.Tipo, t.Cuenta, t.Monto,
      (meta.tags || []).join(';'), meta.notes || '', meta.reviewed ? 'sí' : 'no',
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const period = filterMonth !== 'all' ? `${MONTHS[parseInt(filterMonth, 10) - 1]}_${filterYear}` : filterYear;
    link.download = `transacciones_${period}.csv`;
    link.click();
  };

  const clearFilters = () => {
    setSearchTerm(''); setFilterCategory('all'); setFilterType('all');
    setFilterTag('all'); setFilterReviewed('all'); setFilterRevision('all');
  };

  const hasSecondary = searchTerm || filterCategory !== 'all' || filterType !== 'all'
    || filterTag !== 'all' || filterReviewed !== 'all' || filterRevision !== 'all';
  const periodLabel = filterMonth !== 'all'
    ? `${MONTHS[parseInt(filterMonth, 10) - 1]} ${filterYear}`
    : filterYear === 'all' ? 'Todos los períodos' : `Año ${filterYear}`;

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => navigateMonth(-1)}
              disabled={filterMonth === 'all' || filterYear === 'all'}
              className="h-9 w-9 flex items-center justify-center rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/85 dark:bg-slate-800/75 backdrop-blur-sm text-slate-600 dark:text-slate-400 hover:bg-white/90 dark:hover:bg-slate-700/70 disabled:opacity-30 transition-all">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className={selectCls}>
              <option value="all">Todos los meses</option>
              {MONTHS.map((m, i) => <option key={i} value={String(i + 1)}>{m}</option>)}
            </select>
            <select value={filterYear} onChange={e => setFilterYear(e.target.value)} className={selectCls}>
              <option value="all">Todos los años</option>
              {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button onClick={() => navigateMonth(1)}
              disabled={filterMonth === 'all' || filterYear === 'all'}
              className="h-9 w-9 flex items-center justify-center rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/85 dark:bg-slate-800/75 backdrop-blur-sm text-slate-600 dark:text-slate-400 hover:bg-white/90 dark:hover:bg-slate-700/70 disabled:opacity-30 transition-all">
              <ChevronRight className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1 hidden sm:inline">{periodLabel}</span>
            <div className="flex items-center gap-2 ml-auto">
              {reviewCount > 0 && (
                <Button variant={filterRevision === 'yes' ? 'secondary' : 'outline'} size="sm"
                  onClick={() => setFilterRevision(filterRevision === 'yes' ? 'all' : 'yes')}
                  className="gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                  <span className="hidden sm:inline">Por revisar</span>
                  <span className="text-xs font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-full">{reviewCount}</span>
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}
                className={cn('gap-1.5', showFilters && 'bg-slate-100/80 dark:bg-slate-700/60')}>
                <Filter className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Filtros</span>
                {hasSecondary && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
              </Button>
              <Button variant="outline" size="sm" onClick={exportToCSV} title="Exportar CSV">
                <Download className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {showFilters && (
            <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-200/80 dark:border-white/15">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input placeholder="Buscar texto, categoría, tag o nota..." value={searchTerm}
                       onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
              </div>
              <select value={filterType} onChange={e => setFilterType(e.target.value)} className={selectCls}>
                <option value="all">Todos los tipos</option>
                <option value="Ingreso">Ingresos</option>
                <option value="Gasto">Gastos</option>
              </select>
              <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className={selectCls}>
                <option value="all">Todas las categorías</option>
                {allCats.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {allTags.length > 0 && (
                <select value={filterTag} onChange={e => setFilterTag(e.target.value)} className={selectCls}>
                  <option value="all">Todos los tags</option>
                  {allTags.map(t => <option key={t} value={t}>#{t}</option>)}
                </select>
              )}
              <select value={filterReviewed} onChange={e => setFilterReviewed(e.target.value)} className={selectCls}>
                <option value="all">Todas</option>
                <option value="yes">Solo revisadas</option>
                <option value="no">Sin revisar</option>
              </select>
              {hasSecondary && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-slate-500 gap-1">
                  <X className="w-3.5 h-3.5" /> Limpiar
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>

      {filtered.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Ingresos', value: periodSummary.income,  cls: 'text-emerald-700 dark:text-emerald-400' },
            { label: 'Gastos',   value: periodSummary.expenses, cls: 'text-rose-700 dark:text-rose-400' },
            { label: 'Balance',  value: periodSummary.balance,  cls: periodSummary.balance >= 0 ? 'text-indigo-700 dark:text-indigo-400' : 'text-rose-700 dark:text-rose-400' },
          ].map(({ label, value, cls }) => (
            <Card key={label} className="p-2.5 sm:p-3 text-center">
              <p className="text-xs text-slate-600 dark:text-slate-300 mb-0.5">{label}</p>
              <p className={cn('text-sm sm:text-lg font-bold break-words', cls)}>{fmtMoney(value, settings.currency, { sign: label === 'Balance' })}</p>
            </Card>
          ))}
        </div>
      )}

      <Card className="p-0 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-600 dark:text-slate-300 font-medium">
              {hasSecondary ? 'Sin resultados con esos filtros' : `Sin transacciones en ${periodLabel}`}
            </p>
            {hasSecondary && (
              <button onClick={clearFilters} className="text-xs text-indigo-500 hover:underline mt-1">
                Limpiar filtros adicionales
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100/80 dark:divide-slate-800/60">
            {filtered.map(({ t, idx, meta }) => (
              <TransactionItem key={t.id || idx} transaction={t} meta={meta} currency={settings.currency}
                onClick={() => setEditing({ tx: t, idx })} />
            ))}
          </div>
        )}
      </Card>

      {filtered.length > 0 && (
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
          {filtered.length} transacción{filtered.length !== 1 ? 'es' : ''} · {periodLabel}
        </p>
      )}

      {editing && (
        <TransactionEditModal
          tx={editing.tx} idx={editing.idx} meta={txMeta.get(editing.tx, editing.idx)} categories={categories || allCats}
          onClose={() => setEditing(null)}
          onSave={(patch) => { updateTransaction(editing.tx.id, patch); setEditing(null); }}
          onDelete={() => { deleteTransaction(editing.tx.id); setEditing(null); }}
          onMetaSet={txMeta.set}
          onTagAdd={txMeta.addTag}
          onTagRemove={txMeta.removeTag}
          onToggleReviewed={txMeta.toggleReviewed}
        />
      )}
    </div>
  );
}

function TransactionItem({ transaction, meta, currency, onClick }) {
  const isExpense = transaction.Tipo === 'Gasto' || transaction.Monto < 0;
  return (
    <div onClick={onClick}
      className="group flex items-center justify-between gap-2 px-3 sm:px-4 py-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer">
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
          isExpense ? 'bg-rose-50 text-rose-500 dark:bg-rose-900/30 dark:text-rose-400'
                    : 'bg-emerald-50 text-emerald-500 dark:bg-emerald-900/30 dark:text-emerald-400'
        )}>
          {isExpense ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="font-medium text-slate-900 dark:text-white truncate">{transaction.Descripción || '—'}</p>
            {transaction.necesita_revision && <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" title={transaction.revision_motivo || 'Por revisar'} />}
            {meta.reviewed && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" title="Revisada" />}
            {meta.notes && <StickyNote className="w-3.5 h-3.5 text-amber-500 shrink-0" title="Tiene notas" />}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 flex-wrap">
            {transaction.Categoría === 'Por Clasificar' ? (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-700/60 text-slate-600 dark:text-slate-400 font-medium">
                Por Clasificar
              </span>
            ) : (
              <span className="truncate">{transaction.Categoría}</span>
            )}
            <span>·</span>
            <span className="shrink-0 whitespace-nowrap">{transaction.Fecha}</span>
            {transaction.Cuenta && <><span>·</span><span className="shrink-0 whitespace-nowrap">{transaction.Cuenta}</span></>}
            {transaction.traspaso_id ? (
              <>
                <span>·</span>
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-indigo-50/80 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 whitespace-nowrap">
                  <Repeat className="w-2.5 h-2.5" />Traspaso{transaction.traspaso_contraparte ? ` → ${transaction.traspaso_contraparte}` : ''}
                </span>
              </>
            ) : transaction.es_traspaso ? (
              <>
                <span>·</span>
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-100/80 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  <Repeat className="w-2.5 h-2.5" />Traspaso sin confirmar
                </span>
              </>
            ) : null}
            {transaction.necesita_revision && transaction.revision_motivo && (
              <>
                <span>·</span>
                <span className="flex gap-1 flex-wrap">
                  {parseMotivos(transaction.revision_motivo).map((m, i) => (
                    <span key={i} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-50/80 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 whitespace-nowrap">
                      <AlertCircle className="w-2.5 h-2.5" />{m}
                    </span>
                  ))}
                </span>
              </>
            )}
            {meta.tags?.length > 0 && (
              <>
                <span>·</span>
                <span className="flex gap-1">
                  {meta.tags.slice(0, 3).map(t => (
                    <span key={t} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-indigo-50/80 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400">
                      <TagIcon className="w-2.5 h-2.5" />{t}
                    </span>
                  ))}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <span className={cn('font-bold text-sm sm:text-base whitespace-nowrap',
          isExpense ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
        )}>
          {isExpense ? '-' : '+'}{fmtMoney(Math.abs(transaction.Monto), currency)}
        </span>
        <Edit2 className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors hidden sm:block" />
      </div>
    </div>
  );
}
