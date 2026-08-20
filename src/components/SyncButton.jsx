import { useState } from 'react';
import { syncData } from '../syncOrchestrator.js';

let tokenClient = null;

function initTokenClient(onToken) {
  const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!CLIENT_ID) {
    alert('Set VITE_GOOGLE_CLIENT_ID in your .env file to enable sync.');
    return;
  }
  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: 'https://www.googleapis.com/auth/drive.appdata',
    callback: onToken
  });
  tokenClient.requestAccessToken();
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
        .finally(() => setSyncing(false));
    }

    if (tokenClient) {
      tokenClient.requestAccessToken();
    } else {
      initTokenClient(onToken);
    }
  }

  return (
    <div className="sync-area">
      <button onClick={handleSync} disabled={syncing} className="sync-btn">
        {syncing ? 'Syncing…' : '⟳ Sync with Drive'}
      </button>
      {status && <span className="sync-status">{status}</span>}
    </div>
  );
}
