/* core/sharing-and-export.js
 * Clipboard/date helpers, QR payload encode/decode, file download, family share HTML.
 */

import { stripArticle } from "../components/word-forms/word-forms";
import { escapeHtml, genderClass } from "../components/word-modal/word-modal";
import { DM_LIMITS, dmSanitizeStack, dmStr } from "../services/config-and-validation";
import { uid } from "./constants";

export async function copyTextToClipboard(text) {
  try {
    if (window.isSecureContext !== false && navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) {}
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "-1000px";
    ta.style.left = "-1000px";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    ta.setSelectionRange(0, text.length);
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    if (ok) return true;
  } catch (e) {}
  return false;
}
function formatRelativeTime(ts) {
  if (!ts) return "never";
  const diff = Date.now() - ts;
  if (diff < 10 * 1e3) return "just now";
  if (diff < 60 * 1e3) return Math.round(diff / 1e3) + "s ago";
  if (diff < 60 * 60 * 1e3) return Math.round(diff / 6e4) + "m ago";
  if (diff < 24 * 60 * 60 * 1e3) return Math.round(diff / 36e5) + "h ago";
  return Math.round(diff / 864e5) + "d ago";
}
const QR_PAYLOAD_PREFIX = "DMQR1:";
const QR_PAYLOAD_PREFIX_RAW = "DMQR1R:";
export const QR_MAX_BYTES = 2700;
const _scriptLoadCache = {};
export function loadExternalScript(src, globalCheck) {
  if (globalCheck && globalCheck()) return Promise.resolve();
  if (_scriptLoadCache[src]) return _scriptLoadCache[src];
  _scriptLoadCache[src] = new Promise((resolve, reject) => {
    const el = document.createElement("script");
    el.src = src;
    el.async = true;
    el.onload = () => resolve();
    el.onerror = () => {
      delete _scriptLoadCache[src];
      reject(new Error("Failed to load " + src));
    };
    document.head.appendChild(el);
  });
  return _scriptLoadCache[src];
}
function bytesToBase64Url(bytes) {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function base64UrlToBytes(str) {
  let s = str.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  const bin = atob(s);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
async function gzipCompress(str) {
  const input = new TextEncoder().encode(str);
  if (typeof CompressionStream === "undefined") return input;
  const cs = new CompressionStream("gzip");
  const writer = cs.writable.getWriter();
  writer.write(input);
  writer.close();
  const chunks = [];
  const reader = cs.readable.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  let total = 0;
  chunks.forEach((c) => (total += c.length));
  const out = new Uint8Array(total);
  let off = 0;
  chunks.forEach((c) => {
    out.set(c, off);
    off += c.length;
  });
  return out;
}
async function gunzipDecompress(bytes) {
  if (typeof DecompressionStream === "undefined") return new TextDecoder().decode(bytes);
  const ds = new DecompressionStream("gzip");
  const writer = ds.writable.getWriter();
  writer.write(bytes).catch(() => {});
  writer.close().catch(() => {});
  const chunks = [];
  const reader = ds.readable.getReader();
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.length;
    if (received > 8e6) {
      try {
        await reader.cancel();
      } catch (e) {}
      throw new Error("This code is too large to import.");
    }
    chunks.push(value);
  }
  let total = 0;
  chunks.forEach((c) => (total += c.length));
  const out = new Uint8Array(total);
  let off = 0;
  chunks.forEach((c) => {
    out.set(c, off);
    off += c.length;
  });
  return new TextDecoder().decode(out);
}
function stackToQRPayloadObject(stack) {
  return {
    n: stack.name || "",
    e: stack.emoji || "book",
    w: (stack.words || []).map((w) => [
      w.de || "",
      w.en || "",
      w.type || "",
      w.level || "",
      w.article || "",
      w.plural || "",
      w.praeteritum || "",
      w.partizipII || "",
      w.komparativ || "",
      w.superlativ || "",
      w.roman || "",
      w.gender || "",
    ]),
  };
}
export function qrPayloadObjectToStack(data) {
  const d = data && typeof data === "object" ? data : {};
  return dmSanitizeStack({
    id: uid(),
    name: d.n || "Imported stack",
    emoji: d.e || "book",
    words: (Array.isArray(d.w) ? d.w : []).slice(0, DM_LIMITS.wordsPerStack).map((a) => {
      const r = Array.isArray(a) ? a : [];
      return {
        id: uid(),
        de: r[0] || "",
        en: r[1] || "",
        type: r[2] || "other",
        level: r[3] || "",
        article: r[4] || "",
        plural: r[5] || "",
        praeteritum: r[6] || "",
        partizipII: r[7] || "",
        komparativ: r[8] || "",
        superlativ: r[9] || "",
        roman: r[10] || "",
        gender: r[11] || "",
        favorite: false,
        srs: {
          level: 0,
          next: Date.now(),
          correct: 0,
          wrong: 0,
        },
      };
    }),
  });
}
export async function encodeStackForQR(stack) {
  const json = JSON.stringify(stackToQRPayloadObject(stack));
  const gzipSupported = typeof CompressionStream !== "undefined";
  const bytes = gzipSupported ? await gzipCompress(json) : new TextEncoder().encode(json);
  const prefix = gzipSupported ? QR_PAYLOAD_PREFIX : QR_PAYLOAD_PREFIX_RAW;
  const payload = prefix + bytesToBase64Url(bytes);
  return {
    payload,
    byteLength: payload.length,
    wordCount: (stack.words || []).length,
  };
}

// ---- Multi-part QR codes: big stacks are split into several codes shown one after another ----
export const QR_CHUNK_SIZE = 700;
export const QR_MAX_FRAMES = 40;
export function isQRChunk(text) {
  return typeof text === "string" && text.indexOf("WWQR|") === 0;
}
export function splitQRPayload(payload, size) {
  const step = size || QR_CHUNK_SIZE;
  const total = Math.ceil(payload.length / step);
  const id = Math.random().toString(36).slice(2, 8);
  const frames = [];
  for (let i = 0; i < total; i++) {
    frames.push("WWQR|" + id + "|" + (i + 1) + "|" + total + "|" + payload.slice(i * step, (i + 1) * step));
  }
  return frames;
}
// Collects scanned parts (in any order) until all are there.
export function createQRAssembler() {
  let id = null;
  let total = 0;
  let parts = {};
  return {
    add(text) {
      const m = /^WWQR\|([a-z0-9]+)\|(\d+)\|(\d+)\|([\s\S]*)$/.exec(String(text).replace(/\s+/g, ""));
      if (!m) return { error: "That code isn't a valid wwordy code." };
      const n = parseInt(m[3], 10);
      const i = parseInt(m[2], 10);
      if (!n || n > QR_MAX_FRAMES || i < 1 || i > n) return { error: "That code isn't a valid wwordy code." };
      if (id !== m[1] || total !== n) {
        id = m[1];
        total = n;
        parts = {};
      }
      parts[i] = m[4];
      const got = Object.keys(parts).length;
      if (got < total) return { complete: false, got, total };
      let payload = "";
      for (let k = 1; k <= total; k++) payload += parts[k];
      return { complete: true, got, total, payload };
    },
  };
}
export async function decodeQRPayload(text) {
  // Tolerate stray whitespace/newlines and any extra text a user may have
  // accidentally copied alongside the code (e.g. from a chat message).
  const cleaned = (text || "").replace(/\s+/g, "");
  if (cleaned.length > 4e6) throw new Error("This code is too large to import.");
  const match = cleaned.match(/(DMQR1R?:)([A-Za-z0-9\-_]+)/);
  if (!match) throw new Error("Not a wwordy QR code");
  const prefix = match[1];
  const b64 = match[2];
  const bytes = base64UrlToBytes(b64);
  let json;
  if (prefix === QR_PAYLOAD_PREFIX_RAW) {
    // Payload was never gzip-compressed (sender's browser lacked CompressionStream).
    json = new TextDecoder().decode(bytes);
  } else {
    // Payload is gzip-compressed. If this browser can't decompress gzip,
    // fail with a clear message instead of a garbled "invalid stack" error.
    if (typeof DecompressionStream === "undefined") {
      throw new Error(
        "This browser can't decode compressed sync codes. Try updating your browser, or generate the code again on a device that supports it."
      );
    }
    json = await gunzipDecompress(bytes);
  }
  const data = JSON.parse(json);
  if (data && data.t === "family") {
    return {
      __isFamily: true,
      name: dmStr(data.n, 80) || "Imported family",
      emoji: data.e || "family",
      stacks: (Array.isArray(data.s) ? data.s : [])
        .slice(0, DM_LIMITS.families)
        .map(qrPayloadObjectToStack),
    };
  }
  return qrPayloadObjectToStack(data);
}
function familyToQRPayloadObject(familyName, stacksList, familyEmoji) {
  return {
    t: "family",
    n: familyName || "",
    e: familyEmoji || "family",
    s: (stacksList || []).map(stackToQRPayloadObject),
  };
}
export async function encodeFamilyForQR(familyName, stacksList, familyEmoji) {
  const json = JSON.stringify(familyToQRPayloadObject(familyName, stacksList, familyEmoji));
  const gzipSupported = typeof CompressionStream !== "undefined";
  const bytes = gzipSupported ? await gzipCompress(json) : new TextEncoder().encode(json);
  const prefix = gzipSupported ? QR_PAYLOAD_PREFIX : QR_PAYLOAD_PREFIX_RAW;
  const payload = prefix + bytesToBase64Url(bytes);
  const wordCount = (stacksList || []).reduce((s, st) => s + (st.words || []).length, 0);
  return {
    payload,
    byteLength: payload.length,
    wordCount,
    stackCount: (stacksList || []).length,
  };
}
export function downloadTextAsFile(filename, content, mime) {
  const blob = new Blob([content], {
    type: mime,
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
export function safeFileBase(name) {
  return (
    (name || "family")
      .trim()
      .replace(/[^a-z0-9]+/gi, "_")
      .replace(/^_+|_+$/g, "") || "family"
  );
}
export function buildFamilyShareHTML(familyName, familyEmoji, stacksList) {
  const stacksData = (stacksList || []).map((s) => ({
    name: s.name || "Stack",
    words: (s.words || []).map((w) => ({
      de: w.article ? `${w.article} ${stripArticle(w.de || "")}` : w.de || "",
      en: w.en || "",
      article: w.article || "",
    })),
  }));
  const safeName = escapeHtml(familyName || "Family");
  const totalWords = stacksData.reduce((n, s) => n + s.words.length, 0);
  const subLabel = `${stacksData.length} stack${stacksData.length === 1 ? "" : "s"} · ${totalWords} word${totalWords === 1 ? "" : "s"}`;
  const sectionsHtml = stacksData.length
    ? stacksData
        .map((s) => {
          const rows = s.words.length
            ? s.words
                .map(
                  (w) =>
                    `<div class="row"><div class="gender ${genderClass(w.article)}"></div><div class="rde">${escapeHtml(w.de)}</div><div class="ren">${escapeHtml(w.en)}</div></div>`
                )
                .join("")
            : `<div class="empty">No words in this stack yet.</div>`;
          return `<div class="list"><h2>${escapeHtml(s.name)} · ${s.words.length} word${s.words.length === 1 ? "" : "s"}</h2><div>${rows}</div></div>`;
        })
        .join("")
    : `<div class="empty">No stacks in this family yet.</div>`;
  // Embed the full, uncompressed family payload so this file can also be
  // re-imported into wwordy later (via the "Import family from file" option),
  // for cases where scanning a QR code isn't practical.
  let dataJson = JSON.stringify(familyToQRPayloadObject(familyName, stacksList, familyEmoji));
  dataJson = dataJson.replace(/</g, "\\u003C").replace(/>/g, "\\u003E");
  return `<!doctype html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<title>${safeName} · wwordy family</title>
<style>
  :root{--bg:#0a0c11;--surface:#12151c;--border:rgba(255,255,255,0.09);--text:#eef1f6;--text-dim:#8b93a7;--cyan:#6ee7f9;--gold:#ffb020;--green:#34d399;--pink:#ff6b9d;}
  *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
  html,body{margin:0;padding:0;background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;}
  body{min-height:100vh;min-height:100dvh;padding:28px 18px 50px;}
  .wrap{max-width:480px;margin:0 auto;}
  .head{text-align:center;margin-bottom:22px;}
  h1{font-size:21px;margin:0 0 4px;background:linear-gradient(90deg,var(--cyan),var(--gold),var(--green));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;font-weight:800;}
  .sub{color:var(--text-dim);font-size:12.5px;}
  .list{border-top:1px solid var(--border);padding-top:16px;margin-bottom:18px;}
  .list h2{font-size:12.5px;color:var(--text-dim);text-transform:uppercase;letter-spacing:.07em;margin:0 0 10px;font-weight:700;}
  .row{display:flex;align-items:center;gap:10px;padding:11px 4px;border-bottom:1px solid var(--border);}
  .gender{width:8px;height:8px;border-radius:50%;flex-shrink:0;}
  .g-der{background:var(--cyan);}
  .g-die{background:var(--pink);}
  .g-das{background:var(--green);}
  .g-none{background:var(--text-dim);}
  .rde{font-weight:600;flex:1;min-width:0;word-break:break-word;}
  .ren{color:var(--text-dim);font-size:13px;text-align:right;flex-shrink:0;padding-left:8px;}
  .empty{text-align:center;color:var(--text-dim);padding:40px 0;font-size:14px;}
  footer{text-align:center;color:var(--text-dim);font-size:11px;margin-top:32px;opacity:.65;}
</style>
</head>
<body>
<div class="wrap">
  <div class="head">
    <h1>${safeName}</h1>
    <div class="sub">${subLabel}</div>
  </div>
  ${sectionsHtml}
  <footer>Shared from wwordy · re-importable via "Import family from file"</footer>
</div>
<script id="wordifyFamilyData" type="application/json">${dataJson}<\/script>
</body>
</html>`;
}
