import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as RKeyboardEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import {
  animate,
  AnimatePresence,
  motion,
  motionValue,
  useDragControls,
  type DragControls,
  type MotionValue,
} from 'motion/react';
import { FINE_POINTER, REDUCED_MOTION, useMediaQuery } from '../hooks/useMediaQuery';
import './Playground.css';

type Tech = 'css' | 'react' | 'ts' | 'node';
type ShapeKind = 'circle' | 'square' | 'triangle';
type ObjId = 'browser' | 'portrait' | 'controls' | Tech | ShapeKind;

const TECHS: { id: Tech; label: string; effect: string }[] = [
  { id: 'css', label: 'CSS', effect: 'styles the page' },
  { id: 'react', label: 'React', effect: 'marks components' },
  { id: 'ts', label: 'TypeScript', effect: 'adds types' },
  { id: 'node', label: 'Node.js', effect: 'connects a server' },
];
const SHAPES: ShapeKind[] = ['circle', 'square', 'triangle'];
const OBJS: ObjId[] = ['browser', 'portrait', 'controls', 'css', 'react', 'ts', 'node', 'circle', 'square', 'triangle'];

// Starting positions, in % of the workspace.
const WIDE: Record<ObjId, [number, number]> = {
  browser: [30, 7],
  portrait: [3, 6],
  controls: [66, 72],
  css: [5, 56],
  react: [17, 44],
  ts: [83, 9],
  node: [84, 48],
  circle: [6, 77],
  square: [19, 72],
  triangle: [50, 80],
};
const NARROW: Record<ObjId, [number, number]> = {
  browser: [4, 4],
  portrait: [79, 68],
  controls: [4, 86],
  css: [4, 62],
  react: [30, 62],
  ts: [58, 62],
  node: [4, 73],
  circle: [34, 74],
  square: [48, 74],
  triangle: [62, 74],
};

let zTop = 10;

