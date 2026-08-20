import { getLocalSnapshot, restoreLocalSnapshot } from './db.js';
import { downloadFromDrive, uploadToDrive } from './driveSync.js';

let isSyncing = false;

/**
 * Last-Write-Wins sync pipeline.
 * @param {string} accessToken  Google OAuth access token
 * @param {string} [passphrase] Optional AES-GCM encryption passphrase
 */
export async function syncData(accessToken, passphrase) {
  if (isSyncing) return { status: 'busy' };
  isSyncing = true;

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
  } finally {
    isSyncing = false;
  }
}
