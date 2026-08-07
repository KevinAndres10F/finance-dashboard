import { useMemo, useState } from 'react';
import { Card } from './ui/Card';
import { cn, fmtMoney, isTransferTx } from '../lib/utils';
import { useSettings } from '../hooks/useSettings';
import { useAccounts } from '../hooks/useAccounts';
import { useDebts } from '../hooks/useDebts';
import { useGoals } from '../hooks/useGoals';
import { useSubscriptions } from '../hooks/useSubscriptions';
import { usePeriod } from '../hooks/usePeriod';
import { PeriodSelector } from './PeriodSelector';
import { computeCardMetrics, cardMonthlySeries } from '../lib/cards';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  TrendingUp, TrendingDown, Wallet, PiggyBank, Calendar, Zap,
  ArrowUp, ArrowDown, AlertTriangle, CheckCircle2, MinusCircle,
  ShoppingBag, CreditCard, Banknote, Activity, Target, BarChart3, Repeat,
  ToggleLeft, ToggleRight, Receipt, Info, ChevronRight
} from 'lucide-react';
import { TransactionDrilldown } from './TransactionDrilldown';
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
function KpiCard({ title, value, sub, icon: Icon, iconBg, valueClass, trend, trendValue, delay = 0, onClick }) {
  // Los montos largos ($11,100.00) no caben a tamaño completo en la tarjeta;
  // se baja un escalón para que nunca se trunquen ni se partan en dos líneas.
  const isLong = String(value).length > 9;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="h-full"
    >
      <Card
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
        className={cn('p-4 sm:p-5 h-full', onClick && 'cursor-pointer group')}
      >
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 truncate">{title}</p>
            <p className={cn('font-bold tracking-tight tabular-nums truncate',
              isLong ? 'text-base sm:text-lg xl:text-xl' : 'text-lg sm:text-xl xl:text-2xl',
              valueClass || 'text-slate-900 dark:text-white')}
               title={typeof value === 'string' ? value : undefined}>
              {value}
            </p>
            {sub && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{sub}</p>}
          </div>
          <div className={cn('p-2 sm:p-2.5 rounded-xl shrink-0 relative', iconBg || 'bg-slate-100 dark:bg-slate-800')}>
            <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
            {onClick && (
              <ChevronRight className="w-3 h-3 absolute -bottom-1 -right-1 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </div>
        </div>
        {trend !== undefined && (
          <div className="flex items-center gap-1 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/50 min-w-0">
            {trend === 'up' && <ArrowUp className="w-3 h-3 text-emerald-500 shrink-0" />}
            {trend === 'down' && <ArrowDown className="w-3 h-3 text-rose-500 shrink-0" />}
            {trend === 'neutral' && <MinusCircle className="w-3 h-3 text-slate-400 shrink-0" />}
            <span className={cn('text-[11px] sm:text-xs font-medium truncate',
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
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
          <span className="truncate max-w-[40vw] sm:max-w-none">{tx.Categoría}</span>
          <span>·</span>
          <span className="whitespace-nowrap">{tx.Fecha}</span>
          <span className="hidden sm:inline">·</span>
          <span className="capitalize whitespace-nowrap hidden sm:inline">{tx.Cuenta}</span>
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

/* ── Panel de tarjetas de crédito ────────────────────────────── */
function CreditCardPanel({ metrics, series, totalExpenses, currency, periodLabel, onDrill }) {
  const fmt = (n) => fmtMoney(n, currency);
  const pctTarjeta = totalExpenses > 0 ? (metrics.consumo / totalExpenses) * 100 : 0;
  const diferencia = metrics.consumo - metrics.pagos;

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-1 flex-wrap">
        <CreditCard className="w-4 h-4 text-indigo-500 shrink-0" />
        <h3 className="text-base font-semibold text-slate-800 dark:text-white">Tarjetas de crédito</h3>
        <span className="text-xs text-slate-400 ml-auto">{periodLabel}</span>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 flex items-start gap-1.5">
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        El consumo con tarjeta ya está contado en Gastos. El pago de la tarjeta es un traspaso
        que liquida esos consumos, por eso no se suma de nuevo.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div onClick={() => onDrill?.('Consumo con tarjeta', metrics.consumoTxs)}
          className="rounded-xl border border-indigo-200/60 dark:border-indigo-700/30 bg-indigo-50/60 dark:bg-indigo-900/20 p-3 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors">
          <p className="text-xs font-medium text-indigo-700 dark:text-indigo-400 mb-1">Consumo con tarjeta</p>
          <p className="text-xl font-bold text-indigo-800 dark:text-indigo-300 break-words">{fmt(metrics.consumo)}</p>
          <p className="text-[11px] text-indigo-600/80 dark:text-indigo-400/80 mt-1">
            {pctTarjeta.toFixed(0)}% de los gastos · ya en Gastos
          </p>
        </div>

        <div onClick={() => onDrill?.('Pago de tarjetas', metrics.pagoTxs)}
          className="rounded-xl border border-slate-200/70 dark:border-white/10 bg-slate-50/70 dark:bg-slate-800/40 p-3 cursor-pointer hover:bg-slate-100/70 dark:hover:bg-slate-800/60 transition-colors">
          <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Pago de tarjetas</p>
          <p className="text-xl font-bold text-slate-800 dark:text-slate-200 break-words">{fmt(metrics.pagos)}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            traspaso · no cuenta como gasto
            {metrics.pagosSinConfirmar > 0 && ` · ${fmt(metrics.pagosSinConfirmar)} sin confirmar`}
          </p>
        </div>

        <div onClick={() => onDrill?.('Gasto directo (débito y efectivo)', metrics.directoTxs)}
          className="rounded-xl border border-emerald-200/60 dark:border-emerald-700/30 bg-emerald-50/60 dark:bg-emerald-900/20 p-3 cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors">
          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 mb-1">Gasto directo</p>
          <p className="text-xl font-bold text-emerald-800 dark:text-emerald-300 break-words">{fmt(metrics.gastoDirecto)}</p>
          <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 mt-1">
            débito y efectivo
          </p>
        </div>
      </div>

      {/* Consumo pendiente de pagar en el período */}
      <div className={cn('text-xs rounded-xl px-3 py-2 mb-4 border',
        Math.abs(diferencia) < 0.01
          ? 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/70 dark:border-white/10 text-slate-600 dark:text-slate-300'
          : diferencia > 0
            ? 'bg-amber-50/70 dark:bg-amber-900/20 border-amber-200/60 dark:border-amber-700/30 text-amber-700 dark:text-amber-400'
            : 'bg-emerald-50/70 dark:bg-emerald-900/20 border-emerald-200/60 dark:border-emerald-700/30 text-emerald-700 dark:text-emerald-400'
      )}>
        {diferencia > 0
          ? <>Consumiste <span className="font-bold">{fmt(diferencia)}</span> más de lo que pagaste en el período — queda pendiente para el próximo corte.</>
          : diferencia < 0
            ? <>Pagaste <span className="font-bold">{fmt(-diferencia)}</span> más de lo que consumiste — estás bajando saldo de períodos anteriores.</>
            : <>Consumo y pago cuadran exactamente en el período.</>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Desglose por tarjeta */}
        <div>
          <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">Por tarjeta</p>
          <div className="space-y-2">
            {metrics.porTarjeta.map(c => (
              <div key={c.name}
                onClick={() => onDrill?.(`${c.name} · consumo`, c.consumoTxs)}
                className="flex items-center justify-between gap-2 py-2 border-b border-slate-100/80 dark:border-slate-700/40 last:border-0 cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/40 rounded-lg px-1 -mx-1 transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{c.name}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {c.txCount} consumo{c.txCount !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-indigo-700 dark:text-indigo-400 whitespace-nowrap">{fmt(c.consumo)}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    pagado {fmt(c.pagos)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Consumo vs pago por mes */}
        <div>
          <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">Consumo vs pago por mes</p>
          {series.length > 0 ? (
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={series} barSize={14}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" style={{ fontSize: 10 }} />
                  <YAxis style={{ fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Consumo" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Pagos"   fill="#94a3b8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-slate-400 py-6 text-center">Sin datos en el período</p>
          )}
        </div>
      </div>
    </Card>
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
export function Dashboard({ transactions, budgetData, categoryColorMap = {}, excludeTransfers = true, onToggleExcludeTransfers }) {
  const { settings } = useSettings();
  const { accounts, totals: accountTotals } = useAccounts(transactions);
  const { totals: debtTotals } = useDebts();
  const { goals, summary: goalsSummary } = useGoals();
  const subs = useSubscriptions(transactions);
  const C = settings.currency;

  /* Período seleccionado (mes, últimos N, año completo, personalizado…) */
  const {
    periods, selection, setSelection, period,
    periodTxs, prevTxs: prevPeriodTxs, hasPrev, months, isCurrentMonth: isThisMonth,
  } = usePeriod(transactions);

  /* Nombres de cuentas tipo tarjeta de crédito */
  const cardNames = useMemo(
    () => accounts.filter(a => a.type === 'credit_card').map(a => a.name),
    [accounts]
  );

  /* Métricas de tarjeta: se calculan sobre las transacciones SIN filtrar
     traspasos, porque el pago de tarjeta es precisamente un traspaso. */
  const cardMetrics = useMemo(
    () => computeCardMetrics(periodTxs, cardNames),
    [periodTxs, cardNames]
  );
  const cardSeries = useMemo(
    () => cardMonthlySeries(periodTxs, cardNames).slice(-12),
    [periodTxs, cardNames]
  );

  const effectiveTxs = useMemo(
    () => excludeTransfers ? transactions.filter(t => !isTransferTx(t)) : transactions,
    [transactions, excludeTransfers]
  );

  const metrics = useMemo(() => {
    const now = new Date();
    const dayOfMonth    = now.getDate();
    const daysInMonth   = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysLeft      = daysInMonth - dayOfMonth;

    const keep = (list) => excludeTransfers ? list.filter(t => !isTransferTx(t)) : list;
    const monthTxs = keep(periodTxs);
    const prevTxs  = keep(prevPeriodTxs);

    const income   = monthTxs.filter(t => t.Tipo === 'Ingreso' || t.Monto > 0).reduce((a, t) => a + Math.abs(Number(t.Monto)), 0);
    const expenses = monthTxs.filter(t => t.Tipo === 'Gasto'   || t.Monto < 0).reduce((a, t) => a + Math.abs(Number(t.Monto)), 0);
    const balance  = income - expenses;

    const prevIncome   = prevTxs.filter(t => t.Tipo === 'Ingreso' || t.Monto > 0).reduce((a, t) => a + Math.abs(Number(t.Monto)), 0);
    const prevExpenses = prevTxs.filter(t => t.Tipo === 'Gasto'   || t.Monto < 0).reduce((a, t) => a + Math.abs(Number(t.Monto)), 0);

    const savingsRate     = income > 0 ? ((income - expenses) / income) * 100 : 0;
    // El promedio diario y la proyección solo tienen sentido en el mes en curso;
    // en períodos largos se usa el promedio mensual.
    const dailyAvg        = isThisMonth && dayOfMonth > 0 ? expenses / dayOfMonth : 0;
    const projection      = isThisMonth && dayOfMonth > 0 ? (expenses / dayOfMonth) * daysInMonth : 0;
    const monthlyAvg      = months > 0 ? expenses / months : expenses;
    const remainingBudget = income - expenses;

    const incomeChange   = hasPrev && prevIncome   > 0 ? ((income   - prevIncome)   / prevIncome)   * 100 : null;
    const expenseChange  = hasPrev && prevExpenses > 0 ? ((expenses - prevExpenses) / prevExpenses) * 100 : null;

    const incomeTxs  = monthTxs.filter(t => t.Tipo === 'Ingreso' || t.Monto > 0);
    const expenseTxs = monthTxs.filter(t => t.Tipo === 'Gasto'   || t.Monto < 0);

    /* Gastos por categoría en el período (con sus transacciones, para el detalle) */
    const byCat = expenseTxs.reduce((a, t) => {
      const c = t.Categoría || 'Otros';
      (a[c] ||= { total: 0, txs: [] });
      a[c].total += Math.abs(Number(t.Monto));
      a[c].txs.push(t);
      return a;
    }, {});
    const topCategories = Object.entries(byCat)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 7)
      .map(([name, v], i) => ({
        name, value: v.total, txs: v.txs,
        color: categoryColorMap[name] || PALETTE[i % PALETTE.length],
      }));

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
      income, expenses, balance, savingsRate, dailyAvg, projection, monthlyAvg,
      remainingBudget, daysLeft, daysInMonth, dayOfMonth,
      incomeChange, expenseChange, prevIncome, prevExpenses,
      periodTxs: monthTxs, incomeTxs, expenseTxs,
      topCategories, accountMonthly,
      monthlyTrend, weeklyTrend, recentTxs,
      totalBudgets, goodBudgets, budgetHealth, biggestExpense,
      totalTxCount: monthTxs.length,
    };
  }, [effectiveTxs, periodTxs, prevPeriodTxs, excludeTransfers, isThisMonth, months, hasPrev, budgetData, categoryColorMap]);

  const fmt = (n) => fmtMoney(n, C);
  const scope = isThisMonth ? 'del Mes' : 'del período';

  /* Detalle de transacciones detrás de cada métrica */
  const [drill, setDrill] = useState(null);
  const openDrill = (title, transactions, subtitle = period.label) =>
    setDrill({ title, transactions, subtitle });
  const upcomingCount = subs.upcomingBills.length;
  const upcomingNext = subs.upcomingBills.slice(0, 5);
  const netWorth = accountTotals.netWorth - debtTotals.totalBalance;
  const hasSaldoInicial = accounts.some(a => a.hasSaldoInicial);

  return (
    <div className="space-y-6">

      {/* ── Filtros: período + excluir traspasos ── */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="glass rounded-full px-3 py-1.5">
          <PeriodSelector periods={periods} selection={selection} onChange={setSelection} resolved={period} />
        </div>
        <button onClick={onToggleExcludeTransfers}
          className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full glass text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
          {excludeTransfers
            ? <ToggleRight className="w-5 h-5 text-indigo-500 shrink-0" />
            : <ToggleLeft className="w-5 h-5 text-slate-400 shrink-0" />}
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
          title={`Balance ${scope}`}
          value={fmt(metrics.balance)}
          onClick={() => openDrill(`Balance ${scope}`, metrics.periodTxs)}
          icon={Wallet}
          iconBg={metrics.balance >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600' : 'bg-rose-50 dark:bg-rose-900/30 text-rose-600'}
          valueClass={metrics.balance >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}
        />
        <KpiCard
          delay={0.05}
          title={`Ingresos ${scope}`}
          value={fmt(metrics.income)}
          onClick={() => openDrill(`Ingresos ${scope}`, metrics.incomeTxs)}
          icon={TrendingUp}
          iconBg="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600"
          valueClass="text-emerald-700 dark:text-emerald-400"
          trend={metrics.incomeChange !== null ? (metrics.incomeChange >= 0 ? 'up' : 'down') : 'neutral'}
          trendValue={metrics.incomeChange !== null ? `${metrics.incomeChange >= 0 ? '+' : ''}${metrics.incomeChange.toFixed(1)}% vs mes anterior` : 'Sin dato anterior'}
        />
        <KpiCard
          delay={0.1}
          title={`Gastos ${scope}`}
          value={fmt(metrics.expenses)}
          onClick={() => openDrill(`Gastos ${scope}`, metrics.expenseTxs)}
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
          onClick={() => openDrill('Ingresos y gastos', metrics.periodTxs)}
          icon={PiggyBank}
          iconBg={metrics.savingsRate >= 20 ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600' : metrics.savingsRate > 0 ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600' : 'bg-rose-50 dark:bg-rose-900/30 text-rose-600'}
          valueClass={metrics.savingsRate >= 20 ? 'text-indigo-700 dark:text-indigo-400' : metrics.savingsRate > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-rose-700 dark:text-rose-400'}
          sub={metrics.savingsRate >= 20 ? '¡Meta superada!' : metrics.savingsRate > 0 ? 'Meta: 20%' : 'Gastos > Ingresos'}
        />
      </div>

      {/* ── ROW 2: KPIs secundarios ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {isThisMonth ? (
          <>
            <KpiCard
              delay={0.2}
              title="Gasto Diario Promedio"
              value={fmt(metrics.dailyAvg)}
              onClick={() => openDrill('Gastos del mes', metrics.expenseTxs)}
              icon={Calendar}
              iconBg="bg-blue-50 dark:bg-blue-900/30 text-blue-600"
              sub={`Día ${metrics.dayOfMonth} de ${metrics.daysInMonth}`}
            />
            <KpiCard
              delay={0.25}
              title="Proyección Mensual"
              value={fmt(metrics.projection)}
              onClick={() => openDrill('Gastos del mes', metrics.expenseTxs)}
              icon={BarChart3}
              iconBg="bg-violet-50 dark:bg-violet-900/30 text-violet-600"
              sub={`${metrics.daysLeft} días restantes`}
            />
          </>
        ) : (
          <>
            <KpiCard
              delay={0.2}
              title="Gasto Mensual Prom."
              value={fmt(metrics.monthlyAvg)}
              onClick={() => openDrill(`Gastos ${scope}`, metrics.expenseTxs)}
              icon={Calendar}
              iconBg="bg-blue-50 dark:bg-blue-900/30 text-blue-600"
              sub={`${months} mes${months !== 1 ? 'es' : ''} en el período`}
            />
            <KpiCard
              delay={0.25}
              title="Ingreso Mensual Prom."
              value={fmt(months > 0 ? metrics.income / months : metrics.income)}
              onClick={() => openDrill(`Ingresos ${scope}`, metrics.incomeTxs)}
              icon={BarChart3}
              iconBg="bg-violet-50 dark:bg-violet-900/30 text-violet-600"
              sub={period.label}
            />
          </>
        )}
        <KpiCard
          delay={0.3}
          title="Disponible"
          value={fmt(Math.max(0, metrics.remainingBudget))}
          onClick={() => openDrill('Ingresos y gastos', metrics.periodTxs)}
          icon={Banknote}
          iconBg="bg-teal-50 dark:bg-teal-900/30 text-teal-600"
          valueClass="text-teal-700 dark:text-teal-400"
          sub={`Ingresos − Gastos ${scope}`}
        />
        <KpiCard
          delay={0.35}
          title="Transacciones"
          value={metrics.totalTxCount}
          onClick={() => openDrill('Todas las transacciones', metrics.periodTxs)}
          icon={Activity}
          iconBg="bg-slate-100 dark:bg-slate-800 text-slate-600"
          sub={metrics.biggestExpense ? `Mayor: ${fmt(Math.abs(Number(metrics.biggestExpense.Monto)))}` : period.label}
        />
      </div>

      {/* ── Tarjetas de crédito: consumo vs pago ── */}
      {cardMetrics.hasCards && (cardMetrics.consumo > 0 || cardMetrics.pagos > 0) && (
        <CreditCardPanel
          metrics={cardMetrics}
          series={cardSeries}
          totalExpenses={metrics.expenses}
          currency={C}
          periodLabel={period.label}
          onDrill={openDrill}
        />
      )}

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
                <div key={c.name} onClick={() => openDrill(`Gastos · ${c.name}`, c.txs)}
                  className="cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/40 rounded-lg px-1 -mx-1 py-0.5 transition-colors">
                  <CategoryBar name={c.name} amount={c.value} total={metrics.expenses} color={c.color} rank={i + 1} />
                </div>
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
              <div key={acc.id}
                onClick={() => openDrill(`${acc.name} · movimientos`, metrics.periodTxs.filter(t => t.Cuenta === acc.name))}
                className="flex items-center justify-between py-2 border-b border-slate-100/80 dark:border-slate-700/40 last:border-0 cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/40 rounded-lg px-1 -mx-1 transition-colors">
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

      {/* Detalle de la métrica seleccionada */}
      <TransactionDrilldown
        open={!!drill}
        title={drill?.title || ''}
        subtitle={drill?.subtitle}
        transactions={drill?.transactions || []}
        currency={C}
        onClose={() => setDrill(null)}
      />

    </div>
  );
}
