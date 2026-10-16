/* components/word-card/word-card.jsx
 * WordCard: one word row in a stack.
 */

import { useContext, useEffect, useRef, useState } from "react";
import { HideArticlesContext } from "../../core/contexts";
import { useRomanizationEnabled } from "../../core/speech-voices";
import { LEVEL_COLOR } from "../../core/srs-and-seed-data";
import { FitText, IconBtn, WordMeta } from "../common/common";
import {
  Check,
  LadderIcon,
  Languages,
  ListChecksIcon,
  MiniStackIcon,
  MoreVertical,
  Star,
  TableIcon,
  Volume2,
  Zap,
} from "../icons/icons";
import { DmBadgeLock } from "../icons/settings-icons";
import { SwipeableRow } from "../swipeable-row/swipeable-row";
import { WordFormsLine, stripArticle } from "../word-forms/word-forms";

export function WordCard({
  w,
  index,
  displayMode,
  showForms,
  formAudio,
  onToggleFav,
  onEdit,
  onSpeak,
  onShowForms,
  onDrill,
  onToggleMiniStack,
  isInMiniStack,
  multiPickMode,
  isPicked,
  onTogglePicked,
  onEnterMultiPick,
  minimalActions,
  isPremium,
}) {
  const hideArticles = useContext(HideArticlesContext);
  const displayDe = hideArticles ? stripArticle(w.de) : w.de;
  const romanizationEnabled = useRomanizationEnabled();
  const isFormsMode = displayMode === "FORMS";
  const isBothMode = displayMode === "BOTH";
  const [peekTranslation, setPeekTranslation] = useState(false);
  const [peekForms, setPeekForms] = useState(false);
  const [longPressed, setLongPressed] = useState(false);
  const longPressTimerRef = useRef(null);
  const longPressStartRef = useRef({
    x: 0,
    y: 0,
  });
  const justActivatedRef = useRef(false);
  const suppressClickRef = useRef(false);
  const cardElRef = useRef(null);
  const longPressExitTimerRef = useRef(null);
  const cancelPendingTimer = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };
  const cancelExitTimer = () => {
    if (longPressExitTimerRef.current) {
      clearTimeout(longPressExitTimerRef.current);
      longPressExitTimerRef.current = null;
    }
  };
  const resetLongPress = () => {
    cancelPendingTimer();
    cancelExitTimer();
    justActivatedRef.current = false;
    setLongPressed(false);
  };
  const startLongPress = (e) => {
    const p = e.touches ? e.touches[0] : e;
    longPressStartRef.current = {
      x: p.clientX,
      y: p.clientY,
    };
    cancelPendingTimer();
    longPressTimerRef.current = setTimeout(() => {
      justActivatedRef.current = true;
      suppressClickRef.current = true;
      longPressTimerRef.current = null;
      setLongPressed(true);
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        try {
          navigator.vibrate(12);
        } catch (e) {}
      }
    }, 420);
  };
  const moveLongPress = (e) => {
    const p = e.touches ? e.touches[0] : e;
    const dx = p.clientX - longPressStartRef.current.x;
    const dy = p.clientY - longPressStartRef.current.y;
    if (longPressTimerRef.current) {
      if (Math.hypot(dx, dy) > 10) cancelPendingTimer();
      return;
    }
    if (justActivatedRef.current && Math.hypot(dx, dy) > 10) {
      justActivatedRef.current = false;
    }
  };
  const endLongPress = () => {
    if (justActivatedRef.current) {
      justActivatedRef.current = false;
      return;
    }
    if (longPressTimerRef.current) {
      cancelPendingTimer();
      return;
    }
    if (longPressed) {
      cancelExitTimer();
      longPressExitTimerRef.current = setTimeout(() => {
        longPressExitTimerRef.current = null;
        setLongPressed(false);
      }, 400);
    }
  };
  useEffect(() => {
    if (!longPressed) return;
    const handleOutside = (e) => {
      if (cardElRef.current && !cardElRef.current.contains(e.target)) resetLongPress();
    };
    document.addEventListener("pointerdown", handleOutside);
    return () => document.removeEventListener("pointerdown", handleOutside);
  }, [longPressed]);
  useEffect(
    () => () => {
      cancelPendingTimer();
      cancelExitTimer();
    },
    []
  );
  useEffect(() => {
    if (multiPickMode) resetLongPress();
  }, [multiPickMode]);
  const canPeekTranslation = displayMode === "GER" || displayMode === "ENG" || isFormsMode;
  const canPeekForms = displayMode === "GER" || displayMode === "ENG" || isBothMode;
  const showTranslationPill = (displayMode === "GER" || displayMode === "ENG") && peekTranslation;
  const hideWordForForms = peekForms && isBothMode;
  const showDE = isFormsMode ? true : displayMode !== "ENG";
  const showEN = isFormsMode ? peekTranslation : displayMode !== "GER" && !hideWordForForms;
  const peekValue = displayMode === "GER" ? w.en : displayDe;
  const swipeActions = [];
  if (canPeekTranslation) {
    swipeActions.push({
      key: "translate",
      label: peekTranslation ? "Hide translation" : "Show translation",
      tone: "cyan",
      active: peekTranslation,
      icon: <Languages size={18} />,
      onClick: () => setPeekTranslation((p) => !p),
    });
  }
  if (canPeekForms) {
    swipeActions.push({
      key: "peekForms",
      label: peekForms ? "Hide forms preview" : "Show forms preview",
      tone: "gold",
      active: peekForms,
      icon: <LadderIcon size={18} />,
      onClick: () => setPeekForms((p) => !p),
    });
  }
  const showMetaBelow = isFormsMode
    ? !peekTranslation
    : isBothMode
      ? (showForms !== false || peekForms) && !hideWordForForms
      : showForms !== false || peekForms;
  const leftActions = [];
  if (onDrill) {
    leftActions.push({
      key: "drill",
      label: "Quiz this word",
      tone: "green",
      icon: <Zap size={18} />,
      onClick: () => onDrill(w),
    });
  }
  const downActions = [
    {
      key: "ministack",
      label: isInMiniStack ? "Remove from mini stack" : "Add to mini stack",
      tone: isInMiniStack ? "green" : "default",
      active: isInMiniStack,
      icon: isInMiniStack ? <Check size={18} /> : <MiniStackIcon size={18} />,
      onClick: () => {
        if (onToggleMiniStack) onToggleMiniStack(w);
      },
    },
  ];
  if (onEnterMultiPick) {
    downActions.push({
      key: "multipick",
      label: "Select multiple",
      tone: "cyan",
      icon: <ListChecksIcon size={18} />,
      onClick: () => {
        onEnterMultiPick(w);
      },
    });
  }
  const pickedLeftActions = [
    {
      key: "picked",
      label: isPicked ? "Picked" : "Tap to pick",
      tone: "green",
      active: true,
      icon: <Check size={18} />,
      onClick: () => {
        if (onTogglePicked) onTogglePicked(w);
      },
    },
  ];
  return (
    <SwipeableRow
      actions={longPressed || multiPickMode ? [] : swipeActions}
      leftActions={multiPickMode ? pickedLeftActions : longPressed ? [] : leftActions}
      downActions={multiPickMode ? [] : downActions}
      downEnabled={longPressed && !multiPickMode}
      forcedOpenSide={multiPickMode ? (isPicked ? "left" : "none") : undefined}
      disableGestures={multiPickMode}
    >
      <div
        className={`dm-card${longPressed ? " dm-card-longpress" : ""}${multiPickMode ? " dm-card-multipick" : ""}${multiPickMode && isPicked ? " dm-card-picked" : ""}`}
        ref={cardElRef}
        onPointerDown={multiPickMode ? undefined : startLongPress}
        onPointerMove={multiPickMode ? undefined : moveLongPress}
        onPointerUp={multiPickMode ? undefined : endLongPress}
        onPointerCancel={multiPickMode ? undefined : resetLongPress}
        onContextMenu={(e) => e.preventDefault()}
        onClick={
          multiPickMode
            ? () => {
                if (onTogglePicked) onTogglePicked(w);
              }
            : undefined
        }
      >
        <div
          className="dm-card-left"
          onClick={
            multiPickMode
              ? undefined
              : () => {
                  if (suppressClickRef.current) {
                    suppressClickRef.current = false;
                    return;
                  }
                  onSpeak(w.de);
                }
          }
        >
          {(index !== undefined || w.level) && (
            <div className="dm-card-badges">
              {index !== undefined && <span className="dm-card-index">{index}</span>}
              {w.level && (
                <span
                  className="dm-level-badge"
                  style={{
                    color: LEVEL_COLOR[w.level],
                    borderColor: LEVEL_COLOR[w.level] + "55",
                    background: LEVEL_COLOR[w.level] + "1a",
                  }}
                >
                  {w.level}
                </span>
              )}
            </div>
          )}
          <span className="dm-word-pair">
            {showDE && <FitText className="dm-de">{displayDe}</FitText>}
            {showDE &&
              romanizationEnabled &&
              w.roman &&
              (isPremium ? (
                <span className="dm-roman-inline">{w.roman}</span>
              ) : (
                <span
                  className="dm-roman-inline dm-roman-locked"
                  title="Unlock romanization with Premium"
                >
                  <Star size={10} fill="currentColor" />
                  {" Premium"}
                </span>
              ))}
            {showEN && (
              <FitText className={`dm-en${displayMode === "ENG" ? " dm-en-solo" : ""}`}>
                {w.en}
              </FitText>
            )}
            {showTranslationPill && <span className="dm-peek-translation">{peekValue}</span>}
            {hideWordForForms && <WordFormsLine w={w} showAudio={!!formAudio} inline />}
          </span>
          {showMetaBelow &&
            (isFormsMode || peekForms ? (
              <WordFormsLine w={w} showAudio={!!formAudio} />
            ) : (
              <WordMeta w={w} />
            ))}
        </div>
        <div
          className="dm-card-actions"
          style={
            multiPickMode
              ? {
                  pointerEvents: "none",
                  opacity: 0.35,
                }
              : undefined
          }
        >
          <IconBtn title="Pronounce" onClick={() => onSpeak(w.de)}>
            <Volume2 size={17} />
          </IconBtn>
          {!minimalActions && (
            <IconBtn title="Favorite" active={w.favorite} onClick={() => onToggleFav(w.id)}>
              <Star
                size={17}
                fill={w.favorite ? "#FFB020" : "none"}
                color={w.favorite ? "#FFB020" : undefined}
              />
            </IconBtn>
          )}
          {!isFormsMode && (w.type === "noun" || w.type === "verb" || w.type === "adj") && (
            <IconBtn
              title={isPremium ? "All forms" : "All forms (Premium)"}
              onClick={() => onShowForms(w)}
            >
              <span className="dm-forms-btn-icon-wrap">
                <TableIcon size={17} />
                {!isPremium && (
                  <span className="dm-premium-badge-dot">
                    <DmBadgeLock size={10} />
                  </span>
                )}
              </span>
            </IconBtn>
          )}
          {!minimalActions && (
            <IconBtn title="Edit" onClick={() => onEdit(w)}>
              <MoreVertical size={17} />
            </IconBtn>
          )}
        </div>
      </div>
    </SwipeableRow>
  );
}
