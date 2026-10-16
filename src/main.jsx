/* main.jsx
 * Entry point: loads boot scripts and styles, mounts <App /> into #root, then starts the
 * DOM behaviours (haptics, keyboard viewport, scroll lock, nav hiding).
 */

// 1) Boot scripts. They must run before the app code: they set window.DM_CONFIG and friends.
import "./boot/hide-translate-banner.js";
import "./boot/sync-language.js";
import "./boot/config.js";
import "./services/cloud-sync.js"; // sets window.wwordyCloud (needs the Supabase CDN script from index.html)

// 2) Styles
import "./styles/index.css";

// 3) App
import { createRoot } from "react-dom/client";
import { App } from "./app/app";
import { ErrorBoundary } from "./components/error-boundary/error-boundary";
import { initBottomNavVisibility } from "./behaviors/bottom-nav-visibility";
import { initHapticsAndConfetti } from "./behaviors/haptics-confetti";
import { initKeyboardViewport } from "./behaviors/keyboard-viewport";
import { initScrollLock } from "./behaviors/scroll-lock";

createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

// 4) Behaviours that watch the DOM (started right after the first render is scheduled)
initHapticsAndConfetti();
initKeyboardViewport();
initScrollLock();
initBottomNavVisibility();

// 5) Offline support: register the service worker (production builds on https or localhost only)
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
