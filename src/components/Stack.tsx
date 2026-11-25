import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { categories, links, skills, type Category, type Skill } from '../data/cv';
import { useMode } from '../context/Mode';
import { REDUCED_MOTION, useMediaQuery } from '../hooks/useMediaQuery';
import './Stack.css';

const W = 1000;
const H = 600;
const byId = Object.fromEntries(skills.map((s) => [s.id, s])) as Record<string, Skill>;
const catLabel = Object.fromEntries(categories.map((c) => [c.id, c.label])) as Record<Category, string>;
const adjacency: Record<string, string[]> = Object.fromEntries(skills.map((s) => [s.id, []]));
for (const [a, b] of links) {
  adjacency[a].push(b);
  adjacency[b].push(a);
}

type Pt = { x: number; y: number };

/**
 * Where every node sits. With no category chosen, the map shows how the stack connects.
 * With a category chosen, its members gather into a ring on the left and the rest
 * step aside into a quiet column on the right.
 */
function layoutFor(cat: Category | null): Record<string, Pt> {
  const out: Record<string, Pt> = {};
  if (!cat) {
    skills.forEach((s) => (out[s.id] = { x: s.x, y: s.y }));
    return out;
  }
  const inCat = skills.filter((s) => s.cat === cat);
  const rest = skills.filter((s) => s.cat !== cat);
  const r = inCat.length > 4 ? 210 : 140;
  inCat.forEach((s, i) => {
    const a = -Math.PI / 2 + (i / inCat.length) * Math.PI * 2;
    out[s.id] = { x: 360 + Math.cos(a) * r * 1.2, y: 300 + Math.sin(a) * r };
  });
  const cols = rest.length > 7 ? 2 : 1;
  const perCol = Math.ceil(rest.length / cols);
  rest.forEach((s, i) => {
    const c = Math.floor(i / perCol);
    const row = i % perCol;
    out[s.id] = { x: cols === 2 ? 790 + c * 140 : 880, y: 60 + (row * 480) / Math.max(1, perCol - 1) };
  });
  return out;
}

function curve(a: Pt, b: Pt) {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const k = 0.16;
  return `M${a.x},${a.y} Q${mx - (b.y - a.y) * k},${my + (b.x - a.x) * k} ${b.x},${b.y}`;
}

export function Stack() {
  const { mode } = useMode();
  const [sel, setSel] = useState<string | null>('react');
  const [hover, setHover] = useState<string | null>(null);
  const [cat, setCat] = useState<Category | null>(null);
  const current = hover ?? sel;

  const lit = useMemo(() => {
    if (current) return new Set([current, ...adjacency[current]]);
    if (cat) return new Set(skills.filter((s) => s.cat === cat).map((s) => s.id));
    return null;
  }, [current, cat]);

  const pick = (id: string) => {
    setCat(null);
    setSel((p) => (p === id ? null : id));
  };

  return (
    <section id="stack" className="section stack" aria-labelledby="stack-title">
      <div className="wrap">
        <header className="chapter">
          <p className="label chapter-idx" data-thread>
            <b>03</b> / Stack
          </p>
          <h2 id="stack-title" className="h2 chapter-title">
            A stack you can play with.
          </h2>
          <p className="chapter-note">Every technology from my CV, mapped by how they work together.</p>
        </header>

        {mode === 'read' ? (
          <ReadList />
        ) : (
          <>
            <div className="stack-filters" role="group" aria-label="Show a category">
              <button type="button" className="chip" aria-pressed={!cat && !sel} onClick={() => { setCat(null); setSel(null); }}>
                All
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`chip chip-${c.id}`}
                  aria-pressed={cat === c.id}
                  onClick={() => {
                    setSel(null);
                    setCat(cat === c.id ? null : c.id);
                  }}
                >
                  <span className={`dot dot-${c.id}`} aria-hidden="true" />
                  {c.label}
                </button>
              ))}
            </div>

            <div className="stack-map">
              <Graph current={current} sel={sel} lit={lit} cat={cat} onHover={setHover} onPick={pick} />
              <ChipMap current={current} lit={lit} onPick={pick} />
              <Detail id={current} onPick={pick} />
            </div>

            <Compose />
          </>
        )}
      </div>
    </section>
  );
}

/* ── Network (tablet and up) ── */

