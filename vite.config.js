import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// Production-only Content-Security-Policy (dev needs inline scripts and websockets for hot reload).
const CSP = "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net/npm/posthog-js@1.194.4/dist/array.full.js https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com data:; img-src 'self' data: blob: https://cdnjs.cloudflare.com https://*.supabase.co; media-src 'self' blob: https://*.supabase.co; connect-src 'self' https://api.groq.com https://us.i.posthog.com https://eu.i.posthog.com https://*.supabase.co wss://*.supabase.co; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self';";

function cspOnBuild() {
  return {
    name: "csp-on-build",
    apply: "build",
    transformIndexHtml(html) {
      return html.replace("</title>", `</title>\n<meta http-equiv="Content-Security-Policy" content="${CSP}" />`);
    },
  };
}


// Fills in the service worker after the build: a unique cache version and the list of built files to pre-cache.
function swPrecache() {
  let outDir = "dist";
  return {
    name: "sw-precache",
    apply: "build",
    configResolved(cfg) {
      outDir = cfg.build.outDir;
    },
    closeBundle() {
      const files = ["/", "/manifest.webmanifest", "/icon-192.png", "/icon-512.png", "/favicon.png", "/vendor/qrcode.js", "/vendor/jsqr.js"];
      try {
        for (const f of readdirSync(join(outDir, "assets"))) files.push("/assets/" + f);
        const swPath = join(outDir, "sw.js");
        const src = readFileSync(swPath, "utf8")
          .replace("__BUILD_ID__", Date.now().toString(36))
          .replace('"__PRECACHE__"', JSON.stringify(files));
        writeFileSync(swPath, src);
      } catch (e) {
        console.warn("sw-precache: could not update sw.js", e.message);
      }
    },
  };
}

// SEO: fills %SITE_URL% (set the SITE_URL environment variable in Netlify, e.g. https://yourdomain.com)
// and writes robots.txt + sitemap.xml next to the build.
const SITE_URL = (process.env.SITE_URL || process.env.URL || "https://wwordy.com").replace(/\/+$/, "");
function seo() {
  let outDir = "dist";
  return {
    name: "seo",
    configResolved(cfg) { outDir = cfg.build.outDir; },
    transformIndexHtml(html) { return html.replaceAll("%SITE_URL%", SITE_URL); },
    closeBundle() {
      try {
        for (const f of readdirSync(outDir)) {
          if (!f.endsWith(".html")) continue;
          const fp = join(outDir, f);
          const h = readFileSync(fp, "utf8");
          if (h.includes("%SITE_URL%")) writeFileSync(fp, h.replaceAll("%SITE_URL%", SITE_URL));
        }
        writeFileSync(join(outDir, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`);
        writeFileSync(join(outDir, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${SITE_URL}/</loc></url>\n  <url><loc>${SITE_URL}/welcome.html</loc></url>\n  <url><loc>${SITE_URL}/privacy.html</loc></url>\n  <url><loc>${SITE_URL}/terms.html</loc></url>\n</urlset>\n`);
      } catch (e) { console.warn("seo: could not write robots/sitemap", e.message); }
    },
  };
}

export default defineConfig({
  plugins: [react(), cspOnBuild(), swPrecache(), seo()],
});
