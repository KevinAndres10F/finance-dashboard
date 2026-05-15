import { useState, useCallback } from 'react';
import { txKey } from '../lib/utils';

const KEY = 'finance-tx-meta';

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
}
function save(m) { localStorage.setItem(KEY, JSON.stringify(m)); }

/**
 * Metadata local por transacción (tags, notas, marcado como revisada).
 * Las transacciones vienen del backend, así que la meta se indexa por una clave estable.
 */
export function useTransactionMeta() {
  const [meta, setMeta] = useState(load);

  const get = useCallback((tx, idx) => meta[txKey(tx, idx)] || { tags: [], notes: '', reviewed: false }, [meta]);

  const set = useCallback((tx, idx, patch) => {
    const k = txKey(tx, idx);
    const next = { ...meta, [k]: { ...(meta[k] || { tags: [], notes: '', reviewed: false }), ...patch } };
    setMeta(next); save(next);
  }, [meta]);

  const toggleReviewed = useCallback((tx, idx) => {
    const k = txKey(tx, idx);
    const cur = meta[k] || { tags: [], notes: '', reviewed: false };
    const next = { ...meta, [k]: { ...cur, reviewed: !cur.reviewed } };
    setMeta(next); save(next);
  }, [meta]);

  const addTag = useCallback((tx, idx, tag) => {
    const k = txKey(tx, idx);
    const cur = meta[k] || { tags: [], notes: '', reviewed: false };
    if (cur.tags.includes(tag)) return;
    const next = { ...meta, [k]: { ...cur, tags: [...cur.tags, tag] } };
    setMeta(next); save(next);
  }, [meta]);

  const removeTag = useCallback((tx, idx, tag) => {
    const k = txKey(tx, idx);
    const cur = meta[k] || { tags: [], notes: '', reviewed: false };
    const next = { ...meta, [k]: { ...cur, tags: cur.tags.filter(t => t !== tag) } };
    setMeta(next); save(next);
  }, [meta]);

  return { meta, get, set, toggleReviewed, addTag, removeTag };
}
