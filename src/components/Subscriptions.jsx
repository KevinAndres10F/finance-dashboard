import { useState } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { useSubscriptions } from '../hooks/useSubscriptions';
import { useSettings } from '../hooks/useSettings';
import { fmtMoney, cn, fmtDate } from '../lib/utils';
import {
  Repeat, Plus, X, Calendar, AlertTriangle, EyeOff, Eye,
  Sparkles, Trash2, ListChecks, CalendarDays
} from 'lucide-react';

export function Subscriptions({ transactions }) {
  const subs = useSubscriptions(transactions);
  const { settings } = useSettings();
  const [view, setView] = useState('list'); // list | calendar | ignored
  const [isModalOpen, setIsModalOpen] = useState(false);

  const yearlyEstimate = subs.monthlyTotal * 12;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Suscripciones y recurrentes</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            Detección automática + lista manual + calendario de cobros
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Añadir manual
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Suscripciones activas" value={subs.all.length} icon={Repeat} color="indigo" />
        <Kpi label="Coste mensual" value={fmtMoney(subs.monthlyTotal, settings.currency)} icon={Calendar} color="rose" />
        <Kpi label="Coste anual estimado" value={fmtMoney(yearlyEstimate, settings.currency)} icon={Sparkles} color="amber" />
        <Kpi label="Próximos cobros" value={subs.upcomingBills.length} icon={AlertTriangle} color="violet" />
      </div>

      {/* Tab switcher */}
      <div className="glass rounded-2xl px-2 py-1.5 inline-flex gap-1">
        {[
          { id: 'list', label: 'Lista', icon: ListChecks },
          { id: 'calendar', label: 'Calendario', icon: CalendarDays },
          { id: 'ignored', label: 'Ignoradas', icon: EyeOff },
        ].map(t => (
          <button key={t.id} onClick={() => setView(t.id)}
            className={cn('px-3 py-1.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-1.5',
              view === t.id ? 'bg-white/80 dark:bg-white/10 text-slate-900 dark:text-white shadow-sm'
                            : 'text-slate-600 dark:text-slate-300 hover:text-slate-700 dark:hover:text-slate-200'
            )}>
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {view === 'list' && (
        <div className="space-y-3">
          {subs.all.length === 0 ? (
            <Card className="p-12 text-center">
              <Repeat className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hemos detectado suscripciones aún</h3>
              <p className="text-slate-600 dark:text-slate-300 mb-4 text-sm">
                La detección busca cargos repetidos en al menos 2 meses con el mismo importe (±10%).
              </p>
              <Button onClick={() => setIsModalOpen(true)}>Añadir manual</Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {subs.all.map(s => (
                <Card key={s.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900 dark:text-white truncate">{s.name}</h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300">{s.category}</p>
                    </div>
                    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full',
                      s.source === 'auto'
                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                        : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    )}>
                      {s.source === 'auto' ? 'AUTO' : 'MANUAL'}
                    </span>
                  </div>
                  <p className="text-xl font-bold text-slate-900 dark:text-white tracking-tight mb-1">
                    {fmtMoney(s.amount, settings.currency)}
                    <span className="text-xs text-slate-400 font-normal ml-1">/{s.cadence === 'yearly' ? 'año' : 'mes'}</span>
                  </p>
                  {s.nextDate && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 mb-3">
                      Próximo cobro: <span className="font-medium text-slate-700 dark:text-slate-300">{fmtDate(s.nextDate)}</span>
                    </p>
                  )}
                  <div className="flex gap-1">
                    {s.source === 'auto' ? (
                      <Button variant="outline" size="sm" className="flex-1 gap-1 text-xs"
                        onClick={() => subs.ignore(s.id)}>
                        <EyeOff className="w-3 h-3" /> Ignorar
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" className="flex-1 gap-1 text-xs"
                        onClick={() => subs.removeManual(s.id)}>
                        <Trash2 className="w-3 h-3" /> Eliminar
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {view === 'calendar' && (
        <Card className="p-5">
          <h3 className="text-lg font-semibold mb-4">Próximos cobros (60 días)</h3>
          {subs.upcomingBills.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">Sin cobros próximos</p>
          ) : (
            <div className="space-y-2">
              {subs.upcomingBills.map(b => {
                const urgency = b.daysUntil <= 3 ? 'urgent' : b.daysUntil <= 14 ? 'soon' : 'later';
                const cls = {
                  urgent: 'bg-rose-50/80 dark:bg-rose-900/20 border-rose-200/60 dark:border-rose-700/30 text-rose-700 dark:text-rose-400',
                  soon:   'bg-amber-50/80 dark:bg-amber-900/20 border-amber-200/60 dark:border-amber-700/30 text-amber-700 dark:text-amber-400',
                  later:  'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200/80 dark:border-white/15 text-slate-700 dark:text-slate-300',
                }[urgency];
                return (
                  <div key={b.id} className={cn('flex items-center justify-between p-3 rounded-xl border', cls)}>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{b.name}</p>
                      <p className="text-xs opacity-80">{fmtDate(b.nextDate)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{fmtMoney(b.amount, settings.currency)}</p>
                      <p className="text-[10px] uppercase tracking-wide opacity-70">
                        {b.daysUntil === 0 ? 'Hoy' : b.daysUntil < 0 ? `Hace ${-b.daysUntil}d` : `En ${b.daysUntil}d`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {view === 'ignored' && (
        <Card className="p-5">
          <h3 className="text-lg font-semibold mb-4">Suscripciones ignoradas</h3>
          {subs.ignored.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">No has ignorado ninguna</p>
          ) : (
            <div className="space-y-2">
              {subs.ignored.map(id => (
                <div key={id} className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 dark:border-white/15">
                  <span className="text-sm text-slate-600 dark:text-slate-300 truncate">{id.replace(/^auto:/, '')}</span>
                  <Button variant="ghost" size="sm" onClick={() => subs.unignore(id)} className="gap-1">
                    <Eye className="w-3.5 h-3.5" /> Restaurar
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {isModalOpen && (
        <ManualModal onClose={() => setIsModalOpen(false)}
          onSave={(d) => { subs.addManual(d); setIsModalOpen(false); }} />
      )}
    </div>
  );
}

function Kpi({ label, value, icon: Icon, color }) {
  const cls = {
    indigo: { bg: 'bg-indigo-50 dark:bg-indigo-900/30', ic: 'text-indigo-600 dark:text-indigo-400' },
    rose:   { bg: 'bg-rose-50 dark:bg-rose-900/30',     ic: 'text-rose-600 dark:text-rose-400' },
    amber:  { bg: 'bg-amber-50 dark:bg-amber-900/30',   ic: 'text-amber-600 dark:text-amber-400' },
    violet: { bg: 'bg-violet-50 dark:bg-violet-900/30', ic: 'text-violet-600 dark:text-violet-400' },
  }[color];
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-slate-600 dark:text-slate-300">{label}</p>
        <div className={cn('p-1.5 rounded-lg', cls.bg)}><Icon className={cn('w-3.5 h-3.5', cls.ic)} /></div>
      </div>
      <p className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">{value}</p>
    </Card>
  );
}

function ManualModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    name: '', amount: '', cadence: 'monthly', nextDate: '', category: 'Suscripción', notes: '',
  });
  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass w-full max-w-md rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-white/30 dark:border-white/10">
          <h3 className="text-lg font-semibold">Nueva suscripción manual</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400 hover:text-slate-700" /></button>
        </div>
        <form onSubmit={e => { e.preventDefault(); onSave({ ...form, amount: Number(form.amount) || 0 }); }} className="p-6 space-y-4">
          <Field label="Nombre"><Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Netflix" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Importe"><Input type="number" step="0.01" required value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></Field>
            <Field label="Frecuencia">
              <select value={form.cadence} onChange={e => setForm({ ...form, cadence: e.target.value })}
                className="w-full h-10 rounded-xl bg-white/85 dark:bg-slate-800/75 border border-slate-200/80 dark:border-white/15 px-3 text-sm">
                <option value="monthly">Mensual</option>
                <option value="yearly">Anual</option>
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Próximo cobro"><Input type="date" value={form.nextDate} onChange={e => setForm({ ...form, nextDate: e.target.value })} /></Field>
            <Field label="Categoría"><Input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} /></Field>
          </div>
          <Button type="submit" className="w-full">Guardar</Button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block">{label}</label>
      {children}
    </div>
  );
}
