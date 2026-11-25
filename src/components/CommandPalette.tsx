import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { person, projects, sections } from '../data/cv';
import { useMode } from '../context/Mode';
import { useToast } from '../context/Toast';
import './CommandPalette.css';

type Cmd = { id: string; group: string; label: string; hint?: string; run: () => void };

const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

export function selectProject(id: string) {
  go('work');
  window.dispatchEvent(new CustomEvent('ha:select-project', { detail: id }));
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  return <AnimatePresence>{open && <Palette onClose={onClose} />}</AnimatePresence>;
}

function Palette({ onClose }: { onClose: () => void }) {
  const { mode, setMode } = useMode();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const all = useMemo<Cmd[]>(
    () => [
      ...sections.map((s, i) => ({
        id: `go-${s.id}`,
        group: 'Go to',
        label: s.label,
        hint: String(i + 1).padStart(2, '0'),
        run: () => go(s.id),
      })),
      { id: 'go-lab', group: 'Go to', label: 'Interaction Lab', hint: 'Lab', run: () => go('lab') },
      ...projects.map((p, i) => ({
        id: `p-${p.id}`,
        group: 'Projects',
        label: p.name,
        hint: `Project ${String(i + 1).padStart(2, '0')}`,
        run: () => selectProject(p.id),
      })),
      {
        id: 'mode',
        group: 'Actions',
        label: mode === 'explore' ? 'Switch to Read mode' : 'Switch to Explore mode',
        run: () => setMode(mode === 'explore' ? 'read' : 'explore'),
      },
      {
        id: 'copy',
        group: 'Actions',
        label: 'Copy email address',
        hint: person.email,
        run: () =>
          navigator.clipboard
            .writeText(person.email)
            .then(() => toast('Email address copied'))
            .catch(() => toast('Copy blocked by the browser')),
      },
      {
        id: 'mail',
        group: 'Actions',
        label: 'Write an email',
        run: () => (window.location.href = `mailto:${person.email}`),
      },
      {
        id: 'call',
        group: 'Actions',
        label: 'Call',
        hint: person.phone,
        run: () => (window.location.href = `tel:${person.phone.replace(/\s/g, '')}`),
      },
    ],
    [mode, setMode, toast],
  );

  const items = useMemo(() => {
    const t = q.trim().toLowerCase();
    // The unlisted command: only appears when typed in full.
    if (t === 'debug')
      return [
        {
          id: 'debug',
          group: 'Hidden',
          label: 'Toggle box-model view',
          hint: 'you found it',
          run: () => window.dispatchEvent(new Event('ha:debug')),
        },
      ];
    return t ? all.filter((c) => `${c.group} ${c.label} ${c.hint ?? ''}`.toLowerCase().includes(t)) : all;
  }, [q, all]);

  useEffect(() => setSel(0), [q]);

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    inputRef.current?.focus();
    const root = document.documentElement;
    root.style.overflow = 'hidden';
    return () => {
      root.style.overflow = '';
      prev?.focus?.();
    };
  }, []);

  useEffect(() => {
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [sel]);

  const run = (c: Cmd) => {
    onClose();
    // Let the dialog close before scrolling so focus restore does not jump back.
    window.setTimeout(c.run, 60);
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSel((s) => (items.length ? (s + 1) % items.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSel((s) => (items.length ? (s - 1 + items.length) % items.length : 0));
    } else if (e.key === 'Enter' && items[sel]) {
      e.preventDefault();
      run(items[sel]);
    } else if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Tab') {
      e.preventDefault(); // focus stays in the dialog
    }
  };

  let lastGroup = '';

  return (
    <motion.div
      className="pal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onPointerDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Jump to a section or action"
        className="pal"
        initial={{ y: -16, scale: 0.97, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: -8, scale: 0.98, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 460, damping: 34 }}
        onKeyDown={onKey}
      >
        <div className="pal-search">
          <span className="pal-prompt" aria-hidden="true">
            /
          </span>
          <input
            ref={inputRef}
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Try “work”, “email” or “stack”…"
            name="command"
            aria-label="Search commands"
            role="combobox"
            aria-expanded="true"
            aria-controls="pal-list"
            aria-activedescendant={items[sel] ? `pal-${items[sel].id}` : undefined}
            autoComplete="off"
            spellCheck={false}
          />
          <kbd>Esc</kbd>
        </div>
        <ul id="pal-list" ref={listRef} role="listbox" className="pal-list" aria-label="Commands">
          {items.length === 0 && <li className="pal-empty">Nothing matches “{q}”. Try “work” or “email”.</li>}
          {items.map((c, i) => {
            const head = c.group !== lastGroup;
            lastGroup = c.group;
            return (
              <li key={c.id} role="presentation">
                {head && <p className="pal-group label">{c.group}</p>}
                <div
                  id={`pal-${c.id}`}
                  role="option"
                  aria-selected={i === sel}
                  className="pal-item"
                  onPointerMove={() => setSel(i)}
                  onClick={() => run(c)}
                >
                  <span>{c.label}</span>
                  {c.hint && <span className="pal-hint">{c.hint}</span>}
                </div>
              </li>
            );
          })}
        </ul>
        <p className="pal-foot">
          <span>
            <kbd>↑</kbd>
            <kbd>↓</kbd> move
          </span>
          <span>
            <kbd>Enter</kbd> open
          </span>
          <span className="pal-secret">One command is not listed here.</span>
        </p>
      </motion.div>
    </motion.div>
  );
}
