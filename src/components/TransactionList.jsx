import { useState, useMemo } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { TrendingDown, TrendingUp, Search, Filter, Download, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const selectCls = "h-9 px-3 rounded-xl text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-400/50 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-slate-200/80 dark:border-white/10 text-slate-800 dark:text-slate-200";

export function TransactionList({ transactions }) {
  const now = new Date();

  const [filterYear,     setFilterYear]     = useState(String(now.getFullYear()));
  const [filterMonth,    setFilterMonth]    = useState(String(now.getMonth() + 1)); // '1'–'12' o 'all'
  const [searchTerm,     setSearchTerm]     = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterType,     setFilterType]     = useState('all');
  const [showFilters,    setShowFilters]    = useState(false);

  /* ── Años disponibles en las transacciones ── */
  const availableYears = useMemo(() => {
    const years = [...new Set(
      transactions.map(t => t.Fecha?.slice(0, 4)).filter(Boolean)
    )].sort((a, b) => b.localeCompare(a));
    if (!years.includes(String(now.getFullYear()))) years.unshift(String(now.getFullYear()));
    return years;
  }, [transactions]);

  /* ── Categorías únicas ── */
  const categories = useMemo(() => {
    const cats = [...new Set(transactions.map(t => t.Categoría).filter(Boolean))];
    return cats.sort();
  }, [transactions]);

  /* ── Filtrado ── */
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(t => {
        const fecha = t.Fecha || '';
        const tYear  = fecha.slice(0, 4);
        const tMonth = String(parseInt(fecha.slice(5, 7), 10)); // '1'–'12'

        const matchesYear     = filterYear  === 'all' || tYear  === filterYear;
        const matchesMonth    = filterMonth === 'all' || tMonth === filterMonth;
        const matchesSearch   = !searchTerm ||
          t.Descripción?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.Categoría?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'all' || t.Categoría === filterCategory;
        const matchesType     = filterType     === 'all' || t.Tipo      === filterType;

        return matchesYear && matchesMonth && matchesSearch && matchesCategory && matchesType;
      })
      .sort((a, b) => (b.Fecha || '').localeCompare(a.Fecha || ''));
  }, [transactions, filterYear, filterMonth, searchTerm, filterCategory, filterType]);

  /* ── Resumen del período filtrado ── */
  const periodSummary = useMemo(() => {
    const income   = filteredTransactions.filter(t => t.Tipo === 'Ingreso' || t.Monto > 0).reduce((a, t) => a + Math.abs(Number(t.Monto)), 0);
    const expenses = filteredTransactions.filter(t => t.Tipo === 'Gasto'   || t.Monto < 0).reduce((a, t) => a + Math.abs(Number(t.Monto)), 0);
    return { income, expenses, balance: income - expenses };
  }, [filteredTransactions]);

  /* ── Navegación mes anterior / siguiente ── */
  const navigateMonth = (dir) => {
    if (filterMonth === 'all' || filterYear === 'all') return;
    let m = parseInt(filterMonth, 10) + dir;
    let y = parseInt(filterYear, 10);
    if (m < 1) { m = 12; y -= 1; }
    if (m > 12) { m = 1;  y += 1; }
    setFilterMonth(String(m));
    setFilterYear(String(y));
  };

  /* ── Export CSV ── */
  const exportToCSV = () => {
    const headers = ['Fecha', 'Descripción', 'Categoría', 'Tipo', 'Cuenta', 'Monto'];
    const rows = filteredTransactions.map(t => [t.Fecha, t.Descripción, t.Categoría, t.Tipo, t.Cuenta, t.Monto]);
    const csv  = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const period = filterMonth !== 'all' ? `${MONTHS[parseInt(filterMonth,10)-1]}_${filterYear}` : filterYear;
    link.download = `transacciones_${period}.csv`;
    link.click();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterCategory('all');
    setFilterType('all');
  };

  const hasSecondaryFilters = searchTerm || filterCategory !== 'all' || filterType !== 'all';
  const periodLabel = filterMonth !== 'all'
    ? `${MONTHS[parseInt(filterMonth, 10) - 1]} ${filterYear}`
    : filterYear === 'all' ? 'Todos los períodos' : `Año ${filterYear}`;

  return (
    <div className="space-y-4">

      {/* ── Selector de período ── */}
      <Card className="p-4">
        <div className="space-y-3">

          {/* Fila 1: Mes + Año + navegación */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Botón ← */}
            <button
              onClick={() => navigateMonth(-1)}
              disabled={filterMonth === 'all' || filterYear === 'all'}
              className="h-9 w-9 flex items-center justify-center rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm text-slate-600 dark:text-slate-400 hover:bg-white/90 dark:hover:bg-slate-700/70 disabled:opacity-30 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Selector de mes */}
            <select
              value={filterMonth}
              onChange={e => setFilterMonth(e.target.value)}
              className={selectCls}
            >
              <option value="all">Todos los meses</option>
              {MONTHS.map((m, i) => (
                <option key={i} value={String(i + 1)}>{m}</option>
              ))}
            </select>

            {/* Selector de año */}
            <select
              value={filterYear}
              onChange={e => setFilterYear(e.target.value)}
              className={selectCls}
            >
              <option value="all">Todos los años</option>
              {availableYears.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>

            {/* Botón → */}
            <button
              onClick={() => navigateMonth(1)}
              disabled={filterMonth === 'all' || filterYear === 'all'}
              className="h-9 w-9 flex items-center justify-center rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm text-slate-600 dark:text-slate-400 hover:bg-white/90 dark:hover:bg-slate-700/70 disabled:opacity-30 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1 hidden sm:inline">
              {periodLabel}
            </span>

            {/* Acciones */}
            <div className="flex items-center gap-2 ml-auto">
              <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}
                className={cn('gap-1.5', showFilters && 'bg-slate-100/80 dark:bg-slate-700/60')}>
                <Filter className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Filtros</span>
                {hasSecondaryFilters && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
              </Button>
              <Button variant="outline" size="sm" onClick={exportToCSV} title="Exportar CSV">
                <Download className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Fila 2: Búsqueda + filtros adicionales (expandible) */}
          {showFilters && (
            <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-200/60 dark:border-white/10">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Buscar por descripción o categoría..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <select value={filterType} onChange={e => setFilterType(e.target.value)} className={selectCls}>
                <option value="all">Todos los tipos</option>
                <option value="Ingreso">Ingresos</option>
                <option value="Gasto">Gastos</option>
              </select>
              <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className={selectCls}>
                <option value="all">Todas las categorías</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {hasSecondaryFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-slate-500 gap-1">
                  <X className="w-3.5 h-3.5" /> Limpiar
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* ── Resumen del período ── */}
      {filteredTransactions.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Ingresos',  value: periodSummary.income,   cls: 'text-emerald-700 dark:text-emerald-400' },
            { label: 'Gastos',    value: periodSummary.expenses,  cls: 'text-rose-700 dark:text-rose-400' },
            { label: 'Balance',   value: periodSummary.balance,   cls: periodSummary.balance >= 0 ? 'text-indigo-700 dark:text-indigo-400' : 'text-rose-700 dark:text-rose-400' },
          ].map(({ label, value, cls }) => (
            <Card key={label} className="p-3 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">{label}</p>
              <p className={cn('text-lg font-bold', cls)}>
                {value >= 0 ? '' : '-'}${Math.abs(value).toLocaleString('es', { minimumFractionDigits: 2 })}
              </p>
            </Card>
          ))}
        </div>
      )}

      {/* ── Lista de transacciones ── */}
      <Card className="p-0 overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              {hasSecondaryFilters ? 'Sin resultados con esos filtros' : `Sin transacciones en ${periodLabel}`}
            </p>
            {hasSecondaryFilters && (
              <button onClick={clearFilters} className="text-xs text-indigo-500 hover:underline mt-1">
                Limpiar filtros adicionales
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100/80 dark:divide-slate-800/60">
            {filteredTransactions.map((t, i) => (
              <TransactionItem key={i} transaction={t} />
            ))}
          </div>
        )}
      </Card>

      {/* ── Contador ── */}
      {filteredTransactions.length > 0 && (
        <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
          {filteredTransactions.length} transacción{filteredTransactions.length !== 1 ? 'es' : ''} · {periodLabel}
        </p>
      )}
    </div>
  );
}

function TransactionItem({ transaction }) {
  const isExpense = transaction.Tipo === 'Gasto' || transaction.Monto < 0;
  return (
    <div className="flex items-center justify-between px-4 py-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className={cn(
          'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
          isExpense ? 'bg-rose-50 text-rose-500 dark:bg-rose-900/30 dark:text-rose-400'
                    : 'bg-emerald-50 text-emerald-500 dark:bg-emerald-900/30 dark:text-emerald-400'
        )}>
          {isExpense ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
        </div>
        <div className="min-w-0">
          <p className="font-medium text-slate-900 dark:text-white truncate">{transaction.Descripción || '—'}</p>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="truncate">{transaction.Categoría}</span>
            <span>·</span>
            <span className="shrink-0">{transaction.Fecha}</span>
            {transaction.Cuenta && <><span>·</span><span className="shrink-0">{transaction.Cuenta}</span></>}
          </div>
        </div>
      </div>
      <span className={cn(
        'font-bold shrink-0 ml-3',
        isExpense ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
      )}>
        {isExpense ? '-' : '+'}${Math.abs(transaction.Monto).toLocaleString('es', { minimumFractionDigits: 2 })}
      </span>
    </div>
  );
}
