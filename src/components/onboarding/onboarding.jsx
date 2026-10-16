/* components/onboarding/onboarding.jsx
 * First-run onboarding flow.
 */

import { Fragment, useMemo, useState } from "react";
import { ONBOARDING_LOGO_SRC } from "../../assets/inline-images";
import { speak } from "../../core/speech-voices";
import { seedWord } from "../../core/srs-and-seed-data";
import { FREE_THEME_LIMIT } from "../../services/premium-gems-store";
import { THEMES } from "../appearance-settings/appearance-settings";
import { AppLogo } from "../common/common";
import { CardsIcon, Check, Flame, Gamepad2, Plus, Volume2 } from "../icons/icons";
import { FlagIcon, LANGUAGES, getLangAbbr } from "../language-settings/language-settings";
import { WordFormsLine } from "../word-forms/word-forms";

function AnimatedText({ text, tag = "span", startDelay = 0, step = 0.045, className }) {
  const Tag = tag;
  const words = text.split(" ");
  return (
    <Tag className={className}>
      {words.map((w, i) => (
        <span
          key={`${i}-${w}`}
          className="dm-onboard-word"
          style={{
            animationDelay: `${startDelay + i * step}s`,
          }}
        >
          {w + (i < words.length - 1 ? "\xA0" : "")}
        </span>
      ))}
    </Tag>
  );
}
const ONBOARD_SAMPLE_FORMS = {
  en: {
    plural: "cats",
  },
  de: {
    article: "die",
    plural: "Katzen",
  },
  es: {
    article: "el",
    plural: "gatos",
  },
  fr: {
    article: "le",
    plural: "chats",
  },
  it: {
    article: "il",
    plural: "gatti",
  },
  pt: {
    article: "o",
    plural: "gatos",
  },
  nl: {
    plural: "katten",
  },
  pl: {
    plural: "koty",
  },
  sv: {
    plural: "katter",
  },
  tr: {
    plural: "kediler",
  },
  ru: {
    plural: "кошки",
  },
  uk: {
    plural: "коти",
  },
  uz: {
    plural: "mushuklar",
  },
  ar: {
    plural: "قطط",
  },
  hi: {
    plural: "बिल्लियाँ",
  },
  zh: {
    plural: "猫们",
  },
  ja: {
    plural: "猫たち",
  },
  ko: {
    plural: "고양이들",
  },
};
function buildOnboardingSample(learningLanguage, nativeLanguage) {
  const learn = learningLanguage || "de";
  const native = nativeLanguage || "en";
  const f = ONBOARD_SAMPLE_FORMS[learn] || {};
  return {
    id: "onboarding-sample",
    de: seedWord("cat", learn),
    en: seedWord("cat", native),
    type: "noun",
    level: "A1",
    article: f.article || "",
    plural: f.plural || "",
  };
}
function OnboardingFlashcard({ sample, learningLanguage, nativeLanguage }) {
  const [flipped, setFlipped] = useState(false);
  const learn = LANGUAGES.find((l) => l.code === learningLanguage) || LANGUAGES[1];
  const native = LANGUAGES.find((l) => l.code === nativeLanguage) || LANGUAGES[0];
  const toggle = () => setFlipped((f) => !f);
  const chip = (lang) => (
    <span className="dm-onboard-flip-lang notranslate" translate="no">
      <FlagIcon code={lang.flagCode} className="dm-onboard-flip-flag" />
      {lang.name}
    </span>
  );
  const frontWord = sample.article ? `${sample.article} ${sample.de}` : sample.de;
  return (
    <>
      <div
        className="dm-flip-wrap dm-onboard-flip"
        role="button"
        tabIndex={0}
        aria-pressed={flipped}
        aria-label="Flashcard. Tap to flip."
        onClick={toggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggle();
          }
        }}
      >
        <div className={`dm-flipcard ${flipped ? "dm-flipped" : ""}`}>
          <div className="dm-flip-face dm-flip-front">
            {chip(learn)}
            <span className="dm-flip-word">{frontWord}</span>
            <span className="dm-flip-hint">Tap to reveal</span>
          </div>
          <div className="dm-flip-face dm-flip-back">
            {chip(native)}
            <span className="dm-flip-word">{sample.en}</span>
            <button
              type="button"
              className="dm-speak-btn"
              onClick={(e) => {
                e.stopPropagation();
                speak(sample.de);
              }}
            >
              <Volume2 size={16} />
              <span className="notranslate" translate="no">
                {" " + sample.de}
              </span>
            </button>
            <span className="dm-flip-hint">Tap to flip back</span>
          </div>
        </div>
      </div>
      <p className="dm-onboard-caption">
        {flipped
          ? "The other side shows the translation. Tap again to flip back."
          : "The front shows the word you're learning. Tap the card to flip it."}
      </p>
    </>
  );
}
function OnboardingFilterDemo({ sample, learningLanguage, nativeLanguage }) {
  const [mode, setMode] = useState("BOTH");
  const modes = [
    {
      id: "LEARN",
      tab: getLangAbbr(learningLanguage),
      note: "Only the word you're learning — try to recall its meaning.",
    },
    {
      id: "NATIVE",
      tab: getLangAbbr(nativeLanguage),
      note: "Only the translation — try to recall the word.",
    },
    {
      id: "BOTH",
      tab: "BOTH",
      note: "The word and its translation, side by side.",
    },
    {
      id: "FORMS",
      tab: "FORMS",
      note: "The word's forms (plural, cases & tenses) — test yourself on them.",
    },
  ];
  const active = modes.find((m) => m.id === mode) || modes[2];
  const showWord = mode !== "NATIVE";
  const showTranslation = mode === "BOTH" || mode === "NATIVE";
  return (
    <>
      <div
        className="dm-segmented dm-onboard-filterdemo"
        role="group"
        aria-label="Word display mode"
      >
        {modes.map((m) => (
          <button
            key={m.id}
            type="button"
            aria-pressed={mode === m.id}
            className={`dm-seg ${mode === m.id ? "dm-seg-active" : ""}`}
            onClick={() => setMode(m.id)}
          >
            {m.tab}
          </button>
        ))}
      </div>
      <div className="dm-card dm-onboard-samplecard">
        <div className="dm-card-left dm-onboard-swap" key={mode} onClick={() => speak(sample.de)}>
          <span className="dm-word-pair">
            {showWord && <span className="dm-de">{sample.de}</span>}
            {showTranslation && (
              <span className={`dm-en${mode === "NATIVE" ? " dm-en-solo" : ""}`}>{sample.en}</span>
            )}
          </span>
          {mode === "FORMS" && <WordFormsLine w={sample} showAudio={false} />}
        </div>
      </div>
      <p className="dm-onboard-caption">{active.note}</p>
    </>
  );
}
export function OnboardingFlow({
  nativeLanguage,
  learningLanguage,
  onSetNativeLanguage,
  onSetLearningLanguage,
  theme,
  onSelectTheme,
  starterStack,
  onSetStarterStack,
  onFinish,
}) {
  const [step, setStep] = useState(0);
  const sample = useMemo(
    () => buildOnboardingSample(learningLanguage, nativeLanguage),
    [learningLanguage, nativeLanguage]
  );
  const steps = ["welcome", "native", "learning", "theme", "stacks", "cards", "filters"];
  const total = steps.length;
  const go = (delta) => setStep((s) => Math.max(0, Math.min(total - 1, s + delta)));
  const isLast = step === total - 1;
  let body;
  if (steps[step] === "welcome") {
    body = (
      <div className="dm-onboard-step dm-onboard-welcome">
        <div className="dm-onboard-logo-frame dm-onboard-fade">
          <AppLogo
            size={72}
            animated
            learningLanguage={learningLanguage}
            src={ONBOARDING_LOGO_SRC}
            hideFlag
          />
        </div>
        <AnimatedText
          tag="h1"
          text="Welcome to wwordy!"
          className="dm-onboard-title"
          startDelay={0.15}
        />
        <p className="dm-onboard-sub dm-onboard-fade dm-onboard-delay-3">
          A quick setup so your flashcards feel right for you — about a minute.
        </p>
        <div className="dm-onboard-highlights dm-onboard-fade dm-onboard-delay-4">
          <div className="dm-onboard-highlight">
            <CardsIcon size={17} />
            <span>Flashcards</span>
          </div>
          <div className="dm-onboard-highlight">
            <Gamepad2 size={17} />
            <span>Games</span>
          </div>
          <div className="dm-onboard-highlight">
            <Flame size={17} />
            <span>Streaks</span>
          </div>
        </div>
      </div>
    );
  } else if (steps[step] === "native") {
    body = (
      <div className="dm-onboard-step">
        <AnimatedText tag="h2" text="What's your native language?" className="dm-onboard-title" />
        <p className="dm-onboard-sub dm-onboard-fade dm-onboard-delay-2">
          We'll use this for translations and the filter labels around the app.
        </p>
        <div className="dm-onboard-lang-grid">
          {LANGUAGES.map((l, i) => (
            <button
              key={l.code}
              type="button"
              className={`dm-onboard-lang-card ${nativeLanguage === l.code ? "dm-onboard-lang-card-active" : ""} dm-onboard-fade`}
              style={{
                animationDelay: `${0.32 + i * 0.045}s`,
              }}
              onClick={() => onSetNativeLanguage(l.code)}
            >
              <FlagIcon code={l.flagCode} className="dm-onboard-lang-flag" />
              <span>{l.name}</span>
              {nativeLanguage === l.code && <Check size={14} className="dm-onboard-lang-check" />}
            </button>
          ))}
        </div>
      </div>
    );
  } else if (steps[step] === "learning") {
    body = (
      <div className="dm-onboard-step">
        <AnimatedText
          tag="h2"
          text="Which language are you learning?"
          className="dm-onboard-title"
        />
        <p className="dm-onboard-sub dm-onboard-fade dm-onboard-delay-2">
          This sets your flashcards, games, and the flag on your logo.
        </p>
        <div className="dm-onboard-lang-grid">
          {LANGUAGES.map((l, i) => (
            <button
              key={l.code}
              type="button"
              className={`dm-onboard-lang-card ${learningLanguage === l.code ? "dm-onboard-lang-card-active" : ""} dm-onboard-fade`}
              style={{
                animationDelay: `${0.32 + i * 0.045}s`,
              }}
              onClick={() => onSetLearningLanguage(l.code)}
            >
              <FlagIcon code={l.flagCode} className="dm-onboard-lang-flag" />
              <span>{l.name}</span>
              {learningLanguage === l.code && <Check size={14} className="dm-onboard-lang-check" />}
            </button>
          ))}
        </div>
      </div>
    );
  } else if (steps[step] === "theme") {
    body = (
      <div className="dm-onboard-step">
        <AnimatedText tag="h2" text="Pick a look" className="dm-onboard-title" />
        <p className="dm-onboard-sub dm-onboard-fade dm-onboard-delay-2">
          You can always change this later in Settings.
        </p>
        <div className="dm-onboard-theme-grid">
          {THEMES.slice(0, FREE_THEME_LIMIT).map((t, i) => (
            <button
              key={t.id}
              type="button"
              className={`dm-theme-card dm-onboard-theme-card ${theme === t.id ? "dm-theme-card-active" : ""} dm-onboard-fade`}
              style={{
                animationDelay: `${0.32 + i * 0.045}s`,
              }}
              onClick={() => onSelectTheme(t.id)}
            >
              <span
                className="dm-theme-swatch"
                style={{
                  background: t.swatch,
                  borderColor: t.accent,
                }}
              >
                <span
                  className="dm-theme-swatch-dot"
                  style={{
                    background: t.accent,
                  }}
                />
              </span>
              <span className="dm-theme-name">{t.name}</span>
              {theme === t.id && <Check size={14} className="dm-theme-check" />}
            </button>
          ))}
        </div>
      </div>
    );
  } else if (steps[step] === "stacks") {
    body = (
      <div className="dm-onboard-step">
        <AnimatedText tag="h2" text="Your first stack" className="dm-onboard-title" />
        <p className="dm-onboard-sub dm-onboard-fade dm-onboard-delay-2">
          A stack is a themed set of flashcards. Start with a ready-made one, or begin with a clean
          slate.
        </p>
        <div className="dm-onboard-visual dm-onboard-fade dm-onboard-delay-3">
          <div className={`dm-onboard-stackdemo ${starterStack ? "" : "dm-onboard-stackdemo-off"}`}>
            <span className="dm-onboard-stackdemo-emoji">{starterStack ? "\uD83D\uDCD8" : "\u2795"}</span>
            <div className="dm-onboard-stackdemo-text">
              <span className="dm-onboard-stackdemo-name">
                {starterStack ? "A1 Basics" : "No stacks yet"}
              </span>
              <span className="dm-onboard-stackdemo-count">
                {starterStack ? "6 words \u00B7 ready on Home" : "Tap + on Home to create your own"}
              </span>
            </div>
          </div>
          <div
            className={`dm-onboard-toggle-row ${starterStack ? "dm-onboard-toggle-row-on" : ""}`}
            style={{ "--guard-color": "var(--cyan)" }}
          >
            <div className="dm-onboard-toggle-text">
              <span className="dm-onboard-toggle-title">Add a starter stack</span>
              <span className="dm-onboard-toggle-sub">
                {starterStack
                  ? "A1 Basics will appear on Home automatically."
                  : "Home will start empty \u2014 no stacks added."}
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={!!starterStack}
              aria-label="Add a starter stack"
              className={`dm-guard-switch ${starterStack ? "dm-guard-switch-on" : ""}`}
              onClick={() => onSetStarterStack(!starterStack)}
            >
              <span className="dm-guard-switch-knob">
                <Check size={12} />
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  } else if (steps[step] === "cards") {
    body = (
      <div className="dm-onboard-step">
        <AnimatedText tag="h2" text="Browsing your cards" className="dm-onboard-title" />
        <p className="dm-onboard-sub dm-onboard-fade dm-onboard-delay-2">
          Tap a card to flip it — try it below. In your word lists, swipe a card down to pin it to
          your mini stack for focused review.
        </p>
        <div className="dm-onboard-visual dm-onboard-fade dm-onboard-delay-3">
          <OnboardingFlashcard
            sample={sample}
            learningLanguage={learningLanguage}
            nativeLanguage={nativeLanguage}
          />
        </div>
      </div>
    );
  } else if (steps[step] === "filters") {
    body = (
      <div className="dm-onboard-step">
        <AnimatedText tag="h2" text="Four ways to view a word" className="dm-onboard-title" />
        <p className="dm-onboard-sub dm-onboard-fade dm-onboard-delay-2">
          Every word list has this filter bar — tap each mode to see how the word changes.
        </p>
        <div className="dm-onboard-visual dm-onboard-fade dm-onboard-delay-3">
          <OnboardingFilterDemo
            sample={sample}
            learningLanguage={learningLanguage}
            nativeLanguage={nativeLanguage}
          />
        </div>
      </div>
    );
  }
  const stepLabels = {
    welcome: "Welcome",
    native: "Language",
    learning: "Learning",
    theme: "Appearance",
    stacks: "Stacks",
    cards: "Cards",
    filters: "Filters",
  };
  return (
    <div className="dm-onboard-backdrop">
      <div className="dm-onboard-modal" role="dialog" aria-modal="true" aria-label="Welcome to wwordy">
        <div className="dm-onboard-grabber" aria-hidden="true" />
        <div className="dm-onboard-header">
          <div className="dm-onboard-stepcount">
            <span className="dm-onboard-stepcount-num">{`${step + 1}/${total}`}</span>
            <span className="dm-onboard-stepcount-label">{stepLabels[steps[step]]}</span>
          </div>
          {!isLast && (
            <button type="button" className="dm-onboard-skip" onClick={onFinish}>
              Skip
            </button>
          )}
        </div>
        <div
          className="dm-onboard-progress"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={total}
          aria-valuenow={step + 1}
        >
          {steps.map((_, i) => (
            <span
              key={i}
              className={`dm-onboard-progress-seg ${i <= step ? "dm-onboard-progress-seg-on" : ""}`}
            />
          ))}
        </div>
        <div className="dm-onboard-scroll">
          <div className="dm-onboard-body" key={step}>
            {body}
          </div>
        </div>
        <div className="dm-onboard-actions">
          {step > 0 && (
            <button type="button" className="dm-btn-secondary dm-onboard-back" onClick={() => go(-1)}>
              Back
            </button>
          )}
          <button
            type="button"
            className="dm-btn-primary dm-onboard-next"
            onClick={() => (isLast ? onFinish() : go(1))}
          >
            {isLast ? "Get started" : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
