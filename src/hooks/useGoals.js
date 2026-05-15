import { useState, useCallback, useMemo } from 'react';

const KEY = 'finance-goals';

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
}
function save(list) { localStorage.setItem(KEY, JSON.stringify(list)); }

export const GOAL_PRESETS = [
  { id: 'emergency', name: 'Fondo de emergencia', icon: 'shield',   color: '#10b981' },
  { id: 'vacation',  name: 'Vacaciones',          icon: 'plane',    color: '#06b6d4' },
  { id: 'house',     name: 'Casa',                icon: 'home',     color: '#6366f1' },
  { id: 'car',       name: 'Coche',               icon: 'car',      color: '#f59e0b' },
  { id: 'retirement',name: 'Jubilación',          icon: 'piggy',    color: '#8b5cf6' },
  { id: 'education', name: 'Educación',           icon: 'book',     color: '#ec4899' },
  { id: 'wedding',   name: 'Boda',                icon: 'heart',    color: '#f43f5e' },
  { id: 'custom',    name: 'Personalizado',       icon: 'target',   color: '#64748b' },
];

export function useGoals() {
  const [goals, setGoals] = useState(load);

  const addGoal = useCallback((data) => {
    const g = {
      id: Date.now() + Math.random(),
      name: data.name,
      target: Number(data.target) || 0,
      saved: Number(data.saved) || 0,
      deadline: data.deadline || null,
      preset: data.preset || 'custom',
      color: data.color || '#6366f1',
      monthlyContribution: Number(data.monthlyContribution) || 0,
      linkedAccountId: data.linkedAccountId || null,
      createdAt: new Date().toISOString(),
      completedAt: null,
    };
    const next = [...goals, g];
    setGoals(next); save(next);
    return g;
  }, [goals]);

  const updateGoal = useCallback((id, patch) => {
    const next = goals.map(g => {
      if (g.id !== id) return g;
      const merged = { ...g, ...patch };
      if (merged.saved >= merged.target && !merged.completedAt) {
        merged.completedAt = new Date().toISOString();
      } else if (merged.saved < merged.target) {
        merged.completedAt = null;
      }
      return merged;
    });
    setGoals(next); save(next);
  }, [goals]);

  const removeGoal = useCallback((id) => {
    const next = goals.filter(g => g.id !== id);
    setGoals(next); save(next);
  }, [goals]);

  const contribute = useCallback((id, amount) => {
    const g = goals.find(x => x.id === id);
    if (!g) return;
    updateGoal(id, { saved: Math.max(0, Number(g.saved) + Number(amount)) });
  }, [goals, updateGoal]);

  const enriched = useMemo(() => goals.map(g => {
    const pct = g.target > 0 ? Math.min(100, (g.saved / g.target) * 100) : 0;
    const remaining = Math.max(0, g.target - g.saved);
    let monthsToGoal = null;
    if (g.monthlyContribution > 0 && remaining > 0) {
      monthsToGoal = Math.ceil(remaining / g.monthlyContribution);
    }
    let daysLeft = null;
    if (g.deadline) {
      // eslint-disable-next-line react-hooks/purity
      const now = Date.now();
      daysLeft = Math.ceil((new Date(g.deadline).getTime() - now) / 86400000);
    }
    let onTrack = null;
    if (g.deadline && g.target > 0) {
      const totalDays = Math.max(1, Math.ceil((new Date(g.deadline).getTime() - new Date(g.createdAt).getTime()) / 86400000));
      const elapsedDays = Math.max(0, totalDays - (daysLeft || 0));
      const expected = (elapsedDays / totalDays) * g.target;
      onTrack = g.saved >= expected * 0.95;
    }
    return { ...g, pct, remaining, monthsToGoal, daysLeft, onTrack };
  }), [goals]);

  const summary = useMemo(() => ({
    total: goals.length,
    completed: goals.filter(g => g.completedAt).length,
    totalSaved: goals.reduce((s, g) => s + Number(g.saved || 0), 0),
    totalTarget: goals.reduce((s, g) => s + Number(g.target || 0), 0),
  }), [goals]);

  return { goals: enriched, addGoal, updateGoal, removeGoal, contribute, summary };
}