export function Playground() {
  const fine = useMediaQuery(FINE_POINTER);
  const reduced = useMediaQuery(REDUCED_MOTION);
  const wide = useMediaQuery('(min-width: 1024px)');
  const canDrag = fine && wide;
  const layout = wide ? WIDE : NARROW;

  const stageRef = useRef<HTMLDivElement>(null);
  const refs = useRef<Partial<Record<ObjId, HTMLElement | null>>>({});
  const paths = useRef<Partial<Record<Tech | 'shape', SVGPathElement | null>>>({});
  const [mv] = useState(
    () =>
      Object.fromEntries(OBJS.map((id) => [id, { x: motionValue(0), y: motionValue(0) }])) as Record<
        ObjId,
        { x: MotionValue<number>; y: MotionValue<number> }
      >,
  );

  const [tech, setTech] = useState<Set<Tech>>(() => new Set<Tech>(['css', 'react']));
  const [shape, setShape] = useState<ShapeKind>('circle');
  const [warm, setWarm] = useState(true);
  const [blocks, setBlocks] = useState(3);
  const [moved, setMoved] = useState(false);

  const toggleTech = (t: Tech) =>
    setTech((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });

  /* ── Connection lines: recomputed only when something moves or changes ── */
  const raf = useRef(0);
  const drawLines = useCallback(() => {
    raf.current = 0;
    const stage = stageRef.current;
    const b = refs.current.browser;
    if (!stage || !b) return;
    const s = stage.getBoundingClientRect();
    const br = b.getBoundingClientRect();
    const box = { l: br.left - s.left, t: br.top - s.top, r: br.right - s.left, b: br.bottom - s.top };

    const rects = new Map<HTMLElement, DOMRect>();
    const all: (HTMLElement | null | undefined)[] = [...TECHS.map((t) => refs.current[t.id]), refs.current[shape]];
    all.forEach((el) => el && rects.set(el, el.getBoundingClientRect()));
    const connect = (el: HTMLElement | null | undefined, p: SVGPathElement | null | undefined) => {
      if (!el || !p) return;
      const r = rects.get(el)!;
      const cx = r.left - s.left + r.width / 2;
      const cy = r.top - s.top + r.height / 2;
      // Attach to the side of the browser that faces the object.
      let tx: number;
      let ty: number;
      if (cx < box.l || cx > box.r) {
        tx = cx < box.l ? box.l : box.r;
        ty = Math.min(box.b - 16, Math.max(box.t + 16, cy));
        const mid = (cx + tx) / 2;
        p.setAttribute('d', `M${cx},${cy} C${mid},${cy} ${mid},${ty} ${tx},${ty}`);
      } else {
        tx = Math.min(box.r - 16, Math.max(box.l + 16, cx));
        ty = cy < box.t ? box.t : box.b;
        const mid = (cy + ty) / 2;
        p.setAttribute('d', `M${cx},${cy} C${cx},${mid} ${tx},${mid} ${tx},${ty}`);
      }
    };
    TECHS.forEach((t) => connect(refs.current[t.id], paths.current[t.id]));
    connect(refs.current[shape], paths.current.shape);
  }, [shape]);

  const schedule = useCallback(() => {
    if (!raf.current) raf.current = requestAnimationFrame(drawLines);
  }, [drawLines]);

  useEffect(() => {
    const unsubs = OBJS.flatMap((id) => [mv[id].x.on('change', schedule), mv[id].y.on('change', schedule)]);
    const ro = new ResizeObserver(schedule);
    if (stageRef.current) ro.observe(stageRef.current);
    if (refs.current.browser) ro.observe(refs.current.browser);
    schedule();
    return () => {
      unsubs.forEach((u) => u());
      ro.disconnect();
      cancelAnimationFrame(raf.current);
      raf.current = 0;
    };
  }, [mv, schedule]);

  useEffect(schedule, [tech, shape, wide, schedule]);

  /* ── Background dots brighten around the pointer ── */
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !fine || reduced) return;
    let f = 0;
    let x = 0;
    let y = 0;
    let r = stage.getBoundingClientRect();
    const onMove = (e: PointerEvent) => {
      r = stage.getBoundingClientRect();
      x = e.clientX - r.left;
      y = e.clientY - r.top;
      if (!f)
        f = requestAnimationFrame(() => {
          f = 0;
          stage.style.setProperty('--dx', `${x}px`);
          stage.style.setProperty('--dy', `${y}px`);
          stage.style.setProperty('--dx-n', (x / r.width - 0.5).toFixed(3));
          stage.style.setProperty('--dy-n', (y / r.height - 0.5).toFixed(3));
        });
    };
    stage.addEventListener('pointermove', onMove);
    return () => {
      stage.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(f);
    };
  }, [fine, reduced]);

  const reset = () => {
    OBJS.forEach((id) => {
      animate(mv[id].x, 0, { type: 'spring', stiffness: 260, damping: 26 });
      animate(mv[id].y, 0, { type: 'spring', stiffness: 260, damping: 26 });
    });
    setMoved(false);
  };

  const common = { stageRef, canDrag, mv, refs, layout, onMoved: () => setMoved(true) };

  return (
    <div className="pg">
      <div className="pg-head">
        <p className="label">Playground</p>
        <p className="pg-hint">
          {canDrag
            ? 'Drag anything. Click a label to add it to the build, or pick a shape.'
            : 'Tap a label to add it to the build, or pick a shape.'}
        </p>
        <button type="button" className="pg-reset" onClick={reset} disabled={!moved}>
          Reset layout
        </button>
      </div>

      <div ref={stageRef} className={`pg-stage${canDrag ? ' can-drag' : ''}`}>
        <div className="pg-dots" aria-hidden="true" />
        <div className="pg-dots pg-dots-hot" aria-hidden="true" />

        <svg className="pg-lines" aria-hidden="true">
          {TECHS.map((t) => (
            <path
              key={t.id}
              ref={(el) => {
                paths.current[t.id] = el;
              }}
              className={`pg-line${tech.has(t.id) ? ' is-on' : ''}`}
            />
          ))}
          <path
            ref={(el) => {
              paths.current.shape = el;
            }}
            className="pg-line is-shape"
          />
        </svg>

        <Obj id="browser" {...common} className="pg-browser" label="Mini browser" cursor="DRAG">
          <MiniSite tech={tech} shape={shape} warm={warm} blocks={blocks} />
        </Obj>

        <Obj id="portrait" {...common} className="pg-portrait" label="Portrait of Huseyn" cursor="DRAG">
          <img src={`${import.meta.env.BASE_URL}huseyn.jpg`} alt="" width={359} height={480} draggable={false} />
          <span className="pg-portrait-tag">Huseyn, Baku</span>
        </Obj>

        {TECHS.map((t) => (
          <Obj
            key={t.id}
            id={t.id}
            {...common}
            as="button"
            className={`pg-chip${tech.has(t.id) ? ' is-on' : ''}`}
            label={`${t.label}: ${t.effect}`}
            pressed={tech.has(t.id)}
            cursor={tech.has(t.id) ? 'REMOVE' : 'ADD'}
            onActivate={() => toggleTech(t.id)}
          >
            <span className="pg-chip-dot" aria-hidden="true" />
            {t.label}
          </Obj>
        ))}

        {SHAPES.map((k) => (
          <Obj
            key={k}
            id={k}
            {...common}
            as="button"
            className={`pg-shape pg-shape-${k}${shape === k ? ' is-on' : ''}`}
            label={`Use the ${k} in the build`}
            pressed={shape === k}
            cursor="PICK"
            onActivate={() => setShape(k)}
          >
            <Shape kind={k} />
          </Obj>
        ))}

        <Controls
          {...common}
          warm={warm}
          setWarm={setWarm}
          blocks={blocks}
          setBlocks={setBlocks}
        />
      </div>
    </div>
  );
}

