# Slog — Local-First Privacy Health & Fitness Tracker

A serverless, privacy-first web app for tracking height, weight, waistline, and daily habits — stored locally in your browser and optionally synced to your personal Google Drive.

## Features

- 📈 **You** — Save your height, log weight and waistline together, and chart Weight, BMI, or Waistline trends
- ✅ **Habits** — Define habits with 1–20 targets and daily, fortnightly, weekly, or monthly frequencies, then tap daily cards to log progress
- ☁️ **Drive Sync** — Last-Write-Wins sync to your Google Drive `appDataFolder` (hidden from your Drive files)
- 🔒 **Optional AES-GCM encryption** — Encrypt the Drive backup with a passphrase so even Google can't read it
- 📴 **Offline-first PWA** — Works without internet; installable on iOS, Android, and desktop

## Architecture

```
Browser (PWA)
  ├─ React UI  ──── read/write ──►  Dexie.js / IndexedDB  (instant, offline)
  └─ Sync Orchestrator  ──────────► Google Drive appDataFolder  (optional)
```

All health data lives in the browser's IndexedDB. No custom backend. No telemetry.

## Getting Started

### Prerequisites

- Node.js ≥ 18
- A Google Cloud project with the **Drive API** enabled and an **OAuth 2.0 Client ID** (Web application type)

### Development

```bash
npm install

# Copy and fill in your Client ID
cp .env.example .env.local
# VITE_GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com

npm run dev
```

### Production Build

```bash
npm run build      # outputs to dist/
npm run preview    # local preview of the production build
```

### Deploy to GitHub Pages

1. Enable GitHub Pages (Settings → Pages → Source: **GitHub Actions**)
2. Add a repository secret `VITE_GOOGLE_CLIENT_ID` with your OAuth Client ID
3. Push to `main` — the workflow in `.github/workflows/deploy.yml` builds and deploys automatically

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials
2. Create an **OAuth 2.0 Client ID** (Web application)
3. Add your deployed origin to **Authorised JavaScript origins** (e.g. `https://yourusername.github.io`)
4. Enable the **Google Drive API** for the project

## Privacy

- Health data **never leaves your device** unless you explicitly click "Sync with Drive"
- Drive sync writes to `appDataFolder` — invisible to the user's regular Drive file list
- Enabling the passphrase field encrypts data with AES-256-GCM (PBKDF2 key derivation) before upload
- The Content Security Policy restricts all network requests to Google's auth/Drive endpoints only

## Project Structure

```
src/
  db.js                 # Dexie schema + snapshot helpers
  driveSync.js          # Google Drive API + AES-GCM encryption
  syncOrchestrator.js   # Last-Write-Wins sync logic
  utils.js              # nanoid, todayISO helpers
  components/
    YouPage.jsx           # Height, progress logs, editing, and trends
    HabitsPage.jsx
    SyncButton.jsx
  App.jsx
  main.jsx
public/
  manifest.json         # PWA manifest
  icons/                # App icons
.github/workflows/
  deploy.yml            # GitHub Pages CD pipeline
```
