import { useEffect, useState } from 'react';
import TodayPage from './components/TodayPage.jsx';
import ProgressPage from './components/ProgressPage.jsx';
import HabitsPage from './components/HabitsPage.jsx';
import WorkoutsPage from './components/WorkoutsPage.jsx';
import ProfileSetupPage from './components/ProfileSetupPage.jsx';
import ProfileSettingsModal from './components/ProfileSettingsModal.jsx';
import SyncButton from './components/SyncButton.jsx';
import { db } from './db.js';
import './App.css';

const TABS = [
  { id: 'today', label: 'Today', icon: 'check' },
  { id: 'progress', label: 'Progress', icon: 'chart' },
  { id: 'habits', label: 'Habits', icon: 'check' },
  { id: 'workouts', label: 'Workouts', icon: 'activity' }
];

function Icon({ name, size = 18 }) {
  const paths = {
    user: <><circle cx="12" cy="8" r="3.25" /><path d="M5.5 19c.7-3.1 2.85-4.75 6.5-4.75s5.8 1.65 6.5 4.75" /></>,
    chart: <><path d="M4 19V5" /><path d="M4 19h16" /><path d="m7 15 3-4 3 2 4-6" /></>,
    check: <><path d="m5 12 4.2 4.2L19 6.5" /></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    settings: <><circle cx="12" cy="12" r="3.5" /><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0L6.2 6.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    activity: <><path d="M3.5 13.5h3.1l2-5 3 9 2.1-5h6.8" /></>
  };

  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}

export default function App() {
  const [tab, setTab] = useState('today');
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
                    onClick={() => {
                      setTab(t.id);
                      setSettingsOpen(false);
                    }}
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
                  <SyncButton />
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
                </div>
              </div>
            </>
          )}
        </div>
      </header>

      <main className="app-main">
        {needsProfileSetup ? (
          <ProfileSetupPage onComplete={() => setNeedsProfileSetup(false)} />
        ) : (
          <>
            {tab === 'today' && <TodayPage onNavigate={setTab} />}
            {tab === 'progress' && <ProgressPage />}
            {tab === 'habits' && <HabitsPage />}
            {tab === 'workouts' && <WorkoutsPage />}
          </>
        )}
      </main>
      {!needsProfileSetup && settingsOpen && <ProfileSettingsModal onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
