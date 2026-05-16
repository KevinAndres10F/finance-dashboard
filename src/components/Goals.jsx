import { useState } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { useGoals, GOAL_PRESETS } from '../hooks/useGoals';
import { useSettings } from '../hooks/useSettings';
import { fmtMoney, cn, fmtDate } from '../lib/utils';
import {
  Target, Plus, X, Shield, Plane, Home, Car, PiggyBank,
  BookOpen, Heart, CheckCircle2, Edit2, TrendingUp, Calendar
} from 'lucide-react';

const PRESET_ICONS = {
  shield: Shield, plane: Plane, home: Home, car: Car,
  piggy: PiggyBank, book: BookOpen, heart: Heart, target: Target,
};

export function Goals() {
  const { goals, addGoal, updateGoal, removeGoal, contribute, summary } = useGoals();
  const { settings } = useSettings();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [contributing, setContributing] = useState(null);

  const overallPct = summary.totalTarget > 0 ? (summary.totalSaved / summary.totalTarget) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Objetivos de Ahorro</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            Define metas, fija aportes y mira el progreso
          </p>
        </div>
        <Button onClick={() => { setEditing(null); setIsModalOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Nuevo objetivo
        </Button>
      </div>

      {/* Resumen global */}
      {goals.length > 0 && (
        <Card className="p-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Stat label="Objetivos activos" value={summary.total - summary.completed} />
            <Stat label="Completados" value={summary.completed} accent="emerald" />
            <Stat label="Total ahorrado" value={fmtMoney(summary.totalSaved, settings.currency)} accent="indigo" />
            <Stat label="Meta total" value={fmtMoney(summary.totalTarget, settings.currency)} />
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-600 dark:text-slate-300">Progreso global</span>
              <span className="font-semibold">{overallPct.toFixed(1)}%</span>
            </div>
            <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-700"
                   style={{ width: `${Math.min(100, overallPct)}%` }} />
            </div>
          </div>
        </Card>
      )}

      {/* Lista */}
      {goals.length === 0 ? (
        <Card className="p-12 text-center">
          <Target className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Sin objetivos aún</h3>
          <p className="text-slate-600 dark:text-slate-300 mb-4">Crea tu primer objetivo para empezar a ahorrar con propósito</p>
          <Button onClick={() => setIsModalOpen(true)}>Crear objetivo</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map(g => (
            <GoalCard key={g.id} goal={g} currency={settings.currency}
              onEdit={() => { setEditing(g); setIsModalOpen(true); }}
              onContribute={() => setContributing(g)}
              onRemove={() => { if (confirm(`¿Eliminar el objetivo "${g.name}"?`)) removeGoal(g.id); }}
            />
          ))}
        </div>
      )}

      {isModalOpen && (
        <GoalModal
          editing={editing}
          onClose={() => { setIsModalOpen(false); setEditing(null); }}
          onSave={(data) => {
            if (editing) updateGoal(editing.id, data);
            else addGoal(data);
            setIsModalOpen(false); setEditing(null);
          }}
        />
      )}

      {contributing && (
        <ContributeModal
          goal={contributing} currency={settings.currency}
          onClose={() => setContributing(null)}
          onContribute={(amount) => { contribute(contributing.id, amount); setContributing(null); }}
        />
      )}
    </div>
  );
}

function Stat({ label, value, accent }) {
  const c = accent === 'emerald' ? 'text-emerald-700 dark:text-emerald-400'
        : accent === 'indigo'   ? 'text-indigo-700 dark:text-indigo-400'
        : 'text-slate-900 dark:text-white';
  return (
    <div>
      <p className="text-xs text-slate-600 dark:text-slate-300 mb-0.5">{label}</p>
      <p className={cn('text-xl font-bold tracking-tight', c)}>{value}</p>
    </div>
  );
}

