import { useMemo } from 'react';
import { Card } from './ui/Card';
import { cn, fmtMoney, mesLocal, isTransferTx } from '../lib/utils';
import { useSettings } from '../hooks/useSettings';
import { useAccounts } from '../hooks/useAccounts';
import { useDebts } from '../hooks/useDebts';
import { useGoals } from '../hooks/useGoals';
import { useSubscriptions } from '../hooks/useSubscriptions';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  TrendingUp, TrendingDown, Wallet, PiggyBank, Calendar, Zap,
  ArrowUp, ArrowDown, AlertTriangle, CheckCircle2, MinusCircle,
  ShoppingBag, CreditCard, Banknote, Activity, Target, BarChart3, Repeat, ToggleLeft, ToggleRight
} from 'lucide-react';
import { motion } from 'framer-motion';

/* ── Paleta de colores ───────────────────────────────────────── */
const PALETTE = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];

/* ── Tooltip personalizado ───────────────────────────────────── */
function CustomTooltip({ active, payload, label, prefix = '$' }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-xl px-3 py-2 text-sm shadow-lg">
      <p className="font-semibold text-slate-700 dark:text-slate-200 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="text-xs">
          {p.name}: {prefix}{Number(p.value).toLocaleString('es', { minimumFractionDigits: 2 })}
        </p>
      ))}
    </div>
  );
}

/* ── KPI Card ────────────────────────────────────────────────── */
function KpiCard({ title, value, sub, icon: Icon, iconBg, valueClass, trend, trendValue, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      <Card className="p-5 h-full">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 truncate">{title}</p>
            <p className={cn('text-2xl font-bold tracking-tight truncate', valueClass || 'text-slate-900 dark:text-white')}>
              {value}
            </p>
            {sub && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{sub}</p>}
          </div>
          <div className={cn('p-2.5 rounded-xl shrink-0', iconBg || 'bg-slate-100 dark:bg-slate-800')}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
        {trend !== undefined && (
          <div className="flex items-center gap-1 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/50">
            {trend === 'up' && <ArrowUp className="w-3 h-3 text-emerald-500" />}
            {trend === 'down' && <ArrowDown className="w-3 h-3 text-rose-500" />}
            {trend === 'neutral' && <MinusCircle className="w-3 h-3 text-slate-400" />}
            <span className={cn('text-xs font-medium',
              trend === 'up' ? 'text-emerald-600 dark:text-emerald-400' :
              trend === 'down' ? 'text-rose-600 dark:text-rose-400' :
              'text-slate-500'
            )}>
              {trendValue}
            </span>
          </div>
        )}
      </Card>
    </motion.div>
  );
}

/* ── Barra de categoría (mini) ───────────────────────────────── */
function CategoryBar({ name, amount, total, color, rank }) {
  const pct = total > 0 ? (amount / total) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 w-4">#{rank}</span>
          <span className="truncate font-medium text-slate-700 dark:text-slate-300">{name}</span>
        </div>
        <span className="font-semibold text-slate-900 dark:text-white ml-2 shrink-0">
          ${amount.toLocaleString('es', { minimumFractionDigits: 2 })}
        </span>
      </div>
      <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, delay: 0.1 * rank }}
        />
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 text-right">{pct.toFixed(1)}%</p>
    </div>
  );
}

/* ── Fila de transacción reciente ────────────────────────────── */
function RecentTx({ tx }) {
  const isExpense = tx.Tipo === 'Gasto' || tx.Monto < 0;
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-slate-100/80 dark:border-slate-700/40 last:border-0">
      <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center shrink-0',
        isExpense ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-500' : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500'
      )}>
        {isExpense ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{tx.Descripción || '—'}</p>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <span>{tx.Categoría}</span>
          <span>·</span>
          <span>{tx.Fecha}</span>
          <span>·</span>
          <span className="capitalize">{tx.Cuenta}</span>
        </div>
      </div>
      <span className={cn('text-sm font-bold shrink-0',
        isExpense ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
      )}>
        {isExpense ? '-' : '+'}${Math.abs(tx.Monto).toLocaleString('es', { minimumFractionDigits: 2 })}
      </span>
    </div>
  );
}

