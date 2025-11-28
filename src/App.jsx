import { useState } from 'react';
import { useFinanzas } from './hooks/useFinanzas';
import { Card } from './components/ui/Card';
import { Button } from './components/ui/Button';
import { Input } from './components/ui/Input';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend
} from 'recharts';
import {
  Wallet, TrendingUp, TrendingDown, Plus, X,
  CreditCard, Calendar, Tag, DollarSign, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from './lib/utils';

const COLORS = ['#10b981', '#f43f5e', '#3b82f6', '#f59e0b', '#8b5cf6', '#64748b'];

function App() {
  const { transactions, loading, error, addTransaction, stats } = useFinanzas();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    Monto: '',
    Descripción: '',
    Categoría: 'Otros',
    Cuenta: 'Principal',
    Tipo: 'Gasto'
  });
  const [submitStatus, setSubmitStatus] = useState('idle'); // idle, loading, success, error

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitStatus('loading');

    // Convert Monto based on Tipo
    const amount = parseFloat(formData.Monto);
    const finalAmount = formData.Tipo === 'Gasto' ? -Math.abs(amount) : Math.abs(amount);

    const result = await addTransaction({
      ...formData,
      Monto: finalAmount,
      Fecha: new Date().toISOString().split('T')[0]
    });

    if (result.success) {
      setSubmitStatus('success');
      setTimeout(() => {
        setIsModalOpen(false);
        setSubmitStatus('idle');
        setFormData({
          Monto: '',
          Descripción: '',
          Categoría: 'Otros',
          Cuenta: 'Principal',
          Tipo: 'Gasto'
        });
      }, 1500);
    } else {
      setSubmitStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20 md:pb-10">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-slate-900 p-2 rounded-lg">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Finanzas</h1>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="gap-2 shadow-sm">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nueva Transacción</span>
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SummaryCard
            title="Balance Total"
            amount={stats.balance}
            icon={Wallet}
            trend={stats.balance >= 0 ? 'positive' : 'negative'}
          />
          <SummaryCard
            title="Ingresos del Mes"
            amount={stats.income}
            icon={TrendingUp}
            className="text-emerald-600"
            iconBg="bg-emerald-100"
          />
          <SummaryCard
            title="Gastos del Mes"
            amount={stats.expenses}
            icon={TrendingDown}
            className="text-rose-600"
            iconBg="bg-rose-100"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content: Transactions */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">Últimas Transacciones</h2>
              <Button variant="ghost" size="sm">Ver todo</Button>
            </div>

            <Card className="p-0 overflow-hidden border-slate-200/60 shadow-sm">
              {loading && transactions.length === 0 ? (
                <div className="p-8 text-center text-slate-500">Cargando transacciones...</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {transactions.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">No hay transacciones recientes.</div>
                  ) : (
                    transactions.map((t, i) => (
                      <TransactionItem key={i} transaction={t} />
                    ))
                  )}
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar: Chart */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-slate-800">Gastos por Categoría</h2>
            <Card className="min-h-[300px] flex flex-col items-center justify-center">
              {stats.chartData.length > 0 ? (
                <div className="w-full h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {stats.chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-slate-400 text-sm">No hay datos de gastos aún</div>
              )}
            </Card>
          </div>
        </div>
      </main>

      {/* Mobile Floating Action Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-6 right-6 md:hidden bg-slate-900 text-white p-4 rounded-full shadow-lg hover:bg-slate-800 transition-colors z-40"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.95 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none"
            >
              <div className="bg-white w-full max-w-md rounded-2xl shadow-xl pointer-events-auto overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                  <h3 className="text-lg font-semibold">Nueva Transacción</h3>
                  <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Tipo</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, Tipo: 'Gasto' })}
                        className={cn(
                          "flex-1 py-2 rounded-lg text-sm font-medium transition-colors border",
                          formData.Tipo === 'Gasto'
                            ? "bg-rose-50 border-rose-200 text-rose-700"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        )}
                      >
                        Gasto
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, Tipo: 'Ingreso' })}
                        className={cn(
                          "flex-1 py-2 rounded-lg text-sm font-medium transition-colors border",
                          formData.Tipo === 'Ingreso'
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        )}
                      >
                        Ingreso
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Monto</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        type="number"
                        step="0.01"
                        name="Monto"
                        value={formData.Monto}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        className="pl-9"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Descripción</label>
                    <Input
                      name="Descripción"
                      value={formData.Descripción}
                      onChange={handleInputChange}
                      placeholder="Ej: Compras del super"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Categoría</label>
                      <select
                        name="Categoría"
                        value={formData.Categoría}
                        onChange={handleInputChange}
                        className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                      >
                        <option>Comida</option>
                        <option>Transporte</option>
                        <option>Entretenimiento</option>
                        <option>Salud</option>
                        <option>Servicios</option>
                        <option>Salario</option>
                        <option>Otros</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Cuenta</label>
                      <select
                        name="Cuenta"
                        value={formData.Cuenta}
                        onChange={handleInputChange}
                        className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                      >
                        <option>Principal</option>
                        <option>Ahorros</option>
                        <option>Efectivo</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={submitStatus === 'loading'}
                    >
                      {submitStatus === 'loading' ? 'Guardando...' : 'Guardar Transacción'}
                    </Button>
                    {submitStatus === 'success' && (
                      <p className="text-center text-emerald-600 text-sm mt-2">¡Guardado con éxito!</p>
                    )}
                    {submitStatus === 'error' && (
                      <p className="text-center text-rose-600 text-sm mt-2">Error al guardar.</p>
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

function SummaryCard({ title, amount, icon: Icon, className, iconBg, trend }) {
  return (
    <Card className="flex items-center gap-4">
      <div className={cn("p-3 rounded-xl", iconBg || "bg-slate-100")}>
        <Icon className={cn("w-6 h-6", className || "text-slate-600")} />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <h3 className={cn("text-2xl font-bold tracking-tight", className)}>
          ${amount.toFixed(2)}
        </h3>
      </div>
    </Card>
  );
}

function TransactionItem({ transaction }) {
  const isExpense = transaction.Tipo === 'Gasto' || transaction.Monto < 0;
  return (
    <div className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group">
      <div className="flex items-center gap-4">
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center",
          isExpense ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
        )}>
          {isExpense ? <TrendingDown className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
        </div>
        <div>
          <p className="font-medium text-slate-900">{transaction.Descripción}</p>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>{transaction.Categoría}</span>
            <span>•</span>
            <span>{transaction.Fecha}</span>
          </div>
        </div>
      </div>
      <div className={cn(
        "font-semibold",
        isExpense ? "text-rose-600" : "text-emerald-600"
      )}>
        {isExpense ? '-' : '+'}${Math.abs(transaction.Monto).toFixed(2)}
      </div>
    </div>
  );
}

export default App;
