# wwordy (Vite + React)

A vocabulary trainer: stacks of words, flashcards and many games, settings, store, Supabase sync.

## Run it

```bash
npm install
npm run dev       # development server with hot reload (http://localhost:5173)
npm run build     # production build into dist/
npm run preview   # serve dist/ locally
```

You need Node.js 18+. The app no longer opens by double-clicking `index.html`: browsers do not run modules from `file://`, and JSX needs the build step.

## Where things are

```
index.html                  page shell, loads src/main.jsx
vite.config.js              Vite config (adds the Content-Security-Policy on build only)
public/                     files served as-is: icons, offline QR libraries
netlify/functions/          ai-proxy.js (Groq proxy, deploy on Netlify)
src/
  main.jsx                  entry point: boot scripts, styles, <App/>, DOM behaviours
  app/app.jsx               App: root component, global state, which screen is shown
  components/<name>/        one folder per screen / modal / game: <name>.jsx (+ <name>.css)
    games/                  one file per game
    common/Input.jsx        <input> with autocorrect etc. off (was a global createElement patch)
  core/                     constants, contexts, speech, spaced repetition, sharing/export
  services/                 AI (Groq), Supabase sync, analytics, premium/gems, admin, UI translation
  behaviors/                DOM behaviours started from main.jsx (haptics, keyboard viewport, scroll lock)
  boot/                     small scripts that must run before the app (sets window.DM_CONFIG)
  styles/index.css          imports every .css file in cascade order
```

## Good to know

- **Imports are explicit.** Each file imports what it uses (`import { WordCard } from "../word-card/word-card"`), so you can follow the code by clicking through imports.
- **CSS order matters.** `src/styles/index.css` lists all stylesheets in the original order. Later `layer-*` files override earlier ones on purpose, so a style can live in two places. Do not reorder the imports without checking the screens. A good cleanup is to merge the layers back into component files one at a time.
- **Code history.** This code came from a bundled single file, so the original comments are kept but local variable names are whatever the compiler left (for example `w`, `s`, `e`). Rename them as you work on each file.
- **Config.** Edit `src/boot/config.js` for the AI proxy / key settings. The Supabase URL and public key are in `src/services/cloud-sync.js`.
- **Supabase** is still loaded from a CDN `<script>` in `index.html`.

## Changelog (synced from the single-file index.html)

- Sign-in / sign-up modal redesigned (show/hide password, live ID check, password strength, confirm check).
- Onboarding: new header with step counter and progress bar, accessible dialog, "Add a starter stack" switch (saved in `deutschmaster-starter-stack`).
- Home: "New stack" button collapses to a "+" when it does not fit.
- Settings: group labels animate in.
- Pinch-zoom is allowed again (no `maximum-scale` / `user-scalable=no`); text fields stay 16px on touch devices.
- Theme colours, landscape-phone bottom bar, 44px tap targets and the rest of the CSS were synced.

## Account, install and small-screen additions

- **Account screen:** sync status card (last synced, "Sync now", errors), the last used ID is remembered on the sign-in form, and **Delete account** (type your ID + password). Deleting the auth user needs the SQL function in `supabase-delete-account.sql` — run it once in the Supabase SQL editor. Without it only the cloud backup rows are removed.
- **Install as an app:** `public/manifest.webmanifest` and icons; add it to the home screen to get a full-screen app.
- **Offline:** `public/sw.js` is a service worker (production build only). `vite.config.js` fills in its cache version and file list after each build. Page loads try the network first and fall back to the cached app.
- **Small screens:** `src/styles/layer-small-screens.css` (checked at 320x568 and 360x640).

## Games section

The Games tab and every game keep the original mobile layout: original font sizes and spacing, no extra 44px tap targets or 16px field rule, and the screen stays zoom-locked while you are in Games (the viewport is switched back when you leave). The class `dm-section-games` on `.dm-app` marks this section.