/* ── A draggable object: pointer drag on desktop, arrow keys everywhere ── */

type Common = {
  stageRef: RefObject<HTMLDivElement | null>;
  canDrag: boolean;
  mv: Record<ObjId, { x: MotionValue<number>; y: MotionValue<number> }>;
  refs: RefObject<Partial<Record<ObjId, HTMLElement | null>>>;
  layout: Record<ObjId, [number, number]>;
  onMoved: () => void;
};

function useMover(id: ObjId, { stageRef, mv, refs, onMoved }: Common) {
  const dragged = useRef(false);

  const nudge = (e: RKeyboardEvent) => {
    const dir: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    };
    const d = dir[e.key];
    const el = refs.current?.[id];
    const stage = stageRef.current;
    if (!d || !el || !stage) return;
    e.preventDefault();
    const step = e.shiftKey ? 48 : 16;
    const s = stage.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const dx = Math.max(s.left - r.left, Math.min(s.right - r.right, d[0] * step));
    const dy = Math.max(s.top - r.top, Math.min(s.bottom - r.bottom, d[1] * step));
    mv[id].x.set(mv[id].x.get() + dx);
    mv[id].y.set(mv[id].y.get() + dy);
    onMoved();
  };

  const dragProps = (controls?: DragControls) => ({
    drag: true as const,
    dragControls: controls,
    dragListener: !controls,
    dragConstraints: stageRef,
    dragElastic: 0.08,
    dragMomentum: false,
    onDragStart: () => {
      dragged.current = true;
      const el = refs.current?.[id];
      if (el) el.style.zIndex = String(++zTop);
      onMoved();
    },
    onDragEnd: () => {
      // The click that ends a drag should not also toggle the object.
      window.setTimeout(() => (dragged.current = false), 0);
    },
    whileDrag: { scale: 1.05, boxShadow: '6px 6px 0 #263b43' },
  });

  return { dragged, nudge, dragProps };
}

function Obj({
  id,
  as = 'div',
  className,
  label,
  cursor,
  pressed,
  onActivate,
  children,
  ...common
}: Common & {
  id: ObjId;
  as?: 'div' | 'button';
  className: string;
  label: string;
  cursor: string;
  pressed?: boolean;
  onActivate?: () => void;
  children: ReactNode;
}) {
  const { canDrag, mv, refs, layout } = common;
  const { dragged, nudge, dragProps } = useMover(id, common);
  const [l, t] = layout[id];

  const shared = {
    ref: (el: HTMLElement | null) => {
      refs.current![id] = el;
    },
    className: `pg-obj ${className}`,
    style: { left: `${l}%`, top: `${t}%`, x: mv[id].x, y: mv[id].y },
    'data-cursor': canDrag ? cursor : undefined,
    onKeyDown: nudge,
    ...(canDrag ? dragProps() : {}),
  };

  if (as === 'button') {
    return (
      <motion.button
        type="button"
        {...shared}
        aria-pressed={pressed}
        aria-label={label}
        aria-describedby="pg-keys"
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          if (!dragged.current) onActivate?.();
        }}
      >
        {children}
      </motion.button>
    );
  }
  return (
    <motion.div {...shared} tabIndex={0} role="group" aria-label={label} aria-describedby="pg-keys">
      {children}
    </motion.div>
  );
}