function Graph({
  current,
  sel,
  lit,
  cat,
  onHover,
  onPick,
}: {
  current: string | null;
  sel: string | null;
  lit: Set<string> | null;
  cat: Category | null;
  onHover: (id: string | null) => void;
  onPick: (id: string) => void;
}) {
  const reduced = useMediaQuery(REDUCED_MOTION);
  const ref = useRef<HTMLDivElement>(null);
  const [pulse, setPulse] = useState<{ i: number; k: number } | null>(null);
  const [visible, setVisible] = useState(false);
  const pos = useMemo(() => layoutFor(cat), [cat]);
  const move = { type: 'spring', stiffness: 120, damping: 18 } as const;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // At rest, and only while on screen, a signal travels along a random connection.
  useEffect(() => {
    if (reduced || current || !visible) return;
    let k = 0;
    const id = window.setInterval(() => setPulse({ i: Math.floor(Math.random() * links.length), k: k++ }), 1600);
    return () => window.clearInterval(id);
  }, [reduced, current, visible]);

  return (
    <div ref={ref} className={`graph${lit ? ' has-focus' : ''}`} onPointerLeave={() => onHover(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} className="graph-svg" aria-hidden="true">
        {links.map(([a, b]) => {
          const on = !!lit && lit.has(a) && lit.has(b) && (!current || a === current || b === current);
          return (
            <motion.path
              key={`${a}-${b}`}
              initial={false}
              animate={{ d: curve(pos[a], pos[b]) }}
              transition={move}
              className={`edge${on ? ' is-lit' : ''}`}
              pathLength={1}
            />
          );
        })}
        {pulse && !current && (
          <path key={pulse.k} d={curve(pos[links[pulse.i][0]], pos[links[pulse.i][1]])} className="edge-pulse" pathLength={1} />
        )}
      </svg>
      {skills.map((s) => {
        const state = !lit ? '' : s.id === current ? ' is-current' : lit.has(s.id) ? ' is-lit' : ' is-dim';
        const hop = current && current !== s.id ? adjacency[current].indexOf(s.id) : -1;
        return (
          <motion.button
            key={s.id}
            type="button"
            className={`node node-${s.cat}${state}`}
            initial={false}
            aria-pressed={sel === s.id}
            aria-describedby="stack-detail"
            data-cursor={sel === s.id ? 'CLEAR' : 'SELECT'}
            onPointerEnter={() => onHover(s.id)}
            onFocus={() => onHover(s.id)}
            onBlur={() => onHover(null)}
            onClick={() => onPick(s.id)}
            animate={{
              left: `${(pos[s.id].x / W) * 100}%`,
              top: `${(pos[s.id].y / H) * 100}%`,
              scale: s.id === current ? 1.12 : lit?.has(s.id) ? 1.04 : 1,
            }}
            transition={{ left: move, top: move, scale: { type: 'spring', stiffness: 400, damping: 20 } }}
          >
            {/* related nodes answer the selected one with a ripple, in order */}
            {hop >= 0 && (
              <motion.span
                key={current}
                className="node-ripple"
                aria-hidden="true"
                initial={{ scale: 0.6, opacity: 0.9 }}
                animate={{ scale: 2.2, opacity: 0 }}
                transition={{ duration: 0.8, delay: 0.08 + hop * 0.09, ease: 'easeOut' }}
              />
            )}
            <span className="node-dot" aria-hidden="true" />
            {s.name}
          </motion.button>
        );
      })}
    </div>
  );
}

/* ── Phones: the same relationships as a compact chip map ── */

function ChipMap({ current, lit, onPick }: { current: string | null; lit: Set<string> | null; onPick: (id: string) => void }) {
  return (
    <div className="chipmap">
      {categories.map((c) => (
        <div key={c.id} className="chipmap-group">
          <p className="label">{c.label}</p>
          <ul>
            {skills
              .filter((s) => s.cat === c.id)
              .map((s) => {
                const state = !lit ? '' : s.id === current ? ' is-current' : lit.has(s.id) ? ' is-lit' : ' is-dim';
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      className={`chipmap-chip${state}`}
                      aria-pressed={current === s.id}
                      aria-describedby="stack-detail"
                      onClick={() => onPick(s.id)}
                    >
                      {s.name}
                    </button>
                  </li>
                );
              })}
          </ul>
        </div>
      ))}
    </div>
  );
}

