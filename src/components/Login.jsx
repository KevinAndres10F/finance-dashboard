import { useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Mail, Lock, Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

const ERROR_MESSAGES = {
  'Invalid login credentials': 'Correo o contraseña incorrectos',
  'Email not confirmed': 'El correo no está confirmado',
  'Too many requests': 'Demasiados intentos. Espera unos minutos',
  'missing email or phone': 'Ingresa tu correo y contraseña',
};

function toSpanish(message) {
  if (!message) return 'Error al iniciar sesión';
  for (const [en, es] of Object.entries(ERROR_MESSAGES)) {
    if (message.toLowerCase().includes(en.toLowerCase())) return es;
  }
  if (message.toLowerCase().includes('network') || message.toLowerCase().includes('fetch')) {
    return 'Error de conexión. Revisa tu internet';
  }
  return 'Error al iniciar sesión';
}

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!supabase) {
      setError('Supabase no está configurado');
      return;
    }
    setLoading(true);
    setError('');
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      setError(toSpanish(err.message));
      setLoading(false);
    }
    // Si no hay error, onAuthStateChange en useSession desmonta este componente
  };

  const inputCls = "w-full h-11 pl-10 pr-10 rounded-xl text-sm bg-white/85 dark:bg-slate-800/75 border border-slate-200/80 dark:border-white/10 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 transition-all";

  return (
    <div className="app-bg min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35 }}
        className="glass rounded-3xl p-8 w-full max-w-sm"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="bg-slate-900/90 dark:bg-white/90 p-3 rounded-2xl shadow-sm mb-4">
            <Wallet className="w-7 h-7 text-white dark:text-slate-900" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Finanzas</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Inicia sesión para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Correo electrónico"
              autoComplete="email"
              required
              className={inputCls}
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Contraseña"
              autoComplete="current-password"
              required
              className={inputCls}
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400 bg-rose-50/80 dark:bg-rose-900/20 border border-rose-200/60 dark:border-rose-700/30 rounded-xl px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 bg-slate-900/90 dark:bg-white/90 text-white dark:text-slate-900 h-11 rounded-xl text-sm font-semibold shadow-sm hover:shadow-md hover:bg-slate-800 dark:hover:bg-white transition-all disabled:opacity-60"
          >
            <LogIn className="w-4 h-4" />
            {loading ? 'Iniciando sesión…' : 'Iniciar sesión'}
          </button>
        </form>

        <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center mt-6">
          Acceso restringido — no hay registro público
        </p>
      </motion.div>
    </div>
  );
}
