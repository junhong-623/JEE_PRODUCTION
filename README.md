# Jee - Production (jeeprod.com)

A personal portfolio hub — all projects live under `jeeprod.com/:folderName`.

## Stack

| Tool | Purpose |
|------|---------|
| React 18 + Vite | Frontend framework |
| React Router v6 | Client-side routing |
| TailwindCSS | Styling |
| Firebase Auth | Authentication |
| Cloud Firestore | Project metadata (name, description, url, icon) |
| Local `project/` folder | Generate buttons from physical subfolders when `VITE_LOCAL_PROJECTS=true` |
| Firebase Hosting | Deployment |

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy env and fill in your Firebase config
cp .env.example .env.local
#    If you want to use the local `project/` folder instead of Firestore, set `VITE_LOCAL_PROJECTS=true` in `.env.local`

# 3. Dev server → http://localhost:3000
npm run dev

# 4. Build for production
npm run build

# 5. Deploy to Firebase Hosting
firebase deploy
```

## Project Structure

```
jeeprod/
├── public/
│   └── favicon.svg
├── src/
│   ├── contexts/
│   │   ├── AuthContext.jsx    # Firebase Auth state
│   │   ├── ThemeContext.jsx   # Dark/light mode
│   │   └── LangContext.jsx    # EN/ZH i18n
│   ├── lib/
│   │   └── firebase.js        # Firebase init
│   ├── pages/
│   │   ├── Home.jsx           # jeeprod.com/
│   │   └── Redirect.jsx       # jeeprod.com/:folderName
│   ├── components/            # Shared UI components (future)
│   ├── hooks/                 # Custom hooks (future)
│   ├── App.jsx                # Route definitions
│   ├── main.jsx               # Entry point + providers
│   └── index.css              # Tailwind base
├── .env.example
├── .firebaserc
├── firebase.json
├── tailwind.config.js
├── vite.config.js
└── package.json
```

## Firestore Data Model (planned)

```
/projects/{folderName}
  name: string          // "MatéTrip"
  nameZh: string        // "旅行伴侣"
  description: string
  descriptionZh: string
  url: string           // external redirect URL
  iconPath: string      // e.g. "matetrip/public/icons/icon-512.png"
  order: number         // sort order on homepage
  visible: boolean
```

## Admin

Set `VITE_ADMIN_UID` in `.env.local` to your Firebase UID.
When logged in as admin, an ⚙️ settings panel will appear.
