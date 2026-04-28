# JEE Production — www.jeeprod.com

A personal portfolio hub and collection of mini-apps, all deployed as a single SPA at **[www.jeeprod.com](https://www.jeeprod.com)**.

## Live Apps

| App | URL | Description |
|-----|-----|-------------|
| Portfolio | [www.jeeprod.com](https://www.jeeprod.com) | Personal hub linking all projects |
| **JSave** | [www.jeeprod.com/jsave](https://www.jeeprod.com/jsave) | Personal finance tracker — PWA with offline support, push reminders, AA split |
| **MateTrip** | [www.jeeprod.com/matetrip](https://www.jeeprod.com/matetrip) | Trip expense tracker — split bills, track settlements, shared receipts |
| H-Agency | [www.jeeprod.com/h-agency](https://www.jeeprod.com/h-agency) | Agency landing page |
| Lucky Calc | [www.jeeprod.com/lucky-calc](https://www.jeeprod.com/lucky-calc) | Lucky number calculator |
| Calculator | [www.jeeprod.com/calculator](https://www.jeeprod.com/calculator) | General calculator |
| Unserialize | [www.jeeprod.com/unserialize](https://www.jeeprod.com/unserialize) | PHP unserialize tool |

## Stack

| Tool | Purpose |
|------|---------|
| React 18 + Vite | Frontend framework |
| React Router v6 | Client-side routing |
| TailwindCSS | Styling |
| Firebase Auth | Authentication |
| Cloud Firestore | Database |
| Firebase Hosting | Deployment |
| Firebase Functions | Server-side push notifications, payment proxy |
| GitHub Actions | CI/CD — auto-deploy on push to `main` |

## CI/CD

Every push to `main` automatically builds and deploys to Firebase Hosting via GitHub Actions.

```
git push origin main  →  GitHub Actions builds  →  firebase deploy --only hosting
```

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Copy env and fill in your Firebase config
cp .env.example .env.local

# 3. Dev server → http://localhost:3000
npm run dev

# 4. Build for production
npm run build

# 5. Deploy manually (hosting + functions + rules)
firebase deploy
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | Purpose |
|----------|---------|
| `VITE_FIREBASE_*` | Firebase project config |
| `VITE_ADMIN_UID` | Firebase UID that gets admin access |
| `VITE_MATETRIP_VAPID_PUBLIC_KEY` | Web Push public key for JSave reminders |
| `VITE_EMAILJS_*` | EmailJS config for contact form |
| `VITE_LOCAL_PROJECTS` | `true` to load projects from local JSON instead of Firestore |

## GitHub Secrets Required

For CI/CD to work, add these in **GitHub → Settings → Secrets**:

- All `VITE_*` variables above
- `FIREBASE_TOKEN` — from running `firebase login:ci` locally

## Project Structure

```
src/
├── jsave/          # JSave finance tracker (PWA)
├── matetrip/       # MateTrip trip expense tracker (PWA)
├── h-agency/       # H-Agency landing page
├── lucky-calc/     # Lucky number calculator
├── pages/          # Top-level route pages
├── contexts/       # Auth, Theme, Lang providers
└── App.jsx         # Route definitions
functions/
└── index.js        # Firebase Cloud Functions (push notifications, payments)
```

## Deploying Functions

Functions are deployed manually (they use Firebase Secrets like `VAPID_PRIVATE_KEY`):

```bash
firebase deploy --only functions
```