function Detail({ id, onPick }: { id: string | null; onPick: (id: string) => void }) {
  const s = id ? byId[id] : null;
  return (
    <aside id="stack-detail" className="detail" aria-live="polite">
      <AnimatePresence mode="wait" initial={false}>
        {s ? (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
            className="detail-body"
          >
            <p className="label">
              <span className={`dot dot-${s.cat}`} aria-hidden="true" /> {catLabel[s.cat]}
            </p>
            <h3 className="detail-name">{s.name}</h3>
            <p className="detail-text">{s.text}</p>
            {adjacency[s.id].length > 0 ? (
              <>
                <p className="label">Connects to</p>
                <ul className="detail-links">
                  {adjacency[s.id].map((n) => (
                    <li key={n}>
                      <button type="button" className="chip" onClick={() => onPick(n)}>
                        {byId[n].name}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="label">Stands on its own in this map</p>
            )}
          </motion.div>
        ) : (
          <motion.div key="none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="detail-body">
            <p className="label">{skills.length} technologies</p>
            <p className="detail-text">Select a technology to follow its connections. Pick a category to light up its group.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
}

function ReadList() {
  return (
    <div className="readlist">
      {categories.map((c) => (
        <div key={c.id}>
          <p className="label">{c.label}</p>
          <p>
            {skills
              .filter((s) => s.cat === c.id)
              .map((s) => s.name)
              .join(', ')}
          </p>
        </div>
      ))}
    </div>
  );
}

/* ── Compose: pick technologies, watch an exploded stack of layers assemble ── */

type Layer = { id: string; name: string; techs: string[] };
const LAYERS: Layer[] = [
  { id: 'markup', name: 'Markup', techs: ['html'] },
  { id: 'style', name: 'Style', techs: ['css', 'sass', 'tailwind', 'bootstrap'] },
  { id: 'components', name: 'Components', techs: ['react', 'rn'] },
  { id: 'logic', name: 'Logic', techs: ['js', 'ts', 'python'] },
  { id: 'api', name: 'API', techs: ['rest', 'express'] },
  { id: 'server', name: 'Server', techs: ['node'] },
  { id: 'data', name: 'Data', techs: ['mongodb', 'mongoose'] },
];

function Compose() {
  const [on, setOn] = useState<Set<string>>(() => new Set(['html', 'css', 'react', 'ts', 'node', 'mongodb']));
  const toggle = (id: string) =>
    setOn((p) => {
      const n = new Set(p);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const active = LAYERS.filter((l) => l.techs.some((t) => on.has(t)));
  const git = on.has('git');
  const github = on.has('github');
  const phone = on.has('rn') && !on.has('react');

  return (
    <div className="compose">
      <div className="compose-side">
        <h3 className="compose-title">Compose a build</h3>
        <p className="compose-intro">
          Switch technologies on and off. Each one adds or removes a layer of the build. A visual
          experiment, not a compiler.
        </p>
        <div className="compose-chips" role="group" aria-label="Technologies in the build">
          {skills.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`chip chip-sm chip-${s.cat}`}
              aria-pressed={on.has(s.id)}
              onClick={() => toggle(s.id)}
            >
              {s.name}
            </button>
          ))}
        </div>
        <div className="compose-actions">
          <button type="button" className="chip chip-sm" onClick={() => setOn(new Set(skills.map((s) => s.id)))}>
            Everything
          </button>
          <button type="button" className="chip chip-sm" onClick={() => setOn(new Set())}>
            Clear
          </button>
        </div>
      </div>

      <div className="compose-stage" aria-live="polite">
        <p className="sr-only">
          {active.length ? `Layers in the build: ${active.map((l) => l.name).join(', ')}.` : 'The build is empty.'}
        </p>
        <div className={`iso${git ? ' is-git' : ''}`} aria-hidden="true">
          {git && <span className="iso-frame">{github ? 'tracked in Git, pushed to GitHub' : 'tracked in Git'}</span>}
          <AnimatePresence>
            {active.map((l) => {
              const i = LAYERS.length - 1 - LAYERS.indexOf(l);
              return (
                <motion.div
                  key={l.id}
                  className={`plane plane-${l.id}${phone && l.id === 'components' ? ' is-phone' : ''}`}
                  initial={{ opacity: 0, z: i * 34 + 140 }}
                  animate={{ opacity: 1, z: i * 34 }}
                  exit={{ opacity: 0, z: i * 34 + 140 }}
                  transition={{ type: 'spring', stiffness: 220, damping: 22 }}
                >
                  <PlaneArt id={l.id} on={on} />
                  <span className="plane-name">
                    {l.name}
                    <small>{l.techs.filter((t) => on.has(t)).map((t) => byId[t].name).join(', ')}</small>
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {active.length === 0 && <span className="iso-empty">Nothing to build yet.</span>}
        </div>
      </div>
    </div>
  );
}

function PlaneArt({ id, on }: { id: string; on: Set<string> }) {
  switch (id) {
    case 'markup':
      return (
        <span className="art art-markup">
          <i /> <i /> <i /> <i />
        </span>
      );
    case 'style':
      return (
        <span className={`art art-style${on.has('bootstrap') ? ' has-grid' : ''}${on.has('tailwind') ? ' has-space' : ''}`}>
          <i /> <i /> <i />
        </span>
      );
    case 'components':
      return (
        <span className="art art-components">
          <i /> <i /> <i />
        </span>
      );
    case 'logic':
      return <span className="art art-logic">{on.has('ts') ? 'fn(x: T)' : 'fn(x)'}</span>;
    case 'api':
      return (
        <span className="art art-api">
          <i /> <i />
        </span>
      );
    case 'server':
      return (
        <span className="art art-server">
          <i /> <i /> <i />
        </span>
      );
    default:
      return (
        <span className="art art-data">
          <i /> <i /> <i />
        </span>
      );
  }
}