function GoalCard({ goal, currency, onEdit, onContribute, onRemove }) {
  const Icon = PRESET_ICONS[GOAL_PRESETS.find(p => p.id === goal.preset)?.icon] || Target;
  const isComplete = goal.completedAt;
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-xl shrink-0" style={{ backgroundColor: goal.color + '20', color: goal.color }}>
            {isComplete ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-slate-900 dark:text-white truncate">{goal.name}</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Meta: {fmtMoney(goal.target, currency)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 -mr-1">
          <button onClick={onEdit} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={onRemove} className="p-1 text-slate-400 hover:text-rose-500">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600 dark:text-slate-300">{fmtMoney(goal.saved, currency)}</span>
          <span className={cn('font-semibold', isComplete ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-200')}>
            {goal.pct.toFixed(0)}%
          </span>
        </div>
        <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full transition-all duration-700"
               style={{ width: `${goal.pct}%`, backgroundColor: isComplete ? '#10b981' : goal.color }} />
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 text-right">
          Faltan {fmtMoney(goal.remaining, currency)}
        </p>
      </div>

      <div className="space-y-1.5 mb-4">
        {goal.deadline && (
          <div className="flex items-center gap-2 text-xs">
            <Calendar className="w-3 h-3 text-slate-400" />
            <span className={cn('text-slate-600 dark:text-slate-300',
              goal.daysLeft !== null && goal.daysLeft < 0 && 'text-rose-500'
            )}>
              {fmtDate(goal.deadline)} ({goal.daysLeft >= 0 ? `en ${goal.daysLeft} días` : `hace ${-goal.daysLeft} días`})
            </span>
            {goal.onTrack !== null && (
              <span className={cn('ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                goal.onTrack ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
              )}>
                {goal.onTrack ? 'En curso' : 'Atrasado'}
              </span>
            )}
          </div>
        )}
        {goal.monthlyContribution > 0 && (
          <div className="flex items-center gap-2 text-xs">
            <TrendingUp className="w-3 h-3 text-slate-400" />
            <span className="text-slate-600 dark:text-slate-300">
              {fmtMoney(goal.monthlyContribution, currency)}/mes
              {goal.monthsToGoal && ` · ${goal.monthsToGoal} meses al objetivo`}
            </span>
          </div>
        )}
      </div>

      {!isComplete && (
        <Button variant="outline" size="sm" className="w-full" onClick={onContribute}>
          + Aportar
        </Button>
      )}
      {isComplete && (
        <div className="flex items-center justify-center gap-2 py-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="w-4 h-4" /> ¡Objetivo alcanzado!
        </div>
      )}
    </Card>
  );
}

function GoalModal({ editing, onClose, onSave }) {
  const [form, setForm] = useState(editing || {
    name: '', target: '', saved: '', deadline: '',
    preset: 'custom', color: '#6366f1', monthlyContribution: '',
  });

  const onPreset = (presetId) => {
    const p = GOAL_PRESETS.find(x => x.id === presetId);
    if (!p) return;
    setForm({ ...form, preset: presetId, color: p.color, name: form.name || p.name });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass w-full max-w-md rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-white/30 dark:border-white/10 sticky top-0 glass">
          <h3 className="text-lg font-semibold">{editing ? 'Editar objetivo' : 'Nuevo objetivo'}</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400 hover:text-slate-700" /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSave({
          ...form,
          target: Number(form.target) || 0,
          saved: Number(form.saved) || 0,
          monthlyContribution: Number(form.monthlyContribution) || 0,
          deadline: form.deadline || null,
        }); }} className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium block mb-2">Tipo</label>
            <div className="grid grid-cols-4 gap-2">
              {GOAL_PRESETS.map(p => {
                const Icon = PRESET_ICONS[p.icon] || Target;
                const isActive = form.preset === p.id;
                return (
                  <button key={p.id} type="button" onClick={() => onPreset(p.id)}
                    className={cn('flex flex-col items-center gap-1 p-2 rounded-xl border text-xs transition-all',
                      isActive ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20'
                               : 'border-slate-200/80 dark:border-white/15 hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
                    )}>
                    <Icon className="w-4 h-4" style={{ color: p.color }} />
                    <span className="truncate w-full text-center">{p.name.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <Field label="Nombre"><Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Meta"><Input type="number" step="0.01" required value={form.target} onChange={e => setForm({ ...form, target: e.target.value })} /></Field>
            <Field label="Ya ahorrado"><Input type="number" step="0.01" value={form.saved} onChange={e => setForm({ ...form, saved: e.target.value })} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Fecha límite (opcional)"><Input type="date" value={form.deadline || ''} onChange={e => setForm({ ...form, deadline: e.target.value })} /></Field>
            <Field label="Aporte mensual"><Input type="number" step="0.01" value={form.monthlyContribution} onChange={e => setForm({ ...form, monthlyContribution: e.target.value })} /></Field>
          </div>
          <Button type="submit" className="w-full">Guardar</Button>
        </form>
      </div>
    </div>
  );
}

function ContributeModal({ goal, currency, onClose, onContribute }) {
  const [amount, setAmount] = useState('');
  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass w-full max-w-sm rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-white/30 dark:border-white/10">
          <h3 className="text-lg font-semibold">Aportar a {goal.name}</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400 hover:text-slate-700" /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onContribute(Number(amount)); }} className="p-6 space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Faltan <span className="font-semibold text-slate-700 dark:text-slate-200">{fmtMoney(goal.remaining, currency)}</span> para el objetivo.
          </p>
          <Field label="Cantidad a aportar">
            <Input type="number" step="0.01" required autoFocus value={amount} onChange={e => setAmount(e.target.value)} />
          </Field>
          <div className="flex gap-2">
            <Button variant="outline" type="button" onClick={() => setAmount(String(goal.monthlyContribution))} className="flex-1">
              Mensual ({fmtMoney(goal.monthlyContribution, currency)})
            </Button>
            <Button variant="outline" type="button" onClick={() => setAmount(String(goal.remaining))} className="flex-1">
              Completar
            </Button>
          </div>
          <Button type="submit" className="w-full">Aportar</Button>
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
