import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export function AchievementToast({ badge, onDismiss }) {
  useEffect(() => {
    if (!badge) return;
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [badge, onDismiss]);

  return (
    <AnimatePresence>
      {badge && (
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 60, scale: 0.9 }}
          transition={{ type: 'spring', bounce: 0.4, duration: 0.5 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 md:bottom-8 md:left-auto md:right-8 md:translate-x-0 z-[60] w-72"
        >
          <div className="glass rounded-2xl p-4 flex items-center gap-4">
            <div className="badge-pop text-3xl shrink-0">{badge.icon}</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                ¡Logro desbloqueado!
              </p>
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{badge.title}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{badge.desc}</p>
            </div>
            <button onClick={onDismiss} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
