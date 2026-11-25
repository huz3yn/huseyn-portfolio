import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { projects, type Project } from '../data/cv';
import { useMode } from '../context/Mode';
import { useToast } from '../context/Toast';
import { FINE_POINTER, REDUCED_MOTION, useMediaQuery } from '../hooks/useMediaQuery';
import { Magnetic } from './Magnetic';
import './Work.css';

const pad = (n: number) => String(n).padStart(2, '0');
type View = 'desktop' | 'phone';

export function Work() {
  const { mode } = useMode();
  const [active, setActive] = useState(() => {
    const id = new URLSearchParams(window.location.search).get('project');
    return Math.max(0, projects.findIndex((x) => x.id === id));
  });
  const [origin, setOrigin] = useState({ x: 0, y: 50 });
  const [peek, setPeek] = useState<number | null>(null);
  const [view, setView] = useState<View>('desktop');
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);
  const p = projects[active];

  // Keep the selected project in the URL so a link opens on it.
  const initial = useRef(active);
  useEffect(() => {
    if (active === initial.current) return;
    initial.current = -1; // after the first real switch, always sync
    const url = new URL(window.location.href);
    url.searchParams.set('project', projects[active].id);
    window.history.replaceState(null, '', url);
  }, [active]);

  // The command palette can switch projects from anywhere; the new scene opens from the centre.
  useEffect(() => {
    const on = (e: Event) => {
      const i = projects.findIndex((x) => x.id === (e as CustomEvent<string>).detail);
      if (i >= 0) {
        setOrigin({ x: 50, y: 50 });
        setActive(i);
      }
    };
    window.addEventListener('ha:select-project', on);
    return () => window.removeEventListener('ha:select-project', on);
  }, []);

  /** Switch, opening the new scene from where the visitor clicked (or the left edge for keys). */
  const switchTo = (i: number, e?: MouseEvent) => {
    if (i === active) return;
    const w = wrapRef.current?.getBoundingClientRect();
    if (w && e && e.clientX) {
      setOrigin({
        x: Math.max(0, Math.min(100, ((e.clientX - w.left) / w.width) * 100)),
        y: Math.max(0, Math.min(100, ((e.clientY - w.top) / w.height) * 100)),
      });
    } else {
      setOrigin({ x: 0, y: 50 });
    }
    setActive(i);
  };

  const onKey = (e: KeyboardEvent) => {
    const d = ['ArrowDown', 'ArrowRight'].includes(e.key) ? 1 : ['ArrowUp', 'ArrowLeft'].includes(e.key) ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const n = (active + d + projects.length) % projects.length;
    switchTo(n);
    tabs.current[n]?.focus();
  };

  return (
    <section id="work" className={`section work is-${p.id}`} aria-labelledby="work-title">
      <div className="wrap">
        <header className="chapter work-chapter">
          <p className="label chapter-idx" data-thread>
            <b>05</b> / Work
          </p>
          <h2 id="work-title" className="h2 chapter-title">
            Project switchboard.
          </h2>
          <p className="chapter-note">Two projects from my CV. Flip a switch, then open the live site.</p>
        </header>

        {mode === 'read' ? (
          <ul className="work-read">
            {projects.map((x, i) => (
              <li key={x.id}>
                <span className="label">Project {pad(i + 1)}</span>
                <h3>{x.name}</h3>
                {x.description && <p>{x.description}</p>}
                <a className="u-link" href={x.url} target="_blank" rel="noopener noreferrer">
                  {x.domain} ↗<span className="sr-only"> (opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <div className="board">
            <div className="board-switches" role="tablist" aria-label="Projects" aria-orientation="vertical" onKeyDown={onKey}>
              {projects.map((x, i) => (
                <button
                  key={x.id}
                  ref={(el) => {
                    tabs.current[i] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`pj-${x.id}`}
                  aria-selected={i === active}
                  aria-controls="pj-panel"
                  tabIndex={i === active ? 0 : -1}
                  className={`switch-btn${i === active ? ' is-on' : ''}`}
                  data-cursor={i === active ? undefined : 'SWITCH'}
                  onClick={(e) => switchTo(i, e)}
                  onPointerEnter={() => setPeek(i)}
                  onPointerLeave={() => setPeek(null)}
                >
                  <span className="switch-led" aria-hidden="true" />
                  <span className="switch-num">{pad(i + 1)}</span>
                  <span className="switch-name">{x.name}</span>
                  <span className="switch-domain">{x.domain}</span>
                  <span className="switch-toggle" aria-hidden="true">
                    <span />
                  </span>
                </button>
              ))}
              <p className="board-peek" aria-hidden="true">
                {peek !== null && peek !== active
                  ? `Flip to open ${projects[peek].name}`
                  : `Showing ${pad(active + 1)} of ${pad(projects.length)}`}
              </p>
            </div>

            <div ref={wrapRef} className="scene-wrap" id="pj-panel" role="tabpanel" aria-labelledby={`pj-${p.id}`}>
              <AnimatePresence initial={false}>
                <motion.div
                  key={p.id}
                  className={`scene scene-${p.id}`}
                  style={{ zIndex: 2 }}
                  initial={{ clipPath: `circle(0% at ${origin.x}% ${origin.y}%)` }}
                  animate={{ clipPath: `circle(150% at ${origin.x}% ${origin.y}%)` }}
                  exit={{ zIndex: 1, opacity: 1 }}
                  transition={{ duration: 0.85, ease: [0.65, 0, 0.35, 1] }}
                >
                  <Scene p={p} index={active} view={view} setView={setView} />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function Scene({ p, index, view, setView }: { p: Project; index: number; view: View; setView: (v: View) => void }) {
  const fine = useMediaQuery(FINE_POINTER);
  const reduced = useMediaQuery(REDUCED_MOTION);
  const toast = useToast();
  const ref = useRef<HTMLDivElement>(null);

  // Depth: background, frame and art drift at different rates with the pointer.
  const onMove = (e: PointerEvent) => {
    if (!fine || reduced || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    ref.current.style.setProperty('--px', ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
    ref.current.style.setProperty('--py', ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
  };
  const onLeave = () => {
    ref.current?.style.setProperty('--px', '0');
    ref.current?.style.setProperty('--py', '0');
  };

  const copy = () =>
    navigator.clipboard
      .writeText(p.url)
      .then(() => toast(`Link to ${p.domain} copied`))
      .catch(() => toast('Copy was blocked. Use the Visit button instead.'));

  return (
    <div ref={ref} className="scene-inner" onPointerMove={onMove} onPointerLeave={onLeave}>
      <div className="scene-bg" aria-hidden="true">
        {p.id === 'ofisart' ? <OfisartBg /> : <EduBg />}
      </div>

      <div className="scene-head">
        <span className="scene-num" aria-hidden="true">
          {pad(index + 1)}
        </span>
        <h3 className="scene-title">
          {p.name.split('').map((ch, i) => (
            <motion.span
              key={i}
              className="scene-letter"
              initial={{ y: '110%', rotate: 10 }}
              animate={{ y: '0%', rotate: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 24, delay: 0.25 + i * 0.03 }}
            >
              {ch}
            </motion.span>
          ))}
        </h3>
      </div>

      <div className="scene-body">
        <motion.a
          layout
          href={p.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`frame frame-${view}`}
          data-cursor="OPEN"
          aria-label={`Open ${p.domain} in a new tab`}
          transition={{ type: 'spring', stiffness: 200, damping: 26 }}
        >
          <motion.span layout="position" className="frame-bar" aria-hidden="true">
            <span className="frame-dots">
              <i />
              <i />
              <i />
            </span>
            <span className="frame-url">{view === 'phone' ? p.domain : `https://${p.domain}`}</span>
          </motion.span>
          <span className="frame-canvas" aria-hidden="true">
            {p.id === 'ofisart' ? <OfisartArt /> : <EduArt />}
          </span>
          <span className="frame-tag" aria-hidden="true">
            Illustration
          </span>
        </motion.a>

        <div className="scene-controls">
          <dl className="scene-meta">
            <div>
              <dt className="label">Website</dt>
              <dd>{p.domain}</dd>
            </div>
            <div>
              <dt className="label">Project</dt>
              <dd>
                {pad(index + 1)} / {pad(projects.length)}
              </dd>
            </div>
          </dl>
          {p.description && <p className="scene-desc">{p.description}</p>}

          <div className="scene-view" role="group" aria-label="Preview frame">
            {(['desktop', 'phone'] as View[]).map((v) => (
              <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)}>
                {view === v && (
                  <motion.span
                    layoutId={`view-thumb-${p.id}`}
                    className="scene-view-thumb"
                    transition={{ type: 'spring', stiffness: 500, damping: 34 }}
                  />
                )}
                <span>{v === 'desktop' ? 'Desktop' : 'Phone'}</span>
              </button>
            ))}
          </div>

          <div className="scene-actions">
            <Magnetic strength={0.3}>
              <a href={p.url} target="_blank" rel="noopener noreferrer" className="btn btn-orange">
                Visit {p.domain}
                <span className="btn-arrow" aria-hidden="true">
                  ↗
                </span>
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </Magnetic>
            <button type="button" className="btn btn-line" onClick={copy}>
              Copy link
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Illustrations built from each project's name. Not screenshots of the real sites. */

const draw = (delay: number) => ({
  initial: { pathLength: 0 },
  animate: { pathLength: 1 },
  transition: { duration: 0.9, ease: [0.65, 0, 0.35, 1] as const, delay },
});
const pop = (delay: number) => ({
  initial: { scale: 0 },
  animate: { scale: 1 },
  transition: { type: 'spring' as const, stiffness: 380, damping: 18, delay },
});
const center = { transformBox: 'fill-box', transformOrigin: 'center' } as const;

function OfisartArt() {
  const furniture = [
    <rect key="a" x="150" y="120" width="70" height="40" rx="6" />,
    <rect key="b" x="240" y="120" width="70" height="40" rx="6" />,
    <circle key="c" cx="610" cy="170" r="34" />,
    <rect key="d" x="560" y="260" width="100" height="40" rx="6" />,
    <rect key="e" x="150" y="270" width="120" height="50" rx="25" />,
  ];
  return (
    <svg viewBox="0 0 800 460" preserveAspectRatio="xMidYMid slice" className="art-svg">
      <rect width="800" height="460" fill="#fff6ea" />
      <g className="depth depth-1">
        {Array.from({ length: 17 }, (_, i) => (
          <line key={i} x1={i * 50} y1="0" x2={i * 50} y2="460" className="a-grid" />
        ))}
      </g>
      <g className="a-plan depth depth-2">
        <motion.rect x="110" y="80" width="260" height="150" {...draw(0.35)} />
        <motion.rect x="370" y="80" width="150" height="110" {...draw(0.45)} />
        <motion.rect x="370" y="190" width="150" height="160" className="a-lit" {...draw(0.55)} />
        <motion.rect x="110" y="230" width="260" height="120" {...draw(0.65)} />
        <motion.rect x="520" y="80" width="180" height="270" {...draw(0.75)} />
      </g>
      <g className="a-furn depth depth-3">
        {furniture.map((el, i) => (
          <motion.g key={i} style={center} {...pop(1 + i * 0.07)}>
            {el}
          </motion.g>
        ))}
        <motion.circle cx="445" cy="270" r="9" className="a-dot" style={center} {...pop(1.5)} />
      </g>
    </svg>
  );
}

function EduArt() {
  const pts = Array.from({ length: 30 }, (_, i) => {
    const j = Math.sin(i * 12.9898) * 43758.5453;
    return { x: 70 + i * 23, y: 380 - i * 9 + ((j - Math.floor(j)) - 0.5) * 110 };
  });
  return (
    <svg viewBox="0 0 800 460" preserveAspectRatio="xMidYMid slice" className="art-svg">
      <rect width="800" height="460" fill="#fdf3d2" />
      <g className="depth depth-1">
        {Array.from({ length: 8 }, (_, i) => (
          <line key={i} x1="0" y1={50 + i * 55} x2="800" y2={50 + i * 55} className="a-grid" />
        ))}
      </g>
      <g className="depth depth-2">
        {pts.map((pt, i) => (
          <motion.circle key={i} cx={pt.x} cy={pt.y} r="6" className="a-pt" style={center} {...pop(0.35 + i * 0.025)} />
        ))}
      </g>
      <g className="depth depth-3">
        <motion.path d="M70 400 C 260 370, 420 290, 560 190 S 720 80, 760 60" className="a-curve" {...draw(1.05)} />
        <motion.circle cx="760" cy="60" r="12" className="a-dot" style={center} {...pop(1.9)} />
      </g>
    </svg>
  );
}

/* Large background figures that give each scene its own character */
function OfisartBg() {
  return (
    <svg viewBox="0 0 600 600" className="bg-svg">
      <rect x="40" y="40" width="520" height="520" />
      <line x1="300" y1="40" x2="300" y2="560" />
      <line x1="40" y1="300" x2="560" y2="300" />
      <rect x="300" y="300" width="260" height="260" className="bg-fill" />
    </svg>
  );
}
function EduBg() {
  return (
    <svg viewBox="0 0 600 600" className="bg-svg">
      <path d="M20 560 C 200 540, 320 380, 400 260 S 540 60, 580 40" />
      {Array.from({ length: 6 }, (_, i) => (
        <circle key={i} cx={100 + i * 90} cy={520 - i * 90} r={10} className="bg-fill" />
      ))}
    </svg>
  );
}
