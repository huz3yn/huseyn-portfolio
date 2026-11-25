import { useEffect, useRef, useState } from 'react';
import { FINE_POINTER, REDUCED_MOTION, useMediaQuery } from '../hooks/useMediaQuery';
import './Cursor.css';

type Mode = 'idle' | 'link' | 'label';

/**
 * Dot that tracks the pointer exactly, ring that follows with lag.
 * Elements opt into a labelled state with data-cursor="VIEW".
 * Off on touch devices and under reduced motion.
 */
export function Cursor() {
  const fine = useMediaQuery(FINE_POINTER);
  const reduced = useMediaQuery(REDUCED_MOTION);
  const enabled = fine && !reduced;
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>('idle');
  const [label, setLabel] = useState('');

  useEffect(() => {
    if (!enabled) return;
    const root = document.documentElement;
    root.classList.add('has-cursor');

    let x = -100;
    let y = -100;
    let rx = x;
    let ry = y;
    let raf = 0;
    let shown = false;
    let lastKey = '';

    const show = (v: boolean) => {
      if (shown === v) return;
      shown = v;
      dotRef.current?.setAttribute('data-shown', v ? '1' : '0');
      ringRef.current?.setAttribute('data-shown', v ? '1' : '0');
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      x = e.clientX;
      y = e.clientY;
      if (!shown) {
        rx = x;
        ry = y;
      }
      show(true);
    };

    const onOver = (e: PointerEvent) => {
      const t = e.target as Element | null;
      const labelled = t?.closest<HTMLElement>('[data-cursor]');
      const interactive = t?.closest('a, button, [role="button"], label');
      const key = labelled ? `label:${labelled.dataset.cursor}` : interactive ? 'link' : 'idle';
      if (key === lastKey) return;
      lastKey = key;
      if (labelled) {
        setMode('label');
        setLabel(labelled.dataset.cursor ?? '');
      } else {
        setMode(interactive ? 'link' : 'idle');
      }
    };

    const onDown = () => ringRef.current?.classList.add('is-pressed');
    const onUp = () => ringRef.current?.classList.remove('is-pressed');
    const onLeave = () => show(false);

    const loop = () => {
      rx += (x - rx) * 0.2;
      ry += (y - ry) * 0.2;
      if (dotRef.current) dotRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      if (ringRef.current) ringRef.current.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerover', onOver, { passive: true });
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    root.addEventListener('pointerleave', onLeave);

    return () => {
      cancelAnimationFrame(raf);
      root.classList.remove('has-cursor');
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerover', onOver);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      root.removeEventListener('pointerleave', onLeave);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      <div ref={ringRef} className={`cursor-ring mode-${mode}`} aria-hidden="true">
        <div className="cursor-ring-inner">
          <span className="cursor-label">{label}</span>
        </div>
      </div>
      <div ref={dotRef} className={`cursor-dot mode-${mode}`} aria-hidden="true" />
    </>
  );
}
