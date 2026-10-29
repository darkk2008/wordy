/* Runtime configuration (window.DM_CONFIG) and cleanup of legacy stored keys. Edit settings here. */
/* ===== Configuration (edit here) =====
   GOAL: users should never have to deal with an API key. Pick ONE of the two options:

   A) proxyUrl (RECOMMENDED, safe): your Groq key stays on YOUR server. Deploy the function stored in
      netlify/functions/ai-proxy.cjs (Netlify: deploy this project and
      add the environment variable GROQ_API_KEY), then keep proxyUrl = "/.netlify/functions/ai-proxy".
      Until that function exists, the app shows "AI isn't set up yet" and users can still paste their own key.

   B) sharedKey (NO server needed, NOT safe): paste a Groq key below and set proxyUrl to "". Everyone who opens
      the page can read and copy that key. If you do this, use a NEW dedicated key (never the old, leaked one),
      and set a low usage/spend limit for it in the Groq console.

   Users who paste their own key in the AI Tutor always use their own key directly, in both options.

   blockFraming: false lets the page be shown inside a frame (needed for chat/editor previews, which show a black
   screen otherwise). Set it to true on your real, public site so other websites cannot embed it (clickjacking). */
window.DM_CONFIG = {
  proxyUrl: "/.netlify/functions/ai-proxy",
  sharedKey: "",
  blockFraming: true,
  // Pro comes only from the Supabase `entitlements` table (run supabase-entitlements.sql first).
  serverEntitlements: true,
};
/* Clickjacking protection (a <meta> CSP cannot set frame-ancestors): optional, see blockFraming above. */
(function () {
  try {
    if (window.DM_CONFIG.blockFraming && window.top !== window.self) {
      document.documentElement.style.display = "none";
      try {
        window.top.location.replace(window.self.location.href);
      } catch (e) {}
    }
  } catch (e) {
    if (window.DM_CONFIG.blockFraming) document.documentElement.style.display = "none";
  }
})();
(function () {
  // No API key ships in this file. A previously bundled (leaked) key is removed from this browser.
  // The admin secret is no longer persisted.
  try {
    var K = "deutschmaster-groq-key";
    var v = window.localStorage.getItem(K);
    var fp = function (t) {
      var x = 2166136261;
      for (var i = 0; i < t.length; i++) {
        x ^= t.charCodeAt(i);
        x = Math.imul(x, 16777619) >>> 0;
      }
      return x >>> 0;
    };
    if (v && v.length === 56 && fp(v) === 3874756567) {
      window.localStorage.removeItem(K);
      v = null;
    }
    var shared = !!(window.DM_CONFIG.proxyUrl || window.DM_CONFIG.sharedKey);
    if (v === "proxy" && !shared) {
      window.localStorage.removeItem(K);
      v = null;
    }
    if (!v && shared) window.localStorage.setItem(K, "proxy");
    window.localStorage.removeItem("deutschmaster-admin-secret");
  } catch (e) {}
})();
