import { useState, useEffect } from 'react';
import { useFinanzas } from './hooks/useFinanzas';
import { useBudgets } from './hooks/useBudgets';
import { useDeviceAuth } from './hooks/useDeviceAuth';
import { useSettings } from './hooks/useSettings';
import { useCategoryRules } from './hooks/useCategoryRules';
import { useGamification } from './hooks/useGamification';
import { Card } from './components/ui/Card';
import { Button } from './components/ui/Button';
import { Input } from './components/ui/Input';
import { Tabs } from './components/Tabs';
import { Statistics } from './components/Statistics';
import { TransactionList } from './components/TransactionList';
import { Budgets } from './components/Budgets';
import { BudgetAlertBanner } from './components/BudgetAlertBanner';
import { LockScreen } from './components/LockScreen';
import { AuthSetup } from './components/AuthSetup';
import { GamificationDashboard } from './components/GamificationDashboard';
import { AchievementToast } from './components/AchievementToast';
import { ConnectionsPanel } from './components/ConnectionsPanel';
import { Dashboard } from './components/Dashboard';
import { WealthHub } from './components/WealthHub';
import { Goals } from './components/Goals';
import { Subscriptions } from './components/Subscriptions';
import { Settings as SettingsView } from './components/Settings';
import {
  Wallet, Plus, X, DollarSign, Moon, Sun, Target, BarChart3, ListTodo,
  LogOut, Trophy, Flame, Link, Repeat, PiggyBank, Settings as SettingsIcon, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, fmtMoney } from './lib/utils';

