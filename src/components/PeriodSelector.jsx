import { CalendarRange } from 'lucide-react';
import { mesLocal } from '../lib/utils';

const selectCls = "h-9 px-2.5 rounded-xl text-xs font-medium bg-white/85 dark:bg-slate-800/75 border border-slate-200/80 dark:border-white/10 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 transition-all";

/**
 * Selector de período: presets (meses, últimos N, años completos, todo)
 * y un rango personalizado mes-a-mes.
 */
export function PeriodSelector({ periods, selection, onChange, resolved }) {
  const isCustom = selection?.id === 'custom';
  const maxMonth = mesLocal(new Date());

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
        <CalendarRange className="w-4 h-4" />
        <span className="text-xs font-medium hidden sm:inline">Período</span>
      </div>

      <select
        value={selection?.id || 'current-month'}
        onChange={(e) => {
          const id = e.target.value;
          if (id === 'custom') {
            onChange({ id: 'custom', start: resolved?.start || maxMonth, end: resolved?.end || maxMonth });
          } else {
            onChange({ id });
          }
        }}
        className={selectCls}
        aria-label="Seleccionar período"
      >
        {periods.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
        <option value="custom">Personalizado…</option>
      </select>

      {isCustom && (
        <div className="flex items-center gap-1.5">
          <input
            type="month"
            max={maxMonth}
            value={selection.start || ''}
            onChange={(e) => onChange({ ...selection, start: e.target.value })}
            className={selectCls}
            aria-label="Mes inicial"
          />
          <span className="text-xs text-slate-400">—</span>
          <input
            type="month"
            max={maxMonth}
            value={selection.end || ''}
            onChange={(e) => onChange({ ...selection, end: e.target.value })}
            className={selectCls}
            aria-label="Mes final"
          />
        </div>
      )}

      {!isCustom && resolved?.start && (
        <span className="text-[11px] text-slate-400 dark:text-slate-500 hidden md:inline">
          {resolved.start === resolved.end ? resolved.start : `${resolved.start} → ${resolved.end}`}
        </span>
      )}
    </div>
  );
}
