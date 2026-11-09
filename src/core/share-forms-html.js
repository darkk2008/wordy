/* core/share-forms-html.js
 * Pieces shared by the exported (shareable) HTML files:
 *   - a "List | Tables" toggle,
 *   - one forms table per word (noun cases, verb tenses, comparison, ...),
 *   - the CSS and the tiny script that switch between the two views.
 * Kept free of imports from word-modal / sharing-and-export so both can use it.
 */

import { getWordFormSections, stripArticle } from "../components/word-forms/word-forms";

function esc(str) {
  return String(str == null ? "" : str).replace(
    /[&<>"']/g,
    (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]
  );
}

function genderCls(article) {
  if (article === "der") return "g-der";
  if (article === "die") return "g-die";
  if (article === "das") return "g-das";
  return "g-none";
}

const TYPE_LABELS = { noun: "noun", verb: "verb", adj: "adjective" };

// One <table> for a single word: header (word + translation), then every forms section.
export function buildWordTableHtml(w) {
  const de = w.article ? `${w.article} ${stripArticle(w.de || "")}` : w.de || "";
  const meta = [TYPE_LABELS[w.type] || "", w.level || ""].filter(Boolean).join(" · ");
  const sections = getWordFormSections(w);
  const body = sections.length
    ? sections
        .map(
          (s) =>
            `<tr class="sec"><th colspan="2">${esc(s.title)}</th></tr>` +
            s.rows
              .map(
                (r) =>
                  `<tr><td class="lab">${esc(r.label)}</td><td class="val">${esc(r.value)}</td></tr>`
              )
              .join("")
        )
        .join("")
    : `<tr><td class="none" colspan="2">No inflected forms for this word.</td></tr>`;
  return (
    `<table class="wtab"><thead><tr><th colspan="2">` +
    `<div class="wt-head"><span class="gender ${genderCls(w.article)}"></span>` +
    `<span class="wt-de">${esc(de)}</span><span class="wt-en">${esc(w.en || "")}</span></div>` +
    (meta ? `<div class="wt-meta">${esc(meta)}</div>` : "") +
    `</th></tr></thead><tbody>${body}</tbody></table>`
  );
}

// A whole stack in "tables" mode. `heading` is optional (the single-stack file has none).
export function buildStackTablesHtml(words, heading) {
  const list = words || [];
  const inner = list.length
    ? list.map(buildWordTableHtml).join("")
    : `<div class="empty">No words in this stack yet.</div>`;
  return `<div class="list">${heading ? `<h2>${esc(heading)}</h2>` : ""}${inner}</div>`;
}

export function buildModeBarHtml() {
  return (
    `<div class="modebar" role="group" aria-label="View">` +
    `<button type="button" class="on" data-mode="list" aria-pressed="true">☰ Word list</button>` +
    `<button type="button" data-mode="tables" aria-pressed="false">▦ Forms tables</button>` +
    `</div>`
  );
}

export const SHARE_TOGGLE_CSS = `
  .modebar{display:none;gap:4px;background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:4px;margin:0 0 20px;}
  .tg-ready .modebar{display:flex;}
  .modebar button{flex:1;font-family:inherit;font-size:13px;font-weight:600;color:var(--text-dim);background:transparent;border:0;border-radius:10px;padding:10px 8px;min-height:40px;cursor:pointer;transition:background .15s ease,color .15s ease;}
  .modebar button.on{background:rgba(110,231,249,0.14);color:var(--text);box-shadow:0 0 0 1px rgba(110,231,249,0.25) inset;}
  .view-tables{display:none;}
  body.mode-tables .view-list{display:none;}
  body.mode-tables .view-tables{display:block;}
  .wtab{width:100%;border-collapse:separate;border-spacing:0;background:var(--surface);border:1px solid var(--border);border-radius:16px;overflow:hidden;margin:0 0 14px;font-size:14px;}
  .wtab th,.wtab td{padding:9px 14px;text-align:left;vertical-align:baseline;}
  .wtab thead th{background:linear-gradient(160deg,rgba(110,231,249,0.12),rgba(255,255,255,0.02));border-bottom:1px solid var(--border);padding:13px 14px;}
  .wt-head{display:flex;align-items:center;gap:10px;}
  .wt-de{font-weight:800;font-size:17px;flex:1;min-width:0;word-break:break-word;}
  .wt-en{color:var(--text-dim);font-weight:600;font-size:13px;text-align:right;max-width:45%;word-break:break-word;}
  .wt-meta{color:var(--text-dim);font-size:11px;letter-spacing:.06em;text-transform:uppercase;margin:5px 0 0 18px;font-weight:600;}
  .wtab tr.sec th{font-size:11px;color:var(--gold);text-transform:uppercase;letter-spacing:.08em;font-weight:700;padding:11px 14px 5px;background:transparent;}
  .wtab td{border-top:1px solid var(--border);}
  .wtab td.lab{color:var(--text-dim);font-size:12.5px;width:38%;white-space:nowrap;}
  .wtab td.val{font-weight:600;word-break:break-word;}
  .wtab td.none{color:var(--text-dim);font-size:13px;text-align:center;padding:14px;border-top:0;}
`;

// Plain ES5, no template placeholders: safe to drop inside the exported file's <script>.
export const SHARE_TOGGLE_SCRIPT = `(function(){
  try {
    var KEY = "wwordy-share-view";
    var btns = document.querySelectorAll(".modebar button");
    if (!btns.length) return;
    document.documentElement.className += " tg-ready";
    function setMode(m) {
      document.body.classList.toggle("mode-tables", m === "tables");
      for (var i = 0; i < btns.length; i++) {
        var on = btns[i].getAttribute("data-mode") === m;
        btns[i].classList.toggle("on", on);
        btns[i].setAttribute("aria-pressed", on ? "true" : "false");
      }
      try { localStorage.setItem(KEY, m); } catch (e) {}
    }
    for (var i = 0; i < btns.length; i++) {
      btns[i].addEventListener("click", function () { setMode(this.getAttribute("data-mode")); });
    }
    var saved = "list";
    try { saved = localStorage.getItem(KEY) === "tables" ? "tables" : "list"; } catch (e) {}
    setMode(saved);
  } catch (e) {}
})();`;
