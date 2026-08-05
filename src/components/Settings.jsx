import { useState, useRef } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { useSettings } from '../hooks/useSettings';
import { useCategoryRules } from '../hooks/useCategoryRules';
import { fmtMoney, cn } from '../lib/utils';
import {
  Globe, Palette, Sparkles, Plus, X, Download, Upload,
  AlertTriangle, Trash2, Settings as SettingsIcon, Wand2, Lock, Unlock,
  Database, ChevronDown, ChevronUp, Info
} from 'lucide-react';

const CURRENCIES = [
  { code: 'USD', label: 'US Dollar', symbol: '$' },
  { code: 'EUR', label: 'Euro',      symbol: '€' },
  { code: 'MXN', label: 'Peso mexicano',  symbol: '$' },
  { code: 'COP', label: 'Peso colombiano', symbol: '$' },
  { code: 'ARS', label: 'Peso argentino',  symbol: '$' },
  { code: 'GBP', label: 'British Pound',   symbol: '£' },
  { code: 'BRL', label: 'Real brasileño',  symbol: 'R$' },
];

export function Settings({ transactions, categories, importTransactions }) {
  const { settings, update } = useSettings();
  const {
    localRules, globalRules, categories: sbCategories, colorMap,
    addRule, removeRule, clearLocalRules, ruleSuggestions, sbError,
  } = useCategoryRules(transactions);
  const [match, setMatch] = useState('');
  const [category, setCategory] = useState(categories[0] || 'Otros');
  const fileRef = useRef(null);
  const [showGlobalRules, setShowGlobalRules] = useState(false);

  const exportAll = () => {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      settings,
      accounts: JSON.parse(localStorage.getItem('finance-accounts') || '[]'),
      goals: JSON.parse(localStorage.getItem('finance-goals') || '[]'),
      debts: JSON.parse(localStorage.getItem('finance-debts') || '[]'),
      budgets: JSON.parse(localStorage.getItem('finance-budgets') || '[]'),
      rules: JSON.parse(localStorage.getItem('finance-category-rules') || '[]'),
      subscriptions: JSON.parse(localStorage.getItem('finance-subscriptions') || '[]'),
      transactionMeta: JSON.parse(localStorage.getItem('finance-tx-meta') || '{}'),
      localTransactions: JSON.parse(localStorage.getItem('finance-local-transactions') || '[]'),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `finanzas-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
  };

  const exportTxsCSV = () => {
    const headers = ['Fecha', 'Descripción', 'Categoría', 'Tipo', 'Cuenta', 'Monto'];
    const rows = transactions.map(t => [t.Fecha, t.Descripción, t.Categoría, t.Tipo, t.Cuenta, t.Monto]);
    const csv = [headers, ...rows]
      .map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    link.download = `transacciones-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    if (file.name.endsWith('.json')) {
      try {
        const data = JSON.parse(text);
        if (data.settings) localStorage.setItem('finance-settings', JSON.stringify(data.settings));
        if (data.accounts) localStorage.setItem('finance-accounts', JSON.stringify(data.accounts));
        if (data.goals) localStorage.setItem('finance-goals', JSON.stringify(data.goals));
        if (data.debts) localStorage.setItem('finance-debts', JSON.stringify(data.debts));
        if (data.budgets) localStorage.setItem('finance-budgets', JSON.stringify(data.budgets));
        if (data.rules) localStorage.setItem('finance-category-rules', JSON.stringify(data.rules));
        if (data.subscriptions) localStorage.setItem('finance-subscriptions', JSON.stringify(data.subscriptions));
        if (data.transactionMeta) localStorage.setItem('finance-tx-meta', JSON.stringify(data.transactionMeta));
        if (data.localTransactions) localStorage.setItem('finance-local-transactions', JSON.stringify(data.localTransactions));
        alert('Backup restaurado. Recarga la página para ver los cambios.');
      } catch {
        alert('Archivo JSON inválido');
      }
    } else if (file.name.endsWith('.csv')) {
      const lines = text.split('\n').filter(Boolean);
      if (lines.length < 2) { alert('CSV vacío'); return; }
      const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());
      const find = (...names) => headers.findIndex(h => names.some(n => h.toLowerCase() === n.toLowerCase()));
      const idx = {
        Fecha: find('Fecha', 'Date'),
        Descripción: find('Descripción', 'Descripcion', 'Description'),
        Categoría: find('Categoría', 'Categoria', 'Category'),
        Tipo: find('Tipo', 'Type'),
        Cuenta: find('Cuenta', 'Account'),
        Monto: find('Monto', 'Amount'),
      };
      const rows = lines.slice(1).map(line => {
        const cells = parseCsvLine(line);
        const Monto = Number(cells[idx.Monto] ?? 0);
        return {
          Fecha: cells[idx.Fecha] || new Date().toISOString().slice(0, 10),
          Descripción: cells[idx.Descripción] || '',
          Categoría: cells[idx.Categoría] || 'Otros',
          Tipo: cells[idx.Tipo] || (Monto < 0 ? 'Gasto' : 'Ingreso'),
          Cuenta: cells[idx.Cuenta] || 'Principal',
          Monto,
        };
      }).filter(r => r.Monto !== 0);
      const n = importTransactions(rows);
      alert(`${n} transacciones importadas localmente`);
    }
    e.target.value = '';
  };

  const dangerReset = (key, label) => {
    if (!confirm(`Esto borrará ${label}. ¿Seguro?`)) return;
    localStorage.removeItem(key);
    alert(`${label} borrado. Recarga la página.`);
  };

  const rulesByCategory = {};
  for (const r of globalRules) {
    if (!rulesByCategory[r.category]) rulesByCategory[r.category] = [];
    rulesByCategory[r.category].push(r);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Ajustes</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">Moneda, categorías, reglas, import/export y datos</p>
      </div>

      {/* Currency */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-4 h-4 text-indigo-500" />
          <h3 className="text-lg font-semibold">Moneda y formato</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium block mb-2">Moneda</label>
            <select value={settings.currency} onChange={e => update({ currency: e.target.value })}
              className="w-full h-10 rounded-xl bg-white/85 dark:bg-slate-800/75 border border-slate-200/80 dark:border-white/15 px-3 text-sm">
              {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.symbol} {c.code} · {c.label}</option>)}
            </select>
            <p className="text-xs text-slate-400 mt-1">Vista previa: {fmtMoney(1234.56, settings.currency)}</p>
          </div>
          <div>
            <label className="text-sm font-medium block mb-2">Inicio del mes</label>
            <Input type="number" min="1" max="28" value={settings.startOfMonth}
                   onChange={e => update({ startOfMonth: Number(e.target.value) || 1 })} />
            <p className="text-xs text-slate-400 mt-1">Día del mes en que empieza tu ciclo financiero</p>
          </div>
        </div>
      </Card>

      {/* Categorías del motor (Supabase, solo lectura) */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-4 h-4 text-emerald-500" />
          <h3 className="text-lg font-semibold">Motor de categorización</h3>
          {sbCategories.length > 0 && (
            <span className="ml-auto text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
              {sbCategories.length} categorías · {globalRules.length} reglas
            </span>
          )}
        </div>

        {sbError && (
          <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200/40 dark:border-amber-700/20 rounded-xl px-3 py-2 mb-4">
            <Info className="w-3.5 h-3.5 shrink-0" />
            {sbError}
          </div>
        )}

        {sbCategories.length > 0 ? (
          <>
            <div className="flex flex-wrap gap-2 mb-4">
              {sbCategories.map(c => (
                <span key={c.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200/80 dark:border-white/15 text-xs font-medium text-slate-700 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color || '#94a3b8' }} />
                  {c.nombre}
                  {rulesByCategory[c.nombre] && (
                    <span className="text-slate-400 dark:text-slate-500">({rulesByCategory[c.nombre].length})</span>
                  )}
                </span>
              ))}
            </div>

            <button onClick={() => setShowGlobalRules(!showGlobalRules)}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors mb-3">
              {showGlobalRules ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {showGlobalRules ? 'Ocultar reglas globales' : `Ver ${globalRules.length} reglas globales`}
            </button>

            {showGlobalRules && (
              <div className="max-h-80 overflow-y-auto space-y-1 border border-slate-200/80 dark:border-white/10 rounded-xl p-3">
                {Object.entries(rulesByCategory).sort(([a], [b]) => a.localeCompare(b)).map(([cat, rules]) => (
                  <div key={cat} className="mb-3 last:mb-0">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colorMap[cat] || '#94a3b8' }} />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{cat}</span>
                      <span className="text-xs text-slate-400">({rules.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-1 pl-3.5">
                      {rules.map(r => (
                        <span key={r.id} className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100/80 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-mono"
                          title={`prioridad: ${r.priority} · campo: ${r.field}`}>
                          {r.match}
                          {r.field === 'comercio' && <span className="text-amber-500 ml-0.5" title="Solo aplica al campo comercio">©</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 mt-4 text-xs text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/60 dark:border-white/5 rounded-xl px-3 py-2">
              <Lock className="w-3.5 h-3.5 shrink-0" />
              Edición de categorías y reglas globales requiere Supabase Auth
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-400 py-4 text-center">
            {sbError ? 'No se pudieron cargar las categorías de Supabase' : 'Sin categorías en Supabase'}
          </p>
        )}
      </Card>

      {/* Local categorization rules */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Wand2 className="w-4 h-4 text-violet-500" />
          <h3 className="text-lg font-semibold">Reglas locales de auto-categorización</h3>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 mb-4">
          Reglas guardadas en este navegador. Tienen prioridad sobre las reglas globales de Supabase.
        </p>

        <form onSubmit={e => { e.preventDefault(); if (match.trim()) { addRule(match.trim(), category); setMatch(''); } }}
              className="grid grid-cols-1 md:grid-cols-[2fr_1fr_auto] gap-2 mb-4">
          <Input placeholder="Patrón (ej: starbucks)" value={match} onChange={e => setMatch(e.target.value)} />
          <select value={category} onChange={e => setCategory(e.target.value)}
            className="h-10 rounded-xl bg-white/85 dark:bg-slate-800/75 border border-slate-200/80 dark:border-white/15 px-3 text-sm">
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <Button type="submit" className="gap-1.5"><Plus className="w-4 h-4" /> Añadir</Button>
        </form>

        {ruleSuggestions.length > 0 && (
          <div className="mb-4 p-3 rounded-xl bg-violet-50/50 dark:bg-violet-900/10 border border-violet-200/40 dark:border-violet-700/20">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-violet-500" />
              <p className="text-xs font-semibold text-violet-700 dark:text-violet-400 uppercase tracking-wide">Sugeridas</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ruleSuggestions.map(s => (
                <button key={`${s.match}-${s.category}`} onClick={() => addRule(s.match, s.category)}
                  className="text-xs px-2.5 py-1 rounded-lg border border-violet-200/50 dark:border-violet-700/30 bg-white/85 dark:bg-slate-800/75 hover:bg-violet-100/60 dark:hover:bg-violet-900/20 transition-colors">
                  <span className="font-mono">{s.match}</span> → <span className="font-semibold">{s.category}</span>
                  <span className="text-slate-400 ml-1">({s.count}×)</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {localRules.length === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center">Sin reglas locales configuradas</p>
        ) : (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500">{localRules.length} regla{localRules.length !== 1 ? 's' : ''}</span>
              <button onClick={() => { if (confirm('¿Borrar todas las reglas locales? Las reglas globales de Supabase seguirán activas.')) clearLocalRules(); }}
                className="text-xs text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 flex items-center gap-1">
                <Trash2 className="w-3 h-3" /> Borrar todas
              </button>
            </div>
            {localRules.map(r => (
              <div key={r.id} className="flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200/80 dark:border-white/15">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-mono text-slate-600 dark:text-slate-300">{r.match}</span>
                  <span className="text-slate-400">→</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{r.category}</span>
                </div>
                <button onClick={() => removeRule(r.id)} className="text-slate-400 hover:text-rose-500">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Seguridad / bloqueo */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          {settings.authEnabled ? <Lock className="w-4 h-4 text-rose-500" /> : <Unlock className="w-4 h-4 text-slate-400" />}
          <h3 className="text-lg font-semibold">Bloqueo de la app</h3>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 mb-4">
          Cuando está activado, la app pide biometría (Face ID / Touch ID) o un PIN para abrirse y al bloquearla.
        </p>
        <label className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200/80 dark:border-white/15 cursor-pointer">
          <span className="text-sm font-medium">Pedir biometría / PIN al abrir</span>
          <input type="checkbox" checked={!!settings.authEnabled}
                 onChange={e => update({ authEnabled: e.target.checked })} className="w-4 h-4" />
        </label>
        <button
          onClick={() => {
            if (!confirm('Esto eliminará el PIN/credencial guardado. ¿Continuar?')) return;
            localStorage.removeItem('finance-auth-credential');
            localStorage.removeItem('finance-auth-setup');
            sessionStorage.removeItem('finance-auth-unlocked');
            alert('Credenciales borradas. Si activas el bloqueo de nuevo te pedirá configurar uno nuevo.');
          }}
          className="mt-3 text-xs text-rose-600 dark:text-rose-400 hover:underline">
          Borrar credenciales guardadas
        </button>
      </Card>

      {/* Import / Export */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <SettingsIcon className="w-4 h-4 text-emerald-500" />
          <h3 className="text-lg font-semibold">Importar y exportar</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button variant="outline" onClick={exportTxsCSV} className="gap-2 justify-center">
            <Download className="w-4 h-4" /> Transacciones (CSV)
          </Button>
          <Button variant="outline" onClick={exportAll} className="gap-2 justify-center">
            <Download className="w-4 h-4" /> Backup completo (JSON)
          </Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()} className="gap-2 justify-center">
            <Upload className="w-4 h-4" /> Importar CSV / JSON
          </Button>
          <input ref={fileRef} type="file" accept=".csv,.json" onChange={onFile} className="hidden" />
        </div>
        <p className="text-xs text-slate-400 mt-3">
          Las transacciones importadas vía CSV se guardan localmente en este navegador (no se suben al backend).
        </p>
      </Card>

      {/* Danger zone */}
      <Card className="p-5 border-rose-200/40 dark:border-rose-700/20">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-rose-500" />
          <h3 className="text-lg font-semibold">Zona peligrosa</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <DangerBtn label="Borrar presupuestos" onClick={() => dangerReset('finance-budgets', 'todos los presupuestos')} />
          <DangerBtn label="Borrar cuentas y patrimonio" onClick={() => { dangerReset('finance-accounts', 'todas las cuentas'); localStorage.removeItem('finance-networth-history'); }} />
          <DangerBtn label="Borrar deudas" onClick={() => dangerReset('finance-debts', 'todas las deudas')} />
          <DangerBtn label="Borrar objetivos" onClick={() => dangerReset('finance-goals', 'todos los objetivos')} />
          <DangerBtn label="Borrar reglas locales" onClick={() => dangerReset('finance-category-rules', 'todas las reglas locales')} />
          <DangerBtn label="Borrar tags y notas" onClick={() => dangerReset('finance-tx-meta', 'tags y notas locales')} />
          <DangerBtn label="Borrar transacciones locales" onClick={() => dangerReset('finance-local-transactions', 'transacciones locales')} />
          <DangerBtn label="Borrar suscripciones manuales" onClick={() => { dangerReset('finance-subscriptions', 'suscripciones manuales'); localStorage.removeItem('finance-subscriptions-ignored'); }} />
        </div>
      </Card>
    </div>
  );
}

function DangerBtn({ label, onClick }) {
  return (
    <button onClick={onClick}
      className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-rose-200/40 dark:border-rose-700/30 bg-rose-50/40 dark:bg-rose-900/10 text-sm text-rose-700 dark:text-rose-400 hover:bg-rose-100/60 dark:hover:bg-rose-900/20 transition-colors">
      <span>{label}</span>
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  );
}

function parseCsvLine(line) {
  const out = [];
  let cur = '';
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuote = !inQuote;
    } else if (c === ',' && !inQuote) {
      out.push(cur); cur = '';
    } else cur += c;
  }
  out.push(cur);
  return out.map(s => s.trim());
}
