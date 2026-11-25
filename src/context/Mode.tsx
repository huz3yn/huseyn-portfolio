import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

export type Mode = 'explore' | 'read';
const KEY = 'ha-mode';

type Ctx = { mode: Mode; setMode: (m: Mode) => void; toggle: () => void };
const ModeContext = createContext<Ctx>({ mode: 'explore', setMode: () => {}, toggle: () => {} });

function initial(): Mode {
  const fromUrl = new URLSearchParams(window.location.search).get('mode');
  if (fromUrl === 'read' || fromUrl === 'explore') return fromUrl;
  try {
    const v = sessionStorage.getItem(KEY);
    if (v === 'read' || v === 'explore') return v;
  } catch {
    /* storage blocked: default below */
  }
  return 'explore';
}

/** Explore = the playful build. Read = the same facts, quieter, for a fast scan. Kept for the visit. */
export function ModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<Mode>(initial);

  useEffect(() => {
    document.documentElement.dataset.mode = mode;
    const url = new URL(window.location.href);
    if (mode === 'read') url.searchParams.set('mode', 'read');
    else url.searchParams.delete('mode');
    window.history.replaceState(null, '', url);
    try {
      sessionStorage.setItem(KEY, mode);
    } catch {
      /* not persisted; still works for this page view */
    }
  }, [mode]);

  const setMode = useCallback((m: Mode) => setModeState(m), []);
  const toggle = useCallback(() => setModeState((m) => (m === 'explore' ? 'read' : 'explore')), []);

  return <ModeContext.Provider value={{ mode, setMode, toggle }}>{children}</ModeContext.Provider>;
}

export const useMode = () => useContext(ModeContext);
