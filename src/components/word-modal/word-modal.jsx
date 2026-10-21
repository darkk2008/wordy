/* components/word-modal/word-modal.jsx
 * WordModal (add/edit word) and the shareable-HTML builder.
 */

import { Fragment, useState } from "react";
import {
  DM_DE_FORM_RULES,
  DM_DE_SPELLING_RULES,
  GENDER_SETS,
  ROMAN_LANGS,
  uid,
  usesGenderTag,
} from "../../core/constants";
import {
  GENERIC_GENDER_COLORS,
  LEARNING_LANG_WORD_LABEL,
  currentLearningLangCode,
} from "../../core/speech-voices";
import { ARTICLE_COLOR, LEVELS, LEVEL_COLOR } from "../../core/srs-and-seed-data";
import { dmGroqFetch, dmLowResourceNote, dmParseJson } from "../../services/ai-groq";
import { dmSafeIcon } from "../../services/config-and-validation";
import { IconBtn } from "../common/common";
import { Input } from "../common/Input";
import { Check, Loader2, Sparkles, Trash2, X } from "../icons/icons";
import { getLangName } from "../language-settings/language-settings";
import { mainSuperlativ, stripArticle } from "../word-forms/word-forms";

export function WordModal({
  initial,
  onSave,
  onClose,
  onDelete,
  apiKey,
  onOpenAI,
  nativeLanguage,
}) {
  const nativeLangName = getLangName(nativeLanguage || "en");
  const [de, setDe] = useState(initial?.de || "");
  const [en, setEn] = useState(initial?.en || "");
  const [type, setType] = useState(initial?.type || "other");
  const [level, setLevel] = useState(initial?.level || "");
  const genderOptions = GENDER_SETS[currentLearningLangCode] || null;
  const [article, setArticle] = useState(
    initial?.article || initial?.gender || (genderOptions ? genderOptions[0] : "")
  );
  const [roman, setRoman] = useState(initial?.roman || "");
  const romanName = ROMAN_LANGS[currentLearningLangCode] || "";
  const wordFieldLabel = LEARNING_LANG_WORD_LABEL[currentLearningLangCode] || "Word";
  const [plural, setPlural] = useState(initial?.plural || "");
  const [praeteritum, setPraeteritum] = useState(initial?.praeteritum || "");
  const [partizipII, setPartizipII] = useState(initial?.partizipII || "");
  const [komparativ, setKomparativ] = useState(initial?.komparativ || "");
  const [superlativ, setSuperlativ] = useState(initial?.superlativ || "");
  const [autofillLoading, setAutofillLoading] = useState(false);
  const [autofillError, setAutofillError] = useState("");
  const [closing, setClosing] = useState(false);
  const closeWithAnim = () => {
    if (closing) return;
    setClosing(true);
    setTimeout(() => onClose(), 220);
  };
  const canSave = de.trim() && en.trim();
  const doAutofill = async () => {
    const word = de.trim();
    if (!word || autofillLoading) return;
    if (!apiKey) {
      setAutofillError("");
      if (onOpenAI) onOpenAI();
      return;
    }
    setAutofillLoading(true);
    setAutofillError("");
    try {
      const learningLangName = getLangName(currentLearningLangCode);
      const isDeWord = currentLearningLangCode === "de";
      const articleInstruction = genderOptions
        ? `article (one of ${genderOptions.map((a) => `"${a}"`).join("/")} — REQUIRED if type is noun, else empty string; this is the ${usesGenderTag(currentLearningLangCode) ? "grammatical gender tag: m = masculine, f = feminine, n = neuter" : "grammatical gender article for the word"})`
        : `article (leave as an empty string — ${learningLangName} nouns aren't marked with this field)`;
      const sysPrompt = `You are a ${learningLangName} dictionary and grammar engine built into a vocabulary app. The user gives you a ${learningLangName} word or short phrase (it may already be in dictionary base form, or not — normalize it). Respond ONLY with a single JSON object (no prose, no markdown fences) with these exact keys: en (a concise translation in ${nativeLangName}), type (one of "noun", "verb", "adj", "other"), level (CEFR: one of "A1","A2","B1","B2","C1","C2", chosen honestly based on real difficulty/frequency), ${articleInstruction}, plural (REQUIRED if type is noun, else empty string; the bare plural form with no article), praeteritum (REQUIRED if type is verb and ${isDeWord ? "German has this simple-past form" : "the language has a simple/preterite past tense"}, else empty string), partizipII (REQUIRED if type is verb, else empty string; the past-participle form), komparativ (REQUIRED if type is adj and gradable, else empty string; the bare comparative form), superlativ (REQUIRED if type is adj and gradable, else empty string; the superlative form; for German give the -ste form used before a noun WITHOUT \"am\", e.g. \"schnellste\")${romanName ? `, roman (REQUIRED for every word: the ${romanName} of the word in Latin letters, never a translation)` : ""}. Never leave grammar fields blank when required by the type and applicable to ${learningLangName}.${isDeWord ? ` ${DM_DE_FORM_RULES} ${DM_DE_SPELLING_RULES}return the same JSON with en set to a short question naming the candidates (for example "Did you mean X or Y?"), type "other", and every other field an empty string.` : ""}`;
      const res = await dmGroqFetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          messages: [
            {
              role: "system",
              content: sysPrompt,
            },
            {
              role: "user",
              content: word,
            },
          ],
          temperature: 0.3,
          response_format: {
            type: "json_object",
          },
        }),
      });
      if (!res.ok) {
        let msg = `Request failed (${res.status})`;
        try {
          const errJson = await res.json();
          if (errJson?.error?.message) msg = errJson.error.message;
        } catch (e) {}
        throw new Error(msg);
      }
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error("(no response)");
      let parsed;
      try {
        parsed = dmParseJson(content);
      } catch (e) {
        throw new Error("Couldn't parse the response. Try again.");
      }
      if (parsed.en) setEn(parsed.en);
      if (parsed.type) setType(parsed.type);
      if (parsed.level) setLevel(parsed.level);
      if (parsed.article) {
        const ga = String(parsed.article).toLowerCase().trim();
        if (!genderOptions || genderOptions.includes(ga)) setArticle(ga);
      }
      if (romanName && parsed.roman) setRoman(String(parsed.roman).trim());
      setPlural(parsed.plural || "");
      setPraeteritum(parsed.praeteritum || "");
      setPartizipII(parsed.partizipII || "");
      setKomparativ(parsed.komparativ || "");
      setSuperlativ(mainSuperlativ(parsed.superlativ || ""));
    } catch (e) {
      setAutofillError(e.message || "Something went wrong. Try again.");
    } finally {
      setAutofillLoading(false);
    }
  };
  const submitWord = () => {
    if (!canSave) return;
    onSave({
      id: initial?.id || uid(),
      de: de.trim(),
      en: en.trim(),
      type,
      level,
      article: type === "noun" && !usesGenderTag(currentLearningLangCode) ? article : "",
      gender: type === "noun" && usesGenderTag(currentLearningLangCode) ? article : "",
      roman: romanName ? roman.trim() : "",
      ...(initial && initial.paradigm && String(initial.de || "") === de.trim()
        ? {
            paradigm: initial.paradigm,
          }
        : {}),
      plural: type === "noun" ? plural : "",
      praeteritum: type === "verb" ? praeteritum : "",
      partizipII: type === "verb" ? partizipII : "",
      auxiliary: type === "verb" && initial && initial.auxiliary ? initial.auxiliary : "",
      komparativ: type === "adj" ? komparativ : "",
      superlativ: type === "adj" ? superlativ : "",
      favorite: initial?.favorite || false,
      srs: initial?.srs || {
        level: 0,
        next: Date.now(),
        correct: 0,
        wrong: 0,
      },
    });
  };
  const wordFieldKeyDown = (e) => {
    if (e.key === "Enter") submitWord();
    else if (e.key === "Escape") closeWithAnim();
  };
  return (
    <div
      className={`dm-modal-backdrop dm-modal-review-backdrop${closing ? " dm-modal-backdrop-closing" : ""}`}
      onClick={closeWithAnim}
    >
      <div
        className={`dm-modal dm-modal-review${closing ? " dm-modal-closing" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dm-modal-head">
          <h3>{initial ? "Edit word" : "Add word"}</h3>
          <IconBtn onClick={closeWithAnim}>
            <X size={18} />
          </IconBtn>
        </div>
        <label className="dm-label">{wordFieldLabel}</label>
        <Input
          className="dm-input"
          value={de}
          onChange={(e) => setDe(e.target.value)}
          placeholder={currentLearningLangCode === "de" ? "z.B. anbieten" : "e.g. anbieten"}
          autoFocus
          onKeyDown={wordFieldKeyDown}
        />
        <button
          type="button"
          className="dm-autofill-btn"
          disabled={!de.trim() || autofillLoading}
          onClick={doAutofill}
        >
          {autofillLoading ? (
            <Loader2 size={15} className="dm-autofill-spin" />
          ) : (
            <Sparkles size={15} />
          )}
          {autofillLoading ? " Filling…" : " Auto-fill grammar (AI)"}
        </button>
        {autofillError && <div className="dm-autofill-error">{autofillError}</div>}
        {!apiKey && (
          <div className="dm-autofill-hint">
            Add a Groq API key in the AI Tutor to use auto-fill.
          </div>
        )}
        {dmLowResourceNote() && <div className="dm-autofill-hint">{dmLowResourceNote()}</div>}
        {romanName && (
          <>
            <label className="dm-label">{"Romanization (" + romanName + ")"}</label>
            <Input
              className="dm-input"
              value={roman}
              onChange={(e) => setRoman(e.target.value)}
              placeholder="e.g. ni hao"
              onKeyDown={wordFieldKeyDown}
            />
          </>
        )}
        <label className="dm-label">Translation</label>
        <Input
          className="dm-input"
          value={en}
          onChange={(e) => setEn(e.target.value)}
          placeholder="e.g. to offer"
          onKeyDown={wordFieldKeyDown}
        />
        <label className="dm-label">Word type</label>
        <div className="dm-segmented">
          {["noun", "verb", "adj", "other"].map((t) => (
            <button
              key={t}
              className={`dm-seg ${type === t ? "dm-seg-active" : ""}`}
              onClick={() => setType(t)}
            >
              {t === "noun" ? "Noun" : t === "verb" ? "Verb" : t === "adj" ? "Adj." : "Other"}
            </button>
          ))}
        </div>
        <label className="dm-label">Level (CEFR)</label>
        <div className="dm-segmented dm-level-segmented">
          {["", ...LEVELS].map((l) => (
            <button
              key={l || "none"}
              className={`dm-seg ${level === l ? "dm-seg-active" : ""}`}
              style={
                l && level === l
                  ? {
                      color: LEVEL_COLOR[l],
                    }
                  : {}
              }
              onClick={() => setLevel(l)}
            >
              {l || "—"}
            </button>
          ))}
        </div>
        {type === "noun" && (
          <>
            {genderOptions && (
              <>
                <label className="dm-label">Article / gender</label>
                <div className="dm-segmented">
                  {genderOptions.map((a, gi) => (
                    <button
                      key={a}
                      className={`dm-seg ${article === a ? "dm-seg-active" : ""}`}
                      style={
                        article === a
                          ? {
                              borderColor:
                                ARTICLE_COLOR[a] ||
                                GENERIC_GENDER_COLORS[gi % GENERIC_GENDER_COLORS.length],
                              color:
                                ARTICLE_COLOR[a] ||
                                GENERIC_GENDER_COLORS[gi % GENERIC_GENDER_COLORS.length],
                            }
                          : {}
                      }
                      onClick={() => setArticle(a)}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </>
            )}
            <label className="dm-label">Plural form</label>
            <Input
              className="dm-input"
              value={plural}
              onChange={(e) => setPlural(e.target.value)}
              placeholder={currentLearningLangCode === "de" ? "e.g. Häuser" : "e.g. plural form"}
              onKeyDown={wordFieldKeyDown}
            />
          </>
        )}
        {type === "verb" && (
          <>
            <label className="dm-label">
              {currentLearningLangCode === "de" ? "Präteritum" : "Past tense form"}
            </label>
            <Input
              className="dm-input"
              value={praeteritum}
              onChange={(e) => setPraeteritum(e.target.value)}
              placeholder={
                currentLearningLangCode === "de" ? "e.g. begann" : "e.g. past tense form"
              }
              onKeyDown={wordFieldKeyDown}
            />
            <label className="dm-label">
              {currentLearningLangCode === "de" ? "Partizip II" : "Participle / perfect form"}
            </label>
            <Input
              className="dm-input"
              value={partizipII}
              onChange={(e) => setPartizipII(e.target.value)}
              placeholder={
                currentLearningLangCode === "de" ? "e.g. begonnen" : "e.g. participle form"
              }
              onKeyDown={wordFieldKeyDown}
            />
          </>
        )}
        {type === "adj" && (
          <>
            <label className="dm-label">Comparative</label>
            <Input
              className="dm-input"
              value={komparativ}
              onChange={(e) => setKomparativ(e.target.value)}
              placeholder="e.g. schneller"
              onKeyDown={wordFieldKeyDown}
            />
            <label className="dm-label">Superlative</label>
            <Input
              className="dm-input"
              value={superlativ}
              onChange={(e) => setSuperlativ(e.target.value)}
              placeholder="e.g. schnellste"
              onKeyDown={wordFieldKeyDown}
            />
          </>
        )}
        <div className="dm-modal-actions">
          {initial && (
            <button className="dm-btn-danger" onClick={() => onDelete(initial.id)}>
              <Trash2 size={16} />
              {" Delete"}
            </button>
          )}
          <button className="dm-btn-primary" disabled={!canSave} onClick={submitWord}>
            <Check size={16} />
            {" Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
export function escapeHtml(str) {
  return String(str || "").replace(
    /[&<>"']/g,
    (ch) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[ch]
  );
}
export function genderClass(article) {
  if (article === "der") return "g-der";
  if (article === "die") return "g-die";
  if (article === "das") return "g-das";
  return "g-none";
}
export function buildShareHTML(stackData) {
  const words = stackData.words.map((w) => ({
    de: w.article ? `${w.article} ${stripArticle(w.de || "")}` : w.de || "",
    en: w.en || "",
    article: w.article || "",
  }));
  const safeName = escapeHtml(stackData.name || "Vocabulary");
  const emoji = escapeHtml(dmSafeIcon(stackData.emoji, "📚"));
  const wordCountLabel = words.length + (words.length === 1 ? " word" : " words");
  const listRowsHtml = words.length
    ? words
        .map(
          (w) =>
            `<div class="row"><div class="gender ${genderClass(w.article)}"></div><div class="rde">${escapeHtml(w.de)}</div><div class="ren">${escapeHtml(w.en)}</div></div>`
        )
        .join("")
    : `<div class="empty">No words in this stack yet.</div>`;
  let dataJson = JSON.stringify({
    name: stackData.name || "Vocabulary",
    emoji,
    words,
  });
  dataJson = dataJson.replace(/</g, "\\u003C").replace(/>/g, "\\u003E");
  return `<!doctype html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<title>${safeName} · wwordy</title>
<style>
  :root{--bg:#0a0c11;--surface:#12151c;--border:rgba(255,255,255,0.09);--text:#eef1f6;--text-dim:#8b93a7;--cyan:#6ee7f9;--gold:#ffb020;--green:#34d399;--pink:#ff6b9d;}
  *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
  html,body{margin:0;padding:0;background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;}
  body{min-height:100vh;min-height:100dvh;padding:28px 18px 50px;}
  .wrap{max-width:480px;margin:0 auto;}
  .head{text-align:center;margin-bottom:22px;}
  .emoji{font-size:38px;margin-bottom:8px;line-height:1;}
  h1{font-size:21px;margin:0 0 4px;background:linear-gradient(90deg,var(--cyan),var(--gold),var(--green));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;font-weight:800;}
  .sub{color:var(--text-dim);font-size:12.5px;}
  .jshint{color:var(--text-dim);font-size:11.5px;text-align:center;margin:-8px 0 20px;}
  .card-area{perspective:1400px;margin-bottom:16px;}
  .card{position:relative;height:210px;border-radius:24px;cursor:pointer;transform-style:preserve-3d;transition:transform .5s cubic-bezier(.2,.8,.2,1);filter:drop-shadow(0 18px 34px rgba(0,0,0,0.45));}
  .card:active{transform:scale(.98);}
  .card.flipped{transform:rotateY(180deg);}
  .face{position:absolute;inset:0;border-radius:24px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:18px;backface-visibility:hidden;-webkit-backface-visibility:hidden;border:1px solid var(--border);text-align:center;box-shadow:0 1px 0 rgba(255,255,255,0.06) inset, inset 0 0 40px rgba(255,255,255,0.02);}
  .front{background:linear-gradient(160deg,rgba(110,231,249,0.14),rgba(255,255,255,0.02));}
  .back{background:linear-gradient(160deg,rgba(255,176,32,0.16),rgba(255,255,255,0.02));transform:rotateY(180deg);}
  .word{font-size:27px;font-weight:800;overflow-wrap:break-word;max-width:100%;}
  .hint{color:var(--text-dim);font-size:11px;letter-spacing:.08em;text-transform:uppercase;margin-bottom:10px;font-weight:600;}
  .translation{font-size:23px;font-weight:700;overflow-wrap:break-word;max-width:100%;}
  .nav-row{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px;}
  button{font-family:inherit;}
  .nbtn{background:var(--surface);border:1px solid var(--border);color:var(--text);border-radius:14px;padding:13px 18px;min-height:44px;min-width:44px;font-size:17px;cursor:pointer;line-height:1;box-shadow:0 3px 10px -3px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.06) inset;transition:transform .15s ease, box-shadow .15s ease;}
  .nbtn:active{transform:scale(.92);box-shadow:inset 0 2px 4px rgba(0,0,0,0.35);}
  .counter{font-size:12.5px;color:var(--text-dim);font-weight:600;}
  .dots{display:flex;gap:5px;flex-wrap:wrap;justify-content:center;margin:0 0 22px;max-height:20px;overflow:hidden;}
  .dot{width:6px;height:6px;border-radius:50%;background:var(--border);flex-shrink:0;}
  .dot.active{background:var(--cyan);box-shadow:0 0 8px var(--cyan);}
  .toolbar{display:flex;gap:8px;justify-content:center;margin-bottom:28px;flex-wrap:wrap;}
  .tbtn{background:var(--surface);border:1px solid var(--border);color:var(--text-dim);border-radius:12px;padding:9px 14px;font-size:12.5px;cursor:pointer;display:flex;align-items:center;gap:6px;font-weight:600;box-shadow:0 2px 6px -2px rgba(0,0,0,0.4);transition:transform .15s ease, box-shadow .15s ease;}
  .tbtn:active{transform:scale(.95);box-shadow:inset 0 2px 4px rgba(0,0,0,0.3);}
  .list{border-top:1px solid var(--border);padding-top:16px;}
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
  .js-only{display:none;}
  .js-ready .js-only{display:block;}

</style>
</head>
<body>
<div class="wrap">
  <div class="head">
    <div class="emoji">${emoji}</div>
    <h1>${safeName}</h1>
    <div class="sub">${wordCountLabel}</div>
  </div>
  <div id="studyArea" class="js-only"></div>
  <div class="list">
    <h2>All words</h2>
    <div id="listWrap">${listRowsHtml}</div>
  </div>
  <footer>Shared from wwordy · works fully offline</footer>
</div>
<script>
(function(){
  try {
    var DATA = ${dataJson};
    var words = DATA.words || [];
    if (!words.length) return;
    document.documentElement.className += " js-ready";
    var studyArea = document.getElementById("studyArea");
    var order = words.map(function (_, i) { return i; });
    var idx = 0;
    var flipped = false;
    studyArea.innerHTML = '<div class="card-area"><div class="card" id="card"><div class="face front"><div class="hint">German</div><div class="word" id="frontWord"></div></div><div class="face back"><div class="hint">English</div><div class="translation" id="backWord"></div></div></div></div><div class="nav-row"><button class="nbtn" id="prevBtn" aria-label="Previous">‹</button><div class="counter" id="counter"></div><button class="nbtn" id="nextBtn" aria-label="Next">›</button></div><div class="dots" id="dots"></div><div class="toolbar"><button class="tbtn" id="flipBtn">⟲ Flip</button><button class="tbtn" id="shuffleBtn">⥂ Shuffle</button><button class="tbtn" id="speakBtn">🔊 Listen</button></div>';
    var cardEl = document.getElementById("card");
    var frontWord = document.getElementById("frontWord");
    var backWord = document.getElementById("backWord");
    var counter = document.getElementById("counter");
    var dotsWrap = document.getElementById("dots");
    function renderDots() {
      dotsWrap.innerHTML = "";
      for (var i = 0; i < order.length; i++) {
        var d = document.createElement("div");
        d.className = "dot" + (i === idx ? " active" : "");
        dotsWrap.appendChild(d);
      }
    }
    function renderCard() {
      var w = words[order[idx]];
      frontWord.textContent = w.de;
      backWord.textContent = w.en;
      counter.textContent = (idx + 1) + " / " + order.length;
      cardEl.classList.toggle("flipped", flipped);
      renderDots();
    }
    cardEl.addEventListener("click", function () { flipped = !flipped; renderCard(); });
    document.getElementById("flipBtn").addEventListener("click", function () { flipped = !flipped; renderCard(); });
    document.getElementById("prevBtn").addEventListener("click", function () { idx = (idx - 1 + order.length) % order.length; flipped = false; renderCard(); });
    document.getElementById("nextBtn").addEventListener("click", function () { idx = (idx + 1) % order.length; flipped = false; renderCard(); });
    document.getElementById("shuffleBtn").addEventListener("click", function () {
      for (var i = order.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = order[i]; order[i] = order[j]; order[j] = t;
      }
      idx = 0; flipped = false; renderCard();
    });
    document.getElementById("speakBtn").addEventListener("click", function () {
      try {
        var w = words[order[idx]];
        var utter = new SpeechSynthesisUtterance(w.de);
        utter.lang = "de-DE";
        window.speechSynthesis.speak(utter);
      } catch (e) {}
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") document.getElementById("nextBtn").click();
      if (e.key === "ArrowLeft") document.getElementById("prevBtn").click();
      if (e.key === " ") { e.preventDefault(); document.getElementById("flipBtn").click(); }
    });
    renderCard();
  } catch (e) {}
})();
<\/script>
</body>
</html>`;
}
