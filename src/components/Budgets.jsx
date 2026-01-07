import { useState, useMemo } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Plus, Target, AlertTriangle, TrendingUp, X } from 'lucide-react';
import { cn } from '../lib/utils';

export function Budgets({ transactions, categories }) {
  const [budgets, setBudgets] = useState(() => {
    const saved = localStorage.getItem('finance-budgets');
    return saved ? JSON.parse(saved) : [];
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    category: categories[0] || 'Comida',
    limit: '',
    period: 'monthly'
  });

  // Calcular gastos actuales por categoría
  const currentMonthExpenses = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    return transactions
      .filter(t => t.Fecha?.startsWith(currentMonth) && (t.Tipo === 'Gasto' || t.Monto < 0))
      .reduce((acc, t) => {
        const cat = t.Categoría || 'Otros';
        acc[cat] = (acc[cat] || 0) + Math.abs(Number(t.Monto));
        return acc;
      }, {});
  }, [transactions]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const newBudget = {
      id: Date.now(),
      category: formData.category,
      limit: parseFloat(formData.limit),
      period: formData.period
    };
    const updatedBudgets = [...budgets, newBudget];
    setBudgets(updatedBudgets);
    localStorage.setItem('finance-budgets', JSON.stringify(updatedBudgets));
    setIsModalOpen(false);
    setFormData({ category: categories[0] || 'Comida', limit: '', period: 'monthly' });
  };

  const removeBudget = (id) => {
    const updatedBudgets = budgets.filter(b => b.id !== id);
    setBudgets(updatedBudgets);
    localStorage.setItem('finance-budgets', JSON.stringify(updatedBudgets));
  };

  const budgetData = budgets.map(budget => {
    const spent = currentMonthExpenses[budget.category] || 0;
    const percentage = (spent / budget.limit) * 100;
    const remaining = budget.limit - spent;
    const status = percentage >= 100 ? 'exceeded' : percentage >= 80 ? 'warning' : 'good';

    return {
      ...budget,
      spent,
      percentage: Math.min(percentage, 100),
      remaining,
      status
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Presupuestos</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Define límites de gasto por categoría
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Nuevo Presupuesto
        </Button>
      </div>

      {budgetData.length === 0 ? (
        <Card className="p-12 text-center">
          <Target className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            No tienes presupuestos configurados
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            Crea tu primer presupuesto para controlar tus gastos
          </p>
          <Button onClick={() => setIsModalOpen(true)}>
            Crear Presupuesto
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgetData.map((budget) => (
            <Card key={budget.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    {budget.category}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Límite: ${budget.limit.toFixed(2)}
                  </p>
                </div>
                <button
                  onClick={() => removeBudget(budget.id)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-300">
                    ${budget.spent.toFixed(2)} gastados
                  </span>
                  <span className={cn(
                    "font-semibold",
                    budget.status === 'exceeded' ? "text-rose-600 dark:text-rose-400" :
                    budget.status === 'warning' ? "text-amber-600 dark:text-amber-400" :
                    "text-emerald-600 dark:text-emerald-400"
                  )}>
                    {budget.percentage.toFixed(0)}%
                  </span>
                </div>
                
                <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      budget.status === 'exceeded' ? "bg-rose-500" :
                      budget.status === 'warning' ? "bg-amber-500" :
                      "bg-emerald-500"
                    )}
                    style={{ width: `${budget.percentage}%` }}
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  {budget.status === 'exceeded' ? (
                    <div className="flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Presupuesto excedido por ${Math.abs(budget.remaining).toFixed(2)}</span>
                    </div>
                  ) : budget.status === 'warning' ? (
                    <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Quedan ${budget.remaining.toFixed(2)}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                      <TrendingUp className="w-3 h-3" />
                      <span>Quedan ${budget.remaining.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Nuevo Presupuesto
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-2">
                  Categoría
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                  required
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-2">
                  Límite Mensual ($)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.limit}
                  onChange={(e) => setFormData({ ...formData, limit: e.target.value })}
                  placeholder="500.00"
                  required
                />
              </div>

              <Button type="submit" className="w-full">
                Crear Presupuesto
              </Button>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
