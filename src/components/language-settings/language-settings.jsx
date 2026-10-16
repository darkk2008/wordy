/* components/language-settings/language-settings.jsx
 * Language list and LanguagesSettings screen.
 */

import { useEffect, useRef, useState } from "react";
import { ROMAN_LANGS } from "../../core/constants";
import { dmSetRomanizationEnabled, useRomanizationEnabled } from "../../core/speech-voices";
import { IconBtn } from "../common/common";
import { FormsToggle } from "../games/setup-controls";
import { ArrowRight, Check, ChevronLeft } from "../icons/icons";

export const LANGUAGES = [
  {
    code: "en",
    name: "English",
    flagCode: "gb",
  },
  {
    code: "de",
    name: "German",
    flagCode: "de",
  },
  {
    code: "es",
    name: "Spanish",
    flagCode: "es",
  },
  {
    code: "fr",
    name: "French",
    flagCode: "fr",
  },
  {
    code: "it",
    name: "Italian",
    flagCode: "it",
  },
  {
    code: "pt",
    name: "Portuguese",
    flagCode: "pt",
  },
  {
    code: "nl",
    name: "Dutch",
    flagCode: "nl",
  },
  {
    code: "pl",
    name: "Polish",
    flagCode: "pl",
  },
  {
    code: "sv",
    name: "Swedish",
    flagCode: "se",
  },
  {
    code: "tr",
    name: "Turkish",
    flagCode: "tr",
  },
  {
    code: "ru",
    name: "Russian",
    flagCode: "ru",
  },
  {
    code: "uk",
    name: "Ukrainian",
    flagCode: "ua",
  },
  {
    code: "uz",
    name: "Uzbek",
    flagCode: "uz",
  },
  {
    code: "ar",
    name: "Arabic",
    flagCode: "sa",
  },
  {
    code: "hi",
    name: "Hindi",
    flagCode: "in",
  },
  {
    code: "zh",
    name: "Chinese",
    flagCode: "cn",
  },
  {
    code: "ja",
    name: "Japanese",
    flagCode: "jp",
  },
  {
    code: "ko",
    name: "Korean",
    flagCode: "kr",
  },
];
export function getLangAbbr(code) {
  const lang = LANGUAGES.find((l) => l.code === code);
  return lang ? lang.name.slice(0, 3).toUpperCase() : (code || "").toUpperCase();
}
export function getLangName(code) {
  const lang = LANGUAGES.find((l) => l.code === code);
  return lang ? lang.name : (code || "").toUpperCase();
}
export function FlagIcon({ code, className }) {
  return <span className={`fi fi-${code} dm-flag-icon ${className || ""}`} />;
}
function LanguageCard({ label, lang, value, open, onToggle, onPick }) {
  return (
    <div
      className={`dm-settings-card dm-lang-card ${open ? "dm-lang-card-open" : ""}`}
      role="button"
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
    >
      <div className="dm-settings-card-name">{label}</div>
      <div className="dm-lang-card-row">
        <FlagIcon code={lang.flagCode} className="dm-lang-card-flag" />
        <div className="dm-settings-card-desc">{lang.name}</div>
      </div>
      {open && (
        <div
          className="dm-dropdown-panel dm-lang-dropdown-panel"
          role="listbox"
          onClick={(e) => e.stopPropagation()}
        >
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              type="button"
              role="option"
              aria-selected={l.code === value}
              className={`dm-dropdown-item ${l.code === value ? "dm-dropdown-item-active" : ""}`}
              onClick={() => onPick(l.code)}
            >
              <span className="dm-dropdown-item-label">
                <FlagIcon code={l.flagCode} className="dm-lang-flag-sm" />
                {l.name}
              </span>
              {l.code === value && <Check size={15} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
export function LanguagesSettings({
  onBack,
  nativeLanguage,
  learningLanguage,
  onSetNativeLanguage,
  onSetLearningLanguage,
}) {
  const [openField, setOpenField] = useState(null);
  const romanizationEnabled = useRomanizationEnabled();
  const toggleRomanization = (val) => dmSetRomanizationEnabled(val);
  const wrapRef = useRef(null);
  useEffect(() => {
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpenField(null);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);
  const nativeLang = LANGUAGES.find((l) => l.code === nativeLanguage) || LANGUAGES[0];
  const learningLang = LANGUAGES.find((l) => l.code === learningLanguage) || LANGUAGES[1];
  return (
    <div className="dm-view dm-settings-subview">
      <div className="dm-topbar">
        <IconBtn onClick={onBack}>
          <ChevronLeft size={20} />
        </IconBtn>
        <div className="dm-topbar-title">Languages</div>
      </div>
      <p className="dm-settings-hint">
        Set the language you already know and the one you're learning. This is just remembered for
        later — it doesn't change anything else in the app yet.
      </p>
      <div ref={wrapRef} className="dm-lang-wrap">
        <div className="dm-lang-preview">
          <button
            type="button"
            className="dm-lang-preview-side"
            onClick={() => setOpenField((f) => (f === "native" ? null : "native"))}
          >
            <FlagIcon code={nativeLang.flagCode} className="dm-lang-preview-flag" />
            <span className="dm-lang-preview-name">{nativeLang.name}</span>
          </button>
          <ArrowRight size={18} className="dm-lang-preview-arrow" />
          <button
            type="button"
            className="dm-lang-preview-side"
            onClick={() => setOpenField((f) => (f === "learning" ? null : "learning"))}
          >
            <FlagIcon code={learningLang.flagCode} className="dm-lang-preview-flag" />
            <span className="dm-lang-preview-name">{learningLang.name}</span>
          </button>
        </div>
        <div className="dm-settings-grid dm-lang-grid">
          <LanguageCard
            label="Native language"
            lang={nativeLang}
            value={nativeLanguage}
            open={openField === "native"}
            onToggle={() => setOpenField((f) => (f === "native" ? null : "native"))}
            onPick={(code) => {
              onSetNativeLanguage(code);
              setOpenField(null);
            }}
          />
          <LanguageCard
            label="Learning language"
            lang={learningLang}
            value={learningLanguage}
            open={openField === "learning"}
            onToggle={() => setOpenField((f) => (f === "learning" ? null : "learning"))}
            onPick={(code) => {
              onSetLearningLanguage(code);
              setOpenField(null);
            }}
          />
        </div>
      </div>
      <div className="dm-settings-section-label">Romanization</div>
      <div className="dm-settings-row">
        <div>
          <div className="dm-settings-row-title">Show romanization</div>
          <div className="dm-settings-row-sub">
            {ROMAN_LANGS[learningLanguage]
              ? `Show ${ROMAN_LANGS[learningLanguage]} alongside ${learningLang.name} words on cards, flashcards, and grammar tables.`
              : "Show a Latin-letter transliteration alongside words, for languages that use a different script. Off by default."}
          </div>
        </div>
        <FormsToggle checked={romanizationEnabled} onChange={toggleRomanization} compact />
      </div>
    </div>
  );
}
