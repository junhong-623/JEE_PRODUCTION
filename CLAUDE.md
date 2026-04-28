# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Dev server → http://localhost:3000
npm run build     # Production build → dist/
npm run preview   # Preview the built output locally
firebase deploy   # Deploy to Firebase Hosting (deploys dist/)
```

All commands run from the `public/` directory (the project root).

## Architecture

This is a single Vite/React SPA deployed at **jeeprod.com**, which hosts multiple mini-apps under one Firebase Hosting deployment. All routes are rewritten to `index.html` (SPA mode).

### Route layout (`src/App.jsx`)

| Path | Mini-app |
|------|----------|
| `/` | Portfolio hub (Home) |
| `/matetrip` | MateTrip trip-expense tracker |
| `/matetrip-admin/*` | MateTrip admin panel (admin-only) |
| `/h-agency` | H-Agency public page |
| `/h-agency/admin` | H-Agency admin (admin-only) |
| `/lucky-calc` | Lucky number calculator |
| `/calculator` | General calculator |
| `/unserialize` | PHP unserialize tool |
| `/portfolio/:slug` | External redirect for portfolio entries |
| `/bookmarks/:slug` | External redirect for bookmark entries |

### Global providers (wrapping order in `src/main.jsx`)

`ThemeProvider` → `LangProvider` → `AuthProvider` → `App`

- **AuthContext** — Firebase Auth state; exposes `{ user, admin, loading }`. `admin` is true when `user.uid === VITE_ADMIN_UID`.
- **ThemeContext** — Dark/light mode toggle.
- **LangContext** — EN/ZH i18n (bilingual fields: `title`/`titleZh`, `description`/`descriptionZh`).

### Portfolio entries (`src/lib/projects.js`)

Entries (portfolio cards, bookmarks) have the shape `{ id, type, slug, title, titleZh, description, descriptionZh, url, iconUrl, order, visible }`.

Entry ID format: `"type__slug"` (e.g., `"portfolio__matetrip"`).

Data sources (priority order):
1. **manualEntries** (`src/lib/manualEntries.js`) — always included, hardcoded
2. **Firestore `projects` collection** (primary) or **`entries` collection** (fallback)
3. **`src/data/projectFolders.json`** — static fallback when Firestore is unavailable or `VITE_LOCAL_PROJECTS=true`

`getAllEntries()` merges manual entries with the Firestore/local source; Firestore fields override manual fields for the same ID.

### MateTrip (`src/matetrip/`)

Self-contained sub-app with its own Firebase services. Firestore data model:

```
/trips/{tripId}
  /people/{personId}
  /receipts/{receiptId}
  /photos/{photoId}
  /settlements/{settlementId}
  /schedule/{itemId}
  /messages/{messageId}
```

Key files:
- `src/matetrip/services/firestore.js` — all Firestore CRUD + real-time `onSnapshot` subscriptions
- `src/matetrip/contexts/TripContext.jsx` — active trip state shared across MateTrip pages
- `src/matetrip/App.jsx` — MateTrip-internal routing

The MateTrip sub-app is mounted via `src/pages/Matetrip.jsx`, which adds CSS classes to `<html>` and `<body>` for MateTrip-specific global styles.

### Dynamic `<head>` switching (`src/App.jsx`)

`App.jsx` watches `location.pathname` and swaps favicon, manifest, theme-color, and viewport meta based on whether the user is on a `/matetrip` route. This gives MateTrip its own PWA identity without a separate deployment.

### Admin access

Set `VITE_ADMIN_UID` in `.env.local` to your Firebase UID. Admin routes are guarded in `App.jsx` with `admin ? <AdminPage /> : <Navigate to="/" />`.

## Environment variables

Copy `.env.example` to `.env.local` and fill in Firebase config. Key vars:

| Variable | Purpose |
|----------|---------|
| `VITE_FIREBASE_*` | Firebase project config |
| `VITE_ADMIN_UID` | Firebase UID that gets admin privileges |
| `VITE_LOCAL_PROJECTS` | `true` to use `projectFolders.json` instead of Firestore |
| `VITE_EMAILJS_*` | EmailJS config for contact form |
