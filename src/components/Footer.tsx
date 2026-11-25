import { person, sections } from '../data/cv';
import './Footer.css';

export function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer-inner">
        <div className="footer-id">
          <p className="footer-name">{person.name}</p>
          <p className="muted">{person.role}</p>
        </div>

        <nav aria-label="Footer" className="footer-nav">
          <ol>
            {sections.map((s, i) => (
              <li key={s.id}>
                <a className="u-link" href={`#${s.id}`}>
                  <span className="muted">{String(i + 1).padStart(2, '0')}</span> {s.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <p className="footer-status">
          <span className="footer-dot" aria-hidden="true" />
          Studying Information System Security at Azerbaijan State Oil and Industry University
        </p>

        <div className="footer-end">
          <p className="muted">
            © {new Date().getFullYear()} {person.name}. Built with React, TypeScript and Motion.
          </p>
          <a href="#intro" className="u-link">
            Back to the start ↑
          </a>
        </div>
      </div>
    </footer>
  );
}
