const FILE_NAME = 'health_tracker_data.json';
const ALGO = { name: 'AES-GCM', length: 256 };
const IV_LENGTH = 12;

// ── Encryption helpers ────────────────────────────────────────────────────────

async function deriveKey(passphrase, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
    keyMaterial,
    ALGO,
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts a JSON-serialisable payload with AES-GCM.
 * Returns a base64-encoded string: <salt(16B)><iv(12B)><ciphertext>.
 */
export async function encryptPayload(payload, passphrase) {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await deriveKey(passphrase, salt);
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(JSON.stringify(payload))
  );
  const combined = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(ciphertext), salt.length + iv.length);
  let binary = '';
  for (let i = 0; i < combined.length; i++) {
    binary += String.fromCharCode(combined[i]);
  }
  return btoa(binary);
}

/**
 * Decrypts a base64 AES-GCM blob back to a JS object.
 */
export async function decryptPayload(base64, passphrase) {
  const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  const salt = bytes.slice(0, 16);
  const iv = bytes.slice(16, 16 + IV_LENGTH);
  const ciphertext = bytes.slice(16 + IV_LENGTH);
  const key = await deriveKey(passphrase, salt);
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  return JSON.parse(new TextDecoder().decode(plain));
}

// ── Drive API helpers ─────────────────────────────────────────────────────────

async function checkResponse(response) {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Drive API error ${response.status}: ${text}`);
  }
  return response;
}

async function getDriveFileId(accessToken) {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name%3D'${FILE_NAME}'&fields=files(id)`,
    { headers: { Authorization: 'Bearer ' + accessToken } }
  );
  await checkResponse(response);
  const data = await response.json();
  return data.files && data.files.length > 0 ? data.files[0].id : null;
}

/**
 * Downloads latest snapshot from appDataFolder.
 * If passphrase is provided the stored blob is decrypted first.
 */
export async function downloadFromDrive(accessToken, passphrase) {
  const fileId = await getDriveFileId(accessToken);
  if (!fileId) return null;

  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    { headers: { Authorization: 'Bearer ' + accessToken } }
  );
  await checkResponse(response);
  const text = await response.text();

  if (passphrase) {
    return decryptPayload(text, passphrase);
  }
  return JSON.parse(text);
}

/**
 * Uploads local snapshot object to appDataFolder.
 * If passphrase is provided the payload is encrypted before upload.
 */
export async function uploadToDrive(accessToken, payload, passphrase) {
  const fileId = await getDriveFileId(accessToken);

  let body;
  let contentType;
  if (passphrase) {
    body = await encryptPayload(payload, passphrase);
    contentType = 'text/plain';
  } else {
    body = JSON.stringify(payload);
    contentType = 'application/json';
  }

  const blob = new Blob([body], { type: contentType });
  const metadata = { name: FILE_NAME, parents: fileId ? undefined : ['appDataFolder'] };

  const formData = new FormData();
  formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  formData.append('file', blob);

  let url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
  let method = 'POST';

  if (fileId) {
    url = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`;
    method = 'PATCH';
  }

  const response = await fetch(url, {
    method,
    headers: { Authorization: 'Bearer ' + accessToken },
    body: formData
  });
  await checkResponse(response);
}
