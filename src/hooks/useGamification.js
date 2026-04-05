import { useState, useMemo, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'finance-gamification';

const XP_EVENTS = {
  add_transaction: 10,
  budget_created: 25,
  budget_on_track_month: 50,
  streak_3days: 30,
  streak_7days: 100,
  streak_30days: 500,
  savings_rate_10: 50,
  savings_rate_20: 100,
  mission_complete: 200,
};

const LEVELS = [
  { level: 1, xpRequired: 0,    name: 'Principiante' },
  { level: 2, xpRequired: 100,  name: 'Ahorrista' },
  { level: 3, xpRequired: 300,  name: 'Planificador' },
  { level: 4, xpRequired: 600,  name: 'Estratega' },
  { level: 5, xpRequired: 1000, name: 'Inversor' },
  { level: 6, xpRequired: 1500, name: 'Experto' },
  { level: 7, xpRequired: 2200, name: 'Maestro' },
  { level: 8, xpRequired: 3000, name: 'Gurú Financiero' },
];

const ALL_BADGES = [
  { id: 'first_transaction',  icon: '🎯', title: 'Primera Transacción',   desc: 'Registra tu primera transacción' },
  { id: 'budget_master',      icon: '🏆', title: 'Maestro del Presupuesto', desc: '30 días con presupuestos en verde' },
  { id: 'saver_10',           icon: '🐣', title: 'Ahorrista Junior',       desc: 'Tasa de ahorro ≥ 10% en un mes' },
  { id: 'saver_20',           icon: '🐷', title: 'Ahorrista Senior',       desc: 'Tasa de ahorro ≥ 20% en un mes' },
  { id: 'streak_3',           icon: '🔥', title: 'Racha de 3 días',        desc: '3 días consecutivos de actividad' },
  { id: 'streak_7',           icon: '⚡', title: 'Racha Semanal',          desc: '7 días consecutivos de actividad' },
  { id: 'streak_30',          icon: '💎', title: 'Racha del Mes',          desc: '30 días consecutivos de actividad' },
  { id: 'zero_waste',         icon: '✨', title: 'Cero Excesos',           desc: 'Mes con todos los presupuestos < 95%' },
  { id: 'category_cutter',    icon: '✂️',  title: 'Recortador',             desc: 'Reduce una categoría ≥ 20%' },
  { id: 'early_saver',        icon: '🌅', title: 'Madrugador',             desc: 'Ingreso registrado los primeros 5 días del mes' },
  { id: 'positive_balance',   icon: '📈', title: 'Balance Positivo',       desc: '3 meses consecutivos con balance positivo' },
  { id: 'explorer',           icon: '🗺️', title: 'Explorador',            desc: 'Usa todas las secciones de la app' },
];

function getDefaultState() {
  return {
    xp: 0,
    badges: [],
    streaks: { lastDate: null, current: 0, longest: 0 },
    missions: [
      { id: 'add_5_transactions', title: 'Registra 5 transacciones', progress: 0, target: 5, xpReward: 75, completed: false },
      { id: 'create_budget', title: 'Crea tu primer presupuesto', progress: 0, target: 1, xpReward: 50, completed: false },
      { id: 'save_week', title: 'Mantén gastos bajos por 7 días', progress: 0, target: 7, xpReward: 150, completed: false },
    ],
    sectionsVisited: [],
  };
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...getDefaultState(), ...JSON.parse(saved) } : getDefaultState();
  } catch { return getDefaultState(); }
}

function computeLevel(xp) {
  let current = LEVELS[0];
  let next = LEVELS[1];
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].xpRequired) {
      current = LEVELS[i];
      next = LEVELS[i + 1] || null;
      break;
    }
  }
  const progress = next
    ? ((xp - current.xpRequired) / (next.xpRequired - current.xpRequired)) * 100
    : 100;
  return { current, next, progress: Math.min(progress, 100) };
}