/* ── Badge de estado presupuesto ─────────────────────────────── */
function BudgetStatusBadge({ budget }) {
  const cfg = {
    good:     { cls: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-700/30', icon: CheckCircle2 },
    warning:  { cls: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200/60 dark:border-amber-700/30', icon: AlertTriangle },
    exceeded: { cls: 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border-rose-200/60 dark:border-rose-700/30', icon: AlertTriangle },
  }[budget.status];
  const Icon = cfg.icon;
  return (
    <div className={cn('flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-medium', cfg.cls)}>
      <div className="flex items-center gap-2">
        <Icon className="w-3.5 h-3.5" />
        <span>{budget.category}</span>
      </div>
      <span>{budget.percentage.toFixed(0)}% · ${budget.spent.toFixed(0)} / ${budget.limit.toFixed(0)}</span>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   DASHBOARD PRINCIPAL
════════════════════════════════════════════════════════════════ */
export function Dashboard({ transactions, stats, budgetData, categoryColorMap = {}, excludeTransfers = true, onToggleExcludeTransfers }) {
  const { settings } = useSettings();
  const { accounts, totals: accountTotals } = useAccounts(transactions);
  const { totals: debtTotals } = useDebts();
  const { goals, summary: goalsSummary } = useGoals();
  const subs = useSubscriptions(transactions);
  const C = settings.currency;

  const effectiveTxs = useMemo(
    () => excludeTransfers ? transactions.filter(t => !isTransferTx(t)) : transactions,
    [transactions, excludeTransfers]
  );

  const metrics = useMemo(() => {
    const now = new Date();
    const currentMonth  = mesLocal(now);
    const dayOfMonth    = now.getDate();
    const daysInMonth   = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysLeft      = daysInMonth - dayOfMonth;

    /* Mes anterior */
    const prevDate  = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonth = mesLocal(prevDate);

    const monthTxs = effectiveTxs.filter(t => t.Fecha?.startsWith(currentMonth));
    const prevTxs  = effectiveTxs.filter(t => t.Fecha?.startsWith(prevMonth));

    const income   = monthTxs.filter(t => t.Tipo === 'Ingreso' || t.Monto > 0).reduce((a, t) => a + Math.abs(Number(t.Monto)), 0);
    const expenses = monthTxs.filter(t => t.Tipo === 'Gasto'   || t.Monto < 0).reduce((a, t) => a + Math.abs(Number(t.Monto)), 0);
    const balance  = income - expenses;

    const prevIncome   = prevTxs.filter(t => t.Tipo === 'Ingreso' || t.Monto > 0).reduce((a, t) => a + Math.abs(Number(t.Monto)), 0);
    const prevExpenses = prevTxs.filter(t => t.Tipo === 'Gasto'   || t.Monto < 0).reduce((a, t) => a + Math.abs(Number(t.Monto)), 0);

    const savingsRate     = income > 0 ? ((income - expenses) / income) * 100 : 0;
    const dailyAvg        = dayOfMonth > 0 ? expenses / dayOfMonth : 0;
    const projection      = dayOfMonth > 0 ? (expenses / dayOfMonth) * daysInMonth : 0;
    const remainingBudget = income - expenses;

    const incomeChange   = prevIncome   > 0 ? ((income   - prevIncome)   / prevIncome)   * 100 : null;
    const expenseChange  = prevExpenses > 0 ? ((expenses - prevExpenses) / prevExpenses) * 100 : null;

    /* Gastos por categoría este mes */
    const byCat = monthTxs
      .filter(t => t.Tipo === 'Gasto' || t.Monto < 0)
      .reduce((a, t) => { const c = t.Categoría || 'Otros'; a[c] = (a[c] || 0) + Math.abs(Number(t.Monto)); return a; }, {});
    const topCategories = Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 7)
      .map(([name, value], i) => ({ name, value, color: categoryColorMap[name] || PALETTE[i % PALETTE.length] }));

    /* Balance por cuenta — usa accounts de useAccounts (saldo_inicial + movimientos) */

    /* Tendencia mensual (últimos 7 meses) */
    const monthlyMap = effectiveTxs.reduce((a, t) => {
      const k = t.Fecha?.slice(0, 7);
      if (!k) return a;
      if (!a[k]) a[k] = { income: 0, expenses: 0 };
      if (t.Tipo === 'Ingreso' || t.Monto > 0) a[k].income += Math.abs(Number(t.Monto));
      else a[k].expenses += Math.abs(Number(t.Monto));
      return a;
    }, {});
    const monthlyTrend = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-7)
      .map(([k, v]) => ({
        month: new Date(k + '-02').toLocaleDateString('es', { month: 'short', year: '2-digit' }),
        Ingresos: +v.income.toFixed(2),
        Gastos:   +v.expenses.toFixed(2),
        Balance:  +(v.income - v.expenses).toFixed(2),
      }));

    /* Tendencia semanal (últimas 6 semanas) */
    const weeklyTrend = Array.from({ length: 6 }, (_, i) => {
      const end   = new Date(now.getTime() - i * 7 * 86400000);
      const start = new Date(end.getTime() - 7 * 86400000);
      const gastos = effectiveTxs
        .filter(t => { const d = new Date(t.Fecha); return d >= start && d < end && (t.Tipo === 'Gasto' || t.Monto < 0); })
        .reduce((a, t) => a + Math.abs(Number(t.Monto)), 0);
      return { week: `S-${i === 0 ? 'actual' : i}`, gastos: +gastos.toFixed(2) };
    }).reverse();

    /* Distribución ingresos vs gastos por cuenta este mes */
    const accountMonthly = monthTxs.reduce((a, t) => {
      const acc = t.Cuenta || 'Principal';
      if (!a[acc]) a[acc] = { ingresos: 0, gastos: 0 };
      if (t.Tipo === 'Ingreso' || t.Monto > 0) a[acc].ingresos += Math.abs(Number(t.Monto));
      else a[acc].gastos += Math.abs(Number(t.Monto));
      return a;
    }, {});

    /* Recientes */
    const recentTxs = [...effectiveTxs]
      .sort((a, b) => b.Fecha?.localeCompare(a.Fecha || ''))
      .slice(0, 8);

    /* Ratios y salud */
    const totalBudgets  = budgetData.length;
    const goodBudgets   = budgetData.filter(b => b.status === 'good').length;
    const budgetHealth  = totalBudgets > 0 ? (goodBudgets / totalBudgets) * 100 : null;

    /* Bigger single expense this month */
    const biggestExpense = monthTxs
      .filter(t => t.Tipo === 'Gasto' || t.Monto < 0)
      .sort((a, b) => Math.abs(Number(b.Monto)) - Math.abs(Number(a.Monto)))[0];

    return {
      income, expenses, balance, savingsRate, dailyAvg, projection,
      remainingBudget, daysLeft, daysInMonth, dayOfMonth,
      incomeChange, expenseChange, prevIncome, prevExpenses,
      topCategories, accountMonthly,
      monthlyTrend, weeklyTrend, recentTxs,
      totalBudgets, goodBudgets, budgetHealth, biggestExpense,
      totalTxCount: monthTxs.length,
    };
  }, [effectiveTxs, stats, budgetData]);

  const fmt = (n) => fmtMoney(n, C);
  const upcomingCount = subs.upcomingBills.length;
  const upcomingNext = subs.upcomingBills.slice(0, 5);
  const netWorth = accountTotals.netWorth - debtTotals.totalBalance;
  const hasSaldoInicial = accounts.some(a => a.hasSaldoInicial);

  return (
    <div className="space-y-6">

      {/* ── Toggle excluir traspasos ── */}
      <div className="flex items-center justify-end">
        <button onClick={onToggleExcludeTransfers}
          className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
          {excludeTransfers
            ? <ToggleRight className="w-5 h-5 text-indigo-500" />
            : <ToggleLeft className="w-5 h-5 text-slate-400" />}
          Excluir traspasos entre cuentas
        </button>
      </div>

      {/* ── ROW 0: Patrimonio + Objetivos + Suscripciones (resumen) ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300">Patrimonio Neto</p>
            <div className={cn('p-2 rounded-xl',
              !hasSaldoInicial ? 'bg-slate-100 dark:bg-slate-800 text-slate-500' :
              netWorth >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600' : 'bg-rose-50 dark:bg-rose-900/30 text-rose-600'
            )}>
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          {hasSaldoInicial ? (
            <>
              <p className={cn('text-2xl font-bold tracking-tight',
                netWorth >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
              )}>
                {fmtMoney(netWorth, C, { sign: true })}
              </p>
              <p className="text-xs text-slate-400 mt-2">
                Activos {fmt(accountTotals.assets)} · Pasivos {fmt(accountTotals.liabilities + debtTotals.totalBalance)}
              </p>
            </>
          ) : (
            <>
              <p className="text-lg font-semibold text-slate-400 dark:text-slate-500">—</p>
              <p className="text-xs text-amber-500 dark:text-amber-400 mt-2">
                Configura los saldos iniciales en Patrimonio
              </p>
            </>
          )}
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300">Objetivos de ahorro</p>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {fmt(goalsSummary.totalSaved)} <span className="text-sm font-normal text-slate-400">/ {fmt(goalsSummary.totalTarget)}</span>
          </p>
          <p className="text-xs text-slate-400 mt-2">
            {goalsSummary.completed} de {goalsSummary.total} completados
          </p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300">Próximos cobros</p>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600">
              <Repeat className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{fmt(subs.monthlyTotal)}<span className="text-sm font-normal text-slate-400">/mes</span></p>
          <p className="text-xs text-slate-400 mt-2">
            {subs.all.length} suscripciones · {upcomingCount} próximos cobros
          </p>
        </Card>
      </div>

      {/* ── ROW 1: KPIs principales ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          delay={0}
          title="Balance del Mes"
          value={fmt(metrics.balance)}
          icon={Wallet}
          iconBg={metrics.balance >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600' : 'bg-rose-50 dark:bg-rose-900/30 text-rose-600'}
          valueClass={metrics.balance >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}
        />
        <KpiCard
          delay={0.05}
          title="Ingresos del Mes"
          value={fmt(metrics.income)}
          icon={TrendingUp}
          iconBg="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600"
          valueClass="text-emerald-700 dark:text-emerald-400"
          trend={metrics.incomeChange !== null ? (metrics.incomeChange >= 0 ? 'up' : 'down') : 'neutral'}
          trendValue={metrics.incomeChange !== null ? `${metrics.incomeChange >= 0 ? '+' : ''}${metrics.incomeChange.toFixed(1)}% vs mes anterior` : 'Sin dato anterior'}
        />
        <KpiCard
          delay={0.1}
          title="Gastos del Mes"
          value={fmt(metrics.expenses)}
          icon={TrendingDown}
          iconBg="bg-rose-50 dark:bg-rose-900/30 text-rose-600"
          valueClass="text-rose-700 dark:text-rose-400"
          trend={metrics.expenseChange !== null ? (metrics.expenseChange <= 0 ? 'up' : 'down') : 'neutral'}
          trendValue={metrics.expenseChange !== null ? `${metrics.expenseChange >= 0 ? '+' : ''}${metrics.expenseChange.toFixed(1)}% vs mes anterior` : 'Sin dato anterior'}
        />
        <KpiCard
          delay={0.15}
          title="Tasa de Ahorro"
          value={`${metrics.savingsRate.toFixed(1)}%`}
          icon={PiggyBank}
          iconBg={metrics.savingsRate >= 20 ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600' : metrics.savingsRate > 0 ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600' : 'bg-rose-50 dark:bg-rose-900/30 text-rose-600'}
          valueClass={metrics.savingsRate >= 20 ? 'text-indigo-700 dark:text-indigo-400' : metrics.savingsRate > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-rose-700 dark:text-rose-400'}
          sub={metrics.savingsRate >= 20 ? '¡Meta superada!' : metrics.savingsRate > 0 ? 'Meta: 20%' : 'Gastos > Ingresos'}
        />
      </div>

      {/* ── ROW 2: KPIs secundarios ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          delay={0.2}
          title="Gasto Diario Promedio"
          value={fmt(metrics.dailyAvg)}
          icon={Calendar}
          iconBg="bg-blue-50 dark:bg-blue-900/30 text-blue-600"
          sub={`Día ${metrics.dayOfMonth} de ${metrics.daysInMonth}`}
        />
        <KpiCard
          delay={0.25}
          title="Proyección Mensual"
          value={fmt(metrics.projection)}
          icon={BarChart3}
          iconBg="bg-violet-50 dark:bg-violet-900/30 text-violet-600"
          sub={`${metrics.daysLeft} días restantes`}
        />
        <KpiCard
          delay={0.3}
          title="Disponible"
          value={fmt(Math.max(0, metrics.remainingBudget))}
          icon={Banknote}
          iconBg="bg-teal-50 dark:bg-teal-900/30 text-teal-600"
          valueClass="text-teal-700 dark:text-teal-400"
          sub="Ingresos − Gastos del mes"
        />
        <KpiCard
          delay={0.35}
          title="Transacciones"
          value={metrics.totalTxCount}
          icon={Activity}
          iconBg="bg-slate-100 dark:bg-slate-800 text-slate-600"
          sub={metrics.biggestExpense ? `Mayor: ${fmt(Math.abs(Number(metrics.biggestExpense.Monto)))}` : 'Este mes'}
        />
      </div>

      {/* ── ROW 3: Tendencia mensual + Distribución ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-5">
          <h3 className="text-base font-semibold text-slate-800 dark:text-white mb-4">
            Tendencia Mensual
          </h3>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.monthlyTrend}>
                <defs>
                  <linearGradient id="gradIngresos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradGastos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.15)" />
                <XAxis dataKey="month" stroke="#94a3b8" style={{ fontSize: 11 }} />
                <YAxis stroke="#94a3b8" style={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area type="monotone" dataKey="Ingresos" stroke="#10b981" strokeWidth={2} fill="url(#gradIngresos)" dot={{ r: 3, fill: '#10b981' }} />
                <Area type="monotone" dataKey="Gastos"   stroke="#f43f5e" strokeWidth={2} fill="url(#gradGastos)"   dot={{ r: 3, fill: '#f43f5e' }} />
                <Line type="monotone" dataKey="Balance"  stroke="#6366f1" strokeWidth={2} strokeDasharray="5 4" dot={{ r: 3, fill: '#6366f1' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-base font-semibold text-slate-800 dark:text-white mb-4">
            Gastos por Categoría
          </h3>
          {metrics.topCategories.length > 0 ? (
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={metrics.topCategories} cx="50%" cy="45%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                    {metrics.topCategories.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [`$${v.toFixed(2)}`, '']} />
                  <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[240px] flex items-center justify-center text-slate-400 text-sm">Sin gastos este mes</div>
          )}
        </Card>
      </div>

      {/* ── ROW 4: Top categorías + Cuentas + Presupuestos ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Top 7 categorías */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingBag className="w-4 h-4 text-slate-500" />
            <h3 className="text-base font-semibold text-slate-800 dark:text-white">Top Categorías</h3>
          </div>
          {metrics.topCategories.length > 0 ? (
            <div className="space-y-3">
              {metrics.topCategories.map((c, i) => (
                <CategoryBar key={c.name} name={c.name} amount={c.value} total={metrics.expenses} color={c.color} rank={i + 1} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">Sin gastos registrados</p>
          )}
        </Card>

        {/* Balance por cuenta */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-4 h-4 text-slate-500" />
            <h3 className="text-base font-semibold text-slate-800 dark:text-white">Balance por Cuenta</h3>
          </div>
          <div className="space-y-3">
            {accounts.length > 0 ? accounts.map(acc => (
              <div key={acc.id} className="flex items-center justify-between py-2 border-b border-slate-100/80 dark:border-slate-700/40 last:border-0">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={cn('w-2 h-2 rounded-full shrink-0',
                    acc.kind === 'liability' ? 'bg-amber-500' : acc.balance >= 0 ? 'bg-emerald-500' : 'bg-rose-500')} />
                  <div className="min-w-0">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 block truncate">{acc.name}</span>
                    {!acc.hasSaldoInicial && (
                      <span className="text-[10px] text-amber-500 dark:text-amber-400">saldo relativo: falta saldo inicial</span>
                    )}
                  </div>
                </div>
                <span className={cn('text-sm font-bold shrink-0',
                  acc.kind === 'liability'
                    ? 'text-amber-700 dark:text-amber-400'
                    : acc.balance >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
                )}>
                  {fmtMoney(acc.balance, C, { sign: true })}
                </span>
              </div>
            )) : (
              <p className="text-sm text-slate-400">Sin datos</p>
            )}
          </div>

          {/* Gastos semanales mini chart */}
          <div className="mt-4 pt-4 border-t border-slate-100/80 dark:border-slate-700/40">
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">Gastos por semana</p>
            <div className="h-[80px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.weeklyTrend} barSize={14}>
                  <XAxis dataKey="week" stroke="#94a3b8" style={{ fontSize: 10 }} />
                  <Tooltip formatter={(v) => [`$${v.toFixed(2)}`, 'Gastos']} />
                  <Bar dataKey="gastos" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        {/* Salud de presupuestos */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-4 h-4 text-slate-500" />
            <h3 className="text-base font-semibold text-slate-800 dark:text-white">Presupuestos</h3>
            {metrics.budgetHealth !== null && (
              <span className={cn('ml-auto text-xs font-bold px-2 py-0.5 rounded-full',
                metrics.budgetHealth === 100 ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' :
                metrics.budgetHealth >= 60   ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                                               'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400'
              )}>
                {metrics.goodBudgets}/{metrics.totalBudgets} OK
              </span>
            )}
          </div>
          {budgetData.length > 0 ? (
            <div className="space-y-2">
              {budgetData.map(b => <BudgetStatusBadge key={b.id} budget={b} />)}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Target className="w-8 h-8 text-slate-200 dark:text-slate-700 mb-2" />
              <p className="text-sm text-slate-500 dark:text-slate-400">Sin presupuestos configurados</p>
              <p className="text-xs text-slate-300 dark:text-slate-600 mt-1">Ve a la pestaña Presupuestos</p>
            </div>
          )}
        </Card>
      </div>

      {/* ── ROW 5: Transacciones recientes ── */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-slate-800 dark:text-white">Transacciones Recientes</h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">Últimas {metrics.recentTxs.length}</span>
        </div>
        {metrics.recentTxs.length > 0 ? (
          <div>
            {metrics.recentTxs.map((tx, i) => <RecentTx key={i} tx={tx} />)}
          </div>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-6">No hay transacciones aún</p>
        )}
      </Card>

    </div>
  );
}
