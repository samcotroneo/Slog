import { useState } from 'react';
import YouPage from './components/YouPage.jsx';
import HabitsPage from './components/HabitsPage.jsx';
import SyncButton from './components/SyncButton.jsx';
import './App.css';

const TABS = [
  { id: 'you', label: 'You', icon: 'user' },
  { id: 'habits', label: 'Habits', icon: 'check' }
];

function Icon({ name, size = 18 }) {
  const paths = {
    user: <><circle cx="12" cy="8" r="3.25" /><path d="M5.5 19c.7-3.1 2.85-4.75 6.5-4.75s5.8 1.65 6.5 4.75" /></>,
    chart: <><path d="M4 19V5" /><path d="M4 19h16" /><path d="m7 15 3-4 3 2 4-6" /></>,
    check: <><path d="m5 12 4.2 4.2L19 6.5" /></>,
    lock: <><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>
  };

  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}

export default function App() {
  const [tab, setTab] = useState('you');
  const [passphrase, setPassphrase] = useState('');
  const [showPassphrase, setShowPassphrase] = useState(false);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-inner">
          <a className="brand" href="/" onClick={e => e.preventDefault()} aria-label="Slog home">
            <span className="brand-mark">S</span>
            <span className="app-title">Slog</span>
          </a>
          <nav className="tabs" aria-label="Main navigation">
          {TABS.map(t => (
            <button
              key={t.id}
              className={'tab-btn' + (tab === t.id ? ' active' : '')}
              onClick={() => setTab(t.id)}
              type="button"
              aria-current={tab === t.id ? 'page' : undefined}
            >
              <Icon name={t.icon} size={17} />
              <span>{t.label}</span>
            </button>
          ))}
          </nav>
          <div className="header-right">
            <button
              className={'privacy-btn' + (showPassphrase ? ' active' : '')}
              onClick={() => setShowPassphrase(p => !p)}
              title="Toggle encryption passphrase"
              type="button"
              aria-pressed={showPassphrase}
            >
              <Icon name="lock" size={17} />
              <span>Privacy</span>
            </button>
            <SyncButton passphrase={passphrase} />
          </div>
        </div>
      </header>

      {showPassphrase && (
        <div className="passphrase-bar">
          <div className="passphrase-inner">
            <div>
              <strong>Encrypt your backup</strong>
              <p>Optional. This passphrase protects the copy stored in Google Drive.</p>
            </div>
            <label className="passphrase-field">
              <span className="sr-only">Encryption passphrase</span>
              <input
                type="password"
                value={passphrase}
                onChange={e => setPassphrase(e.target.value)}
                placeholder="Enter a passphrase"
                className="passphrase-input"
              />
            </label>
          </div>
        </div>
      )}

      <main className="app-main">
        {tab === 'you' && <YouPage />}
        {tab === 'habits' && <HabitsPage />}
      </main>
    </div>
  );
}
