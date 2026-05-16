import { useState } from 'react';
import { motion } from 'framer-motion';
import { Fingerprint, KeyRound, Wallet, Lock } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

export function LockScreen({ onUnlock, onUnlockPin, authType, error, supportsWebAuthn }) {
  const [showPin, setShowPin] = useState(authType === 'pin');
  const [pin, setPin]         = useState('');

  function handlePinSubmit(e) {
    e.preventDefault();
    onUnlockPin(pin);
    setPin('');
  }

  return (
    <div className="app-bg min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', bounce: 0.25, duration: 0.5 }}
        className="glass rounded-3xl p-8 w-full max-w-sm text-center"
      >
        {/* Animated lock icon */}
        <motion.div
          className="flex justify-center mb-6"
          initial={{ y: -10 }}
          animate={{ y: 0 }}
          transition={{ type: 'spring', bounce: 0.5, delay: 0.2 }}
        >
          <div className="relative">
            <div className="bg-slate-900/90 dark:bg-white/90 p-5 rounded-2xl shadow-lg">
              <Wallet className="w-9 h-9 text-white dark:text-slate-900" />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-slate-700 dark:bg-slate-300 p-1.5 rounded-lg shadow">
              <Lock className="w-3.5 h-3.5 text-white dark:text-slate-800" />
            </div>
          </div>
        </motion.div>

        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
          Finanzas
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-8">
          Verifica tu identidad para continuar
        </p>

        {!showPin ? (
          <div className="space-y-3">
            {supportsWebAuthn && authType === 'webauthn' && (
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={onUnlock}
                className="glass glass-hover w-full flex flex-col items-center gap-3 p-6 rounded-2xl"
              >
                <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-2xl">
                  <Fingerprint className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  Usar Huella / Face ID
                </span>
              </motion.button>
            )}

            <button
              onClick={() => setShowPin(true)}
              className="text-sm text-slate-600 dark:text-slate-300 hover:text-slate-700 dark:hover:text-slate-100 underline underline-offset-2"
            >
              Usar PIN en su lugar
            </button>
          </div>
        ) : (
          <form onSubmit={handlePinSubmit} className="space-y-4">
            <Input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={8}
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="Ingresa tu PIN"
              autoFocus
              className="text-center text-xl tracking-widest"
            />
            <Button type="submit" className="w-full gap-2">
              <KeyRound className="w-4 h-4" />
              Desbloquear
            </Button>
            {supportsWebAuthn && authType === 'webauthn' && (
              <button
                type="button"
                onClick={() => { setShowPin(false); onUnlock(); }}
                className="text-sm text-slate-600 dark:text-slate-300 hover:text-slate-700 dark:hover:text-slate-100 underline underline-offset-2"
              >
                Usar biometría
              </button>
            )}
          </form>
        )}

        {error && (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-rose-600 dark:text-rose-400 mt-4"
          >
            {error}
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}
