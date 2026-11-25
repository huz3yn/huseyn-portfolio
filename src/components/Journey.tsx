import { useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { journey } from '../data/cv';
import { useMode } from '../context/Mode';
import './Journey.css';

const VW = 1200;
const VH = 420;
const START = 2021;
const Y = [300, 175, 105, 285]; // freeform heights: the route climbs, then settles

function nowYear() {
  const d = new Date();
  return d.getFullYear() + d.getMonth() / 12;
}

export function Journey() {
  const { mode } = useMode();
  const [active, setActive] = useState(journey.length - 1);
  const [dir, setDir] = useState(1);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const now = useMemo(nowYear, []);
  const end = now + 0.4;
  const xOf = (y: number) => 90 + ((y - START) / (end - START)) * (VW - 180);
  const pts = journey.map((m, i) => ({ x: xOf(m.start), y: Y[i] }));
  const m = journey[active];

  const go = (i: number, focus = false) => {
    const n = (i + journey.length) % journey.length;
    setDir(n > active ? 1 : -1);
    setActive(n);
    if (focus) tabs.current[n]?.focus();
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      go(active + 1, true);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      go(active - 1, true);
    }
  };

  // Curved segment between two consecutive milestones.
  const seg = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    const dx = (b.x - a.x) * 0.5;
    return `M${a.x},${a.y} C${a.x + dx},${a.y} ${b.x - dx},${b.y} ${b.x},${b.y}`;
  };
  const years = [];
  for (let y = START; y <= Math.floor(now); y++) years.push(y);

  if (mode === 'read') {
    return (
      <section id="experience" className="section journey" aria-labelledby="experience-title">
        <div className="wrap">
          <Header />
          <ol className="journey-read">
            {[...journey].reverse().map((j) => (
              <li key={j.id}>
                <span className="label">{j.range}</span>
                <div>
                  <h3>{j.title}</h3>
                  <p>
                    {j.place}
                    {j.detail ? `, ${j.detail}` : ''}
                  </p>
                </div>
                <span className={`journey-kind kind-${j.kind}`}>{j.kind === 'work' ? 'Work' : 'Study'}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>
    );
  }

  return (
    <section
      id="experience"
      className={`section journey is-${m.kind}`}
      aria-labelledby="experience-title"
    >
      <div className="wrap">
        <Header />

        <div className="journey-board">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={m.id}
              className="journey-year"
              aria-hidden="true"
              initial={{ y: dir * 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: dir * -80, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 24 }}
            >
              {Math.floor(m.start)}
            </motion.span>
          </AnimatePresence>

          <div className="journey-map">
            <svg viewBox={`0 0 ${VW} ${VH}`} aria-hidden="true" className="journey-svg">
              {years.map((y) => (
                <g key={y} className="journey-axis">
                  <line x1={xOf(y)} y1={30} x2={xOf(y)} y2={VH - 20} />
                  <text x={xOf(y)} y={VH - 2}>
                    {y}
                  </text>
                </g>
              ))}
              <g className="journey-axis is-now">
                <line x1={xOf(now)} y1={30} x2={xOf(now)} y2={VH - 20} />
                <text x={xOf(now)} y={22}>
                  Today
                </text>
              </g>

              {/* How long each milestone lasted */}
              {journey.map((j, i) => (
                <line
                  key={j.id}
                  x1={xOf(j.start)}
                  x2={xOf(j.end ?? now)}
                  y1={Y[i]}
                  y2={Y[i]}
                  className={`journey-span${i === active ? ' is-on' : ''}${j.end === null ? ' is-open' : ''}`}
                />
              ))}

              {pts.slice(1).map((p, i) => (
                <g key={i}>
                  <path d={seg(pts[i], p)} className="journey-route" />
                  <motion.path
                    d={seg(pts[i], p)}
                    className="journey-route is-lit"
                    initial={false}
                    animate={{ pathLength: i < active ? 1 : 0 }}
                    transition={{ duration: 0.5, ease: [0.65, 0, 0.35, 1], delay: i < active ? i * 0.12 : 0 }}
                  />
                </g>
              ))}
            </svg>

            <div className="journey-nodes" role="tablist" aria-label="Milestones" onKeyDown={onKey}>
              {journey.map((j, i) => (
                <button
                  key={j.id}
                  ref={(el) => {
                    tabs.current[i] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`ms-${j.id}`}
                  aria-selected={i === active}
                  aria-controls="ms-panel"
                  tabIndex={i === active ? 0 : -1}
                  className={`ms ms-${j.kind}${i === active ? ' is-on' : ''}${i < active ? ' is-past' : ''}`}
                  style={{ left: `${(pts[i].x / VW) * 100}%`, top: `${(pts[i].y / VH) * 100}%` }}
                  data-cursor="OPEN"
                  onClick={() => go(i)}
                >
                  <span className="ms-dot" aria-hidden="true">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="ms-name">{j.place.split(',')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="journey-panel" id="ms-panel" role="tabpanel" aria-labelledby={`ms-${m.id}`}>
            <AnimatePresence mode="wait" custom={dir} initial={false}>
              <motion.div
                key={m.id}
                className="ms-card"
                initial={{ opacity: 0, x: dir * 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: dir * -30 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                <p className="ms-meta">
                  <span className={`journey-kind kind-${m.kind}`}>{m.kind === 'work' ? 'Work' : 'Study'}</span>
                  <span className="label">{m.range}</span>
                </p>
                <h3 className="ms-title">{m.title}</h3>
                <p className="ms-place">
                  {m.place}
                  {m.detail ? <span className="muted">, {m.detail}</span> : null}
                </p>
              </motion.div>
            </AnimatePresence>
            <div className="ms-nav">
              <span className="label">
                Step {active + 1} of {journey.length}
              </span>
              <div>
                <button type="button" className="ms-step" onClick={() => go(active - 1)} aria-label="Previous milestone">
                  ←
                </button>
                <button type="button" className="ms-step" onClick={() => go(active + 1)} aria-label="Next milestone">
                  →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Header() {
  return (
    <header className="chapter">
      <p className="label chapter-idx" data-thread>
        <b>04</b> / Experience
      </p>
      <h2 id="experience-title" className="h2 chapter-title">
        The route so far, study and work.
      </h2>
      <p className="chapter-note">Select a milestone, or use the arrow keys.</p>
    </header>
  );
}
