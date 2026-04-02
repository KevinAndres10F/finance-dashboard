import { useState, useEffect } from 'react';
import { AlertTriangle, XCircle, X, Target } from 'lucide-react';
import { cn } from '../lib/utils';

const DISMISS_KEY = () => {
  const month = new Date().toISOString().slice(0, 7);
  return `budget-alerts-dismissed-${month}`;
};

export function BudgetAlertBanner({ budgetsInWarning, budgetsExceeded }) {
  const alertCategories = [
    ...budgetsExceeded.map(b => b.category),
    ...budgetsInWarning.map(b => b.category),
  ].sort().join(',');

  const [dismissedCategories, setDismissedCategories] = useState(
    () => sessionStorage.getItem(DISMISS_KEY()) || ''
  );

  // Re-show if a new category crosses a threshold after dismiss
  useEffect(() => {
    const dismissed = sessionStorage.getItem(DISMISS_KEY()) || '';
    setDismissedCategories(dismissed);
  }, [alertCategories]);

  if (budgetsInWarning.length === 0 && budgetsExceeded.length === 0) return null;
  if (dismissedCategories === alertCategories) return null;

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY(), alertCategories);
    setDismissedCategories(alertCategories);
  };

  return (
    <div className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 mt-0.5">
              <Target className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Alertas de presupuesto:
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {budgetsExceeded.map(b => (
                <span
                  key={b.id}
                  className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"
                >
                  <XCircle className="w-3 h-3" />
                  {b.category} excedido ({b.percentage.toFixed(0)}%)
                </span>
              ))}
              {budgetsInWarning.map(b => (
                <span
                  key={b.id}
                  className={cn(
                    "inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full",
                    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                  )}
                >
                  <AlertTriangle className="w-3 h-3" />
                  {b.category} al {b.percentage.toFixed(0)}%
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={dismiss}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 shrink-0 mt-0.5"
            aria-label="Cerrar alertas"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
