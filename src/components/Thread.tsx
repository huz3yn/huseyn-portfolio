import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useMode } from '../context/Mode';
import './Thread.css';

type Node = { x: number; y: number; lx: number };
type Geo = { d: string; h: number; nodes: Node[] };

/**
 * One orange line that runs the length of the page.
 * It starts at the dot beside "Front-end developer" in the hero, travels down the left margin,
 * and lights each chapter label as the reader reaches it. Drawn by scroll position only.
 */
export function Thread() {
  const { mode } = useMode();
  const [geo, setGeo] = useState<Geo | null>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const tipRef = useRef<SVGGElement>(null);
  const lut = useRef<{ ys: number[]; ls: number[]; total: number } | null>(null);
  const anchors = useRef<HTMLElement[]>([]);

  // Measure anchors and build the route.
  useEffect(() => {
    const main = document.getElementById('main');
    if (!main) return;
    let raf = 0;
    const measure = () => {
      raf = 0;
      const mr = main.getBoundingClientRect();
      const els = Array.from(main.querySelectorAll<HTMLElement>('[data-thread]'));
      anchors.current = els;
      const pts = els.map((el) => {
        const r = el.getBoundingClientRect();
        return { x: r.left - mr.left, y: r.top - mr.top + r.height / 2, w: r.width };
      });
      if (pts.length < 2) return setGeo(null);
      const gx = Math.min(...pts.slice(1).map((p) => p.x)) - 22;
      if (gx < 10) return setGeo(null); // no margin to run in on small screens

      const first = pts[0];
      const start = { x: first.x + first.w / 2, y: first.y };
      let d = `M${start.x},${start.y} C${start.x},${start.y + 90} ${gx},${start.y + 40} ${gx},${start.y + 160}`;
      let y = start.y + 160;
      const nodes: Node[] = [];
      pts.slice(1).forEach((p, i) => {
        const dy = p.y - y;
        const s = i % 2 ? 14 : -14;
        d += ` C${gx + s},${y + dy * 0.35} ${gx - s},${y + dy * 0.65} ${gx},${p.y}`;
        y = p.y;
        nodes.push({ x: gx, y: p.y, lx: p.x - 6 });
      });
      setGeo({ d, h: mr.height, nodes });
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    const ro = new ResizeObserver(schedule);
    ro.observe(main);
    window.addEventListener('resize', schedule);
    document.fonts?.ready.then(schedule);
    schedule();
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', schedule);
      cancelAnimationFrame(raf);
    };
  }, [mode]);

  // Build a y → length lookup once the path exists.
  useLayoutEffect(() => {
    const p = pathRef.current;
    if (!p || !geo) return;
    const total = p.getTotalLength();
    const ys: number[] = [];
    const ls: number[] = [];
    let maxY = -Infinity;
    for (let l = 0; l <= total; l += 6) {
      const pt = p.getPointAtLength(l);
      if (pt.y > maxY) {
        maxY = pt.y;
        ys.push(pt.y);
        ls.push(l);
      }
    }
    lut.current = { ys, ls, total };
    p.style.strokeDasharray = `${total}`;
  }, [geo]);

  // Draw by scroll.
  useEffect(() => {
    if (!geo) return;
    const main = document.getElementById('main');
    let raf = 0;
    const update = () => {
      raf = 0;
      const t = lut.current;
      const p = pathRef.current;
      if (!t || !p || !main) return;
      const tipY = window.scrollY + window.innerHeight * 0.6 - (main.getBoundingClientRect().top + window.scrollY);
      // binary search the lookup table
      let lo = 0;
      let hi = t.ys.length - 1;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (t.ys[mid] < tipY) lo = mid + 1;
        else hi = mid;
      }
      const len = tipY <= t.ys[0] ? 0 : t.ls[lo];
      p.style.strokeDashoffset = `${t.total - len}`;
      const pt = p.getPointAtLength(len);
      tipRef.current?.setAttribute('transform', `translate(${pt.x} ${pt.y})`);
      geo.nodes.forEach((n, i) => {
        const reached = n.y <= tipY;
        anchors.current[i + 1]?.classList.toggle('is-reached', reached);
        document.getElementById(`thread-node-${i}`)?.classList.toggle('is-reached', reached);
      });
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [geo]);

  if (!geo) return null;
  return (
    <svg className="thread" width="100%" height={geo.h} aria-hidden="true">
      <path d={geo.d} className="thread-base" />
      <path ref={pathRef} d={geo.d} className="thread-line" />
      {geo.nodes.map((n, i) => (
        <g key={i} id={`thread-node-${i}`} className="thread-node">
          <line x1={n.x} y1={n.y} x2={n.lx} y2={n.y} />
          <circle cx={n.x} cy={n.y} r={5} />
        </g>
      ))}
      <g ref={tipRef} className="thread-tip">
        <circle r={7} />
        <circle r={14} className="thread-halo" />
      </g>
    </svg>
  );
}
