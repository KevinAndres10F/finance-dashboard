import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Plus, Moon, Sun, LogOut, Menu, X, Flame } from 'lucide-react';
import { cn } from '../lib/utils';

export function Sidebar({
  tabs, activeTab, onTabChange,
  currency, streak,
  darkMode, onToggleDarkMode,
  authEnabled, onLock,
  onNewTransaction,
  drawerOpen, onDrawerToggle,
}) {
  const closeDrawerAnd = (fn) => (...args) => {
    if (drawerOpen) onDrawerToggle(false);
    fn?.(...args);
  };

  return (
    <>
      {/* Mobile topbar */}
      <header className="md:hidden glass-header sticky top-0 z-30">
        <div className="px-4 h-14 flex items-center justify-between gap-3">
          <button
            onClick={() => onDrawerToggle(!drawerOpen)}
            className="p-2 -ml-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-white/40 dark:hover:bg-white/10 transition-colors"
            aria-label="Menú"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="bg-slate-900/90 dark:bg-white/90 p-1.5 rounded-lg shrink-0">
              <Wallet className="w-4 h-4 text-white dark:text-slate-900" />
            </div>
            <h1 className="text-base font-bold tracking-tight truncate">Finanzas</h1>
            {streak > 0 && (
              <div className="flex items-center gap-1 bg-amber-50/80 dark:bg-amber-900/30 border border-amber-200/60 dark:border-amber-700/30 px-2 py-0.5 rounded-full shrink-0">
                <Flame className="w-3 h-3 text-amber-500 streak-pulse" />
                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400">{streak}</span>
              </div>
            )}
          </div>
          <button
            onClick={onNewTransaction}
            className="bg-slate-900/90 dark:bg-white/90 text-white dark:text-slate-900 p-2 rounded-xl shadow-sm hover:shadow transition-all"
            aria-label="Nueva transacción"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => onDrawerToggle(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
              className="fixed left-0 top-0 bottom-0 w-72 max-w-[85vw] z-50 md:hidden flex flex-col glass border-r border-slate-200/60 dark:border-white/10"
            >
              <SidebarBody
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={closeDrawerAnd(onTabChange)}
                currency={currency}
                streak={streak}
                darkMode={darkMode}
                onToggleDarkMode={onToggleDarkMode}
                authEnabled={authEnabled}
                onLock={closeDrawerAnd(onLock)}
                onNewTransaction={closeDrawerAnd(onNewTransaction)}
                onClose={() => onDrawerToggle(false)}
                showCloseButton
                layoutId="sidebar-pill-mobile"
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 z-20 flex-col glass border-r border-slate-200/60 dark:border-white/10">
        <SidebarBody
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={onTabChange}
          currency={currency}
          streak={streak}
          darkMode={darkMode}
          onToggleDarkMode={onToggleDarkMode}
          authEnabled={authEnabled}
          onLock={onLock}
          onNewTransaction={onNewTransaction}
          layoutId="sidebar-pill-desktop"
        />
      </aside>
    </>
  );
}

function SidebarBody({
  tabs, activeTab, onTabChange,
  currency, streak,
  darkMode, onToggleDarkMode,
  authEnabled, onLock,
  onNewTransaction,
  onClose, showCloseButton,
  layoutId = 'sidebar-pill',
}) {
  return (
    <>
      {/* Header section */}
      <div className="p-5 border-b border-slate-200/60 dark:border-white/10">
        <div className="flex items-center gap-3">
          <div className="bg-slate-900/90 dark:bg-white/90 p-2 rounded-xl shadow-sm shrink-0">
            <Wallet className="w-5 h-5 text-white dark:text-slate-900" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold tracking-tight leading-tight">Finanzas</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100/80 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-medium">
                {currency}
              </span>
              {streak > 0 && (
                <span className="flex items-center gap-0.5 bg-amber-50/80 dark:bg-amber-900/30 border border-amber-200/60 dark:border-amber-700/30 px-1.5 py-0.5 rounded-md">
                  <Flame className="w-2.5 h-2.5 text-amber-500 streak-pulse" />
                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400">{streak}</span>
                </span>
              )}
            </div>
          </div>
          {showCloseButton && (
            <button onClick={onClose} className="p-1.5 -mr-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/40 dark:hover:bg-white/10">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          onClick={onNewTransaction}
          className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-slate-900/90 dark:bg-white/90 text-white dark:text-slate-900 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm hover:shadow-md hover:bg-slate-800 dark:hover:bg-white transition-all"
        >
          <Plus className="w-4 h-4" />
          Nueva Transacción
        </button>
      </div>

      {/* Nav list */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5 scrollbar-none">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                isActive
                  ? 'text-slate-900 dark:text-white'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white/40 dark:hover:bg-white/5'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId={layoutId}
                  className="absolute inset-0 rounded-xl bg-white/80 dark:bg-white/10 shadow-sm border border-white/60 dark:border-white/15"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                />
              )}
              <span className="relative flex items-center gap-3 w-full">
                {tab.icon && <tab.icon className="w-4 h-4 shrink-0" />}
                <span className="truncate">{tab.label}</span>
              </span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-slate-200/60 dark:border-white/10 flex items-center gap-1">
        <button
          onClick={onToggleDarkMode}
          className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-white/40 dark:hover:bg-white/10 transition-colors"
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          <span>{darkMode ? 'Claro' : 'Oscuro'}</span>
        </button>
        {authEnabled && (
          <button
            onClick={onLock}
            className="inline-flex items-center justify-center p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-white/40 dark:hover:bg-white/10 transition-colors"
            title="Bloquear app"
            aria-label="Bloquear app"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </>
  );
}
