import { useState, useMemo } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { useAccounts, ACCOUNT_TYPES } from '../hooks/useAccounts';
import { useDebts } from '../hooks/useDebts';
import { useSettings } from '../hooks/useSettings';
import { fmtMoney, cn } from '../lib/utils';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  Wallet, Plus, X, TrendingUp, TrendingDown, Building2, PiggyBank,
  Bitcoin, Home, Shield, CreditCard, FileText, Banknote, Edit2, Check
} from 'lucide-react';

const ICON_MAP = {
  wallet: Wallet, piggy: PiggyBank, banknote: Banknote, trending: TrendingUp,
  bitcoin: Bitcoin, home: Home, shield: Shield, card: CreditCard,
  file: FileText, circle: Building2,
};

const ASSET_COLORS = ['#10b981', '#06b6d4', '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#84cc16', '#64748b'];
const LIAB_COLORS  = ['#f43f5e', '#e11d48', '#fb7185', '#fda4af', '#9f1239'];

export function NetWorth() {
  const { accounts, addAccount, updateAccount, removeAccount, totals, history } = useAccounts();
  const { totals: debtTotals } = useDebts();
  const { settings } = useSettings();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const assets      = accounts.filter(a => ACCOUNT_TYPES.find(t => t.id === a.type)?.kind === 'asset');
  const liabilities = accounts.filter(a => ACCOUNT_TYPES.find(t => t.id === a.type)?.kind === 'liability');

  const trendData = useMemo(() => {
    return history.slice(-12).map(h => ({
      month: new Date(h.month + '-02').toLocaleDateString('es', { month: 'short', year: '2-digit' }),
      Patrimonio: +h.netWorth.toFixed(2),
      Activos:    +h.assets.toFixed(2),
      Pasivos:    +h.liabilities.toFixed(2),
    }));
  }, [history]);

  const assetBreakdown = useMemo(() => {
    const m = {};
    for (const a of assets) {
      if (!a.includeInNetWorth) continue;
      const label = ACCOUNT_TYPES.find(t => t.id === a.type)?.label || 'Otro';
      m[label] = (m[label] || 0) + Number(a.balance || 0);
    }
    return Object.entries(m).map(([name, value], i) => ({ name, value, color: ASSET_COLORS[i % ASSET_COLORS.length] }));
  }, [assets]);

  const lastChange = useMemo(() => {
    if (history.length < 2) return null;
    const prev = history[history.length - 2].netWorth;
    const cur  = totals.netWorth;
    if (prev === 0) return null;
    return { abs: cur - prev, pct: ((cur - prev) / Math.abs(prev)) * 100 };
  }, [history, totals.netWorth]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Patrimonio Neto</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Activos − Pasivos en una sola vista</p>
        </div>
        <Button onClick={() => { setEditing(null); setIsModalOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Nueva cuenta
        </Button>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Patrimonio Neto</p>
            <div className={cn('p-2 rounded-xl',
              totals.netWorth >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/30' : 'bg-rose-50 dark:bg-rose-900/30'
            )}>
              <Wallet className={cn('w-5 h-5',
                totals.netWorth >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              )} />
            </div>
          </div>
          <p className={cn('text-3xl font-bold tracking-tight',
            totals.netWorth >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
          )}>
            {fmtMoney(totals.netWorth, settings.currency, { sign: true })}
          </p>
          {lastChange && (
            <div className="flex items-center gap-1 mt-3 text-xs">
              {lastChange.abs >= 0 ? <TrendingUp className="w-3 h-3 text-emerald-500" /> : <TrendingDown className="w-3 h-3 text-rose-500" />}
              <span className={lastChange.abs >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                {lastChange.abs >= 0 ? '+' : ''}{fmtMoney(lastChange.abs, settings.currency)} ({lastChange.pct >= 0 ? '+' : ''}{lastChange.pct.toFixed(1)}%) vs mes anterior
              </span>
            </div>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Activos totales</p>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/30">
              <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-400 tracking-tight">
            {fmtMoney(totals.assets, settings.currency)}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">{assets.length} cuenta{assets.length !== 1 && 's'}</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Pasivos totales</p>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-900/30">
              <TrendingDown className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-rose-700 dark:text-rose-400 tracking-tight">
            {fmtMoney(totals.liabilities + debtTotals.totalBalance, settings.currency)}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
            {liabilities.length} cuenta{liabilities.length !== 1 && 's'} + {debtTotals.count} deuda{debtTotals.count !== 1 && 's'}
          </p>
        </Card>
      </div>

      {/* Gráfico histórico + breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-5">
          <h3 className="text-base font-semibold text-slate-800 dark:text-white mb-4">Evolución del patrimonio</h3>
          {trendData.length > 1 ? (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="gradNet" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.15)" />
                  <XAxis dataKey="month" stroke="#94a3b8" style={{ fontSize: 11 }} />
                  <YAxis stroke="#94a3b8" style={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(v) => fmtMoney(v, settings.currency)}
                    contentStyle={{ background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(0,0,0,0.05)', borderRadius: 12 }}
                  />
                  <Area type="monotone" dataKey="Patrimonio" stroke="#6366f1" strokeWidth={2.5} fill="url(#gradNet)" />
                  <Area type="monotone" dataKey="Activos"    stroke="#10b981" strokeWidth={1.5} fill="none" strokeDasharray="3 3" />
                  <Area type="monotone" dataKey="Pasivos"    stroke="#f43f5e" strokeWidth={1.5} fill="none" strokeDasharray="3 3" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[280px] flex flex-col items-center justify-center text-slate-400 text-sm">
              <Wallet className="w-10 h-10 text-slate-200 dark:text-slate-700 mb-2" />
              <p>Añade cuentas para ver la evolución mensual</p>
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="text-base font-semibold text-slate-800 dark:text-white mb-4">Composición de activos</h3>
          {assetBreakdown.length > 0 ? (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={assetBreakdown} cx="50%" cy="45%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {assetBreakdown.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => fmtMoney(v, settings.currency)} />
                  <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-slate-400 text-sm">
              Sin activos registrados
            </div>
          )}
        </Card>
      </div>

      {/* Listas de cuentas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AccountList
          title="Activos"
          accounts={assets}
          colors={ASSET_COLORS}
          onEdit={(a) => { setEditing(a); setIsModalOpen(true); }}
          onRemove={removeAccount}
          onToggle={(a) => updateAccount(a.id, { includeInNetWorth: !a.includeInNetWorth })}
          currency={settings.currency}
        />
        <AccountList
          title="Pasivos"
          accounts={liabilities}
          colors={LIAB_COLORS}
          onEdit={(a) => { setEditing(a); setIsModalOpen(true); }}
          onRemove={removeAccount}
          onToggle={(a) => updateAccount(a.id, { includeInNetWorth: !a.includeInNetWorth })}
          currency={settings.currency}
        />
      </div>

      {isModalOpen && (
        <AccountModal
          editing={editing}
          onClose={() => { setIsModalOpen(false); setEditing(null); }}
          onSave={(data) => {
            if (editing) updateAccount(editing.id, data);
            else addAccount(data);
            setIsModalOpen(false); setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function AccountList({ title, accounts, colors, onEdit, onRemove, onToggle, currency }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-slate-800 dark:text-white">{title}</h3>
        <span className="text-xs text-slate-400">{accounts.length}</span>
      </div>
      {accounts.length === 0 ? (
        <p className="text-sm text-slate-400 dark:text-slate-500 py-6 text-center">Sin {title.toLowerCase()} aún</p>
      ) : (
        <div className="space-y-2">
          {accounts.map((a, i) => {
            const meta = ACCOUNT_TYPES.find(t => t.id === a.type);
            const Icon = ICON_MAP[meta?.icon] || Building2;
            return (
              <div key={a.id} className={cn(
                'group flex items-center gap-3 px-3 py-2.5 rounded-xl border border-slate-100/80 dark:border-white/5',
                'hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors',
                !a.includeInNetWorth && 'opacity-50'
              )}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                     style={{ backgroundColor: colors[i % colors.length] + '20', color: colors[i % colors.length] }}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900 dark:text-white truncate text-sm">{a.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {meta?.label} {a.institution && `· ${a.institution}`}
                  </p>
                </div>
                <span className="font-semibold text-slate-900 dark:text-white text-sm shrink-0">
                  {fmtMoney(a.balance, currency)}
                </span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => onToggle(a)} title={a.includeInNetWorth ? 'Excluir del NW' : 'Incluir en NW'}
                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => onEdit(a)} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => onRemove(a.id)} className="p-1 text-slate-400 hover:text-rose-500">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function AccountModal({ editing, onClose, onSave }) {
  const [form, setForm] = useState(editing || {
    name: '', type: 'checking', balance: '', institution: '', includeInNetWorth: true,
  });

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass w-full max-w-md rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-white/30 dark:border-white/10">
          <h3 className="text-lg font-semibold">{editing ? 'Editar cuenta' : 'Nueva cuenta'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSave({ ...form, balance: Number(form.balance) || 0 }); }}
              className="p-6 space-y-4">
          <Field label="Nombre">
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Ej: Cuenta Santander" />
          </Field>
          <Field label="Tipo">
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
              className="w-full h-10 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-white/50 dark:border-white/10 px-3 text-sm">
              <optgroup label="Activos">
                {ACCOUNT_TYPES.filter(t => t.kind === 'asset').map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </optgroup>
              <optgroup label="Pasivos">
                {ACCOUNT_TYPES.filter(t => t.kind === 'liability').map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </optgroup>
            </select>
          </Field>
          <Field label="Balance actual">
            <Input type="number" step="0.01" value={form.balance} onChange={e => setForm({ ...form, balance: e.target.value })} required />
          </Field>
          <Field label="Institución (opcional)">
            <Input value={form.institution} onChange={e => setForm({ ...form, institution: e.target.value })} placeholder="Ej: Banco Galicia" />
          </Field>
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input type="checkbox" checked={form.includeInNetWorth}
              onChange={e => setForm({ ...form, includeInNetWorth: e.target.checked })} />
            Incluir en Patrimonio Neto
          </label>
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
