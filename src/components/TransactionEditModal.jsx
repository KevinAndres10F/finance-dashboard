import { useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { X, Tag, Plus, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';

export function TransactionEditModal({ tx, idx, meta, categories, onClose, onSave, onDelete, onMetaSet, onTagAdd, onTagRemove, onToggleReviewed }) {
  const [form, setForm] = useState({
    Descripción: tx.Descripción || '',
    Categoría: tx.Categoría || 'Otros',
    Tipo: tx.Tipo || (Number(tx.Monto) < 0 ? 'Gasto' : 'Ingreso'),
    Cuenta: tx.Cuenta || 'Principal',
    Monto: Math.abs(Number(tx.Monto)) || 0,
    Fecha: tx.Fecha || '',
  });
  const [notes, setNotes] = useState(meta.notes || '');
  const [tagInput, setTagInput] = useState('');
  const isLocal = String(tx.id || '').startsWith('local:');

  const submit = (e) => {
    e.preventDefault();
    const finalAmount = form.Tipo === 'Gasto' ? -Math.abs(Number(form.Monto)) : Math.abs(Number(form.Monto));
    onMetaSet(tx, idx, { notes });
    onSave({ ...form, Monto: finalAmount });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass w-full max-w-md rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-white/30 dark:border-white/10 sticky top-0 glass z-10">
          <h3 className="text-lg font-semibold">Editar transacción</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400 hover:text-slate-700" /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          {!isLocal && (
            <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50/80 dark:bg-amber-900/20 px-3 py-2 rounded-xl border border-amber-200/40 dark:border-amber-700/30">
              Los cambios se guardan localmente (override). El backend Google Sheets no se modifica.
            </p>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium block">Tipo</label>
            <div className="flex gap-2">
              {['Gasto', 'Ingreso'].map(t => (
                <button key={t} type="button" onClick={() => setForm({ ...form, Tipo: t })}
                  className={cn('flex-1 py-2 rounded-xl text-sm font-medium border',
                    form.Tipo === t
                      ? t === 'Gasto'
                        ? 'bg-rose-50 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400'
                        : 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
                      : 'bg-white/40 dark:bg-slate-700/40 border-slate-200/60 dark:border-white/10 text-slate-600 dark:text-slate-300'
                  )}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Monto"><Input type="number" step="0.01" required value={form.Monto} onChange={e => setForm({ ...form, Monto: e.target.value })} /></Field>
            <Field label="Fecha"><Input type="date" value={form.Fecha} onChange={e => setForm({ ...form, Fecha: e.target.value })} /></Field>
          </div>

          <Field label="Descripción"><Input required value={form.Descripción} onChange={e => setForm({ ...form, Descripción: e.target.value })} /></Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Categoría">
              <select value={form.Categoría} onChange={e => setForm({ ...form, Categoría: e.target.value })}
                className="w-full h-10 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-white/50 dark:border-white/10 px-3 text-sm">
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Cuenta">
              <Input value={form.Cuenta} onChange={e => setForm({ ...form, Cuenta: e.target.value })} />
            </Field>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium block">Tags</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {(meta.tags || []).map(t => (
                <span key={t} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-50/80 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-xs">
                  <Tag className="w-3 h-3" /> {t}
                  <button type="button" onClick={() => onTagRemove(tx, idx, t)}><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={tagInput} onChange={e => setTagInput(e.target.value)} placeholder="Añadir tag..." />
              <Button type="button" variant="outline" onClick={() => { if (tagInput.trim()) { onTagAdd(tx, idx, tagInput.trim()); setTagInput(''); } }}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <Field label="Notas">
            <textarea rows="3" value={notes} onChange={e => setNotes(e.target.value)}
              className="w-full rounded-xl bg-white/60 dark:bg-slate-800/60 border border-white/50 dark:border-white/10 px-3 py-2 text-sm" />
          </Field>

          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input type="checkbox" checked={!!meta.reviewed} onChange={() => onToggleReviewed(tx, idx)} />
            Marcar como revisada
          </label>

          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1">Guardar</Button>
            <Button type="button" variant="danger" onClick={() => { if (confirm('¿Eliminar transacción?')) onDelete(); }} className="gap-1.5">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
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
