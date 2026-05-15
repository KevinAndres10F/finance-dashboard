import { useState, useEffect, useCallback } from 'react';

const KEY = 'finance-settings';
const DEFAULTS = {
  currency: 'USD',
  locale: 'es',
  startOfMonth: 1,
  notificationsEnabled: true,
};

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch { return DEFAULTS; }
}

let listeners = new Set();
let snapshot = load();
function notify() { for (const l of listeners) l(snapshot); }

export function useSettings() {
  const [settings, setSettings] = useState(snapshot);
  useEffect(() => {
    const cb = (s) => setSettings(s);
    listeners.add(cb);
    return () => { listeners.delete(cb); };
  }, []);

  const update = useCallback((patch) => {
    snapshot = { ...snapshot, ...patch };
    localStorage.setItem(KEY, JSON.stringify(snapshot));
    notify();
  }, []);

  return { settings, update };
}

export function getSettings() { return snapshot; }
