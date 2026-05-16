import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export function Tabs({ tabs, activeTab, onTabChange }) {
  return (
    <div className="glass rounded-2xl px-2 py-1.5">
      <div className="flex gap-1 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "relative px-4 py-2.5 text-sm font-medium whitespace-nowrap rounded-xl",
                "transition-colors duration-200",
                isActive
                  ? "text-slate-900 dark:text-white"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-700 dark:hover:text-slate-100"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="tab-pill"
                  className="absolute inset-0 rounded-xl bg-white/80 dark:bg-white/10 shadow-sm border border-white/60 dark:border-white/15"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                />
              )}
              <span className="relative flex items-center gap-2">
                {tab.icon && <tab.icon className="w-4 h-4" />}
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
