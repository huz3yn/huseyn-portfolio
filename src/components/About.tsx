import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { animate, AnimatePresence, motion, useInView } from 'motion/react';
import { about, languages, traits } from '../data/cv';
import { useMode } from '../context/Mode';
import { REDUCED_MOTION, useMediaQuery } from '../hooks/useMediaQuery';
import './About.css';

/* Four outlines with the same number of points, so one can morph into another. */
const N = 48;
function outline(fn: (a: number) => number, rot = 0) {
  const pts: string[] = [];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2 + rot;
    const r = fn(a) * 92;
    pts.push(`${(100 + Math.cos(a) * r).toFixed(1)} ${(100 + Math.sin(a) * r).toFixed(1)}`);
  }
  return `M${pts.join(' L')} Z`;
}
const SHAPES: Record<string, string> = {
  // a square: structure and order
  analytical: outline((a) => 0.78 / Math.max(Math.abs(Math.cos(a)), Math.abs(Math.sin(a))), Math.PI / 4),
  // a six-point star: a solved puzzle
  problem: outline((a) => 0.62 + 0.38 * Math.abs(Math.cos(3 * a)) ** 3),
  // a circle: fits anywhere
  adapt: outline(() => 0.92),
  // four lobes held together
  team: outline((a) => 0.66 + 0.3 * Math.abs(Math.cos(2 * a))),
};

