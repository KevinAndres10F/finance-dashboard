import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';
import { Link2, TrendingUp, Bitcoin, Building2, ArrowRight, Lock, Sparkles } from 'lucide-react';

const CONNECTIONS = [
  {
    id: 'plaid',
    name: 'Plaid',
    subtitle: 'Banca tradicional',
    desc: 'Conecta tu cuenta bancaria y tarjetas de crédito. Importa transacciones automáticamente.',
    icon: Building2,
    color: 'blue',
    status: 'coming_soon',
    features: ['Importación automática', 'Balance en tiempo real', 'Historial de 12 meses'],
  },
  {
    id: 'snaptrade',
    name: 'SnapTrade',
    subtitle: 'Inversiones y criptoactivos',
    desc: 'Sincroniza tu portafolio de acciones, ETFs y criptomonedas en tiempo real.',
    icon: Bitcoin,
    color: 'emerald',
    status: 'coming_soon',
    features: ['Portafolio unificado', 'P&L en tiempo real', 'Crypto + stocks'],
  },
  {
    id: 'sheets',
    name: 'Google Sheets',
    subtitle: 'Backend actual',
    desc: 'Tu fuente de datos principal. Todas las transacciones se guardan en tu hoja de cálculo.',
    icon: TrendingUp,
    color: 'amber',
    status: 'active',
    features: ['Activo', 'Datos en tiempo real', 'Sin límites'],
  },
];

const colorMap = {
  blue:    { bg: 'bg-blue-50/80 dark:bg-blue-900/20',    icon: 'text-blue-600 dark:text-blue-400',    border: 'border-blue-200/60 dark:border-blue-800/40' },
  emerald: { bg: 'bg-emerald-50/80 dark:bg-emerald-900/20', icon: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200/60 dark:border-emerald-800/40' },
  amber:   { bg: 'bg-amber-50/80 dark:bg-amber-900/20',   icon: 'text-amber-600 dark:text-amber-400',   border: 'border-amber-200/60 dark:border-amber-800/40' },
};

export function ConnectionsPanel() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Conexiones</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
          Integra tus cuentas financieras en un solo lugar
        </p>
      </div>

      {/* Roadmap banner */}
      <Card className="p-4">
        <div className="flex items-start gap-3">
          <div className="bg-violet-50 dark:bg-violet-900/30 p-2 rounded-xl">
            <Sparkles className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Próximamente</p>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
              Las integraciones con Plaid y SnapTrade requieren un backend seguro para gestionar
              tokens OAuth. Estarán disponibles en la próxima iteración.
            </p>
          </div>
        </div>
      </Card>

      {/* Connection cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {CONNECTIONS.map(conn => {
          const c = colorMap[conn.color];
          const isActive = conn.status === 'active';
          return (
            <Card key={conn.id} className="p-6 flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div className={cn('p-3 rounded-xl', c.bg)}>
                  <conn.icon className={cn('w-6 h-6', c.icon)} />
                </div>
                <span className={cn(
                  'text-xs font-semibold px-2.5 py-1 rounded-full border',
                  isActive
                    ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-700/40'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200/60 dark:border-slate-700/40'
                )}>
                  {isActive ? '● Activo' : 'Próximamente'}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">{conn.name}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mb-2">{conn.subtitle}</p>
                <p className="text-sm text-slate-600 dark:text-slate-300">{conn.desc}</p>
              </div>

              <ul className="space-y-1.5">
                {conn.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <div className={cn('w-1.5 h-1.5 rounded-full', c.icon.replace('text-', 'bg-'))} />
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                variant={isActive ? 'secondary' : 'outline'}
                size="sm"
                className="w-full gap-2 mt-auto"
                disabled={!isActive}
              >
                {isActive ? (
                  <>Ver datos <ArrowRight className="w-3.5 h-3.5" /></>
                ) : (
                  <><Lock className="w-3.5 h-3.5" /> Requiere backend</>
                )}
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
