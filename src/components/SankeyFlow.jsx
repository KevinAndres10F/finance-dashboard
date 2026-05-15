import { useMemo } from 'react';
import { Card } from './ui/Card';
import { useSettings } from '../hooks/useSettings';
import { fmtMoney, cn } from '../lib/utils';
import { GitMerge } from 'lucide-react';

const COLORS = ['#10b981', '#06b6d4', '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#84cc16', '#f43f5e', '#64748b'];

/**
 * Sankey simple en SVG: dos columnas (Ingresos por fuente → Hub → Categorías de gasto / Ahorro).
 */
export function SankeyFlow({ transactions }) {
  const { settings } = useSettings();

  const data = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthTxs = transactions.filter(t => t.Fecha?.startsWith(currentMonth));

    const incomeBySrc = {};
    const expenseByCat = {};
    let totalIncome = 0, totalExpense = 0;

    for (const t of monthTxs) {
      const isIncome = t.Tipo === 'Ingreso' || Number(t.Monto) > 0;
      const amount = Math.abs(Number(t.Monto));
      if (isIncome) {
        const src = t.Categoría || 'Otros ingresos';
        incomeBySrc[src] = (incomeBySrc[src] || 0) + amount;
        totalIncome += amount;
      } else {
        const cat = t.Categoría || 'Otros';
        expenseByCat[cat] = (expenseByCat[cat] || 0) + amount;
        totalExpense += amount;
      }
    }

    const savings = Math.max(0, totalIncome - totalExpense);
    return {
      incomes: Object.entries(incomeBySrc).sort((a, b) => b[1] - a[1]),
      expenses: Object.entries(expenseByCat).sort((a, b) => b[1] - a[1]),
      totalIncome, totalExpense, savings,
    };
  }, [transactions]);

  if (data.totalIncome === 0 && data.totalExpense === 0) {
    return (
      <Card className="p-12 text-center">
        <GitMerge className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
        <p className="text-sm text-slate-500 dark:text-slate-400">Sin datos del mes para visualizar el flujo</p>
      </Card>
    );
  }

  const W = 800, H = Math.max(400, (data.incomes.length + data.expenses.length) * 30);
  const colW = 180;
  const hubX = W / 2 - 30;
  const hubW = 60;

  // posiciones acumuladas con reduce (sin reasignar fuera del scope local)
  const stackNodes = (entries, total, colorOffset = 0) =>
    entries.reduce((acc, [name, value], i) => {
      const h = (value / total) * (H - 60);
      const prev = acc[acc.length - 1];
      const y = prev ? prev.y + prev.h + 4 : 30;
      acc.push({ name, value, y, h, color: COLORS[(i + colorOffset) % COLORS.length] });
      return acc;
    }, []);

  const incomeNodes = stackNodes(data.incomes, data.totalIncome, 0);
  const totalRight = data.totalExpense + data.savings;
  const expenseNodes = stackNodes(data.expenses, totalRight, 3);
  const savingsNode = data.savings > 0 ? {
    name: 'Ahorro', value: data.savings,
    y: (expenseNodes[expenseNodes.length - 1]?.y || 30) + (expenseNodes[expenseNodes.length - 1]?.h || 0) + 4,
    h: (data.savings / totalRight) * (H - 60),
    color: '#10b981',
  } : null;

  // flujos ingreso → hub: y1 = posición del nodo izquierdo, y2 = acumulado en el hub
  const incomeFlows = incomeNodes.reduce((acc, n) => {
    const prev = acc[acc.length - 1];
    const y2 = prev ? prev.y2 + prev.h2 + 4 : 30;
    acc.push({ x1: colW, y1: n.y, h1: n.h, x2: hubX, y2, h2: n.h, color: n.color });
    return acc;
  }, []);

  const rightNodes = [...expenseNodes, ...(savingsNode ? [savingsNode] : [])];
  // flujos hub → gasto/ahorro: y1 = acumulado en hub, y2 = posición del nodo derecho
  const expenseFlows = rightNodes.reduce((acc, n) => {
    const prev = acc[acc.length - 1];
    const y1 = prev ? prev.y1 + prev.h1 + 4 : 30;
    acc.push({ x1: hubX + hubW, y1, h1: n.h, x2: W - colW, y2: n.y, h2: n.h, color: n.color });
    return acc;
  }, []);

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <GitMerge className="w-4 h-4 text-indigo-500" />
        <h3 className="text-base font-semibold">Flujo de dinero · este mes</h3>
        <span className="ml-auto text-xs text-slate-400">
          Ahorro: <span className={cn('font-bold', data.savings > 0 ? 'text-emerald-600' : 'text-rose-600')}>
            {fmtMoney(data.savings, settings.currency)}
          </span>
        </span>
      </div>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" className="w-full" style={{ minHeight: 320 }}>
          {/* Flujos ingreso → hub */}
          {incomeFlows.map((f, i) => (
            <path key={`if-${i}`}
              d={`M ${f.x1} ${f.y1} C ${(f.x1 + f.x2) / 2} ${f.y1}, ${(f.x1 + f.x2) / 2} ${f.y2}, ${f.x2} ${f.y2}
                  L ${f.x2} ${f.y2 + f.h2} C ${(f.x1 + f.x2) / 2} ${f.y2 + f.h2}, ${(f.x1 + f.x2) / 2} ${f.y1 + f.h1}, ${f.x1} ${f.y1 + f.h1} Z`}
              fill={f.color} fillOpacity="0.35" />
          ))}
          {/* Flujos hub → gasto */}
          {expenseFlows.map((f, i) => (
            <path key={`ef-${i}`}
              d={`M ${f.x1} ${f.y1} C ${(f.x1 + f.x2) / 2} ${f.y1}, ${(f.x1 + f.x2) / 2} ${f.y2}, ${f.x2} ${f.y2}
                  L ${f.x2} ${f.y2 + f.h2} C ${(f.x1 + f.x2) / 2} ${f.y2 + f.h2}, ${(f.x1 + f.x2) / 2} ${f.y1 + f.h1}, ${f.x1} ${f.y1 + f.h1} Z`}
              fill={f.color} fillOpacity="0.35" />
          ))}

          {/* Nodos ingreso */}
          {incomeNodes.map((n, i) => (
            <g key={`in-${i}`}>
              <rect x={colW - 8} y={n.y} width="8" height={n.h} fill={n.color} />
              <text x={colW - 14} y={n.y + n.h / 2 + 4} textAnchor="end" fontSize="11" fill="currentColor" className="text-slate-700 dark:text-slate-200">
                {n.name} · {fmtMoney(n.value, settings.currency)}
              </text>
            </g>
          ))}

          {/* Hub */}
          <rect x={hubX} y={30} width={hubW} height={H - 60} fill="#6366f1" fillOpacity="0.85" rx="4" />
          <text x={hubX + hubW / 2} y={H / 2} textAnchor="middle" fontSize="10" fontWeight="bold" fill="white">
            Total
          </text>
          <text x={hubX + hubW / 2} y={H / 2 + 14} textAnchor="middle" fontSize="9" fill="white">
            {fmtMoney(data.totalIncome, settings.currency)}
          </text>

          {/* Nodos gasto + ahorro */}
          {rightNodes.map((n, i) => (
            <g key={`out-${i}`}>
              <rect x={W - colW} y={n.y} width="8" height={n.h} fill={n.color} />
              <text x={W - colW + 14} y={n.y + n.h / 2 + 4} fontSize="11" fill="currentColor" className="text-slate-700 dark:text-slate-200">
                {n.name} · {fmtMoney(n.value, settings.currency)}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </Card>
  );
}
