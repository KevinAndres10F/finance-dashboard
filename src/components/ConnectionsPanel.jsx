import { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { cn, fmtDate } from '../lib/utils';
import { supabase, isAuthError } from '../lib/supabase';
import {
  Link2, Database, Mail, Clock, CheckCircle2, AlertTriangle, XCircle,
  ArrowRight, RefreshCw, Sparkles, Activity
} from 'lucide-react';

export function ConnectionsPanel() {
  const [health, setHealth] = useState({ loading: true, error: null, denied: false, runs: [], emails: null });

  useEffect(() => {
    if (!supabase) {
      setHealth({ loading: false, error: 'Supabase no configurado', denied: false, runs: [], emails: null });
      return;
    }
    loadHealth();
  }, []);

  async function loadHealth() {
    setHealth(h => ({ ...h, loading: true, error: null, denied: false }));

    const { data: runs, error: runErr } = await supabase
      .from('finanzas_personales_ejecuciones')
      .select('*')
      .order('inicio', { ascending: false })
      .limit(10);

    if (runErr && isAuthError(runErr)) {
      setHealth({ loading: false, error: null, denied: true, runs: [], emails: null });
      return;
    }

    let emails = null;
    const estados = ['procesado', 'error', 'ignorado'];
    const countQueries = await Promise.all([
      supabase.from('finanzas_personales_email_log').select('*', { count: 'exact', head: true }),
      ...estados.map(e =>
        supabase.from('finanzas_personales_email_log').select('*', { count: 'exact', head: true }).eq('estado', e)
      ),
    ]);
    const totalRes = countQueries[0];
    if (!totalRes.error && totalRes.count != null) {
      emails = { total: totalRes.count };
      estados.forEach((e, i) => {
        const r = countQueries[i + 1];
        if (!r.error && r.count != null) emails[e] = r.count;
      });
    }

    const noRuns = !runErr && (!runs || runs.length === 0);
    const noEmails = !emails || emails.total === 0;
    if (noRuns && noEmails) {
      setHealth({ loading: false, error: null, denied: true, runs: [], emails: null });
      return;
    }

    setHealth({
      loading: false,
      error: runErr ? runErr.message : null,
      denied: false,
      runs: runs || [],
      emails,
    });
  }

  const lastRun = health.runs[0];
  const lastRunTime = lastRun?.inicio ? new Date(lastRun.inicio) : null;
  const hoursSinceRun = lastRunTime ? (Date.now() - lastRunTime.getTime()) / 3600000 : null;
  const isStale = hoursSinceRun !== null && hoursSinceRun > 2;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Conexiones</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
          Estado de la integración y el pipeline de datos
        </p>
      </div>

      {/* Supabase connection card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6 flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div className="p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-900/20">
              <Database className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full border bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-700/40">
              Activo
            </span>
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white">Supabase</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-2">Base de datos PostgreSQL</p>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Almacena transacciones, cuentas y configuración. Conectado via PostgREST API.
            </p>
          </div>
          <ul className="space-y-1.5">
            {['Transacciones en tiempo real', 'RLS habilitado', 'Filtro activo=true'].map(f => (
              <li key={f} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {f}
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-6 flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div className="p-3 rounded-xl bg-blue-50/80 dark:bg-blue-900/20">
              <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full border bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200/60 dark:border-blue-700/40">
              Automatizado
            </span>
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white">Gmail → Apps Script</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-2">Pipeline de emails bancarios</p>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Lee notificaciones bancarias de Gmail, extrae datos y los inserta en Supabase automáticamente.
            </p>
          </div>
          <ul className="space-y-1.5">
            {['Trigger cada 15 minutos', 'Parser multi-banco', 'Detección de duplicados'].map(f => (
              <li key={f} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                {f}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Pipeline health panel */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-slate-500" />
            <h3 className="text-base font-semibold text-slate-800 dark:text-white">Salud del Pipeline</h3>
          </div>
          <Button variant="outline" size="sm" onClick={loadHealth} disabled={health.loading} className="gap-1.5">
            <RefreshCw className={cn("w-3.5 h-3.5", health.loading && "animate-spin")} />
            Actualizar
          </Button>
        </div>

        {health.denied ? (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50/80 dark:bg-amber-900/20 border border-amber-200/60 dark:border-amber-700/30">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-400">
              Sin acceso a las tablas de auditoría — requiere Supabase Auth para ver el estado del pipeline.
            </p>
          </div>
        ) : health.error ? (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-50/80 dark:bg-rose-900/20 border border-rose-200/60 dark:border-rose-700/30">
            <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
            <p className="text-sm text-rose-700 dark:text-rose-400">{health.error}</p>
          </div>
        ) : health.loading ? (
          <p className="text-sm text-slate-500 py-4 text-center">Cargando...</p>
        ) : (
          <div className="space-y-4">
            {/* Last run status */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/50">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Última ejecución</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {lastRunTime ? fmtDate(lastRunTime) : 'Sin datos'}
                </p>
                {isStale && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Hace más de 2 horas
                  </p>
                )}
              </div>
              <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/50">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Estado</p>
                <p className={cn("text-sm font-semibold", lastRun?.estado === 'ok' ? 'text-emerald-600' : lastRun?.estado === 'error' ? 'text-rose-600' : 'text-slate-600')}>
                  {lastRun?.estado === 'ok' ? 'OK' : lastRun?.estado || 'Sin datos'}
                </p>
                {lastRun?.nuevas_tx != null && (
                  <p className="text-xs text-slate-500 mt-1">{lastRun.nuevas_tx} transacciones nuevas</p>
                )}
              </div>
              <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/50">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Emails procesados</p>
                {health.emails ? (
                  <>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{health.emails.total} total</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {health.emails.procesado || 0} ok · {health.emails.error || 0} error · {health.emails.ignorado || 0} ignorados
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-slate-500">Sin datos de email</p>
                )}
              </div>
            </div>

            {/* Recent runs */}
            {health.runs.length > 0 && (
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Últimas ejecuciones</p>
                <div className="space-y-1">
                  {health.runs.slice(0, 5).map((run, i) => (
                    <div key={run.id || i} className="flex items-center justify-between py-1.5 px-2 rounded-lg text-xs hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <div className="flex items-center gap-2">
                        {run.estado === 'ok'
                          ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          : <XCircle className="w-3.5 h-3.5 text-rose-500" />}
                        <span className="text-slate-700 dark:text-slate-300">{fmtDate(run.inicio)}</span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-500">
                        {run.nuevas_tx != null && <span>+{run.nuevas_tx} tx</span>}
                        {run.emails_procesados != null && <span>{run.emails_procesados} emails</span>}
                        {run.duracion_seg != null && <span>{run.duracion_seg}s</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Roadmap banner */}
      <Card className="p-4">
        <div className="flex items-start gap-3">
          <div className="bg-violet-50 dark:bg-violet-900/30 p-2 rounded-xl">
            <Sparkles className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Próximamente</p>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
              Integraciones con Plaid y SnapTrade para importación automática de banca y portafolio de inversiones.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
