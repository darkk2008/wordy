/* components/common/common.jsx
 * Shared bits: AnimatedIcon, IconBtn, GenderDot, AppLogo, WordMeta, FitText, form speak/eye buttons.
 */

import { Fragment, useLayoutEffect, useRef, useState } from "react";
import { APP_LOGO_SRC } from "../../assets/inline-images";
import { wordGender } from "../../core/constants";
import { ICON_SVGS, resolveIconId } from "../../core/icon-registry";
import { currentLearningLangCode, speak } from "../../core/speech-voices";
import { ARTICLE_COLOR } from "../../core/srs-and-seed-data";
import { Eye, EyeOff, Volume2 } from "../icons/icons";
import { LANGUAGES } from "../language-settings/language-settings";
import { formatSuperlativ, stripArticle } from "../word-forms/word-forms";

export function AnimatedIcon({ id, size = 24, className = "" }) {
  const resolved = resolveIconId(id);
  return (
    <span
      className={`dm-aicon ${className}`}
      style={{
        width: size,
        height: size,
      }}
      dangerouslySetInnerHTML={{
        __html: ICON_SVGS[resolved],
      }}
    />
  );
}
export function IconBtn({ children, onClick, active, title, style, className }) {
  const stop = (e) => e.stopPropagation();
  return (
    <button
      className={`dm-iconbtn ${active ? "dm-iconbtn-active" : ""} ${className || ""}`}
      onClick={onClick}
      title={title}
      style={style}
      onMouseDown={stop}
      onTouchStart={stop}
      onPointerDown={stop}
    >
      {children}
    </button>
  );
}
function GenderDot({ article }) {
  if (!article || !ARTICLE_COLOR[article]) return null;
  const dot = (
    <span
      className="dm-gdot"
      style={{
        background: ARTICLE_COLOR[article],
      }}
    />
  );
  if (article === "m" || article === "f" || article === "n")
    return (
      <>
        {dot}
        <span className="dm-mono dm-meta-sub">{article}</span>
      </>
    );
  return dot;
}
export function AppLogo({ size, className, animated, learningLanguage, src, hideFlag }) {
  const s = size || 40;
  const logoSrc = src || APP_LOGO_SRC;
  const maskStyle = {
    WebkitMaskImage: `url(${logoSrc})`,
    maskImage: `url(${logoSrc})`,
    WebkitMaskSize: "contain",
    maskSize: "contain",
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    WebkitMaskPosition: "center",
    maskPosition: "center",
  };
  const learningLang = LANGUAGES.find((l) => l.code === learningLanguage);
  const flagCode = learningLang ? learningLang.flagCode : "de";
  return (
    <div
      className={`dm-logo ${className || ""} ${animated ? "dm-logo-animated" : ""}`}
      style={{
        width: s,
        height: s,
      }}
    >
      <div className="dm-logo-motion">
        <img
          src={logoSrc}
          alt="wwordy"
          className="dm-logo-img"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            display: "block",
          }}
        />
        {!hideFlag && <span className={`fi fi-${flagCode} dm-logo-flag`} />}
        {animated && <span className="dm-logo-sweep" style={maskStyle} />}
      </div>
    </div>
  );
}
export function WordMeta({ w }) {
  if (w.type === "noun") {
    const pluralDisplay =
      currentLearningLangCode === "de" ? stripArticle(w.plural || "") : w.plural || "";
    return (
      <div className="dm-meta">
        <GenderDot article={wordGender(w)} />
        {w.plural && (
          <span className="dm-mono dm-meta-sub">
            {currentLearningLangCode === "de" ? "die " : ""}
            {pluralDisplay}
          </span>
        )}
      </div>
    );
  }
  if (w.type === "verb" && (w.praeteritum || w.partizipII)) {
    return (
      <div className="dm-meta">
        <span className="dm-mono dm-meta-sub">{w.praeteritum}</span>
        <span className="dm-meta-arrow">→</span>
        <span className="dm-mono dm-meta-sub">{w.partizipII}</span>
        {w.trennbar && <span className="dm-mono dm-meta-sub">sep.</span>}
        {w.reflexiv && <span className="dm-mono dm-meta-sub">refl.</span>}
      </div>
    );
  }
  if (w.type === "adj" && (w.komparativ || w.superlativ)) {
    return (
      <div className="dm-meta">
        <span className="dm-mono dm-meta-sub">{w.komparativ}</span>
        <span className="dm-meta-arrow">→</span>
        <span className="dm-mono dm-meta-sub">{formatSuperlativ(w.superlativ, w.de || "")}</span>
      </div>
    );
  }
  return null;
}
export function FormSpeakBtn({ text }) {
  if (!text) return null;
  return (
    <button
      className="dm-speak-btn dm-speak-inline dm-form-speak-btn"
      title="Pronounce form"
      onClick={(e) => {
        e.stopPropagation();
        speak(text);
      }}
    >
      <Volume2 size={14} />
    </button>
  );
}
export function FormEyeBtn({ hidden, onToggle, locked }) {
  const [shakeId, setShakeId] = useState(0);
  const handleClick = (e) => {
    e.stopPropagation();
    if (locked) {
      setShakeId((n) => n + 1);
      return;
    }
    onToggle();
  };
  return (
    <button
      className="dm-speak-btn dm-speak-inline dm-form-speak-btn dm-form-eye-btn"
      title={
        locked
          ? "Unlock with Premium to reveal this form"
          : hidden
            ? "Show this form"
            : "Hide this form"
      }
      onClick={handleClick}
    >
      <span
        key={`${hidden ? "off" : "on"}-${shakeId}`}
        className={`dm-eye-toggle${shakeId > 0 ? " dm-eye-shake" : ""}`}
      >
        {hidden ? <EyeOff size={14} /> : <Eye size={14} />}
      </span>
    </button>
  );
}
export function FitText({ className, children }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      el.style.fontSize = "";
      el.style.whiteSpace = "";
      el.style.overflowWrap = "";
      if (el.scrollWidth <= el.clientWidth + 1) return;
      const base = parseFloat(getComputedStyle(el).fontSize) || 16;
      const min = Math.max(11, base * 0.7);
      let size = base;
      while (size > min && el.scrollWidth > el.clientWidth + 1) {
        size = Math.max(min, size - 0.5);
        el.style.fontSize = size + "px";
      }
      if (el.scrollWidth > el.clientWidth + 1) {
        // still too long at the smallest size: wrap instead of cutting the word off
        el.style.whiteSpace = "normal";
        el.style.overflowWrap = "anywhere";
      }
    };
    fit();
    let ro;
    const parent = el.parentElement;
    if (typeof ResizeObserver !== "undefined" && parent) {
      let lastW = parent.clientWidth;
      ro = new ResizeObserver(() => {
        const w = parent.clientWidth;
        if (w !== lastW) {
          lastW = w;
          fit();
        }
      });
      ro.observe(parent);
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
    return () => {
      if (ro) ro.disconnect();
    };
  }, [children]);
  return (
    <span ref={ref} className={className}>
      {children}
    </span>
  );
}
