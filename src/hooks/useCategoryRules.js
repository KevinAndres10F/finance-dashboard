import { useState, useCallback, useMemo, useEffect } from 'react';
import { supabase, isAuthError } from '../lib/supabase';

const KEY = 'finance-category-rules';

function loadLocal() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
}
function saveLocal(r) { localStorage.setItem(KEY, JSON.stringify(r)); }

export function useCategoryRules(transactions = []) {
  const [localRules, setLocalRules] = useState(loadLocal);
  const [sbCategories, setSbCategories] = useState([]);
  const [sbRules, setSbRules] = useState([]);
  const [sbError, setSbError] = useState(null);

  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;
    (async () => {
      const [catRes, ruleRes] = await Promise.all([
        supabase.from('finanzas_personales_categorias').select('*').order('nombre'),
        supabase.from('finanzas_personales_reglas_categoria').select('*').order('prioridad'),
      ]);
      if (cancelled) return;
      if (catRes.error) {
        setSbError(isAuthError(catRes.error) ? 'sin permisos de lectura en categorías' : catRes.error.message);
      } else {
        setSbCategories(catRes.data || []);
      }
      if (ruleRes.error && !catRes.error) {
        setSbError(isAuthError(ruleRes.error) ? 'sin permisos de lectura en reglas' : ruleRes.error.message);
      } else if (!ruleRes.error) {
        setSbRules(ruleRes.data || []);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const categoryNames = useMemo(() => {
    if (sbCategories.length > 0) return sbCategories.map(c => c.nombre);
    return [];
  }, [sbCategories]);

  const colorMap = useMemo(() => {
    const m = {};
    for (const c of sbCategories) {
      if (c.nombre && c.color) m[c.nombre] = c.color;
    }
    return m;
  }, [sbCategories]);

  const globalRules = useMemo(() => {
    const catById = {};
    for (const c of sbCategories) catById[c.id] = c.nombre;
    return sbRules.map(r => ({
      id: r.id,
      match: r.palabra_clave,
      category: catById[r.categoria_id] || '?',
      priority: r.prioridad,
      field: r.campo || 'ambos',
      source: 'global',
    }));
  }, [sbRules, sbCategories]);

  const allRules = useMemo(() => {
    const local = localRules.map(r => ({ ...r, source: 'local' }));
    return [...local, ...globalRules];
  }, [localRules, globalRules]);

  const addRule = useCallback((match, category) => {
    const cleaned = String(match || '').trim().toLowerCase();
    if (!cleaned || !category) return;
    if (localRules.some(r => r.match === cleaned && r.category === category)) return;
    const next = [...localRules, { id: Date.now() + Math.random(), match: cleaned, category, hits: 0 }];
    setLocalRules(next); saveLocal(next);
  }, [localRules]);

  const removeRule = useCallback((id) => {
    const next = localRules.filter(r => r.id !== id);
    setLocalRules(next); saveLocal(next);
  }, [localRules]);

  const suggestCategory = useCallback((description = '', comercio = '') => {
    const desc = String(description).toLowerCase();
    const com = String(comercio).toLowerCase();

    const localMatch = localRules.find(r => desc.includes(r.match) || com.includes(r.match));
    if (localMatch) return { category: localMatch.category, source: 'local' };

    let best = null;
    for (const r of globalRules) {
      const kw = r.match.toLowerCase();
      let matches = false;
      if (r.field === 'comercio') {
        matches = com.includes(kw);
      } else {
        matches = desc.includes(kw) || com.includes(kw);
      }
      if (!matches) continue;
      if (!best || r.priority < best.priority || (r.priority === best.priority && kw.length > best.match.length)) {
        best = r;
      }
    }
    if (best) return { category: best.category, source: 'global' };
    return null;
  }, [localRules, globalRules]);

  const ruleSuggestions = useMemo(() => {
    const buckets = {};
    for (const t of transactions) {
      const desc = String(t.Descripción || '').toLowerCase().trim();
      const cat = t.Categoría;
      if (!desc || !cat || cat === 'Otros' || cat === 'Por Clasificar') continue;
      const word = desc.split(/\s+/)[0];
      if (word.length < 3) continue;
      const k = `${word}|${cat}`;
      buckets[k] = (buckets[k] || 0) + 1;
    }
    return Object.entries(buckets)
      .filter(([k, count]) => count >= 2 && !localRules.some(r => k.startsWith(r.match + '|')))
      .map(([k, count]) => {
        const [match, category] = k.split('|');
        return { match, category, count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [transactions, localRules]);

  return {
    rules: allRules,
    localRules,
    globalRules,
    categories: sbCategories,
    categoryNames,
    colorMap,
    addRule,
    removeRule,
    suggestCategory,
    ruleSuggestions,
    sbError,
  };
}
