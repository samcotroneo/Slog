import { getLocalSnapshot, restoreLocalSnapshot } from './db.js';
import { downloadFromDrive, uploadToDrive } from './driveSync.js';

/**
 * Last-Write-Wins sync pipeline.
 * Uses the Web Locks API to enforce a cross-tab mutex so only one tab can
 * run a sync at a time.
 *
 * @param {string} accessToken  Google OAuth access token
 * @param {string} [passphrase] Optional AES-GCM encryption passphrase
 */
export async function syncData(accessToken, passphrase) {
  if (!navigator.locks) {
    // Fallback for environments without Web Locks (should not happen in modern browsers)
    return runSync(accessToken, passphrase);
  }

  return navigator.locks.request('slog_sync', { ifAvailable: true }, async lock => {
    if (!lock) return { status: 'busy' };
    return runSync(accessToken, passphrase);
  });
}

async function runSync(accessToken, passphrase) {
  try {
    const localSnapshot = await getLocalSnapshot();
    const remoteSnapshot = await downloadFromDrive(accessToken, passphrase);

    if (!remoteSnapshot) {
      await uploadToDrive(accessToken, localSnapshot, passphrase);
      return { status: 'pushed' };
    } else if (remoteSnapshot.timestamp > localSnapshot.timestamp) {
      await restoreLocalSnapshot(remoteSnapshot);
      return { status: 'pulled' };
    } else if (localSnapshot.timestamp > remoteSnapshot.timestamp) {
      await uploadToDrive(accessToken, localSnapshot, passphrase);
      return { status: 'pushed' };
    }
    return { status: 'up-to-date' };
  } catch (err) {
    console.error('Sync failed:', err);
    return { status: 'error', error: err.message };
  }
}
