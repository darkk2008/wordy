/* components/games/game-chrome.jsx
 * GameTopBar and GameDone (shared game header and results screen).
 */

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { IconBtn } from "../common/common";
import { ArrowRight, RotateCcw, X } from "../icons/icons";
import { getLangAbbr } from "../language-settings/language-settings";

export function GameTopBar({
  onExit,
  progress,
  title,
  direction,
  learningLanguage,
  nativeLanguage,
}) {
  const learnAbbr = getLangAbbr(learningLanguage || "de");
  const nativeAbbr = getLangAbbr(nativeLanguage || "en");
  return (
    <div className="dm-topbar">
      <IconBtn onClick={onExit}>
        <X size={20} />
      </IconBtn>
      <div className="dm-topbar-title">
        {title}
        {direction && (
          <span className="dm-direction-badge">
            {direction === "en2de"
              ? `${nativeAbbr} → ${learnAbbr}`
              : `${learnAbbr} → ${nativeAbbr}`}
          </span>
        )}
      </div>
      <div className="dm-progress-pill">{progress}</div>
    </div>
  );
}
export function GameDone({
  onExit,
  onPlayAgain,
  label,
  score,
  onNext,
  nextLabel,
  showRing = true,
}) {
  let percent = null;
  if (score) {
    const m = /^(\d+)\/(\d+)$/.exec(score);
    if (m) {
      const num = parseInt(m[1], 10);
      const den = parseInt(m[2], 10);
      percent = den ? Math.round((num / den) * 100) : 0;
    }
  }
  const displayPercent = percent === null ? 100 : percent;
  const tier = displayPercent >= 80 ? "green" : displayPercent >= 50 ? "gold" : "red";
  const ringColor =
    tier === "green" ? "var(--green)" : tier === "gold" ? "var(--gold)" : "var(--red)";
  const heading =
    tier === "green" ? "Excellent!" : tier === "gold" ? "Good effort!" : "Keep practicing!";
  const rainPalette =
    tier === "green"
      ? ["#43D9A3", "#6EE7F9", "#34D399", "#A7F3D0", "#10B981", "#22D3EE"]
      : tier === "gold"
        ? ["#FFB020", "#FFD666", "#F59E0B", "#FFC94D", "#FF8C42", "#FDE68A"]
        : ["#FF3B5C", "#FF6B9D", "#FF8080", "#F87171", "#E11D48", "#FFA3B3"];
  const rainDrops = useMemo(
    () =>
      Array.from(
        {
          length: 46,
        },
        (_, i) => {
          const shapeRoll = Math.random();
          const shape =
            shapeRoll < 0.34
              ? "dm-done-rain-circle"
              : shapeRoll < 0.67
                ? "dm-done-rain-ribbon"
                : "";
          const isRibbon = shape === "dm-done-rain-ribbon";
          const w = isRibbon ? 5 + Math.random() * 3 : 6 + Math.random() * 6;
          const h = isRibbon ? 12 + Math.random() * 8 : w;
          return {
            key: i,
            shape,
            style: {
              "--x": `${Math.random() * 100}%`,
              "--w": `${w}px`,
              "--h": `${h}px`,
              "--c": rainPalette[i % rainPalette.length],
              "--dur": `${3.6 + Math.random() * 3.4}s`,
              "--delay": `${-Math.random() * 6}s`,
              "--rot0": `${Math.random() * 360}deg`,
              "--rot1": `${(Math.random() < 0.5 ? -1 : 1) * (360 + Math.random() * 360)}deg`,
              "--drift": `${(Math.random() - 0.5) * 160}px`,
            },
          };
        }
      ),
    [tier]
  );
  const [animatedPercent, setAnimatedPercent] = useState(0);
  const rafRef = useRef(null);
  useEffect(() => {
    if (!showRing) {
      setAnimatedPercent(displayPercent);
      return;
    }
    setAnimatedPercent(0);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const duration = 1100;
    const startDelay = 150;
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
    let start = null;
    const tick = (now) => {
      if (start === null) start = now + startDelay;
      const elapsed = now - start;
      if (elapsed < 0) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      const t = Math.min(1, elapsed / duration);
      setAnimatedPercent(Math.round(displayPercent * easeOutCubic(t)));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => rafRef.current && cancelAnimationFrame(rafRef.current);
  }, [displayPercent, showRing]);
  useEffect(() => {
    if (!onNext) return;
    const t = setTimeout(() => onNext(), showRing ? 900 : 0);
    return () => clearTimeout(t);
  }, [onNext, showRing]);
  const sparkles = useMemo(
    () =>
      Array.from(
        {
          length: 14,
        },
        (_, i) => {
          const angle = (i / 14) * Math.PI * 2 + Math.random() * 0.3;
          const radius = 76 + Math.random() * 44;
          return {
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius,
            delay: Math.random() * 2.6,
            duration: 2.4 + Math.random() * 2.2,
            size: 3 + Math.random() * 4,
          };
        }
      ),
    [tier]
  );
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (animatedPercent / 100) * circumference;
  if (onNext && !showRing) {
    return null;
  }
  return (
    <div
      className="dm-game-play dm-game-done"
      style={{
        "--ring-color": ringColor,
      }}
    >
      {tier !== "red" && (
        <div className="dm-done-rain">
          {rainDrops.map((d) => (
            <span key={d.key} className={`dm-done-rain-piece ${d.shape}`} style={d.style} />
          ))}
        </div>
      )}
      <div className="dm-done-glow" />
      <div className="dm-done-ring-wrap">
        <div className="dm-done-sparkles">
          {sparkles.map((s, i) => (
            <span
              key={i}
              className="dm-done-spark"
              style={{
                left: `calc(50% + ${s.x}px)`,
                top: `calc(50% + ${s.y}px)`,
                width: `${s.size}px`,
                height: `${s.size}px`,
                animationDelay: `${s.delay}s`,
                animationDuration: `${s.duration}s`,
              }}
            />
          ))}
        </div>
        <svg viewBox="0 0 120 120" className="dm-done-ring-svg">
          <circle cx={60} cy={60} r={54} className="dm-done-ring-track" />
          <circle
            cx={60}
            cy={60}
            r={54}
            className="dm-done-ring-fill"
            style={{
              stroke: ringColor,
              strokeDasharray: circumference,
              strokeDashoffset: offset,
            }}
          />
        </svg>
        <div className="dm-done-ring-label">{animatedPercent}%</div>
      </div>
      <h2 className="dm-h1 dm-done-heading">{heading}</h2>
      <p className="dm-done-sub">
        {label}
        {" round complete"}
        {percent !== null ? ` — ${score} correct` : ""}.
      </p>
      <div className="dm-done-btn-row">
        {onNext ? (
          <button className="dm-btn-secondary dm-done-again dm-done-exit-only" onClick={onExit}>
            <X size={16} />
            {" Exit quiz"}
          </button>
        ) : (
          <>
            <button className="dm-btn-secondary dm-done-again" onClick={onPlayAgain}>
              <RotateCcw size={16} />
              {" Play again"}
            </button>
            <button className="dm-btn-primary dm-done-back" onClick={onExit}>
              <ArrowRight size={16} />
              {" Back to games"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
