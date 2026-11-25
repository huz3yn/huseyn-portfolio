import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { person, sections } from '../data/cv';
import { useMode, type Mode } from '../context/Mode';
import { useActiveSection } from '../hooks/useActiveSection';
import './TopBar.css';

const ids: string[] = sections.map((s) => s.id);
const pad = (n: number) => String(n).padStart(2, '0');
const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

export function TopBar({ onOpenPalette }: { onOpenPalette: () => void }) {
  const active = useActiveSection(ids) ?? 'intro';
  const index = Math.max(0, ids.indexOf(active));
  useEffect(() => {
    document.documentElement.dataset.section = active;
  }, [active]);
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const segRef = useRef<HTMLOListElement>(null);

  // Each index segment fills with the reader's progress through its section.
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const mid = window.scrollY + window.innerHeight * 0.5;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

      const items = segRef.current?.children;
      const geo = ids.map((id) => {
        const el = document.getElementById(id);
        return el ? [el.offsetTop, el.offsetHeight] : null;
      });
      geo.forEach((g, i) => {
        const seg = items?.[i] as HTMLElement | undefined;
        if (!g || !seg) return;
        const p = Math.min(1, Math.max(0, (mid - g[0]) / g[1]));
        seg.style.setProperty('--p', p.toFixed(3));
      });
      document.documentElement.style.setProperty('--bar-p', String(maxScroll > 0 ? window.scrollY / maxScroll : 0));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) btnRef.current?.focus();
  };

  return (
    <header className="bar">
      <div className="wrap bar-inner">
        <a href="#intro" className="bar-logo" aria-label={`${person.name}, back to the start`}>
          <span className="bar-mark" aria-hidden="true">
            <span>H</span>
            <span>A</span>
          </span>
        </a>

        <div className="bar-index">
          <button
            ref={btnRef}
            type="button"
            className={`index-btn${open ? ' is-open' : ''}`}
            aria-expanded={open}
            aria-controls="index-panel"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="index-num">{pad(index + 1)}</span>
            <span className="index-slash" aria-hidden="true">
              /
            </span>
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={active}
                className="index-name"
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: '0%', opacity: 1 }}
                exit={{ y: '-100%', opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 34 }}
              >
                {sections[index].label}
              </motion.span>
            </AnimatePresence>
            <span className="index-caret" aria-hidden="true" />
            <span className="sr-only">, open the index</span>
          </button>

          <ol ref={segRef} className="index-segs" aria-label="Sections">
            {sections.map((s, i) => (
              <li key={s.id} className={i === index ? 'is-active' : undefined}>
                <a href={`#${s.id}`} aria-current={i === index ? 'true' : undefined}>
                  <span className="seg-fill" aria-hidden="true" />
                  <span className="seg-tip">
                    {pad(i + 1)} {s.label}
                  </span>
                </a>
              </li>
            ))}
          </ol>
        </div>

        <div className="bar-tools">
          <ModeSwitch />
          <button type="button" className="bar-cmd" onClick={onOpenPalette}>
            <span className="bar-cmd-text">Jump to</span>
            <kbd>{isMac ? '⌘' : 'Ctrl'}</kbd>
            <kbd>K</kbd>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && <IndexPanel active={index} onClose={close} />}
      </AnimatePresence>
    </header>
  );
}

function IndexPanel({ active, onClose }: { active: number; onClose: (refocus?: boolean) => void }) {
  const first = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    first.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    const onDown = (e: PointerEvent) => {
      const t = e.target as Element;
      if (!t.closest('#index-panel') && !t.closest('.index-btn')) onClose(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onDown);
    };
  }, [onClose]);

  return (
    <motion.nav
      id="index-panel"
      aria-label="Index"
      className="index-panel"
      initial={{ clipPath: 'inset(0 0 100% 0)' }}
      animate={{ clipPath: 'inset(0 0 0% 0)' }}
      exit={{ clipPath: 'inset(0 0 100% 0)' }}
      transition={{ duration: 0.45, ease: [0.65, 0, 0.35, 1] }}
    >
      <div className="wrap">
        <ol className="index-list">
          {sections.map((s, i) => (
            <li key={s.id}>
              <motion.a
                ref={i === 0 ? first : undefined}
                href={`#${s.id}`}
                className={i === active ? 'is-active' : undefined}
                aria-current={i === active ? 'true' : undefined}
                onClick={() => onClose(false)}
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 320, damping: 28, delay: 0.05 + i * 0.035 }}
              >
                <span className="index-list-num">{pad(i + 1)}</span>
                <span className="index-list-name">{s.label}</span>
              </motion.a>
            </li>
          ))}
        </ol>
      </div>
    </motion.nav>
  );
}

function ModeSwitch() {
  const { mode, setMode } = useMode();
  const opts: { id: Mode; label: string }[] = [
    { id: 'explore', label: 'Explore' },
    { id: 'read', label: 'Read' },
  ];
  return (
    <div className="mode" role="group" aria-label="Viewing mode">
      {opts.map((o) => (
        <button
          key={o.id}
          type="button"
          className={`mode-opt${mode === o.id ? ' is-on' : ''}`}
          aria-pressed={mode === o.id}
          onClick={() => setMode(o.id)}
        >
          {mode === o.id && (
            <motion.span
              layoutId="mode-thumb"
              className="mode-thumb"
              transition={{ type: 'spring', stiffness: 500, damping: 34 }}
            />
          )}
          <span className="mode-label">{o.label}</span>
        </button>
      ))}
    </div>
  );
}
