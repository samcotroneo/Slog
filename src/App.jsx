import { useEffect, useState } from 'react';
import YouPage from './components/YouPage.jsx';
import HabitsPage from './components/HabitsPage.jsx';
import ProfileSetupPage from './components/ProfileSetupPage.jsx';
import SyncButton from './components/SyncButton.jsx';
import { db } from './db.js';
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
    menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    settings: <><circle cx="12" cy="12" r="3.5" /><path d="M19.4 15a1.8 1.8 0 0 0 .4 2l.1.1a1.8 1.8 0 1 1-2.5 2.5l-.1-.1a1.8 1.8 0 0 0-2-.4 1.8 1.8 0 0 0-1.1 1.7v.2a1.8 1.8 0 0 1-3.6 0v-.2a1.8 1.8 0 0 0-1.1-1.7 1.8 1.8 0 0 0-2 .4l-.1.1a1.8 1.8 0 1 1-2.5-2.5l.1-.1a1.8 1.8 0 0 0 .4-2A1.8 1.8 0 0 0 5.8 14h-.2a1.8 1.8 0 0 1 0-3.6h.2a1.8 1.8 0 0 0 1.7-1.1 1.8 1.8 0 0 0-.4-2L7 7.2a1.8 1.8 0 1 1 2.5-2.5l.1.1a1.8 1.8 0 0 0 2 .4A1.8 1.8 0 0 0 12.7 3v-.2a1.8 1.8 0 0 1 3.6 0V3a1.8 1.8 0 0 0 1.1 1.7 1.8 1.8 0 0 0 2-.4l.1-.1A1.8 1.8 0 1 1 22 6.7l-.1.1a1.8 1.8 0 0 0-.4 2 1.8 1.8 0 0 0 1.7 1.1h.2a1.8 1.8 0 0 1 0 3.6h-.2a1.8 1.8 0 0 0-1.7 1.1Z" /></>,
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
  const [profileReady, setProfileReady] = useState(false);
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    db.profile.get('user_profile').then(profile => {
      setNeedsProfileSetup(profile?.setupComplete !== true);
      setProfileReady(true);
    });
  }, []);

  if (!profileReady) {
    return <div className="app-shell" aria-busy="true" />;
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-inner">
          <a className="brand" href="/" onClick={e => e.preventDefault()} aria-label="Slog home">
            <span className="brand-wordmark">slog</span>
          </a>
          {!needsProfileSetup && (
            <>
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
              <div className={'header-right' + (mobileMenuOpen ? ' menu-open' : '')}>
                <button
                  type="button"
                  className="menu-toggle"
                  aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                  aria-expanded={mobileMenuOpen}
                  aria-controls="toolbar-actions"
                  onClick={() => setMobileMenuOpen(open => !open)}
                >
                  <Icon name={mobileMenuOpen ? 'close' : 'menu'} size={20} />
                </button>
                <div id="toolbar-actions" className="toolbar-actions">
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
                  {tab === 'you' && (
                    <button
                      type="button"
                      className={'settings-toggle toolbar-settings' + (settingsOpen ? ' active' : '')}
                      aria-expanded={settingsOpen}
                      aria-controls="profile-settings"
                      onClick={() => {
                        setSettingsOpen(open => !open);
                        setMobileMenuOpen(false);
                      }}
                    >
                      <Icon name="settings" size={17} />
                      <span>Settings</span>
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </header>

      {!needsProfileSetup && showPassphrase && (
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
        {needsProfileSetup ? (
          <ProfileSetupPage onComplete={() => setNeedsProfileSetup(false)} />
        ) : (
          <>
            {tab === 'you' && <YouPage settingsOpen={settingsOpen} />}
            {tab === 'habits' && <HabitsPage />}
          </>
        )}
      </main>
    </div>
  );
}