function Controls({
  warm,
  setWarm,
  blocks,
  setBlocks,
  ...common
}: Common & {
  warm: boolean;
  setWarm: (v: boolean) => void;
  blocks: number;
  setBlocks: (v: number) => void;
}) {
  const { canDrag, mv, refs, layout } = common;
  const controls = useDragControls();
  const { nudge, dragProps } = useMover('controls', common);
  const [l, t] = layout.controls;

  return (
    <motion.div
      ref={(el) => {
        refs.current!.controls = el;
      }}
      className="pg-obj pg-controls"
      style={{ left: `${l}%`, top: `${t}%`, x: mv.controls.x, y: mv.controls.y }}
      {...(canDrag ? dragProps(controls) : {})}
      role="group"
      aria-label="Build controls"
    >
      <button
        type="button"
        className="pg-grip"
        aria-label="Move the controls. Use arrow keys."
        data-cursor={canDrag ? 'MOVE' : undefined}
        onPointerDown={(e) => canDrag && controls.start(e)}
        onKeyDown={nudge}
      >
        <span aria-hidden="true" />
      </button>
      <label className="pg-switch">
        <input type="checkbox" role="switch" checked={warm} onChange={(e) => setWarm(e.target.checked)} />
        <span className="pg-switch-track" aria-hidden="true">
          <span />
        </span>
        Warm palette
      </label>
      <label className="pg-range">
        <span>
          Blocks <b>{blocks}</b>
        </span>
        <input type="range" min={1} max={6} step={1} value={blocks} onChange={(e) => setBlocks(+e.target.value)} />
      </label>
      <span id="pg-keys" className="sr-only">
        Arrow keys move this object. Hold Shift to move further.
      </span>
    </motion.div>
  );
}

/* ── Shapes, shared by the workspace and the mini site ── */

export function Shape({ kind }: { kind: ShapeKind }) {
  return (
    <svg viewBox="0 0 40 40" className="shape" aria-hidden="true">
      {kind === 'circle' && <circle cx="20" cy="20" r="18" />}
      {kind === 'square' && <rect x="3" y="3" width="34" height="34" rx="3" />}
      {kind === 'triangle' && <path d="M20 3 L37 36 L3 36 Z" />}
    </svg>
  );
}

/* ── The mini site inside the browser: assembled from the workspace state ── */

function MiniSite({
  tech,
  shape,
  warm,
  blocks,
}: {
  tech: Set<Tech>;
  shape: ShapeKind;
  warm: boolean;
  blocks: number;
}) {
  const css = tech.has('css');
  const react = tech.has('react');
  const ts = tech.has('ts');
  const node = tech.has('node');
  const spring = { type: 'spring', stiffness: 380, damping: 30 } as const;

  return (
    <div className="mini-frame">
      <div className="mini-bar">
        <span className="mini-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className="mini-url">localhost:5173</span>
      </div>
      <div className={`mini${css ? ' is-styled' : ' is-raw'}${warm ? ' is-warm' : ' is-cool'}`}>
        <div className="mini-nav">
          <span className={`mini-logo mini-logo-${shape}`}>
            <Shape kind={shape} />
          </span>
          <span className="mini-txt w30" />
          <span className="mini-txt w14 push" />
          <span className="mini-txt w14" />
          <Tag show={react} text="<Nav />" />
        </div>
        <div className="mini-hero">
          <div className="mini-copy">
            <span className="mini-txt big w90" />
            <span className="mini-txt big w60" />
            <AnimatePresence>
              {ts && (
                <motion.span
                  className="mini-type"
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                >
                  title: string
                </motion.span>
              )}
            </AnimatePresence>
            <span className="mini-btn" />
          </div>
          <motion.span key={shape} className="mini-art" initial={{ scale: 0.6, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={spring}>
            <Shape kind={shape} />
          </motion.span>
          <Tag show={react} text="<Hero />" />
        </div>
        <motion.div className="mini-cards" layout transition={spring}>
          <AnimatePresence initial={false}>
            {Array.from({ length: blocks }, (_, i) => (
              <motion.div
                key={i}
                className="mini-card"
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={spring}
              >
                <span className="mini-txt w60" />
                <span className="mini-txt w40" />
                {react && i === 0 && <span className="mini-tag in-card">{'<Card />'}</span>}
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
        <AnimatePresence>
          {node && (
            <motion.div
              className="mini-status"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <span className="mini-pulse" aria-hidden="true" />
              GET /api 200
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Tag({ show, text }: { show: boolean; text: string }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.span
          className="mini-tag"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
        >
          {text}
        </motion.span>
      )}
    </AnimatePresence>
  );
}
