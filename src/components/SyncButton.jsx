import { useState } from 'react';
import { syncData } from '../syncOrchestrator.js';

let tokenClient = null;

function initTokenClient(onToken, onUnavailable) {
  const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!CLIENT_ID) {
    onUnavailable('Add VITE_GOOGLE_CLIENT_ID to enable sync.');
    return false;
  }

  if (!window.google?.accounts?.oauth2) {
    onUnavailable('Google sign-in is still loading. Try again in a moment.');
    return false;
  }

  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: 'https://www.googleapis.com/auth/drive.appdata',
    callback: onToken
  });
  tokenClient.requestAccessToken();
  return true;
}

export default function SyncButton({ passphrase }) {
  const [status, setStatus] = useState('');
  const [syncing, setSyncing] = useState(false);

  async function handleSync() {
    setSyncing(true);
    setStatus('');

    function onToken(response) {
      if (response.error) {
        setStatus('Auth failed: ' + response.error);
        setSyncing(false);
        return;
      }
      syncData(response.access_token, passphrase || undefined)
        .then(result => {
          const labels = { pushed: 'Pushed ↑', pulled: 'Pulled ↓', 'up-to-date': 'Up to date ✓', busy: 'Busy…', error: 'Error ✕' };
          setStatus(labels[result.status] ?? result.status);
          if (result.error) console.error(result.error);
        })
        .catch(error => {
          console.error(error);
          setStatus('Sync failed. Try again.');
        })
        .finally(() => setSyncing(false));
    }

    try {
      if (tokenClient) {
        tokenClient.requestAccessToken();
      } else {
        initTokenClient(onToken, message => {
          setStatus(message);
          setSyncing(false);
        });
      }
    } catch (error) {
      console.error(error);
      setStatus('Sync failed. Try again.');
      setSyncing(false);
    }
  }

  return (
    <div className="sync-area">
      <button
        onClick={handleSync}
        disabled={syncing}
        className="sync-btn"
        type="button"
        aria-label={syncing ? 'Syncing backup' : 'Sync backup'}
        title={syncing ? 'Syncing backup' : 'Sync backup'}
      >
        <svg className="sync-icon" aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12a8 8 0 0 1 13.5-5.8L20 9" />
          <path d="M20 4v5h-5" />
          <path d="M20 12a8 8 0 0 1-13.5 5.8L4 15" />
          <path d="M4 20v-5h5" />
        </svg>
        <span className="sync-label">{syncing ? 'Syncing' : 'Sync backup'}</span>
      </button>
      {status && <span className="sync-status" role="status" aria-live="polite">{status}</span>}
    </div>
  );
}
