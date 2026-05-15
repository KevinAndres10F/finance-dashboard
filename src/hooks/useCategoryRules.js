import { useState, useCallback, useMemo } from 'react';

const KEY = 'finance-category-rules';

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
}
function save(r) { localStorage.setItem(KEY, JSON.stringify(r)); }

/**
 * Reglas de auto-categorización: si la descripción contiene `match` (case-insensitive),
 * sugerir la categoría `category`.
 */
export function useCategoryRules(transactions = []) {
  const [rules, setRules] = useState(load);

  const addRule = useCallback((match, category) => {
    const cleaned = String(match || '').trim().toLowerCase();
    if (!cleaned || !category) return;
    if (rules.some(r => r.match === cleaned && r.category === category)) return;
    const next = [...rules, { id: Date.now() + Math.random(), match: cleaned, category, hits: 0 }];
    setRules(next); save(next);
  }, [rules]);

  const removeRule = useCallback((id) => {
    const next = rules.filter(r => r.id !== id);
    setRules(next); save(next);
  }, [rules]);

  const suggestCategory = useCallback((description = '') => {
    const desc = String(description).toLowerCase();
    const match = rules.find(r => desc.includes(r.match));
    return match ? match.category : null;
  }, [rules]);

  // Sugerencias de reglas basadas en patrones repetidos de descripción → categoría
  const ruleSuggestions = useMemo(() => {
    const buckets = {};
    for (const t of transactions) {
      const desc = String(t.Descripción || '').toLowerCase().trim();
      const cat = t.Categoría;
      if (!desc || !cat || cat === 'Otros') continue;
      // tomar primera palabra significativa
      const word = desc.split(/\s+/)[0];
      if (word.length < 3) continue;
      const k = `${word}|${cat}`;
      buckets[k] = (buckets[k] || 0) + 1;
    }
    return Object.entries(buckets)
      .filter(([k, count]) => count >= 2 && !rules.some(r => k.startsWith(r.match + '|')))
      .map(([k, count]) => {
        const [match, category] = k.split('|');
        return { match, category, count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [transactions, rules]);

  return { rules, addRule, removeRule, suggestCategory, ruleSuggestions };
}
