import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { person } from '../data/cv';
import { useMode } from '../context/Mode';
import { useToast } from '../context/Toast';
import { useBakuTime } from '../hooks/useBakuTime';
import { FINE_POINTER, REDUCED_MOTION, useMediaQuery } from '../hooks/useMediaQuery';
import { splitLetters, useKineticType } from '../hooks/useKineticType';
import { Magnetic } from './Magnetic';
import './Contact.css';

const LINES = ['LET’S CREATE', 'SOMETHING', 'INTERESTING.'];

export function Contact() {
  const { mode } = useMode();
  const fine = useMediaQuery(FINE_POINTER);
  const reduced = useMediaQuery(REDUCED_MOTION);
  const toast = useToast();
  const time = useBakuTime();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [copied, setCopied] = useState(false);
  const explore = mode === 'explore';

  // Magnetic typography: letters widen and lean toward the pointer.
  useKineticType(titleRef, { enabled: explore && fine && !reduced, base: 76, max: 118, radius: 200, pull: 0.12 });

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(person.email);
      setCopied(true);
      toast('Email address copied');
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      toast('Copy was blocked. Use “Open mail app” instead.');
    }
  };

  let offset = 0;

  return (
    <section id="contact" className="section contact" aria-labelledby="contact-title">
      <div className="wrap">
        <header className="chapter contact-chapter">
          <p className="label chapter-idx" data-thread>
            <b>06</b> / Contact
          </p>
        </header>

        <div className="contact-grid">
          <h2 id="contact-title" ref={titleRef} className="contact-title" aria-label="Let’s create something interesting.">
            {LINES.map((l, i) => {
              const start = offset;
              offset += l.length;
              return (
                <span key={l} className={`contact-line line-${i}`} aria-hidden="true">
                  {explore ? splitLetters(l, start) : l}
                </span>
              );
            })}
          </h2>

          {explore && <Needles />}

          <div className="contact-panel">
            <div className="contact-mail">
              <p className="label">Email</p>
              <Magnetic strength={0.15}>
                <button type="button" className="contact-copy" onClick={copy} data-cursor="COPY">
                  <span className="contact-copy-addr">{person.email}</span>
                  <span className="contact-copy-hint">{copied ? 'Copied to clipboard' : 'Click to copy'}</span>
                </button>
              </Magnetic>
              <a href={`mailto:${person.email}`} className="btn btn-orange">
                Open mail app <span className="btn-arrow" aria-hidden="true">↗</span>
              </a>
            </div>

            <dl className="contact-facts">
              <div>
                <dt className="label">Phone</dt>
                <dd>
                  <a className="u-link contact-tel" href={`tel:${person.phone.replace(/\s/g, '')}`}>
                    {person.phone}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="label">Location</dt>
                <dd>
                  {person.city}, {person.country}
                </dd>
              </div>
              <div>
                <dt className="label">Local time</dt>
                <dd>
                  <time>{time}</time> <span className="muted">in Baku</span>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}

/* A field of short strokes that all turn to face the pointer. */
const COLS = 11;
const ROWS = 7;
function Needles() {
  const ref = useRef<SVGSVGElement>(null);
  const fine = useMediaQuery(FINE_POINTER);
  const reduced = useMediaQuery(REDUCED_MOTION);

  useEffect(() => {
    const svg = ref.current;
    if (!svg || !fine || reduced) return;
    const lines = Array.from(svg.querySelectorAll<SVGGElement>('g[data-n]'));
    let raf = 0;
    let px = 0;
    let py = 0;
    const apply = () => {
      raf = 0;
      const r = svg.getBoundingClientRect();
      const sx = r.width / (COLS * 40);
      const sy = r.height / (ROWS * 40);
      for (const g of lines) {
        const cx = r.left + (+g.dataset.x! * sx);
        const cy = r.top + (+g.dataset.y! * sy);
        const a = (Math.atan2(py - cy, px - cx) * 180) / Math.PI;
        const d = Math.hypot(px - cx, py - cy);
        g.style.transform = `rotate(${a.toFixed(1)}deg)`;
        g.classList.toggle('is-near', d < 140);
      }
    };
    const onMove = (e: PointerEvent) => {
      px = e.clientX;
      py = e.clientY;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(raf);
    };
  }, [fine, reduced]);

  return (
    <motion.svg
      ref={ref}
      viewBox={`0 0 ${COLS * 40} ${ROWS * 40}`}
      className="needles"
      aria-hidden="true"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
    >
      {Array.from({ length: COLS * ROWS }, (_, n) => {
        const x = (n % COLS) * 40 + 20;
        const y = Math.floor(n / COLS) * 40 + 20;
        return (
          <g key={n} data-n={n} data-x={x} data-y={y} style={{ transformOrigin: `${x}px ${y}px`, transform: 'rotate(-35deg)' }}>
            <line x1={x - 11} y1={y} x2={x + 11} y2={y} />
            <circle cx={x + 11} cy={y} r={2.6} />
          </g>
        );
      })}
    </motion.svg>
  );
}
