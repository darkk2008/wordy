/* components/games/games-hub.jsx
 * GamesHub (game selection screen) and ReviewGamePicker.
 */

import { useEffect, useState } from "react";
import { IconBtn } from "../common/common";
import { ChevronDown, TableIcon, Type, X } from "../icons/icons";
import { LockIcon } from "../icons/settings-icons";
import {
  DirectionPicker,
  GameUnavailableModal,
  LevelPicker,
  gameUnavailableInfo,
} from "../pickers/pickers";
import {
  StackSelect,
  formatCooldownClock,
  getGameCooldownUntil,
} from "../stack-select/stack-select";
import { isRealNoun, isRealVerb } from "./cases-game";
import {
  DIRECTION_GAMES,
  FORMS_ONLY_GAMES,
  FORMS_REQUIRED_GAMES,
  GAME_LIST,
  LEVEL_GAMES,
} from "./games-config";
import { FormsToggle } from "./setup-controls";

export function GamesHub({
  stacks,
  onStart,
  learningLanguage,
  nativeLanguage,
  isPremium,
  onOpenPremium,
  stackId,
  onChangeStackId,
  mixForms,
  onChangeMixForms,
}) {
  const [pendingGame, setPendingGame] = useState(null);
  const [pendingLevelGame, setPendingLevelGame] = useState(null);
  const [unavailableGame, setUnavailableGame] = useState(null);
  const [nowTick, setNowTick] = useState(() => Date.now());
  useEffect(() => {
    if (isPremium) return;
    const t = setInterval(() => setNowTick(Date.now()), 1e3);
    return () => clearInterval(t);
  }, [isPremium]);
  const setStackId = onChangeStackId;
  const setMixForms = onChangeMixForms;
  const [setupCollapsed, setSetupCollapsed] = useState(() => {
    try {
      const stored = window.localStorage.getItem("wf-games-setup-collapsed");
      return stored === null ? true : stored === "1";
    } catch (e) {
      return true;
    }
  });
  const [barSettled, setBarSettled] = useState(setupCollapsed);
  useEffect(() => {
    try {
      window.localStorage.setItem("wf-games-setup-collapsed", setupCollapsed ? "1" : "0");
    } catch (e) {}
    if (!setupCollapsed) {
      setBarSettled(false);
      return;
    }
    const t = setTimeout(() => setBarSettled(true), 480);
    return () => clearTimeout(t);
  }, [setupCollapsed]);
  const stack = stacks.find((s) => s.id === stackId) || stacks[0];
  const nounCount = stack ? stack.words.filter(isRealNoun).length : 0;
  const verbCount = stack ? stack.words.filter(isRealVerb).length : 0;
  const adjCount = stack ? stack.words.filter((w) => w.type === "adj" && w.de).length : 0;
  const formsCapableCount = stack
    ? stack.words.filter(
        (w) =>
          (w.type === "noun" && w.plural) ||
          (w.type === "verb" && w.de) ||
          (w.type === "adj" && (w.komparativ || w.superlativ))
      ).length
    : 0;
  const isPlayable = (g) => {
    if (!stack) return false;
    if (g.id === "cases") return nounCount >= 4;
    if (g.id === "ladder") return verbCount >= 4;
    if (g.id === "tensemixer") return verbCount >= 1;
    if (g.id === "adjendings") return adjCount >= 1;
    if (g.id === "speedforms" || g.id === "wordforms") return formsCapableCount >= 1;
    if (g.id === "paradigm")
      return stack.words.some((w) => w.type === "noun" || w.type === "verb" || w.type === "adj");
    return stack.words.length >= 4;
  };
  const visibleGames = GAME_LIST.filter(
    (g) =>
      (!g.germanOnly || learningLanguage === "de") &&
      (!g.nonGermanOnly || learningLanguage !== "de")
  );
  const isGameUnavailable = (g) => !!g.soon || !isPlayable(g);
  const orderedGames = [
    ...visibleGames.filter((g) => !isGameUnavailable(g)),
    ...visibleGames.filter(isGameUnavailable),
  ];
  return (
    <div className="dm-view">
      <div className="dm-header">
        <div>
          <div className="dm-eyebrow">Train your recall</div>
          <h1 className="dm-h1">Games</h1>
        </div>
      </div>
      <div className={`dm-gsetup${setupCollapsed ? " dm-gsetup-collapsed" : ""}`}>
        <button
          type="button"
          className="dm-gsetup-toggle"
          onClick={() => setSetupCollapsed((c) => !c)}
          aria-expanded={!setupCollapsed}
          aria-controls="dm-gsetup-collapse"
          aria-label={setupCollapsed ? "Show practice settings" : "Hide practice settings"}
          title={setupCollapsed ? "Show practice settings" : "Hide practice settings"}
        >
          <ChevronDown size={17} className="dm-gsetup-toggle-icon" />
        </button>
        <div
          className={`dm-gsetup-bar${setupCollapsed ? " dm-gsetup-bar-open" : ""}${setupCollapsed && barSettled ? " dm-gsetup-bar-settled" : ""}`}
        >
          <div className="dm-gsetup-bar-inner">
            <div className="dm-gsetup-bar-row">
              <StackSelect
                stacks={stacks}
                value={stackId}
                onChange={setStackId}
                variant="dropdown"
                active={setupCollapsed}
              />
              <button
                type="button"
                className={`dm-gsetup-modechip${mixForms ? " dm-gsetup-modechip-on" : ""}`}
                onClick={() => setMixForms(!mixForms)}
                title={
                  mixForms
                    ? "Practicing word forms – tap for whole words"
                    : "Practicing whole words – tap for word forms"
                }
                aria-label={
                  mixForms
                    ? "Practicing word forms. Switch to whole words"
                    : "Practicing whole words. Switch to word forms"
                }
              >
                <span key={mixForms ? "f" : "w"} className="dm-gsetup-modechip-icon">
                  {mixForms ? <TableIcon size={15} /> : <Type size={15} />}
                </span>
                <span className="dm-gsetup-modechip-full">
                  {mixForms ? "Word forms" : "Whole words"}
                </span>
                <span className="dm-gsetup-modechip-short">{mixForms ? "Forms" : "Words"}</span>
              </button>
            </div>
          </div>
        </div>
        <div className="dm-gsetup-collapse" id="dm-gsetup-collapse">
          <div className="dm-gsetup-collapse-inner">
            <div className="dm-gsetup-body">
              <div className="dm-gsetup-stack">
                <label className="dm-label">Practice stack</label>
                <StackSelect
                  stacks={stacks}
                  value={stackId}
                  onChange={setStackId}
                  variant="rail"
                  active={!setupCollapsed}
                />
              </div>
              <div className="dm-gsetup-mode">
                <label className="dm-label dm-gsetup-modelabel">What you practice</label>
                <div
                  className={`dm-forms-toggle-row dm-forms-mix-row ${mixForms ? "dm-forms-toggle-on" : ""}`}
                >
                  <FormsToggle
                    checked={mixForms}
                    onChange={setMixForms}
                    compact
                    title="Play with word forms only"
                  />
                  <span className="dm-forms-mix-label" onClick={() => setMixForms((v) => !v)}>
                    Play all games with word forms only (genitive, plural, tenses, comparatives)
                  </span>
                </div>
                <div className="dm-formsmode" role="radiogroup" aria-label="What you practice">
                  <button
                    type="button"
                    role="radio"
                    aria-checked={!mixForms}
                    tabIndex={mixForms ? -1 : 0}
                    className={`dm-formsmode-btn ${mixForms ? "" : "dm-formsmode-btn-active"}`}
                    onClick={() => setMixForms(false)}
                  >
                    Whole words
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={!!mixForms}
                    tabIndex={mixForms ? 0 : -1}
                    className={`dm-formsmode-btn ${mixForms ? "dm-formsmode-btn-active" : ""}`}
                    onClick={() => setMixForms(true)}
                  >
                    Word forms
                  </button>
                </div>
                <p className="dm-formsmode-hint">
                  {mixForms
                    ? "Every game asks for each word’s key forms — genitive, plural, tense and comparative — instead of whole words."
                    : "Every game asks for the words in this stack, the way you saved them."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="dm-game-grid">
        {orderedGames.map((g) => {
          const locked = !!g.premium && !isPremium;
          const cooldownUntil = isPremium ? 0 : getGameCooldownUntil(g.id);
          const cooldownRemaining = cooldownUntil - nowTick;
          const cooldownLocked = cooldownRemaining > 0;
          return (
            <button
              key={g.id}
              className={`dm-game-card ${locked || cooldownLocked ? "dm-game-card-locked" : ""}${g.soon || !isPlayable(g) ? " dm-game-card-unavailable" : ""}`}
              aria-disabled={g.soon || !isPlayable(g) ? "true" : undefined}
              onClick={() =>
                g.soon || !isPlayable(g)
                  ? setUnavailableGame(g)
                  : locked || cooldownLocked
                    ? onOpenPremium && onOpenPremium()
                    : DIRECTION_GAMES.includes(g.id)
                      ? setPendingGame(g.id)
                      : LEVEL_GAMES.includes(g.id)
                        ? setPendingLevelGame(g.id)
                        : onStart(
                            g.id,
                            stack,
                            undefined,
                            undefined,
                            FORMS_ONLY_GAMES.includes(g.id) && mixForms
                          )
              }
            >
              {g.soon && <div className="dm-game-soon">Soon</div>}
              {locked && (
                <div className="dm-game-lock-badge">
                  <LockIcon size={12} />
                  {" Premium"}
                </div>
              )}
              <div className="dm-game-icon">{g.icon}</div>
              <div className="dm-game-name">{g.name}</div>
              <div className="dm-game-desc">{g.desc}</div>
              {cooldownLocked && (
                <div className="dm-game-cooldown-timer">
                  <LockIcon size={10} />
                  {formatCooldownClock(cooldownRemaining)}
                </div>
              )}
            </button>
          );
        })}
      </div>
      {pendingGame && (
        <DirectionPicker
          onClose={() => setPendingGame(null)}
          learningLanguage={learningLanguage}
          nativeLanguage={nativeLanguage}
          onPick={(direction) => {
            onStart(
              pendingGame,
              stack,
              direction,
              undefined,
              FORMS_ONLY_GAMES.includes(pendingGame) && mixForms
            );
            setPendingGame(null);
          }}
        />
      )}
      {pendingLevelGame && (
        <LevelPicker
          onClose={() => setPendingLevelGame(null)}
          onPick={(level) => {
            onStart(pendingLevelGame, stack, undefined, level);
            setPendingLevelGame(null);
          }}
        />
      )}
      {unavailableGame && (
        <GameUnavailableModal
          game={unavailableGame}
          info={gameUnavailableInfo(unavailableGame, {
            nounCount,
            verbCount,
            adjCount,
            formsCapableCount,
            total: stack ? stack.words.length : 0,
            scope: "this stack",
          })}
          onClose={() => setUnavailableGame(null)}
        />
      )}
    </div>
  );
}
export function ReviewGamePicker({
  words,
  title,
  onClose,
  onStart,
  learningLanguage,
  nativeLanguage,
  isPremium,
  onOpenPremium,
  translationsOnly = false,
}) {
  const [pendingGame, setPendingGame] = useState(null);
  const [pendingLevelGame, setPendingLevelGame] = useState(null);
  const [unavailableGame, setUnavailableGame] = useState(null);
  const nounCount = words.filter(isRealNoun).length;
  const verbCount = words.filter(isRealVerb).length;
  const adjCount = words.filter((w) => w.type === "adj" && w.de).length;
  const formsCapableCount = words.filter(
    (w) =>
      (w.type === "noun" && w.plural) ||
      (w.type === "verb" && w.de) ||
      (w.type === "adj" && (w.komparativ || w.superlativ))
  ).length;
  const isPlayable = (g) => {
    if (g.id === "cases") return nounCount >= 4;
    if (g.id === "ladder") return verbCount >= 4;
    if (g.id === "tensemixer") return verbCount >= 1;
    if (g.id === "adjendings") return adjCount >= 1;
    if (g.id === "speedforms" || g.id === "wordforms") return formsCapableCount >= 1;
    if (g.id === "paradigm")
      return words.some((w) => w.type === "noun" || w.type === "verb" || w.type === "adj");
    return words.length >= 4;
  };
  const visibleGames = GAME_LIST.filter(
    (g) =>
      (!g.germanOnly || learningLanguage === "de") &&
      (!g.nonGermanOnly || learningLanguage !== "de") &&
      !(translationsOnly && FORMS_REQUIRED_GAMES.includes(g.id))
  );
  const isGameUnavailable = (g) => !!g.soon || !isPlayable(g);
  const orderedGames = [
    ...visibleGames.filter((g) => !isGameUnavailable(g)),
    ...visibleGames.filter(isGameUnavailable),
  ];
  return (
    <div className="dm-modal-backdrop" onClick={onClose}>
      <div className="dm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="dm-modal-head">
          <h3>{title || "Choose a game"}</h3>
          <IconBtn onClick={onClose}>
            <X size={18} />
          </IconBtn>
        </div>
        <div className="dm-game-grid">
          {orderedGames.map((g) => {
            const locked = !!g.premium && !isPremium;
            return (
              <button
                key={g.id}
                className={`dm-game-card ${locked ? "dm-game-card-locked" : ""}${g.soon || !isPlayable(g) ? " dm-game-card-unavailable" : ""}`}
                aria-disabled={g.soon || !isPlayable(g) ? "true" : undefined}
                onClick={() =>
                  g.soon || !isPlayable(g)
                    ? setUnavailableGame(g)
                    : locked
                      ? onOpenPremium && onOpenPremium()
                      : DIRECTION_GAMES.includes(g.id)
                        ? setPendingGame(g.id)
                        : LEVEL_GAMES.includes(g.id)
                          ? setPendingLevelGame(g.id)
                          : onStart(g.id)
                }
              >
                {g.soon && <div className="dm-game-soon">Soon</div>}
                {locked && (
                  <div className="dm-game-lock-badge">
                    <LockIcon size={12} />
                    {" Premium"}
                  </div>
                )}
                <div className="dm-game-icon">{g.icon}</div>
                <div className="dm-game-name">{g.name}</div>
                <div className="dm-game-desc">{g.desc}</div>
              </button>
            );
          })}
        </div>
        {pendingGame && (
          <DirectionPicker
            onClose={() => setPendingGame(null)}
            learningLanguage={learningLanguage}
            nativeLanguage={nativeLanguage}
            onPick={(direction) => {
              onStart(pendingGame, direction);
              setPendingGame(null);
            }}
          />
        )}
        {pendingLevelGame && (
          <LevelPicker
            onClose={() => setPendingLevelGame(null)}
            onPick={(level) => {
              onStart(pendingLevelGame, undefined, level);
              setPendingLevelGame(null);
            }}
          />
        )}
        {unavailableGame && (
          <GameUnavailableModal
            game={unavailableGame}
            info={gameUnavailableInfo(unavailableGame, {
              nounCount,
              verbCount,
              adjCount,
              formsCapableCount,
              total: words.length,
              scope: "these words",
            })}
            onClose={() => setUnavailableGame(null)}
          />
        )}
      </div>
    </div>
  );
}
