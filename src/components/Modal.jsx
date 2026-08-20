import { useEffect, useState } from 'react';

export default function Modal({ title, onClose, children }) {
  const [headerHeight, setHeaderHeight] = useState(() => document.querySelector('.app-header')?.getBoundingClientRect().height ?? 0);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose();
    }

    document.body.classList.add('modal-open');
    document.addEventListener('keydown', handleKeyDown);

    function updateHeaderHeight() {
      setHeaderHeight(document.querySelector('.app-header')?.getBoundingClientRect().height ?? 0);
    }

    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);

    return () => {
      document.body.classList.remove('modal-open');
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', updateHeaderHeight);
    };
  }, [onClose]);

  const titleId = `modal-title-${title.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="modal-backdrop" style={{ '--modal-top': `${headerHeight}px` }} onMouseDown={onClose}>
      <section
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={event => event.stopPropagation()}
      >
        <div className="modal-heading">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label={`Close ${title.toLowerCase()}`}>
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
