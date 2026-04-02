import { useMemo } from 'react';
import { Card } from './ui/Card';
import { Lightbulb, TrendingUp, PiggyBank, ShieldCheck, ShieldAlert } from 'lucide-react';
import { cn } from '../lib/utils';

export function InsightsPanel({ transactions, budgetData }) {
  const insights = useMemo(() => {
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7);
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

    const currentMonthTxs = transactions.filter(t => t.Fecha?.startsWith(currentMonth));

    const income = currentMonthTxs
      .filter(t => t.Tipo === 'Ingreso' || t.Monto > 0)
      .reduce((acc, t) => acc + Math.abs(Number(t.Monto)), 0);

    const expenses = currentMonthTxs
      .filter(t => t.Tipo === 'Gasto' || t.Monto < 0)
      .reduce((acc, t) => acc + Math.abs(Number(t.Monto)), 0);

    // Top category this month
    const byCategory = currentMonthTxs
      .filter(t => t.Tipo === 'Gasto' || t.Monto < 0)
      .reduce((acc, t) => {
        const cat = t.Categoría || 'Otros';
        acc[cat] = (acc[cat] || 0) + Math.abs(Number(t.Monto));
        return acc;
      }, {});

    const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];

    // Monthly projection
    const projected = dayOfMonth > 0 ? (expenses / dayOfMonth) * daysInMonth : 0;

    // Savings rate
    const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : null;

    // Budget health
    const goodBudgets = budgetData.filter(b => b.status === 'good').length;
    const totalBudgets = budgetData.length;

    return { income, expenses, projected, savingsRate, topCategory, goodBudgets, totalBudgets, dayOfMonth };
  }, [transactions, budgetData]);

  if (insights.dayOfMonth === 0 || transactions.length === 0) return null;

  const items = [];

  if (insights.topCategory) {
    items.push({
      icon: TrendingUp,
      color: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-50 dark:bg-rose-900/20',
      text: `Tu mayor gasto este mes es ${insights.topCategory[0]} con $${insights.topCategory[1].toFixed(2)}`
    });
  }

  if (insights.expenses > 0) {
    items.push({
      icon: Lightbulb,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      text: `A este ritmo gastarás $${insights.projected.toFixed(2)} este mes (quedan ${
        new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate()
      } días)`
    });
  }

  if (insights.savingsRate !== null) {
    const positive = insights.savingsRate >= 0;
    items.push({
      icon: PiggyBank,
      color: positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400',
      bg: positive ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-rose-50 dark:bg-rose-900/20',
      text: positive
        ? `Estás ahorrando el ${insights.savingsRate.toFixed(1)}% de tus ingresos este mes`
        : `Tus gastos superan tus ingresos en $${(insights.expenses - insights.income).toFixed(2)} este mes`
    });
  }

  if (insights.totalBudgets > 0) {
    const allGood = insights.goodBudgets === insights.totalBudgets;
    items.push({
      icon: allGood ? ShieldCheck : ShieldAlert,
      color: allGood ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400',
      bg: allGood ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-amber-50 dark:bg-amber-900/20',
      text: allGood
        ? `Todos tus ${insights.totalBudgets} presupuestos están en buen estado`
        : `${insights.goodBudgets} de ${insights.totalBudgets} presupuestos en buen estado`
    });
  }

  if (items.length === 0) return null;

  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
        Insights del mes
      </h3>
      <div className="space-y-2.5">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className={cn('p-1.5 rounded-lg shrink-0', item.bg)}>
              <item.icon className={cn('w-3.5 h-3.5', item.color)} />
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-snug">{item.text}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
