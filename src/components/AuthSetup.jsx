import { useState } from 'react';
import { motion } from 'framer-motion';
import { Fingerprint, KeyRound, Wallet, ShieldCheck } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

export function AuthSetup({ onSetupBiometric, onSetupPin, supportsWebAuthn, error }) {
  const [mode, setMode]     = useState('choose'); // 'choose' | 'pin'
  const [pin, setPin]       = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [pinError, setPinError]     = useState('');

  function handlePinSubmit(e) {
    e.preventDefault();
    if (pin.length < 4) { setPinError('Mínimo 4 dígitos'); return; }
    if (pin !== pinConfirm) { setPinError('Los PINs no coinciden'); return; }
    onSetupPin(pin);
  }

  return (
    <div className="app-bg min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', bounce: 0.3, duration: 0.5 }}
        className="glass rounded-3xl p-8 w-full max-w-sm text-center"
      >
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="bg-slate-900/90 dark:bg-white/90 p-4 rounded-2xl shadow-lg">
            <Wallet className="w-8 h-8 text-white dark:text-slate-900" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
          Configura tu acceso
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
          Protege tus datos financieros con biometría o PIN
        </p>

        {mode === 'choose' && (
          <div className="space-y-3">
            {supportsWebAuthn && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={onSetupBiometric}
                className="glass glass-hover w-full flex items-center gap-4 p-4 rounded-2xl text-left"
              >
                <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-xl">
                  <Fingerprint className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white text-sm">
                    Huella / Face ID
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Usa la biometría de tu dispositivo
                  </p>
                </div>
                <ShieldCheck className="w-4 h-4 text-emerald-500 ml-auto" />
              </motion.button>
            )}

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setMode('pin')}
              className="glass glass-hover w-full flex items-center gap-4 p-4 rounded-2xl text-left"
            >
              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                <KeyRound className="w-6 h-6 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white text-sm">PIN numérico</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Crea un código de 4+ dígitos</p>
              </div>
            </motion.button>

            {error && (
              <p className="text-xs text-rose-600 dark:text-rose-400 text-center mt-2">{error}</p>
            )}
          </div>
        )}

        {mode === 'pin' && (
          <form onSubmit={handlePinSubmit} className="space-y-4 text-left">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">
                Crear PIN
              </label>
              <Input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={8}
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Mínimo 4 dígitos"
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">
                Confirmar PIN
              </label>
              <Input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={8}
                value={pinConfirm}
                onChange={e => setPinConfirm(e.target.value.replace(/\D/g, ''))}
                placeholder="Repite el PIN"
              />
            </div>
            {pinError && (
              <p className="text-xs text-rose-600 dark:text-rose-400">{pinError}</p>
            )}
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setMode('choose')} className="flex-1">
                Atrás
              </Button>
              <Button type="submit" className="flex-1">Guardar PIN</Button>
            </div>
          </form>
        )}

        <p className="text-xs text-slate-400 dark:text-slate-500 mt-6">
          Solo tú puedes acceder a tus datos
        </p>
      </motion.div>
    </div>
  );
}
