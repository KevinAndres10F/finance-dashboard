import { useState, useMemo } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { useDebts, simulateDebtPayoff } from '../hooks/useDebts';
import { useSettings } from '../hooks/useSettings';
import { fmtMoney, cn } from '../lib/utils';
import {
  CreditCard, Plus, X, Edit2, TrendingDown, Calculator,
  Mountain, Snowflake, Calendar, AlertTriangle, CheckCircle2
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const KIND_OPTIONS = [
  { id: 'credit_card', label: 'Tarjeta de crédito' },
  { id: 'loan',        label: 'Préstamo personal' },
  { id: 'mortgage',    label: 'Hipoteca' },
  { id: 'student',     label: 'Préstamo estudiantil' },
  { id: 'auto',        label: 'Préstamo de coche' },
  { id: 'other',       label: 'Otra' },
];

export function Debts() {
  const { debts, addDebt, updateDebt, removeDebt, totals } = useDebts();
  const { settings } = useSettings();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [extra, setExtra] = useState(0);
  const [strategy, setStrategy] = useState('avalanche');

  const sim = useMemo(() => simulateDebtPayoff(debts, Number(extra) || 0, strategy), [debts, extra, strategy]);
  const minOnly = useMemo(() => simulateDebtPayoff(debts, 0, strategy), [debts, strategy]);

  const interestSaved = Math.max(0, minOnly.totalInterest - sim.totalInterest);
  const monthsSaved = Math.max(0, minOnly.months - sim.months);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Gestión de Deudas</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            Simula estrategias snowball / avalancha y mira cuánto te ahorras
          </p>
        </div>
        <Button onClick={() => { setEditing(null); setIsModalOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Nueva deuda
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiBox label="Deuda total" value={fmtMoney(totals.totalBalance, settings.currency)} icon={TrendingDown}
                color={totals.totalBalance > 0 ? 'rose' : 'emerald'} />
        <KpiBox label="Pago mínimo / mes" value={fmtMoney(totals.totalMinPayment, settings.currency)} icon={Calendar} color="amber" />
        <KpiBox label="APR ponderado" value={`${totals.weightedApr.toFixed(2)}%`} icon={AlertTriangle} color="violet" />
        <KpiBox label="Cuentas activas" value={String(totals.count)} icon={CreditCard} color="slate" />
      </div>

      {debts.length === 0 ? (
        <Card className="p-12 text-center">
          <CreditCard className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Sin deudas registradas</h3>
          <p className="text-slate-600 dark:text-slate-300 mb-4">Añade tus deudas para simular planes de pago</p>
          <Button onClick={() => setIsModalOpen(true)}>Añadir primera deuda</Button>
        </Card>
      ) : (
        <>
          {/* Lista de deudas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {debts.map(d => {
              const monthlyInterest = (Number(d.balance) * (Number(d.apr) / 100)) / 12;
              return (
                <Card key={d.id} className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <CreditCard className="w-4 h-4 text-rose-500" />
                        <h3 className="font-bold text-slate-900 dark:text-white truncate">{d.name}</h3>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        {KIND_OPTIONS.find(k => k.id === d.kind)?.label} · APR {Number(d.apr).toFixed(2)}%
                      </p>
                    </div>
                    <div className="flex items-center gap-1 -mr-1">
                      <button onClick={() => { setEditing(d); setIsModalOpen(true); }}
                              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => removeDebt(d.id)} className="p-1 text-slate-400 hover:text-rose-500">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-slate-400">Balance</p>
                      <p className="text-sm font-bold text-rose-600 dark:text-rose-400">{fmtMoney(d.balance, settings.currency)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-slate-400">Pago mín.</p>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{fmtMoney(d.minPayment, settings.currency)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-slate-400">Interés/mes</p>
                      <p className="text-sm font-bold text-amber-600 dark:text-amber-400">{fmtMoney(monthlyInterest, settings.currency)}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Simulador */}
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="w-5 h-5 text-indigo-500" />
              <h3 className="text-lg font-semibold">Simulador de pago</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-sm font-medium block mb-2">Pago extra mensual</label>
                <Input type="number" step="0.01" value={extra} onChange={e => setExtra(e.target.value)}
                       placeholder="0.00" />
                <p className="text-xs text-slate-400 mt-1">Aplicado además del pago mínimo</p>
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">Estrategia</label>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setStrategy('avalanche')}
                    className={cn('flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-all',
                      strategy === 'avalanche'
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                        : 'border-slate-200/80 dark:border-white/15'
                    )}>
                    <Mountain className="w-3.5 h-3.5" /> Avalancha
                  </button>
                  <button onClick={() => setStrategy('snowball')}
                    className={cn('flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-all',
                      strategy === 'snowball'
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                        : 'border-slate-200/80 dark:border-white/15'
                    )}>
                    <Snowflake className="w-3.5 h-3.5" /> Bola de nieve
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {strategy === 'avalanche' ? 'Prioriza la deuda con mayor APR (ahorra más interés)' : 'Prioriza la deuda con menor balance (gana motivación)'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <KpiBox label="Tiempo libre de deuda" value={`${sim.months} meses`} icon={Calendar} color="indigo" />
              <KpiBox label="Interés total" value={fmtMoney(sim.totalInterest, settings.currency)} icon={TrendingDown} color="rose" />
              <KpiBox label="Ahorro vs mínimo"
                      value={fmtMoney(interestSaved, settings.currency)} icon={CheckCircle2} color="emerald" />
              <KpiBox label="Meses ahorrados" value={`${monthsSaved} meses`} icon={Mountain} color="amber" />
            </div>

            {sim.schedule.length > 0 && (
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sim.schedule.filter((_, i) => i % Math.max(1, Math.floor(sim.schedule.length / 30)) === 0)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.15)" />
                    <XAxis dataKey="month" stroke="#94a3b8" style={{ fontSize: 11 }}
                           label={{ value: 'Mes', position: 'insideBottom', offset: -5, fill: '#94a3b8', fontSize: 11 }} />
                    <YAxis stroke="#94a3b8" style={{ fontSize: 11 }} />
                    <Tooltip formatter={(v) => fmtMoney(v, settings.currency)} />
                    <Legend />
                    <Line type="monotone" dataKey="totalBalance" name="Balance restante" stroke="#6366f1" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </>
      )}

      {isModalOpen && (
        <DebtModal
          editing={editing}
          onClose={() => { setIsModalOpen(false); setEditing(null); }}
          onSave={(data) => {
            if (editing) updateDebt(editing.id, data);
            else addDebt(data);
            setIsModalOpen(false); setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function KpiBox({ label, value, icon: Icon, color }) {
  const cls = {
    rose:    { bg: 'bg-rose-50 dark:bg-rose-900/30',     ic: 'text-rose-600 dark:text-rose-400' },
    emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/30', ic: 'text-emerald-600 dark:text-emerald-400' },
    indigo:  { bg: 'bg-indigo-50 dark:bg-indigo-900/30', ic: 'text-indigo-600 dark:text-indigo-400' },
    violet:  { bg: 'bg-violet-50 dark:bg-violet-900/30', ic: 'text-violet-600 dark:text-violet-400' },
    amber:   { bg: 'bg-amber-50 dark:bg-amber-900/30',   ic: 'text-amber-600 dark:text-amber-400' },
    slate:   { bg: 'bg-slate-100 dark:bg-slate-800',     ic: 'text-slate-600 dark:text-slate-400' },
  }[color];
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-slate-600 dark:text-slate-300">{label}</p>
        <div className={cn('p-1.5 rounded-lg', cls.bg)}>
          <Icon className={cn('w-3.5 h-3.5', cls.ic)} />
        </div>
      </div>
      <p className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{value}</p>
    </Card>
  );
}

function DebtModal({ editing, onClose, onSave }) {
  const [form, setForm] = useState(editing || {
    name: '', kind: 'credit_card', balance: '', apr: '', minPayment: '', dueDay: 1,
  });
  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass w-full max-w-md rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-white/30 dark:border-white/10">
          <h3 className="text-lg font-semibold">{editing ? 'Editar deuda' : 'Nueva deuda'}</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400 hover:text-slate-700" /></button>
        </div>
        <form onSubmit={e => { e.preventDefault(); onSave({
          ...form,
          balance: Number(form.balance) || 0,
          apr: Number(form.apr) || 0,
          minPayment: Number(form.minPayment) || 0,
          dueDay: Number(form.dueDay) || 1,
        }); }} className="p-6 space-y-4">
          <Field label="Nombre"><Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ej: Visa Banco X" /></Field>
          <Field label="Tipo">
            <select value={form.kind} onChange={e => setForm({ ...form, kind: e.target.value })}
              className="w-full h-10 rounded-xl bg-white/85 dark:bg-slate-800/75 border border-slate-200/80 dark:border-white/15 px-3 text-sm">
              {KIND_OPTIONS.map(k => <option key={k.id} value={k.id}>{k.label}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Balance actual"><Input type="number" step="0.01" required value={form.balance} onChange={e => setForm({ ...form, balance: e.target.value })} /></Field>
            <Field label="APR (%)"><Input type="number" step="0.01" required value={form.apr} onChange={e => setForm({ ...form, apr: e.target.value })} placeholder="22.5" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Pago mínimo / mes"><Input type="number" step="0.01" value={form.minPayment} onChange={e => setForm({ ...form, minPayment: e.target.value })} /></Field>
            <Field label="Día de pago"><Input type="number" min="1" max="31" value={form.dueDay} onChange={e => setForm({ ...form, dueDay: e.target.value })} /></Field>
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
