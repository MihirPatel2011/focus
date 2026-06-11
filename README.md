# Focus

A calm, fast personal productivity & time-tracking app: tasks, life-area
organization, projects, and a focus timer that logs where your time goes.

Built as a **PWA** (React + TypeScript + Vite + Tailwind, Firebase backend),
architected so it can be wrapped to iOS/macOS with Capacitor later with minimal
rework — all business logic lives in framework-agnostic modules.

> **Status:** Vertical slice. Working: auth, Areas, task capture + inbox
> clarification, smart task views, and the focus timer (logs `TimeLog`s).
> Deferred to later sessions: projects detail, recurring tasks, planning view,
> full statistics/charts, focus mode, idle nudge, keyboard-shortcut expansion.

## Architecture

Strict separation so the native wrap reuses everything below the UI:

```
src/
  lib/firebase/   Firebase SDK init + config (env-driven)
  lib/            framework-agnostic helpers (dates, icons/colors)
  data/           Firestore data-access layer (typed CRUD, live subscriptions)
  logic/          business logic — Zustand stores + hooks (auth, data, timer)
  components/     reusable UI
  pages/          routed screens
```

- **State:** Zustand. Firestore is the source of truth; the data store mirrors
  it in memory via live `onSnapshot` subscriptions.
- **Offline:** Firestore persistent local cache (IndexedDB, multi-tab) — capture
  and edit offline, syncs on reconnect.
- **Multi-user from day one:** every document is stored under
  `users/{uid}/...` and locked to its owner by Firestore security rules
  (`firestore.rules`). No single user is hardcoded anywhere.

## Local development

```bash
npm install
cp .env.example .env   # then fill in your Firebase web config (see below)
npm run dev            # http://localhost:5173
```

If `.env` is missing/empty the app shows a setup notice instead of crashing.

## Firebase setup

1. **Create a project** at <https://console.firebase.google.com>.
2. **Enable Firestore** (Build → Firestore Database → Create database, production
   mode).
3. **Enable Authentication** (Build → Authentication → Get started) and turn on:
   - **Email/Password**
   - **Google**
4. **Get your web config:** Project settings → General → Your apps → Web app →
   "SDK setup and configuration" → Config. Copy the values into `.env`:

   ```
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   ```

   > These keys are **not secrets** — they ship in the client bundle and are
   > meant to be public. Security is enforced by Firestore rules + Auth, not by
   > hiding them.

5. **Deploy the security rules** (the real security boundary):

   ```bash
   npm i -g firebase-tools   # once
   firebase login
   firebase use --add        # select your project
   npm run deploy:rules      # deploys firestore.rules
   ```

   Or paste `firestore.rules` into Firestore → Rules in the console.

## Deploying to GitHub Pages

The app auto-deploys via GitHub Actions on every push to `main`
(`.github/workflows/deploy.yml`), building the Vite app and publishing to Pages.

**One-time setup:**

1. Push this repo to GitHub as **`focus`** (the Vite production base is
   `/focus/` — see `vite.config.ts`). If you use a different repo name, set the
   repo/Actions variable `VITE_BASE_PATH=/<repo-name>/`. For a custom domain set
   `VITE_BASE_PATH=/`.
2. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
3. **Settings → Secrets and variables → Actions → New repository secret** — add
   each Firebase value (so the real values stay out of the committed source even
   though they end up in the public bundle):
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - (optional) repository **variable** `VITE_BASE_PATH`
4. **Authorize the domain in Firebase** (Authentication → Settings → Authorized
   domains) — add `your-username.github.io` (and keep `localhost` for dev).
5. **Restrict the API key** (Google Cloud Console → Credentials → your browser
   key → Application restrictions → HTTP referrers): allow
   `https://your-username.github.io/*` and `http://localhost:*`.

**Trigger a deploy:** push to `main`, or run the workflow manually from the
Actions tab (`workflow_dispatch`).

### SPA routing on GitHub Pages

GitHub Pages has no server-side rewrite, so deep links / refreshes are handled by
the standard `404.html` redirect trick (`public/404.html` encodes the path, a
snippet in `index.html` restores it). The PWA manifest and service worker are
emitted relative to the base path, so the app stays installable under `/focus/`.

## PWA install

After deploying (or running a local `npm run build && npm run preview`), the app
is installable from the browser's install prompt on Mac and iPhone.

## Capacitor-readiness notes (future)

- No UI component imports the Firebase SDK directly — only `src/lib/firebase`,
  `src/data`, and `src/logic` do. Swapping to a native data source later means
  touching only those layers.
- Timer logic (`src/logic/stores/timerStore.ts`) holds no DOM/interval state; the
  UI drives a 1s ticker. It will run unchanged inside a Capacitor WebView.
- `env(safe-area-inset-*)` padding is already applied for notched devices.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Local dev server |
| `npm run build` | Typecheck + production build (base `/focus/`) |
| `npm run preview` | Serve the production build locally |
| `npm run deploy:rules` | Deploy Firestore security rules |
