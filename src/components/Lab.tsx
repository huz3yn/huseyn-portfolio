import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent as RPointerEvent } from 'react';
import { animate, AnimatePresence, motion } from 'motion/react';
import { useMode } from '../context/Mode';
import { useToast } from '../context/Toast';
import { Shape } from './Playground';
import './Lab.css';

type Exp = 'easing' | 'type';

export function Lab() {
  const { mode } = useMode();
  const [exp, setExp] = useState<Exp>('easing');
  if (mode === 'read') return null;

  return (
    <section id="lab" className="lab" aria-labelledby="lab-title">
      <div className="wrap lab-grid">
        <div className="lab-side">
          <p className="label lab-label" data-thread>
            Interlude
          </p>
          <h2 id="lab-title" className="lab-title">
            Interaction Lab.
          </h2>
          <p className="lab-intro">
            Two small instruments from the front-end toolbox. Shape how something moves, or how a
            letter is drawn.
          </p>
          <div className="lab-tabs" role="tablist" aria-label="Experiments">
            {(
              [
                ['easing', 'Motion curve'],
                ['type', 'Variable type'],
              ] as [Exp, string][]
            ).map(([k, l]) => (
              <button
                key={k}
                type="button"
                role="tab"
                id={`lab-tab-${k}`}
                aria-selected={exp === k}
                aria-controls="lab-panel"
                onClick={() => setExp(k)}
              >
                {exp === k && (
                  <motion.span layoutId="lab-tab" className="lab-tab-bg" transition={{ type: 'spring', stiffness: 500, damping: 36 }} />
                )}
                <span>{l}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="lab-panel" id="lab-panel" role="tabpanel" aria-labelledby={`lab-tab-${exp}`}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={exp}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              {exp === 'easing' ? <EasingLab /> : <TypeLab />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

/* ── Motion curve: drag the handles of a cubic-bezier and watch an object use it ── */

type Bez = [number, number, number, number];
const PRESETS: [string, Bez][] = [
  ['Ease out', [0.16, 1, 0.3, 1]],
  ['In and out', [0.65, 0, 0.35, 1]],
  ['Overshoot', [0.34, 1.56, 0.64, 1]],
  ['Linear', [0, 0, 1, 1]],
];
const COLORS = [
  ['Orange', '#ff6b35'],
  ['Ink', '#263b43'],
  ['Butter', '#f5df9b'],
] as const;
type ShapeKind = 'circle' | 'square' | 'triangle';

// Plot area inside the SVG: x 0..1 maps to 40..260, y 0..1 maps to 250..70.
const X = (v: number) => 40 + v * 220;
const Y = (v: number) => 250 - v * 180;
const fmt = (b: Bez) => `cubic-bezier(${b.map((n) => n.toFixed(2)).join(', ')})`;

function EasingLab() {
  const toast = useToast();
  const [bez, setBez] = useState<Bez>(PRESETS[0][1]);
  const [duration, setDuration] = useState(900);
  const [color, setColor] = useState<string>(COLORS[0][1]);
  const [shape, setShape] = useState<ShapeKind>('circle');
  const svgRef = useRef<SVGSVGElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const objRef = useRef<HTMLDivElement>(null);
  const forward = useRef(true);
  const dirty = useRef(false); // replay only after the visitor changed something
  const [drag, setDrag] = useState<0 | 1 | null>(null);

  const play = () => {
    const track = trackRef.current;
    const obj = objRef.current;
    if (!track || !obj) return;
    const dist = track.clientWidth - obj.offsetWidth - 16;
    const from = forward.current ? 0 : dist;
    const to = forward.current ? dist : 0;
    forward.current = !forward.current;
    obj.getAnimations().forEach((a) => a.cancel());
    obj.animate(
      [
        { transform: `translateX(${from}px) rotate(0deg)` },
        { transform: `translateX(${to}px) rotate(${shape === 'circle' ? 0 : 180}deg)` },
      ],
      { duration, easing: fmt(bez), fill: 'forwards' },
    );
  };

  // Replay whenever the visitor changes the curve or timing, so every adjustment is felt.
  useEffect(() => {
    if (!dirty.current || drag !== null) return;
    const t = window.setTimeout(play, 220);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bez, duration, shape, drag]);

  const toCurve = (e: RPointerEvent) => {
    const svg = svgRef.current;
    const ctm = svg?.getScreenCTM();
    if (!svg || !ctm) return null;
    const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    return {
      x: Math.min(1, Math.max(0, (pt.x - 40) / 220)),
      y: Math.min(1.8, Math.max(-0.8, (250 - pt.y) / 180)),
    };
  };
  const onMove = (e: RPointerEvent) => {
    if (drag === null) return;
    dirty.current = true;
    const c = toCurve(e);
    if (!c) return;
    setBez((b) => {
      const n = [...b] as Bez;
      n[drag * 2] = c.x;
      n[drag * 2 + 1] = c.y;
      return n;
    });
  };
  const onKey = (h: 0 | 1) => (e: KeyboardEvent) => {
    const step = e.shiftKey ? 0.1 : 0.02;
    const d: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, step],
      ArrowDown: [0, -step],
    };
    if (!d[e.key]) return;
    e.preventDefault();
    dirty.current = true;
    setBez((b) => {
      const n = [...b] as Bez;
      n[h * 2] = Math.min(1, Math.max(0, n[h * 2] + d[e.key][0]));
      n[h * 2 + 1] = Math.min(1.8, Math.max(-0.8, n[h * 2 + 1] + d[e.key][1]));
      return n;
    });
  };

  const copy = () =>
    navigator.clipboard
      .writeText(fmt(bez))
      .then(() => toast('Easing copied'))
      .catch(() => toast('Copy was blocked by the browser'));

  const [x1, y1, x2, y2] = bez;

  return (
    <div className="ease">
      <div className="ease-graph">
        <svg
          ref={svgRef}
          viewBox="0 0 300 320"
          className="ease-svg"
          onPointerMove={onMove}
          onPointerUp={() => setDrag(null)}
          onPointerCancel={() => setDrag(null)}
        >
          <rect x={40} y={70} width={220} height={180} className="ease-box" />
          <line x1={X(0)} y1={Y(0)} x2={X(1)} y2={Y(1)} className="ease-diag" />
          <line x1={X(0)} y1={Y(0)} x2={X(x1)} y2={Y(y1)} className="ease-arm" />
          <line x1={X(1)} y1={Y(1)} x2={X(x2)} y2={Y(y2)} className="ease-arm" />
          <path d={`M${X(0)},${Y(0)} C${X(x1)},${Y(y1)} ${X(x2)},${Y(y2)} ${X(1)},${Y(1)}`} className="ease-curve" />
          <text x={40} y={272} className="ease-axis">
            time
          </text>
          <text x={26} y={250} className="ease-axis" transform="rotate(-90 26 250)">
            progress
          </text>
          {([0, 1] as const).map((h) => (
            <g
              key={h}
              className={`ease-handle${drag === h ? ' is-drag' : ''}`}
              transform={`translate(${X(bez[h * 2])} ${Y(bez[h * 2 + 1])})`}
              tabIndex={0}
              role="slider"
              aria-label={`Control point ${h + 1}. Arrow keys move it.`}
              aria-valuetext={`x ${bez[h * 2].toFixed(2)}, y ${bez[h * 2 + 1].toFixed(2)}`}
              data-cursor="DRAG"
              onPointerDown={(e) => {
                svgRef.current?.setPointerCapture(e.pointerId);
                setDrag(h);
              }}
              onKeyDown={onKey(h)}
            >
              <circle r={20} className="ease-hit" />
              <circle r={8} />
            </g>
          ))}
        </svg>
      </div>

      <div className="ease-side">
        <div className="ease-track" ref={trackRef}>
          <div ref={objRef} className="ease-obj" style={{ color }}>
            <Shape kind={shape} />
          </div>
        </div>

        <div className="ease-presets" role="group" aria-label="Presets">
          {PRESETS.map(([name, b]) => (
            <button key={name} type="button" aria-pressed={fmt(b) === fmt(bez)} onClick={() => {
                dirty.current = true;
                setBez(b);
              }}>
              <svg viewBox="0 0 40 40" aria-hidden="true">
                <path d={`M4,36 C${4 + b[0] * 32},${36 - b[1] * 32} ${4 + b[2] * 32},${36 - b[3] * 32} 36,4`} />
              </svg>
              {name}
            </button>
          ))}
        </div>

        <label className="lab-field">
          <span>
            Duration <b>{duration} ms</b>
          </span>
          <input type="range" min={200} max={2400} step={50} value={duration} onChange={(e) => {
              dirty.current = true;
              setDuration(+e.target.value);
            }} />
        </label>

        <div className="lab-row">
          <div className="ease-swatches" role="group" aria-label="Colour">
            {COLORS.map(([name, c]) => (
              <button key={c} type="button" aria-pressed={color === c} aria-label={name} onClick={() => setColor(c)} style={{ background: c }} />
            ))}
          </div>
          <div className="lab-seg" role="group" aria-label="Shape">
            {(['circle', 'square', 'triangle'] as ShapeKind[]).map((k) => (
              <button key={k} type="button" aria-pressed={shape === k} aria-label={k} onClick={() => {
                dirty.current = true;
                setShape(k);
              }} className="ease-shape-btn">
                <Shape kind={k} />
              </button>
            ))}
          </div>
        </div>

        <div className="lab-row">
          <button type="button" className="btn" onClick={play}>
            Play
          </button>
          <button type="button" className="ease-code" onClick={copy} translate="no" aria-label={`Copy ${fmt(bez)}`}>
            {fmt(bez)}
            <span aria-hidden="true">Copy</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Variable type: Archivo's width and weight axes as live controls ── */

type Case = 'title' | 'upper' | 'lower';
const DEFAULTS = { wdth: 80, wght: 760 };

function TypeLab() {
  const [wdth, setWdth] = useState(DEFAULTS.wdth);
  const [wght, setWght] = useState(DEFAULTS.wght);
  const [outline, setOutline] = useState(false);
  const [kase, setKase] = useState<Case>('title');
  const [text, setText] = useState('Huseyn');
  const anim = useRef<{ stop: () => void }[]>([]);

  const tweenTo = (w: number, g: number) => {
    anim.current.forEach((a) => a.stop());
    anim.current = [
      animate(wdth, w, { type: 'spring', stiffness: 120, damping: 14, onUpdate: (v) => setWdth(Math.round(v)) }),
      animate(wght, g, { type: 'spring', stiffness: 120, damping: 14, onUpdate: (v) => setWght(Math.round(v)) }),
    ];
  };
  const shuffle = () => tweenTo(62 + Math.round(Math.random() * 63), 100 + Math.round(Math.random() * 8) * 100);
  const shown = kase === 'upper' ? text.toUpperCase() : kase === 'lower' ? text.toLowerCase() : text;

  return (
    <div className="typelab">
      <div className="lab-controls">
        <label className="lab-field">
          <span>
            Width <b>{wdth}</b>
          </span>
          <input type="range" min={62} max={125} value={wdth} onChange={(e) => setWdth(+e.target.value)} />
        </label>
        <label className="lab-field">
          <span>
            Weight <b>{wght}</b>
          </span>
          <input type="range" min={100} max={900} step={10} value={wght} onChange={(e) => setWght(+e.target.value)} />
        </label>
        <label className="lab-field">
          <span>Your word</span>
          <input
            type="text"
            name="specimen"
            autoComplete="off"
            spellCheck={false}
            value={text}
            maxLength={14}
            onChange={(e) => setText(e.target.value)}
            className="lab-input"
          />
        </label>
        <div className="lab-row">
          <div className="lab-seg" role="group" aria-label="Letter case">
            {(
              [
                ['title', 'Aa'],
                ['upper', 'AA'],
                ['lower', 'aa'],
              ] as [Case, string][]
            ).map(([k, l]) => (
              <button key={k} type="button" aria-pressed={kase === k} onClick={() => setKase(k)}>
                {l}
              </button>
            ))}
          </div>
          <label className="lab-switch">
            <input type="checkbox" role="switch" checked={outline} onChange={(e) => setOutline(e.target.checked)} />
            <span aria-hidden="true">
              <span />
            </span>
            Outline
          </label>
        </div>
        <div className="lab-row">
          <button type="button" className="btn" onClick={shuffle}>
            Shuffle axes
          </button>
          <button type="button" className="btn btn-line" onClick={() => tweenTo(DEFAULTS.wdth, DEFAULTS.wght)}>
            Reset
          </button>
        </div>
      </div>
      <div className="lab-stage">
        <p className={`lab-specimen${outline ? ' is-outline' : ''}`} style={{ fontStretch: `${wdth}%`, fontWeight: wght }}>
          {shown || 'Type something'}
        </p>
        <code className="lab-code" translate="no">
          font-stretch: {wdth}%; font-weight: {wght};
        </code>
      </div>
    </div>
  );
}
