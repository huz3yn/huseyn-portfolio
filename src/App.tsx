import { useCallback, useEffect, useState } from 'react';
import { MotionConfig } from 'motion/react';
import { About } from './components/About';
import { CommandPalette } from './components/CommandPalette';
import { Contact } from './components/Contact';
import { Cursor } from './components/Cursor';
import { Footer } from './components/Footer';
import { Hero } from './components/Hero';
import { Journey } from './components/Journey';
import { Lab } from './components/Lab';
import { Stack } from './components/Stack';
import { Thread } from './components/Thread';
import { TopBar } from './components/TopBar';
import { Work } from './components/Work';
import { ModeProvider, useMode } from './context/Mode';
import { ToastProvider, useToast } from './context/Toast';

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <ModeProvider>
        <ToastProvider>
          <Shell />
        </ToastProvider>
      </ModeProvider>
    </MotionConfig>
  );
}

function Shell() {
  const { mode } = useMode();
  const [palette, setPalette] = useState(false);
  const open = useCallback(() => setPalette(true), []);
  const close = useCallback(() => setPalette(false), []);
  useShortcuts(setPalette);

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      {mode === 'explore' && <Cursor />}
      <TopBar onOpenPalette={open} />
      <CommandPalette open={palette} onClose={close} />
      <main id="main">
        <Thread />
        <Hero />
        <About />
        <Stack />
        <Journey />
        <Work />
        <Lab />
        <Contact />
      </main>
      <Footer />
    </>
  );
}

/**
 * Ctrl/Cmd + K toggles the command palette.
 * Hidden: typing "debug" anywhere outside a text field toggles a box-model view of the page.
 */
function useShortcuts(setPalette: (fn: (v: boolean) => boolean) => void) {
  const toast = useToast();
  useEffect(() => {
    let buffer = '';
    const toggleDebug = () => {
      const on = document.documentElement.classList.toggle('box-model');
      toast(on ? 'Box-model view on. Every element shows its edges. Type “debug” again to leave.' : 'Box-model view off.');
    };
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPalette((v) => !v);
        return;
      }
      const t = e.target as Element | null;
      if (t?.closest?.('input, textarea, [contenteditable="true"], [role="dialog"]') || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key.length !== 1) return;
      buffer = (buffer + e.key.toLowerCase()).slice(-5);
      if (buffer === 'debug') {
        buffer = '';
        toggleDebug();
      }
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('ha:debug', toggleDebug);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('ha:debug', toggleDebug);
    };
  }, [setPalette, toast]);
}
