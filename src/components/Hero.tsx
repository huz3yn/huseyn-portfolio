import { useCallback, useEffect, useRef, useState } from 'react';
import { person } from '../data/cv';
import { useMode } from '../context/Mode';
import { FINE_POINTER, REDUCED_MOTION, useMediaQuery } from '../hooks/useMediaQuery';
import { splitLetters, useKineticType } from '../hooks/useKineticType';
import { Playground } from './Playground';
import './Hero.css';

export function Hero() {
  const { mode, setMode } = useMode();
  const fine = useMediaQuery(FINE_POINTER);
  const reduced = useMediaQuery(REDUCED_MOTION);
  const nameRef = useRef<HTMLHeadingElement>(null);
  const explore = mode === 'explore';

  const [plucked, setPlucked] = useState(false);
  // The entrance masks the letters; once settled, plucked letters may leave their line.
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setSettled(true), 1500);
    return () => window.clearTimeout(t);
  }, []);
  const onPluck = useCallback(() => setPlucked(true), []);

  // Signature interaction: the name is a string. Hover widens letters; grab one and pull.
  useKineticType(nameRef, {
    enabled: explore && !reduced,
    base: 74,
    max: 125,
    radius: fine ? 240 : 0,
    delay: 1400,
    pluck: true,
    onPluck,
  });

  return (
    <section id="intro" className={`hero hero-${mode}${settled ? ' is-settled' : ''}`} aria-labelledby="hero-title">
      <div className="wrap hero-grid">
        <h1 id="hero-title" ref={nameRef} className="hero-name" translate="no" aria-label={`${person.name}, ${person.role}`}>
          <span className="hero-first" aria-hidden="true" data-cursor={explore ? 'PULL' : undefined}>
            {splitLetters(person.first)}
          </span>
          <span className="hero-last" aria-hidden="true" data-cursor={explore ? 'PULL' : undefined}>
            {splitLetters(person.last, person.first.length)}
          </span>
        </h1>

        {explore && !reduced && (
          <p className={`hero-hint${plucked ? ' is-done' : ''}`} aria-hidden="true">
            <svg viewBox="0 0 60 24" className="hero-hint-arrow">
              <path d="M58 20 C 40 22, 22 18, 6 6" />
              <path d="M6 6 L 14 7 M6 6 L 8 14" />
            </svg>
            {fine ? 'Grab a letter and pull' : 'Tap or swipe a letter'}
          </p>
        )}

        <div className="hero-side">
          <p className="hero-role">
            <span className="hero-role-mark" aria-hidden="true" data-thread />
            Front-end developer
          </p>
          <p className="hero-statement">
            I build web interfaces with React and TypeScript, from semantic HTML down to the API
            behind them. Based in {person.city}, {person.country}.
          </p>
          {!explore && (
            <dl className="hero-facts">
              <div>
                <dt className="label">Studying</dt>
                <dd>Information System Security, Azerbaijan State Oil and Industry University</dd>
              </div>
              <div>
                <dt className="label">Stack</dt>
                <dd>JavaScript, TypeScript, React.js, React Native, Node.js, Express.js, MongoDB</dd>
              </div>
              <div>
                <dt className="label">Contact</dt>
                <dd>
                  <a className="u-link" href={`mailto:${person.email}`}>
                    {person.email}
                  </a>
                </dd>
              </div>
            </dl>
          )}
          <div className="hero-actions">
            <a href="#work" className="btn btn-orange">
              See the work <span className="btn-arrow" aria-hidden="true">↓</span>
            </a>
            {explore ? (
              <button type="button" className="btn btn-line" onClick={() => setMode('read')}>
                Switch to Read mode
              </button>
            ) : (
              <button type="button" className="btn btn-line" onClick={() => setMode('explore')}>
                Open the playground
              </button>
            )}
          </div>
        </div>

        {explore && (
          <div className="hero-stage">
            <Playground />
          </div>
        )}
      </div>
    </section>
  );
}