function App() {
  const auth = useDeviceAuth();
  const {
    transactions, loading, error, addTransaction, updateTransaction,
    deleteTransaction, importTransactions, stats, categories
  } = useFinanzas();
  const { budgetData, budgetsInWarning, budgetsExceeded } = useBudgets(transactions);
  const gamification = useGamification(transactions, budgetData);
  const { settings } = useSettings();
  const rules = useCategoryRules(transactions);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const [formData, setFormData] = useState({
    Monto: '', Descripción: '', Categoría: 'Otros',
    Cuenta: 'Principal', Tipo: 'Gasto',
    Fecha: new Date().toISOString().split('T')[0],
  });
  const [submitStatus, setSubmitStatus] = useState('idle');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [autoSuggested, setAutoSuggested] = useState(null);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  // Auto-sugerir categoría según las reglas cuando cambia la descripción
  useEffect(() => {
    if (!formData.Descripción || isCustomCategory) return;
    const suggested = rules.suggestCategory(formData.Descripción);
    if (suggested && suggested !== formData.Categoría) {
      setAutoSuggested(suggested);
    } else {
      setAutoSuggested(null);
    }
  }, [formData.Descripción, isCustomCategory, rules]);

  const tabs = [
    { id: 'overview',      label: 'Resumen',       icon: Wallet },
    { id: 'transactions',  label: 'Transacciones', icon: ListTodo },
    { id: 'statistics',    label: 'Estadísticas',  icon: BarChart3 },
    { id: 'budgets',       label: 'Presupuestos',  icon: Target },
    { id: 'wealth',        label: 'Patrimonio',    icon: PiggyBank },
    { id: 'goals',         label: 'Objetivos',     icon: Sparkles },
    { id: 'subscriptions', label: 'Recurrentes',   icon: Repeat },
    { id: 'gamification',  label: 'Logros',        icon: Trophy },
    { id: 'connections',   label: 'Conexiones',    icon: Link },
    { id: 'settings',      label: 'Ajustes',       icon: SettingsIcon },
  ];

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    gamification.visitSection(tab);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const applyAutoSuggested = () => {
    if (autoSuggested) {
      setFormData(prev => ({ ...prev, Categoría: autoSuggested }));
      setAutoSuggested(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitStatus('loading');
    const amount = parseFloat(formData.Monto);
    const finalAmount = formData.Tipo === 'Gasto' ? -Math.abs(amount) : Math.abs(amount);
    const result = await addTransaction({
      ...formData,
      Monto: finalAmount,
      Fecha: formData.Fecha || new Date().toISOString().split('T')[0],
    });
    if (result.success) {
      setSubmitStatus('success');
      setTimeout(() => {
        setIsModalOpen(false);
        setSubmitStatus('idle');
        setFormData({
          Monto: '', Descripción: '', Categoría: 'Otros',
          Cuenta: 'Principal', Tipo: 'Gasto',
          Fecha: new Date().toISOString().split('T')[0],
        });
        setIsCustomCategory(false);
        setAutoSuggested(null);
      }, 1200);
    } else {
      setSubmitStatus('error');
    }
  };

  if (auth.status === 'setup-required') {
    return (
      <AuthSetup
        supportsWebAuthn={auth.supportsWebAuthn}
        error={auth.error}
        onSetupBiometric={auth.setupBiometric}
        onSetupPin={auth.setupFallbackPin}
      />
    );
  }
  if (auth.status === 'locked') {
    return (
      <LockScreen
        authType={auth.authType}
        error={auth.error}
        supportsWebAuthn={auth.supportsWebAuthn}
        onUnlock={auth.unlock}
        onUnlockPin={auth.unlockWithPin}
      />
    );
  }

  return (
    <div className="app-bg text-slate-900 dark:text-white font-sans pb-20 md:pb-10 transition-colors">
      <header className="glass-header sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-slate-900/90 dark:bg-white/90 p-2 rounded-xl shadow-sm">
              <Wallet className="w-5 h-5 text-white dark:text-slate-900" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Finanzas</h1>
            <span className="hidden md:inline text-xs px-2 py-0.5 rounded-full bg-slate-100/80 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400">
              {settings.currency}
            </span>
            {gamification.streak > 0 && (
              <div className="hidden sm:flex items-center gap-1 bg-amber-50/80 dark:bg-amber-900/30 border border-amber-200/60 dark:border-amber-700/30 px-2.5 py-1 rounded-full">
                <Flame className="w-3.5 h-3.5 text-amber-500 streak-pulse" />
                <span className="text-xs font-bold text-amber-700 dark:text-amber-400">{gamification.streak}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setDarkMode(!darkMode)} className="p-2">
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={auth.lock} className="p-2" title="Bloquear app">
              <LogOut className="w-5 h-5" />
            </Button>
            <Button onClick={() => setIsModalOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nueva Transacción</span>
            </Button>
          </div>
        </div>
      </header>

      <BudgetAlertBanner budgetsInWarning={budgetsInWarning} budgetsExceeded={budgetsExceeded} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Tabs tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} />

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.18 }}
          >
            {activeTab === 'overview' && <Dashboard stats={stats} transactions={transactions} budgetData={budgetData} />}
            {activeTab === 'transactions' && (
              <TransactionList
                transactions={transactions}
                categories={categories}
                updateTransaction={updateTransaction}
                deleteTransaction={deleteTransaction}
              />
            )}
            {activeTab === 'statistics' && <Statistics transactions={transactions} budgetData={budgetData} />}
            {activeTab === 'budgets' && <Budgets transactions={transactions} categories={categories} />}
            {activeTab === 'wealth' && <WealthHub />}
            {activeTab === 'goals' && <Goals />}
            {activeTab === 'subscriptions' && <Subscriptions transactions={transactions} />}
            {activeTab === 'gamification' && (
              <GamificationDashboard
                xp={gamification.xp}
                level={gamification.level}
                streak={gamification.streak}
                longestStreak={gamification.longestStreak}
                badges={gamification.badges}
                missions={gamification.missions}
              />
            )}
            {activeTab === 'connections' && <ConnectionsPanel />}
            {activeTab === 'settings' && (
              <SettingsView
                transactions={transactions}
                categories={categories}
                importTransactions={importTransactions}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <AchievementToast badge={gamification.newBadge} onDismiss={gamification.dismissBadge} />

      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-6 right-6 md:hidden bg-slate-900/90 dark:bg-white/90 text-white dark:text-slate-900 p-4 rounded-full shadow-lg hover:shadow-xl transition-all z-40 backdrop-blur-sm"
      >
        <Plus className="w-6 h-6" />
      </button>

      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.96 }}
              transition={{ type: 'spring', bounce: 0.25, duration: 0.4 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none"
            >
              <div className="glass w-full max-w-md rounded-2xl pointer-events-auto overflow-hidden max-h-[92vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-white/30 dark:border-white/10 sticky top-0 glass z-10">
                  <h3 className="text-lg font-semibold">Nueva Transacción</h3>
                  <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Tipo</label>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setFormData({ ...formData, Tipo: 'Gasto' })}
                        className={cn('flex-1 py-2 rounded-lg text-sm font-medium transition-colors border',
                          formData.Tipo === 'Gasto'
                            ? 'bg-rose-50 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400'
                            : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600'
                        )}>
                        Gasto
                      </button>
                      <button type="button" onClick={() => setFormData({ ...formData, Tipo: 'Ingreso' })}
                        className={cn('flex-1 py-2 rounded-lg text-sm font-medium transition-colors border',
                          formData.Tipo === 'Ingreso'
                            ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
                            : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600'
                        )}>
                        Ingreso
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Monto</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input type="number" step="0.01" name="Monto" value={formData.Monto}
                               onChange={handleInputChange} placeholder="0.00" className="pl-9" required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Fecha</label>
                      <Input type="date" name="Fecha" value={formData.Fecha} onChange={handleInputChange} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Descripción</label>
                    <Input name="Descripción" value={formData.Descripción}
                      onChange={handleInputChange} placeholder="Ej: Compras del super" required />
                  </div>

                  {autoSuggested && (
                    <button type="button" onClick={applyAutoSuggested}
                      className="w-full text-left text-xs px-3 py-2 rounded-xl bg-violet-50/80 dark:bg-violet-900/20 border border-violet-200/60 dark:border-violet-700/30 text-violet-700 dark:text-violet-400 hover:bg-violet-100/80 dark:hover:bg-violet-900/30 transition-colors flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5" />
                      Regla detectada · usar categoría <span className="font-bold">{autoSuggested}</span>
                    </button>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Categoría</label>
                      {isCustomCategory ? (
                        <div className="flex gap-2">
                          <Input name="Categoría" value={formData.Categoría} onChange={handleInputChange}
                            placeholder="Nueva categoría..." required autoFocus />
                          <button type="button" onClick={() => {
                              setIsCustomCategory(false);
                              setFormData(prev => ({ ...prev, Categoría: categories[0] || 'Otros' }));
                            }}
                            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
                            title="Volver a la lista">
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <select name="Categoría" value={formData.Categoría}
                          onChange={(e) => {
                            if (e.target.value === '__NEW__') {
                              setIsCustomCategory(true);
                              setFormData(prev => ({ ...prev, Categoría: '' }));
                            } else handleInputChange(e);
                          }}
                          className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400">
                          {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                          <option value="__NEW__" className="font-semibold text-indigo-600">+ Nueva Categoría...</option>
                        </select>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Cuenta</label>
                      <select name="Cuenta" value={formData.Cuenta} onChange={handleInputChange}
                        className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400">
                        <option>Principal</option>
                        <option>Ahorros</option>
                        <option>Efectivo</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button type="submit" className="w-full" disabled={submitStatus === 'loading'}>
                      {submitStatus === 'loading' ? 'Guardando...' : 'Guardar Transacción'}
                    </Button>
                    {submitStatus === 'success' && (
                      <p className="text-center text-emerald-600 dark:text-emerald-400 text-sm mt-2">¡Guardado con éxito!</p>
                    )}
                    {submitStatus === 'error' && (
                      <p className="text-center text-rose-600 dark:text-rose-400 text-sm mt-2">Error al guardar.</p>
                    )}
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