export function About() {
  const { mode } = useMode();
  return (
    <section id="about" className="section about" aria-labelledby="about-title">
      <div className="wrap">
        <header className="chapter">
          <p className="label chapter-idx" data-thread>
            <b>02</b> / About
          </p>
          <h2 id="about-title" className="h2 chapter-title about-title">
            Discover the{' '}
            <span className="about-pill" aria-hidden="true">
              <img src={`${import.meta.env.BASE_URL}huseyn.jpg`} alt="" width={359} height={480} loading="lazy" decoding="async" />
            </span>{' '}
            developer.
          </h2>
        </header>

        <div className="about-grid">
          <div className="about-copy">
            <p className="lead">{about.lead}</p>
            <p className="about-body">{about.body}</p>
            <div className="about-next">
              <p className="label">Heading toward</p>
              <ul>
                {about.next.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            </div>
          </div>
          {mode === 'explore' ? <TraitExplorer /> : <TraitList />}
        </div>

        <Languages />
      </div>
    </section>
  );
}

function TraitExplorer() {
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const t = traits[active];

  const onKey = (e: KeyboardEvent) => {
    const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const next = (active + d + traits.length) % traits.length;
    setActive(next);
    tabs.current[next]?.focus();
  };

  return (
    <div className={`traits traits-${t.id}`}>
      <div className="traits-tabs" role="tablist" aria-label="Traits" onKeyDown={onKey}>
        {traits.map((tr, i) => (
          <button
            key={tr.id}
            ref={(el) => {
              tabs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`trait-tab-${tr.id}`}
            aria-selected={i === active}
            aria-controls="trait-panel"
            tabIndex={i === active ? 0 : -1}
            className="traits-tab"
            onClick={() => setActive(i)}
          >
            <span className="traits-tab-num">{String(i + 1).padStart(2, '0')}</span>
            {tr.title}
            {i === active && (
              <motion.span
                layoutId="trait-ind"
                className="traits-ind"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
          </button>
        ))}
      </div>

      <div
        className="traits-stage"
        role="tabpanel"
        id="trait-panel"
        aria-labelledby={`trait-tab-${t.id}`}
      >
        <svg viewBox="0 0 200 200" className="traits-shape" aria-hidden="true">
          <motion.path
            className="traits-shape-fill"
            initial={false}
            animate={{ d: SHAPES[t.id], rotate: active * 45 }}
            transition={{ type: 'spring', stiffness: 120, damping: 16 }}
          />
          <motion.path
            className="traits-shape-line"
            initial={false}
            animate={{ d: SHAPES[t.id], rotate: active * -30 }}
            transition={{ type: 'spring', stiffness: 90, damping: 14 }}
          />
        </svg>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={t.id}
            className="traits-copy"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          >
            <h3 className="traits-title">{t.title}</h3>
            <p className="traits-text">{t.text}</p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function TraitList() {
  return (
    <ul className="traits-list" aria-label="Traits">
      {traits.map((t) => (
        <li key={t.id}>
          <h3>{t.title}</h3>
          <p>{t.text}</p>
        </li>
      ))}
    </ul>
  );
}

/* ── Languages: an instrument of four concentric arcs ── */

const C = 160;
const RINGS = [138, 108, 78, 48];

function Languages() {
  const { mode } = useMode();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-15% 0px' });
  const [active, setActive] = useState(0);
  const lang = languages[active];

  if (mode === 'read') {
    return (
      <div className="langs langs-read">
        <h3 className="langs-title">Languages</h3>
        <ul className="langs-read-list">
          {languages.map((l) => (
            <li key={l.name}>
              <span>{l.name}</span>
              <b>{l.value}%</b>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="langs" ref={ref}>
      <div className="langs-head">
        <h3 className="langs-title">Languages</h3>
        <p className="muted">Select a language to read its level.</p>
      </div>

      <div className="langs-dial">
        <svg viewBox="-28 -28 376 376" aria-hidden="true">
          {[0, 25, 50, 75].map((v) => {
            const a = (v / 100) * Math.PI * 2 - Math.PI / 2;
            return (
              <g key={v} className="langs-tick">
                <line x1={C + Math.cos(a) * 150} y1={C + Math.sin(a) * 150} x2={C + Math.cos(a) * 157} y2={C + Math.sin(a) * 157} />
                <text x={C + Math.cos(a) * 170} y={C + Math.sin(a) * 170} dy={4}>
                  {v}
                </text>
              </g>
            );
          })}
          {languages.map((l, i) => {
            const on = i === active;
            return (
              <g key={l.name}>
                <circle cx={C} cy={C} r={RINGS[i]} className="langs-track" />
                <motion.circle
                  cx={C}
                  cy={C}
                  r={RINGS[i]}
                  className={`langs-arc${on ? ' is-on' : ''}`}
                  transform={`rotate(-90 ${C} ${C})`}
                  initial={{ pathLength: 0 }}
                  animate={{
                    pathLength: inView ? l.value / 100 : 0,
                    strokeWidth: on ? 22 : 10,
                  }}
                  transition={{
                    pathLength: { duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: inView ? i * 0.1 : 0 },
                    strokeWidth: { type: 'spring', stiffness: 300, damping: 22 },
                  }}
                />
              </g>
            );
          })}
        </svg>
        <div className="langs-center">
          <Counter value={lang.value} run={inView} />
        </div>
      </div>

      <div className="langs-picker" role="group" aria-label="Languages">
        {languages.map((l, i) => (
          <button
            key={l.name}
            type="button"
            aria-pressed={i === active}
            className={`langs-opt${i === active ? ' is-on' : ''}`}
            onClick={() => setActive(i)}
            onPointerEnter={() => setActive(i)}
            onFocus={() => setActive(i)}
          >
            <span className="langs-opt-name">{l.name}</span>
            <span className="langs-opt-val">{l.value}%</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Counter({ value, run }: { value: number; run: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const shown = useRef(0);
  const reduced = useMediaQuery(REDUCED_MOTION);
  useEffect(() => {
    if (!run) return;
    const c = animate(shown.current, value, {
      duration: reduced ? 0 : 0.9,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        shown.current = v;
        if (ref.current) ref.current.textContent = String(Math.round(v));
      },
    });
    return () => c.stop();
  }, [value, run, reduced]);
  return (
    <p className="langs-count" aria-hidden="true">
      <span ref={ref}>0</span>
      <small>%</small>
    </p>
  );
}