export function useGamification(transactions, budgetData) {
  const [state, setState] = useState(loadState);
  const [newBadge, setNewBadge] = useState(null); // last earned badge for toast

  // Persist on every state change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // ── Streak tracking: update when transactions change ──────────────────
  useEffect(() => {
    if (!transactions.length) return;
    const today = new Date().toISOString().slice(0, 10);
    setState(prev => {
      const { lastDate, current, longest } = prev.streaks;
      if (lastDate === today) return prev; // already counted today
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      const newCurrent = lastDate === yesterday ? current + 1 : 1;
      const newLongest = Math.max(newCurrent, longest);
      return { ...prev, streaks: { lastDate: today, current: newCurrent, longest: newLongest } };
    });
  }, [transactions.length]);

  // ── Badge & XP evaluator ──────────────────────────────────────────────
  const evaluate = useCallback(() => {
    setState(prev => {
      const earned = new Set(prev.badges.map(b => b.id));
      const toAward = [];
      let xpDelta = 0;

      const award = (id) => {
        if (!earned.has(id)) {
          const badge = ALL_BADGES.find(b => b.id === id);
          if (badge) { toAward.push({ ...badge, earnedAt: Date.now() }); xpDelta += 50; }
        }
      };

      // First transaction
      if (transactions.length >= 1) award('first_transaction');

      // Savings badges (current month)
      const currentMonth = new Date().toISOString().slice(0, 7);
      const monthTxs = transactions.filter(t => t.Fecha?.startsWith(currentMonth));
      const income = monthTxs.filter(t => t.Tipo === 'Ingreso' || t.Monto > 0).reduce((a, t) => a + Math.abs(Number(t.Monto)), 0);
      const expenses = monthTxs.filter(t => t.Tipo === 'Gasto' || t.Monto < 0).reduce((a, t) => a + Math.abs(Number(t.Monto)), 0);
      const rate = income > 0 ? ((income - expenses) / income) * 100 : 0;
      if (rate >= 10) award('saver_10');
      if (rate >= 20) award('saver_20');

      // Streak badges
      const { current: streak } = prev.streaks;
      if (streak >= 3) award('streak_3');
      if (streak >= 7) award('streak_7');
      if (streak >= 30) award('streak_30');

      // Budget zero waste
      if (budgetData.length > 0 && budgetData.every(b => b.percentage < 95)) award('zero_waste');

      if (toAward.length === 0 && xpDelta === 0) return prev;

      // Show toast for the first new badge
      if (toAward.length > 0) setNewBadge(toAward[0]);

      return {
        ...prev,
        xp: prev.xp + xpDelta,
        badges: [...prev.badges, ...toAward],
      };
    });
  }, [transactions, budgetData]);

  // Re-evaluate whenever transactions or budgets change
  useEffect(() => { evaluate(); }, [evaluate]);

  // ── Track XP events ───────────────────────────────────────────────────
  const addXP = useCallback((event) => {
    const amount = XP_EVENTS[event] || 0;
    if (!amount) return;
    setState(prev => ({ ...prev, xp: prev.xp + amount }));
  }, []);

  // ── Track section visits (Explorer badge) ────────────────────────────
  const visitSection = useCallback((section) => {
    setState(prev => {
      const visited = new Set(prev.sectionsVisited);
      visited.add(section);
      const allSections = ['overview', 'transactions', 'statistics', 'budgets', 'gamification', 'connections'];
      const badgesAlready = new Set(prev.badges.map(b => b.id));
      if (visited.size >= 5 && !badgesAlready.has('explorer')) {
        const badge = ALL_BADGES.find(b => b.id === 'explorer');
        setNewBadge({ ...badge, earnedAt: Date.now() });
        return {
          ...prev,
          xp: prev.xp + 50,
          sectionsVisited: [...visited],
          badges: [...prev.badges, { ...badge, earnedAt: Date.now() }],
        };
      }
      return { ...prev, sectionsVisited: [...visited] };
    });
  }, []);

  // ── Mission progress ──────────────────────────────────────────────────
  const updateMission = useCallback((missionId, progress) => {
    setState(prev => {
      const missions = prev.missions.map(m => {
        if (m.id !== missionId || m.completed) return m;
        const newProgress = Math.min(progress, m.target);
        const completed = newProgress >= m.target;
        return { ...m, progress: newProgress, completed };
      });
      const justCompleted = missions.find(m => m.id === missionId && m.completed && !prev.missions.find(pm => pm.id === missionId)?.completed);
      const xpDelta = justCompleted ? justCompleted.xpReward : 0;
      return { ...prev, missions, xp: prev.xp + xpDelta };
    });
  }, []);

  const dismissBadge = useCallback(() => setNewBadge(null), []);

  const levelInfo = useMemo(() => computeLevel(state.xp), [state.xp]);
  const badgeMap = useMemo(() => {
    const earned = new Set(state.badges.map(b => b.id));
    return ALL_BADGES.map(b => ({ ...b, earned: earned.has(b.id), earnedAt: state.badges.find(e => e.id === b.id)?.earnedAt }));
  }, [state.badges]);

  return {
    xp: state.xp,
    level: levelInfo,
    streak: state.streaks.current,
    longestStreak: state.streaks.longest,
    badges: badgeMap,
    missions: state.missions,
    newBadge,
    dismissBadge,
    addXP,
    visitSection,
    updateMission,
  };
}
