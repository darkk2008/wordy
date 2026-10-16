/* components/pickers/pickers.jsx
 * Level picker, direction picker, streak modal, "game unavailable" modal.
 */

import { useState } from "react";
import { createPortal } from "react-dom";
import { LEVELS, LEVEL_COLOR } from "../../core/srs-and-seed-data";
import { IconBtn } from "../common/common";
import { ArrowRight, Flame, X } from "../icons/icons";
import { getLangName } from "../language-settings/language-settings";

export function LevelPicker({ onPick, onClose }) {
  return createPortal(
    <div className="dm-modal-backdrop" onClick={onClose}>
      <div className="dm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="dm-modal-head">
          <h3>Choose a level</h3>
          <IconBtn onClick={onClose}>
            <X size={18} />
          </IconBtn>
        </div>
        <div className="dm-level-pick-grid">
          {LEVELS.map((lv) => (
            <button
              key={lv}
              type="button"
              className="dm-level-pick-btn"
              style={{
                color: LEVEL_COLOR[lv],
                borderColor: (LEVEL_COLOR[lv] || "#8B93A7") + "55",
                background: (LEVEL_COLOR[lv] || "#8B93A7") + "14",
              }}
              onClick={() => onPick(lv)}
            >
              {lv}
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.querySelector(".dm-app") || document.body
  );
}
export function DirectionPicker({ onPick, onClose, learningLanguage, nativeLanguage }) {
  const [closing, setClosing] = useState(false);
  const learnLangName = getLangName(learningLanguage || "de");
  const nativeLangName = getLangName(nativeLanguage || "en");
  const closeWithAnim = () => {
    if (closing) return;
    setClosing(true);
    setTimeout(() => onClose(), 240);
  };
  const pickWithAnim = (direction) => {
    if (closing) return;
    setClosing(true);
    setTimeout(() => onPick(direction), 240);
  };
  return createPortal(
    <div
      className={`dm-modal-backdrop${closing ? " dm-modal-backdrop-closing" : ""}`}
      onClick={closeWithAnim}
    >
      <div
        className={`dm-modal${closing ? " dm-modal-closing" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dm-modal-head">
          <h3>Choose direction</h3>
          <IconBtn onClick={closeWithAnim}>
            <X size={18} />
          </IconBtn>
        </div>
        <div className="dm-direction-row">
          <button className="dm-direction-btn" onClick={() => pickWithAnim("de2en")}>
            <span className="dm-direction-lang">{learnLangName}</span>
            <ArrowRight size={18} />
            <span className="dm-direction-lang">{nativeLangName}</span>
          </button>
          <button className="dm-direction-btn" onClick={() => pickWithAnim("en2de")}>
            <span className="dm-direction-lang">{nativeLangName}</span>
            <ArrowRight size={18} />
            <span className="dm-direction-lang">{learnLangName}</span>
          </button>
        </div>
      </div>
    </div>,
    document.querySelector(".dm-app") || document.body
  );
}
export function gameUnavailableInfo(g, c) {
  const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
  const where = c.scope || "this stack";
  if (g.soon)
    return {
      title: "Coming soon",
      body: `${g.name} isn't available yet — we're still building it.`,
      tip: "",
    };
  if (g.id === "cases")
    return {
      title: "Not enough nouns yet",
      body: `${g.name} practises noun cases, so it needs at least 4 nouns with an article (like “das Haus”) in ${where}. You have ${plural(c.nounCount, "noun", "nouns")} so far.`,
      tip: "Add nouns with their article to unlock it.",
    };
  if (g.id === "ladder")
    return {
      title: "Not enough verbs yet",
      body: `${g.name} needs at least 4 verbs in ${where}. You have ${plural(c.verbCount, "verb", "verbs")} so far.`,
      tip: "Add more verbs to unlock it.",
    };
  if (g.id === "tensemixer")
    return {
      title: "No verbs yet",
      body: `${g.name} needs at least 1 verb in ${where}.`,
      tip: "Add a verb to unlock it.",
    };
  if (g.id === "adjendings")
    return {
      title: "No adjectives yet",
      body: `${g.name} needs at least 1 word marked as an adjective in ${where}.`,
      tip: "Add an adjective (or set a word's type to Adjective) to unlock it.",
    };
  if (g.id === "speedforms" || g.id === "wordforms")
    return {
      title: "No words with forms yet",
      body: `${g.name} needs at least 1 word that has forms to practise: a noun with a plural, a verb, or an adjective with comparative/superlative forms.`,
      tip: "Fill in word forms (or let the AI Tutor autofill them) to unlock it.",
    };
  if (g.id === "paradigm")
    return {
      title: "No suitable words yet",
      body: `${g.name} needs at least 1 noun, verb or adjective in ${where}.`,
      tip: "Add one of those word types to unlock it.",
    };
  return {
    title: "Not enough words yet",
    body: `${g.name} needs at least 4 words in ${where}. You have ${plural(c.total, "word", "words")} so far.`,
    tip: "Add more words to unlock it.",
  };
}
export function StreakModal({ streak, bestStreak, todayReviews, dailyGoal, onClose }) {
  const [closing, setClosing] = useState(false);
  const closeWithAnim = () => {
    if (closing) return;
    setClosing(true);
    setTimeout(() => onClose(), 240);
  };
  const DAYMS = 864e5;
  const days = Array.from(
    {
      length: 7,
    },
    (_, i) => {
      const k = 6 - i;
      const d = new Date(Date.now() - k * DAYMS);
      return {
        k,
        label: d.toLocaleDateString(undefined, {
          weekday: "narrow",
        }),
        active: k < streak,
        today: k === 0,
      };
    }
  );
  const milestones = [3, 7, 14, 30, 50, 100, 200, 365, 500, 1000];
  const next = milestones.find((m) => m > streak);
  const prev = [...milestones].reverse().find((m) => m <= streak) || 0;
  const best = Math.max(bestStreak || 0, streak || 0);
  const goal = dailyGoal || 0;
  const done = todayReviews || 0;
  const goalPct = goal ? Math.min(100, Math.round((done / goal) * 100)) : 0;
  const nextPct = next ? Math.max(4, Math.round(((streak - prev) / (next - prev)) * 100)) : 100;
  const dayWord = (n) => (n === 1 ? "day" : "days");
  return createPortal(
    <div
      className={`dm-modal-backdrop${closing ? " dm-modal-backdrop-closing" : ""}`}
      onClick={closeWithAnim}
    >
      <div
        className={`dm-modal dm-streak-modal${closing ? " dm-modal-closing" : ""}`}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dm-modal-head">
          <h3>Your streak</h3>
          <IconBtn onClick={closeWithAnim}>
            <X size={18} />
          </IconBtn>
        </div>
        <div className="dm-streak-hero">
          <div className="dm-streak-hero-flame">
            <Flame size={30} color="#FF3B5C" />
          </div>
          <div className="dm-streak-hero-num">{streak}</div>
          <div className="dm-streak-hero-label">{`${dayWord(streak)} in a row`}</div>
          <div className="dm-streak-hero-best">
            {best > streak ? `Best: ${best} ${dayWord(best)}` : "This is your best streak so far"}
          </div>
        </div>
        <div className="dm-streak-week">
          {days.map((d) => (
            <div
              key={d.k}
              className={`dm-streak-day${d.active ? " dm-streak-day-on" : ""}${d.today ? " dm-streak-day-today" : ""}`}
            >
              <span className="dm-streak-day-label">{d.label}</span>
              <span className="dm-streak-day-dot">
                {d.active ? <Flame size={15} color="#FF3B5C" /> : null}
              </span>
            </div>
          ))}
        </div>
        {goal > 0 && (
          <div className="dm-streak-block">
            <div className="dm-streak-block-row">
              <span>Today's goal</span>
              <strong>{`${Math.min(done, goal)} / ${goal} reviews`}</strong>
            </div>
            <div className="dm-streak-bar">
              <div
                className="dm-streak-bar-fill dm-streak-bar-goal"
                style={{
                  width: `${goalPct}%`,
                }}
              />
            </div>
          </div>
        )}
        {next ? (
          <div className="dm-streak-block">
            <div className="dm-streak-block-row">
              <span>Next milestone</span>
              <strong>{`${next} days · ${next - streak} to go`}</strong>
            </div>
            <div className="dm-streak-bar">
              <div
                className="dm-streak-bar-fill"
                style={{
                  width: `${nextPct}%`,
                }}
              />
            </div>
          </div>
        ) : (
          <div className="dm-streak-block dm-streak-block-note">
            You've passed every milestone. Legendary.
          </div>
        )}
        <p className="dm-streak-hint">Open the app every day to keep your streak going.</p>
        <button className="dm-btn-primary" onClick={closeWithAnim}>
          Got it
        </button>
      </div>
    </div>,
    document.querySelector(".dm-app") || document.body
  );
}
export function GameUnavailableModal({ game, info, onClose }) {
  const [closing, setClosing] = useState(false);
  const closeWithAnim = () => {
    if (closing) return;
    setClosing(true);
    setTimeout(() => onClose(), 240);
  };
  return createPortal(
    <div
      className={`dm-modal-backdrop${closing ? " dm-modal-backdrop-closing" : ""}`}
      onClick={closeWithAnim}
    >
      <div
        className={`dm-modal dm-game-unavailable${closing ? " dm-modal-closing" : ""}`}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dm-modal-head">
          <h3>{game.name}</h3>
          <IconBtn onClick={closeWithAnim}>
            <X size={18} />
          </IconBtn>
        </div>
        <div className="dm-game-unavailable-icon">{game.icon}</div>
        <div className="dm-game-unavailable-title">{info.title}</div>
        <p className="dm-game-unavailable-body">{info.body}</p>
        {info.tip && <p className="dm-game-unavailable-tip">{info.tip}</p>}
        <button className="dm-btn-primary" onClick={closeWithAnim}>
          Got it
        </button>
      </div>
    </div>,
    document.querySelector(".dm-app") || document.body
  );
}
