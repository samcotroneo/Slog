import { useState } from 'react';
import ProfilePage from './components/ProfilePage.jsx';
import WeightLogPage from './components/WeightLogPage.jsx';
import HabitsPage from './components/HabitsPage.jsx';
import SyncButton from './components/SyncButton.jsx';
import './App.css';

const TABS = [
  { id: 'profile', label: '👤 Profile' },
  { id: 'weight', label: '⚖️ Weight' },
  { id: 'habits', label: '✅ Habits' }
];

export default function App() {
  const [tab, setTab] = useState('weight');
  const [passphrase, setPassphrase] = useState('');
  const [showPassphrase, setShowPassphrase] = useState(false);

  return (
    <>
      <header className="app-header">
        <span className="app-title">Slog</span>
        <nav className="tabs">
          {TABS.map(t => (
            <button
              key={t.id}
              className={'tab-btn' + (tab === t.id ? ' active' : '')}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <div className="header-right">
          <button
            className="btn-sm"
            onClick={() => setShowPassphrase(p => !p)}
            title="Toggle encryption passphrase"
          >
            🔒
          </button>
          <SyncButton passphrase={passphrase} />
        </div>
      </header>

      {showPassphrase && (
        <div className="passphrase-bar">
          <label>
            Encryption passphrase (optional):
            <input
              type="password"
              value={passphrase}
              onChange={e => setPassphrase(e.target.value)}
              placeholder="Leave blank to skip encryption"
              className="passphrase-input"
            />
          </label>
        </div>
      )}

      <main className="app-main">
        {tab === 'profile' && <ProfilePage />}
        {tab === 'weight' && <WeightLogPage />}
        {tab === 'habits' && <HabitsPage />}
      </main>
    </>
  );
}
