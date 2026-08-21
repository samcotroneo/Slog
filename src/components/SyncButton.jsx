import { useRef, useState } from 'react';
import { syncData } from '../syncOrchestrator.js';
import Modal from './Modal.jsx';

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

  const tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: 'https://www.googleapis.com/auth/drive.appdata',
    callback: onToken
  });
  tokenClient.requestAccessToken();
  return tokenClient;
}

export default function SyncButton() {
  const tokenClientRef = useRef(null);
  const tokenHandlerRef = useRef(null);
  const [status, setStatus] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [encryptionConfigured, setEncryptionConfigured] = useState(false);
  const [encryptionPromptOpen, setEncryptionPromptOpen] = useState(false);
  const [pendingToken, setPendingToken] = useState('');
  const [encryptionError, setEncryptionError] = useState('');

  function finishSync(accessToken, encryptionPassphrase) {
    syncData(accessToken, encryptionPassphrase || undefined)
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

  async function handleSync() {
    setSyncing(true);
    setStatus('');

    function onToken(response) {
      if (response.error) {
        setStatus('Auth failed: ' + response.error);
        setSyncing(false);
        return;
      }
      if (!encryptionConfigured) {
        setPendingToken(response.access_token);
        setEncryptionPromptOpen(true);
        setSyncing(false);
        return;
      }
      finishSync(response.access_token, passphrase);
    }
    tokenHandlerRef.current = onToken;

    try {
      if (tokenClientRef.current) {
        tokenClientRef.current.requestAccessToken();
      } else {
        tokenClientRef.current = initTokenClient(response => tokenHandlerRef.current?.(response), message => {
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

  function closeEncryptionPrompt() {
    setEncryptionPromptOpen(false);
    setPendingToken('');
    setEncryptionError('');
    setStatus('Sync cancelled.');
  }

  function continueWithoutEncryption() {
    const accessToken = pendingToken;
    setEncryptionConfigured(true);
    setEncryptionPromptOpen(false);
    setPendingToken('');
    setEncryptionError('');
    finishSync(accessToken, '');
  }

  function handleEncryptionSubmit(event) {
    event.preventDefault();
    if (!passphrase.trim()) {
      setEncryptionError('Enter a passphrase or continue without encryption.');
      return;
    }

    const accessToken = pendingToken;
    setEncryptionConfigured(true);
    setEncryptionPromptOpen(false);
    setPendingToken('');
    setEncryptionError('');
    finishSync(accessToken, passphrase);
  }

  return (
    <>
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
      {encryptionPromptOpen && (
        <Modal title="Protect your backup" onClose={closeEncryptionPrompt}>
          <div className="modal-copy">
            <strong>Choose your backup privacy</strong>
            <p>Sync is ready. Add a passphrase to encrypt this backup before it is saved to Google Drive.</p>
          </div>
          <form className="backup-encryption-form" onSubmit={handleEncryptionSubmit}>
            <label className="passphrase-field">
              <span className="field-label">Encryption passphrase</span>
              <input
                type="password"
                value={passphrase}
                onChange={event => setPassphrase(event.target.value)}
                placeholder="Enter a passphrase"
                className="passphrase-input"
                autoFocus
              />
            </label>
            {encryptionError && <p className="form-error" role="alert">{encryptionError}</p>}
            <div className="modal-actions">
              <button type="submit">Encrypt backup</button>
              <button type="button" className="modal-secondary" onClick={continueWithoutEncryption}>Continue without encryption</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
