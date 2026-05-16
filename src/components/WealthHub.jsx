import { useState } from 'react';
import { NetWorth } from './NetWorth';
import { Debts } from './Debts';
import { cn } from '../lib/utils';
import { Wallet, CreditCard } from 'lucide-react';

export function WealthHub() {
  const [view, setView] = useState('networth');
  return (
    <div className="space-y-4">
      <div className="glass rounded-2xl px-2 py-1.5 inline-flex gap-1">
        {[
          { id: 'networth', label: 'Patrimonio Neto', icon: Wallet },
          { id: 'debts',    label: 'Deudas',          icon: CreditCard },
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
      {view === 'networth' && <NetWorth />}
      {view === 'debts' && <Debts />}
    </div>
  );
}