## Sync via QR (Settings)

Settings > Account group > **Sync via QR**: send one stack (or all stacks as a family) to another device as a QR code, or scan a code to receive one. Stacks that do not fit one code are sent as several codes shown in turn (up to 40 parts); the scanner collects the parts in any order. The original entry points on Home / stack / families stay switched off (`QR_SHARING_ENABLED` in `qr-share.jsx`). Scanning needs the camera, so the site must be served over https (or localhost).

## Games layout fix
Removed the phone-only vertical centring of game content and the enlarged tap-target sizes inside games (hit areas are now invisible `::after` extensions), so in-game positions on phones match the original layout again.

## Name and SEO
- User-facing name is "wwordy" everywhere (About screen, backup file name). Internal storage keys and the login e-mail pattern keep the old "wordify" prefix on purpose so existing accounts and data keep working.
- `index.html` now has a description, canonical URL, Open Graph / Twitter tags (`public/og-image.png`) and JSON-LD. The build writes `robots.txt` and `sitemap.xml`.
- The site address comes from the `SITE_URL` environment variable (Netlify also supplies `URL` automatically). Set `SITE_URL=https://yourdomain.com` in Netlify once the domain is connected, then redeploy.

## Going live (Netlify)
Build command `npm run build`, publish directory `dist` (already in `netlify.toml`).
Environment variables (Site configuration > Environment variables):
- `GROQ_API_KEY` (required for AI): a NEW Groq key; revoke any older one.
- `ADMIN_SECRET` (required for the admin panel): a long random string; you type it in the admin panel to create promo codes and see device/online counts.
- `SITE_URL` (optional): `https://yourdomain.com` for canonical links, share previews and sitemap.
- `AI_ALLOWED_ORIGINS` (optional): your site origin(s), comma-separated.

Server functions (`netlify/functions`): `ai-proxy.cjs` (AI), `promo-redeem.mjs` / `promo-admin.mjs` (promo codes, stored in Netlify Blobs), `device-register.mjs` / `devices-count.mjs`, `presence-join.mjs` / `presence-leave.mjs` / `presence-count.mjs`. Promo codes are now consumed on the server, so a code cannot be reused or shared after it is redeemed.

Pages: `/welcome.html` (landing), `/privacy.html`, `/terms.html`, `/404.html`. The legal texts describe how the app actually works today; have them reviewed for your country before launch and update them if you add payments or new services.
Note: `blockFraming` is now `true` in `src/boot/config.js`, so the site cannot be embedded in other sites (set it to `false` for chat/editor previews).

## Speed, error page, device checks
- Games, Settings, Store, AI tutor, sign-in and onboarding are now loaded on demand (code splitting). First-load JavaScript went from about 761 KB to about 527 KB (roughly 160 KB compressed).
- App images are real files instead of ~110 KB of base64 text inside the JavaScript.
- Google Fonts load from `<link>` tags in `index.html` (no longer blocking via a CSS `@import`).
- The QR libraries (`/vendor/*.js`) are loaded only when a QR screen opens and are pre-cached for offline use.
- `ErrorBoundary` shows a "Something went wrong / Reload" screen instead of a blank page, and reloads once automatically if a new deploy replaced a file the page was about to load.
- Checked at 320x568, 375x667, 390x844, 430x932, 360x800, 360x640, 768x1024 and 844x390 landscape: home, new stack, games hub, 5 games, favorites, settings and its sections. No sideways scrolling, no script errors; games, QR and offline mode work with the split files.

## New Supabase project
If you do not have access to the old project, create a new one and run `supabase-setup.sql` and then `supabase-delete-account.sql` in its SQL Editor. Turn OFF "Confirm email" (Authentication > Providers > Email). Then put the new project's URL and publishable (anon) key into `window.SUPABASE_CONFIG` at the top of `src/services/cloud-sync.js` and rebuild. Existing accounts in the old project do not carry over.
