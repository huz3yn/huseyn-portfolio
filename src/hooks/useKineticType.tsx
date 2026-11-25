import { useEffect, type RefObject } from 'react';

type Opts = {
  enabled: boolean;
  base?: number; // resting width (font-stretch %)
  max?: number; // width right under the pointer
  radius?: number; // px of proximity influence
  pull?: number; // 0..1: letters lean toward the pointer
  delay?: number; // wait for an entrance animation before taking over
  pluck?: boolean; // letters can be grabbed, stretched and released like a string
  onPluck?: () => void;
};

// How much a plucked letter drags its neighbours along: itself, ±1, ±2, ±3.
const STRING = [1, 0.42, 0.16, 0.05];

/**
 * Kinetic letters for every `.kt` span inside `ref`.
 * - Proximity: letters widen along Archivo's width axis as the pointer nears.
 * - Pluck: grab a letter and pull. It stretches, drags its neighbours like a string,
 *   and on release the whole word settles with a damped spring.
 * One requestAnimationFrame loop, running only while something moves.
 */
export function useKineticType(ref: RefObject<HTMLElement | null>, opts: Opts) {
  const { enabled, base = 74, max = 125, radius = 260, pull = 0, delay = 0, pluck = false, onPluck } = opts;

  useEffect(() => {
    const root = ref.current;
    if (!enabled || !root) return;
    const ls = Array.from(root.querySelectorAll<HTMLElement>('.kt'));
    if (!ls.length) return;
    const n = ls.length;

    // Per-letter state
    const w = new Float32Array(n).fill(base);
    const tx = new Float32Array(n); // proximity lean
    const ty = new Float32Array(n);
    const ox = new Float32Array(n); // pluck offset
    const oy = new Float32Array(n);
    const vx = new Float32Array(n);
    const vy = new Float32Array(n);
    let centers: { x: number; y: number }[] = [];
    let mx = -1e5;
    let my = -1e5;
    let raf = 0;
    let last = 0;
    let armed = false;

    // Pluck state
    let held = -1;
    let sx = 0;
    let sy = 0;
    let dx = 0;
    let dy = 0;
    let pointerId = -1;

    const measure = () => {
      ls.forEach((l) => {
        l.style.fontStretch = `${base}%`;
        l.style.transform = '';
      });
      w.fill(base);
      centers = ls.map((l) => {
        const r = l.getBoundingClientRect();
        return { x: r.left + r.width / 2 + window.scrollX, y: r.top + r.height / 2 + window.scrollY };
      });
    };

    const rubber = (d: number, limit: number) => (d * limit) / (Math.abs(d) + limit);

    const tick = (t: number) => {
      raf = 0;
      if (!armed) return;
      const dt = Math.min(0.033, last ? (t - last) / 1000 : 0.016);
      last = t;
      let moving = false;

      for (let i = 0; i < n; i++) {
        // proximity
        const c = centers[i];
        const ddx = mx - c.x;
        const ddy = my - c.y;
        const f = Math.max(0, 1 - Math.hypot(ddx, ddy * 1.4) / radius);
        const e = held >= 0 ? 0 : f * f * (3 - 2 * f);

        // pluck: follow the hand while held, spring home after release
        if (held >= 0) {
          const k = STRING[Math.abs(i - held)] ?? 0;
          const gx = rubber(dx, 140) * k;
          const gy = rubber(dy, 90) * k;
          vx[i] = (gx - ox[i]) / Math.max(dt, 0.001) * 0.3;
          vy[i] = (gy - oy[i]) / Math.max(dt, 0.001) * 0.3;
          ox[i] += (gx - ox[i]) * 0.35;
          oy[i] += (gy - oy[i]) * 0.35;
        } else {
          const ax = -260 * ox[i] - 11 * vx[i];
          const ay = -260 * oy[i] - 11 * vy[i];
          vx[i] += ax * dt;
          vy[i] += ay * dt;
          ox[i] += vx[i] * dt;
          oy[i] += vy[i] * dt;
        }
        const stretch = Math.min(max - base, Math.abs(ox[i]) * 0.45 + Math.abs(oy[i]) * 0.15);

        const target = base + (max - base) * e + stretch;
        const nw = w[i] + (Math.min(max, target) - w[i]) * (held >= 0 ? 0.4 : 0.18);
        const nx = tx[i] + (ddx * e * pull - tx[i]) * 0.16;
        const ny = ty[i] + (ddy * e * pull - ty[i]) * 0.16;

        const active =
          Math.abs(nw - w[i]) > 0.04 ||
          Math.abs(nx - tx[i]) > 0.04 ||
          Math.abs(ny - ty[i]) > 0.04 ||
          Math.abs(ox[i]) > 0.05 ||
          Math.abs(oy[i]) > 0.05 ||
          Math.abs(vx[i]) > 0.5 ||
          Math.abs(vy[i]) > 0.5;

        if (active) {
          moving = true;
          w[i] = nw;
          tx[i] = nx;
          ty[i] = ny;
          ls[i].style.fontStretch = `${nw.toFixed(1)}%`;
          const X = tx[i] + ox[i];
          const Y = ty[i] + oy[i];
          // a slight shear in the direction of travel sells the elasticity
          const skew = Math.max(-14, Math.min(14, -vx[i] * 0.012));
          ls[i].style.transform = `translate(${X.toFixed(1)}px, ${Y.toFixed(1)}px) skewX(${skew.toFixed(1)}deg)`;
        } else if (ox[i] || oy[i]) {
          ox[i] = oy[i] = vx[i] = vy[i] = 0;
        }
      }
      if (moving || held >= 0) raf = requestAnimationFrame(tick);
      else last = 0;
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent) => {
      mx = e.clientX + window.scrollX;
      my = e.clientY + window.scrollY;
      if (held >= 0 && e.pointerId === pointerId) {
        dx = e.clientX - sx;
        dy = e.clientY - sy;
      }
      kick();
    };
    const onDown = (e: PointerEvent) => {
      if (!armed || e.button > 0) return;
      const i = ls.indexOf(e.target as HTMLElement);
      if (i < 0) return;
      held = i;
      pointerId = e.pointerId;
      sx = e.clientX;
      sy = e.clientY;
      dx = dy = 0;
      root.classList.add('is-plucking');
      ls[i].classList.add('is-held');
      kick();
    };
    const release = (e: PointerEvent) => {
      if (held < 0 || e.pointerId !== pointerId) return;
      const moved = Math.hypot(dx, dy);
      // A tap without a drag still plucks: a small sideways flick.
      if (moved < 4) {
        const dir = Math.random() > 0.5 ? 1 : -1;
        for (let j = 0; j < n; j++) vx[j] += dir * 1100 * (STRING[Math.abs(j - held)] ?? 0);
      }
      ls[held].classList.remove('is-held');
      root.classList.remove('is-plucking');
      held = -1;
      onPluck?.();
      kick();
    };
    const onResize = () => {
      if (armed) measure();
    };

    let alive = true;
    const timer = window.setTimeout(() => {
      (document.fonts?.ready ?? Promise.resolve()).then(() => {
        if (!alive) return;
        measure();
        armed = true;
      });
    }, delay);

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);
    window.addEventListener('resize', onResize);
    if (pluck) root.addEventListener('pointerdown', onDown);

    return () => {
      alive = false;
      window.clearTimeout(timer);
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', release);
      window.removeEventListener('resize', onResize);
      root.removeEventListener('pointerdown', onDown);
      root.classList.remove('is-plucking');
      ls.forEach((l) => {
        l.style.fontStretch = '';
        l.style.transform = '';
        l.classList.remove('is-held');
      });
    };
  }, [ref, enabled, base, max, radius, pull, delay, pluck, onPluck]);
}

/** Splits text into `.kt` spans for useKineticType. Spaces stay real spaces. */
export function splitLetters(text: string, offset = 0) {
  return text.split('').map((ch, i) =>
    ch === ' ' ? (
      ' '
    ) : (
      <span key={i} className="kt" style={{ ['--i' as string]: i + offset }}>
        {ch}
      </span>
    ),
  );
}
