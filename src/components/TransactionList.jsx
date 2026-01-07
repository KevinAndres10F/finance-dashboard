import { useState, useMemo } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { TrendingDown, TrendingUp, Search, Filter, Download, X } from 'lucide-react';
import { cn } from '../lib/utils';

export function TransactionList({ transactions }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Extraer categorías únicas
  const categories = useMemo(() => {
    const cats = [...new Set(transactions.map(t => t.Categoría).filter(Boolean))];
    return cats.sort();
  }, [transactions]);

  // Filtrar transacciones
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = !searchTerm || 
        t.Descripción?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.Categoría?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = filterCategory === 'all' || t.Categoría === filterCategory;
      const matchesType = filterType === 'all' || t.Tipo === filterType;

      return matchesSearch && matchesCategory && matchesType;
    });
  }, [transactions, searchTerm, filterCategory, filterType]);

  const exportToCSV = () => {
    const headers = ['Fecha', 'Descripción', 'Categoría', 'Tipo', 'Cuenta', 'Monto'];
    const rows = filteredTransactions.map(t => [
      t.Fecha,
      t.Descripción,
      t.Categoría,
      t.Tipo,
      t.Cuenta,
      t.Monto
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `transacciones_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterCategory('all');
    setFilterType('all');
  };

  const hasActiveFilters = searchTerm || filterCategory !== 'all' || filterType !== 'all';

  return (
    <div className="space-y-4">
      {/* Barra de búsqueda y filtros */}
      <Card className="p-4">
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar transacciones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(showFilters && "bg-slate-100 dark:bg-slate-800")}
            >
              <Filter className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
              title="Exportar a CSV"
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>

          {/* Filtros expandibles */}
          {showFilters && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                <option value="all">Todos los tipos</option>
                <option value="Ingreso">Ingresos</option>
                <option value="Gasto">Gastos</option>
              </select>

              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                <option value="all">Todas las categorías</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4 mr-1" />
                  Limpiar filtros
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Lista de transacciones */}
      <Card className="p-0 overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">
            {hasActiveFilters ? 'No se encontraron transacciones con los filtros aplicados' : 'No hay transacciones'}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredTransactions.map((t, i) => (
              <TransactionItem key={i} transaction={t} />
            ))}
          </div>
        )}
      </Card>

      {/* Resumen de resultados */}
      {filteredTransactions.length > 0 && (
        <div className="text-sm text-slate-500 dark:text-slate-400 text-center">
          Mostrando {filteredTransactions.length} de {transactions.length} transacciones
        </div>
      )}
    </div>
  );
}

function TransactionItem({ transaction }) {
  const isExpense = transaction.Tipo === 'Gasto' || transaction.Monto < 0;
  return (
    <div className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
      <div className="flex items-center gap-4">
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
          isExpense 
            ? "bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400" 
            : "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
        )}>
          {isExpense ? <TrendingDown className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
        </div>
        <div className="min-w-0">
          <p className="font-medium text-slate-900 dark:text-white truncate">
            {transaction.Descripción}
          </p>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="truncate">{transaction.Categoría}</span>
            <span>•</span>
            <span>{transaction.Fecha}</span>
            {transaction.Cuenta && (
              <>
                <span>•</span>
                <span>{transaction.Cuenta}</span>
              </>
            )}
          </div>
        </div>
      </div>
      <div className={cn(
        "font-semibold text-right flex-shrink-0",
        isExpense 
          ? "text-rose-600 dark:text-rose-400" 
          : "text-emerald-600 dark:text-emerald-400"
      )}>
        {isExpense ? '-' : '+'}${Math.abs(transaction.Monto).toFixed(2)}
      </div>
    </div>
  );
}
