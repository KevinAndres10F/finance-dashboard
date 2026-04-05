import { Card } from './ui/Card';
import { cn } from '../lib/utils';
import { Flame, Trophy, Star, Zap, Target, CheckCircle2, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

function LevelBar({ level }) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Nivel {level.current.level}
          </p>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {level.current.name}
          </h2>
        </div>
        <div className="flex items-center gap-1.5 text-amber-500">
          <Zap className="w-5 h-5" />
          <span className="text-xl font-bold">{Math.round(level.current.xpRequired + (level.next ? (level.progress / 100) * (level.next.xpRequired - level.current.xpRequired) : 0))} XP</span>
        </div>
      </div>

      {level.next && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Nivel {level.current.level}</span>
            <span>Nivel {level.next.level} — {level.next.name}</span>
          </div>
          <div className="h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${level.progress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 text-right">
            {level.progress.toFixed(0)}% hacia el siguiente nivel
          </p>
        </div>
      )}

      {!level.next && (
        <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
          ¡Has alcanzado el nivel máximo! 🏆
        </p>
      )}
    </Card>
  );
}

function StreakCard({ streak, longest }) {
  return (
    <Card className="p-6 flex items-center gap-5">
      <div className={cn("text-4xl streak-pulse", streak > 0 ? "" : "opacity-30")}>🔥</div>
      <div>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Racha actual</p>
        <p className="text-3xl font-bold text-slate-900 dark:text-white">
          {streak} <span className="text-lg font-medium text-slate-500">{streak === 1 ? 'día' : 'días'}</span>
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
          Mejor racha: {longest} {longest === 1 ? 'día' : 'días'}
        </p>
      </div>
    </Card>
  );
}

function BadgeGrid({ badges }) {
  const earned  = badges.filter(b => b.earned);
  const pending = badges.filter(b => !b.earned);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Insignias</h3>
        <span className="text-sm text-slate-500 dark:text-slate-400">
          {earned.length}/{badges.length}
        </span>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {badges.map(badge => (
          <motion.div
            key={badge.id}
            whileHover={{ scale: 1.05 }}
            className={cn(
              "flex flex-col items-center gap-1.5 p-3 rounded-2xl text-center transition-all",
              badge.earned
                ? "bg-amber-50/80 dark:bg-amber-900/20 border border-amber-200/60 dark:border-amber-700/30"
                : "bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/30 opacity-40 grayscale"
            )}
          >
            <span className={cn("text-2xl", badge.earned && "badge-pop")} style={badge.earned ? {} : {}}>
              {badge.icon}
            </span>
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-tight">
              {badge.title}
            </p>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}

function MissionList({ missions }) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Misiones activas</h3>
      </div>
      <div className="space-y-4">
        {missions.map(m => (
          <div key={m.id} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {m.completed
                  ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  : <Clock className="w-4 h-4 text-slate-400" />
                }
                <span className={cn(
                  "text-sm font-medium",
                  m.completed ? "text-emerald-700 dark:text-emerald-400 line-through" : "text-slate-800 dark:text-slate-200"
                )}>
                  {m.title}
                </span>
              </div>
              <div className="flex items-center gap-1 text-amber-500">
                <Zap className="w-3 h-3" />
                <span className="text-xs font-semibold">+{m.xpReward} XP</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                  className={cn("h-full rounded-full", m.completed ? "bg-emerald-500" : "bg-blue-500")}
                  initial={{ width: 0 }}
                  animate={{ width: `${(m.progress / m.target) * 100}%` }}
                  transition={{ duration: 0.6 }}
                />
              </div>
              <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums">
                {m.progress}/{m.target}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function GamificationDashboard({ xp, level, streak, longestStreak, badges, missions }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Logros</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Tu progreso financiero gamificado
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <LevelBar level={level} />
        <StreakCard streak={streak} longest={longestStreak} />
      </div>

      <MissionList missions={missions} />
      <BadgeGrid badges={badges} />
    </div>
  );
}
