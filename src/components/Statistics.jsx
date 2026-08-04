import { useMemo } from 'react';
import { Card } from './ui/Card';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { TrendingUp, TrendingDown, Target, Calendar, PiggyBank, AlertCircle, Rocket } from 'lucide-react';
import { cn, fmtMoney, mesLocal } from '../lib/utils';
import { useSettings } from '../hooks/useSettings';
import { SankeyFlow } from './SankeyFlow';

const COLORS = ['#10b981', '#f43f5e', '#3b82f6', '#f59e0b', '#8b5cf6', '#64748b', '#ec4899', '#06b6d4'];

export function Statistics({ transactions, budgetData = [] }) {
  const { settings } = useSettings();
  const C = settings.currency;
  const stats = useMemo(() => {
    const monthlyData = transactions.reduce((acc, t) => {
      const monthKey = t.Fecha?.slice(0, 7);
      
      if (!monthKey) return acc;
      if (!acc[monthKey]) {
        acc[monthKey] = { month: monthKey, income: 0, expenses: 0 };
      }

      const amount = Math.abs(Number(t.Monto));
      if (t.Tipo === 'Ingreso' || t.Monto > 0) {
        acc[monthKey].income += amount;
      } else {
        acc[monthKey].expenses += amount;
      }
      
      return acc;
    }, {});

    const monthlyTrend = Object.values(monthlyData)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6) // Últimos 6 meses
      .map(d => ({
        month: new Date(d.month + '-01').toLocaleDateString('es', { month: 'short', year: '2-digit' }),
        Ingresos: Number(d.income.toFixed(2)),
        Gastos: Number(d.expenses.toFixed(2)),
        Balance: Number((d.income - d.expenses).toFixed(2))
      }));

    // Top categorías de gasto
    const categoryExpenses = transactions
      .filter(t => t.Tipo === 'Gasto' || t.Monto < 0)
      .reduce((acc, t) => {
        const cat = t.Categoría || 'Otros';
        acc[cat] = (acc[cat] || 0) + Math.abs(Number(t.Monto));
        return acc;
      }, {});

    const topCategories = Object.entries(categoryExpenses)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({
        name,
        value: Number(value.toFixed(2))
      }));

    // Comparativa mes actual vs anterior
    const currentMonth = mesLocal(new Date());
    const lastMonth = mesLocal(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1));

    const currentMonthData = transactions.filter(t => t.Fecha?.startsWith(currentMonth));
    const lastMonthData = transactions.filter(t => t.Fecha?.startsWith(lastMonth));

    const currentIncome = currentMonthData
      .filter(t => t.Tipo === 'Ingreso' || t.Monto > 0)
      .reduce((acc, t) => acc + Math.abs(Number(t.Monto)), 0);
    
    const currentExpenses = currentMonthData
      .filter(t => t.Tipo === 'Gasto' || t.Monto < 0)
      .reduce((acc, t) => acc + Math.abs(Number(t.Monto)), 0);

    const lastIncome = lastMonthData
      .filter(t => t.Tipo === 'Ingreso' || t.Monto > 0)
      .reduce((acc, t) => acc + Math.abs(Number(t.Monto)), 0);
    
    const lastExpenses = lastMonthData
      .filter(t => t.Tipo === 'Gasto' || t.Monto < 0)
      .reduce((acc, t) => acc + Math.abs(Number(t.Monto)), 0);

    const incomeChange = lastIncome > 0 ? ((currentIncome - lastIncome) / lastIncome) * 100 : 0;
    const expensesChange = lastExpenses > 0 ? ((currentExpenses - lastExpenses) / lastExpenses) * 100 : 0;

    // Métricas adicionales
    const now = new Date();
    const savingsRate = currentIncome > 0 ? ((currentIncome - currentExpenses) / currentIncome) * 100 : 0;
    const dayOfMonth = now.getDate();
    const avgDailyExpense = currentExpenses / dayOfMonth;
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const projectedExpense = dayOfMonth > 0 ? (currentExpenses / dayOfMonth) * daysInMonth : 0;

    // Análisis semanal (últimas 4 semanas)
    const weeklyData = [];
    for (let i = 3; i >= 0; i--) {
      const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const weekStart = new Date(weekEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const weekTransactions = transactions.filter(t => {
        const tDate = new Date(t.Fecha);
        return tDate >= weekStart && tDate < weekEnd;
      });

      const weekExpenses = weekTransactions
        .filter(t => t.Tipo === 'Gasto' || t.Monto < 0)
        .reduce((acc, t) => acc + Math.abs(Number(t.Monto)), 0);

      weeklyData.push({
        week: `Sem ${4 - i}`,
        gastos: Number(weekExpenses.toFixed(2))
      });
    }

    return {
      monthlyTrend,
      topCategories,
      comparison: {
        currentIncome,
        currentExpenses,
        incomeChange,
        expensesChange
      },
      metrics: {
        savingsRate,
        avgDailyExpense,
        projectedExpense,
        daysInMonth,
        dayOfMonth
      },
      weeklyData
    };
  }, [transactions]);

  return (
    <div className="space-y-6">
      {/* Sankey de flujo de dinero */}
      <SankeyFlow transactions={transactions} />

      {/* Métricas Clave */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <MetricCard
          title="Tasa de Ahorro"
          value={`${stats.metrics.savingsRate.toFixed(1)}%`}
          icon={PiggyBank}
          trend={stats.metrics.savingsRate > 20 ? 'positive' : stats.metrics.savingsRate > 0 ? 'neutral' : 'negative'}
        />
        <MetricCard
          title="Gasto Diario Promedio"
          value={fmtMoney(stats.metrics.avgDailyExpense, C)}
          icon={Calendar}
          className="text-blue-600"
        />
        <MetricCard
          title="Proyección Mensual"
          value={fmtMoney(stats.metrics.projectedExpense, C)}
          icon={Rocket}
          trend={stats.metrics.projectedExpense <= stats.comparison.currentExpenses * (stats.metrics.daysInMonth / Math.max(stats.metrics.dayOfMonth, 1)) ? 'positive' : 'neutral'}
        />
        <MetricCard
          title="Cambio en Ingresos"
          value={`${stats.comparison.incomeChange >= 0 ? '+' : ''}${stats.comparison.incomeChange.toFixed(1)}%`}
          icon={TrendingUp}
          trend={stats.comparison.incomeChange >= 0 ? 'positive' : 'negative'}
        />
        <MetricCard
          title="Cambio en Gastos"
          value={`${stats.comparison.expensesChange >= 0 ? '+' : ''}${stats.comparison.expensesChange.toFixed(1)}%`}
          icon={TrendingDown}
          trend={stats.comparison.expensesChange <= 0 ? 'positive' : 'negative'}
        />
      </div>

      {/* Gráficos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tendencia Mensual */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">
            Tendencia Mensual (6 meses)
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: '12px' }} />
                <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="Ingresos" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ fill: '#10b981', r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="Gastos" 
                  stroke="#f43f5e" 
                  strokeWidth={2}
                  dot={{ fill: '#f43f5e', r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="Balance" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Top Categorías */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">
            Top Categorías de Gasto
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.topCategories} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" stroke="#64748b" style={{ fontSize: '12px' }} />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  stroke="#64748b" 
                  style={{ fontSize: '11px' }}
                  width={80}
                />
                <Tooltip 
                  formatter={(value) => fmtMoney(value, C)}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                  {stats.topCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Distribución de Gastos (Pie) */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">
            Distribución de Gastos
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.topCategories}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stats.topCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => fmtMoney(value, C)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Gastos Semanales */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">
            Gastos por Semana (Últimas 4)
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="week" stroke="#64748b" style={{ fontSize: '12px' }} />
                <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                <Tooltip
                  formatter={(value) => fmtMoney(value, C)}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="gastos" fill="#f43f5e" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Presupuesto vs. Real */}
        {budgetData.length > 0 && (
          <Card className="p-6 lg:col-span-2">
            <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">
              Presupuesto vs. Gastado (mes actual)
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={budgetData.map(b => ({ name: b.category, Presupuesto: b.limit, Gastado: b.spent }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                  <Tooltip
                    formatter={(value) => fmtMoney(value, C)}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="Presupuesto" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Gastado" radius={[4, 4, 0, 0]}>
                    {budgetData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.status === 'exceeded' ? '#f43f5e' : entry.status === 'warning' ? '#f59e0b' : '#10b981'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, trend, className }) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-1">{title}</p>
          <p className={cn("text-2xl font-bold", className)}>
            {value}
          </p>
        </div>
        <div className={cn(
          "p-2 rounded-lg",
          trend === 'positive' ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30" :
          trend === 'negative' ? "bg-rose-100 text-rose-600 dark:bg-rose-900/30" :
          "bg-slate-100 text-slate-600 dark:bg-slate-800"
        )}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </Card>
  );
}
