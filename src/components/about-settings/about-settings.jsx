/* components/about-settings/about-settings.jsx
 * About screens, small charts and progress bars.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { ARTICLE_COLOR, LEVEL_COLOR } from "../../core/srs-and-seed-data";
import { IconBtn } from "../common/common";
import {
  Bot,
  Check,
  ChevronDown,
  ChevronLeft,
  Clock,
  Flame,
  Grid3x3,
  Languages,
  Layers,
  Sparkles,
  Star,
  Zap,
} from "../icons/icons";
import { GraduationCap, LockIcon, UsersIcon } from "../icons/settings-icons";

function useRevealOnView() {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setInView(true);
            io.disconnect();
          }
        });
      },
      {
        threshold: 0.2,
        rootMargin: "0px 0px -40px 0px",
      }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, inView];
}
function SplitBar({ segments }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const shown = segments.filter((s) => s.value > 0);
  const [ref, inView] = useRevealOnView();
  return (
    <div className="dm-split-wrap" ref={ref}>
      <div className="dm-split-bar">
        {shown.map((s, i) => (
          <div
            key={s.label}
            className="dm-split-bar-seg dm-fill-js"
            style={{
              width: inView ? `${(s.value / total) * 100}%` : "0%",
              background: s.color,
              transitionDelay: `${i * 0.05}s`,
            }}
          />
        ))}
      </div>
      <div className="dm-split-legend">
        {shown.map((s) => (
          <div key={s.label} className="dm-split-legend-item">
            <span
              className="dm-split-dot"
              style={{
                background: s.color,
              }}
            />
            <span>{s.label}</span>
            <span className="dm-split-legend-count">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
function BarChart({ items }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  const [ref, inView] = useRevealOnView();
  return (
    <div className="dm-barchart" ref={ref}>
      {items.map((it, i) => (
        <div key={it.label} className="dm-barchart-row">
          <div className="dm-barchart-label">{it.label}</div>
          <div className="dm-barchart-track">
            <div
              className="dm-barchart-fill dm-fill-js"
              style={{
                width: inView ? `${(it.value / max) * 100}%` : "0%",
                background: it.color,
                transitionDelay: `${i * 0.05}s`,
              }}
            />
          </div>
          <div className="dm-barchart-value">{it.value}</div>
        </div>
      ))}
    </div>
  );
}
function RevealProgressBar({ pct }) {
  const [ref, inView] = useRevealOnView();
  return (
    <div className="dm-family-progress-track dm-family-progress-track-sm" ref={ref}>
      <div
        className="dm-family-progress-fill dm-fill-js"
        style={{
          width: inView ? `${pct}%` : "0%",
        }}
      />
    </div>
  );
}
export function AboutSettings({
  onBack,
  streak,
  bestStreak,
  totalWords,
  stacks,
  families,
  dueCount,
  todayReviews,
  dailyGoal,
}) {
  const stackList = stacks || [];
  const familyList = families || [];
  const allWords = useMemo(
    () => stackList.reduce((acc, st) => acc.concat(st.words), []),
    [stackList]
  );
  const stackCount = stackList.length;
  const familyCount = familyList.length;
  const mastered = allWords.filter((w) => w.srs && w.srs.level >= 5).length;
  const learning = Math.max(0, totalWords - mastered);
  const masteryPct = totalWords ? Math.round((mastered / totalWords) * 100) : 0;
  const avgPerStack = stackCount ? Math.round(totalWords / stackCount) : 0;
  const biggestStack = stackList.reduce(
    (best, st) => (!best || st.words.length > best.words.length ? st : best),
    null
  );
  const nounCount = allWords.filter((w) => w.article).length;
  const favoriteCount = allWords.filter((w) => w.favorite).length;
  const typeCounts = useMemo(() => {
    const c = {
      noun: 0,
      verb: 0,
      adj: 0,
      other: 0,
    };
    allWords.forEach((w) => {
      const t = w.type && c.hasOwnProperty(w.type) ? w.type : "other";
      c[t]++;
    });
    return c;
  }, [allWords]);
  const genderCounts = useMemo(() => {
    const c = {
      der: 0,
      die: 0,
      das: 0,
    };
    allWords.forEach((w) => {
      if (w.article && c.hasOwnProperty(w.article)) c[w.article]++;
    });
    return c;
  }, [allWords]);
  const levelCounts = useMemo(() => {
    const order = ["A1", "A2", "B1", "B2", "C1", "C2"];
    const c = {};
    order.forEach((lv) => (c[lv] = 0));
    let unrated = 0;
    allWords.forEach((w) => {
      if (w.level && c.hasOwnProperty(w.level)) c[w.level]++;
      else unrated++;
    });
    return {
      order,
      c,
      unrated,
    };
  }, [allWords]);
  return (
    <div className="dm-view dm-settings-subview">
      <div className="dm-topbar">
        <IconBtn onClick={onBack}>
          <ChevronLeft size={20} />
        </IconBtn>
        <div className="dm-topbar-title">Your Stats</div>
      </div>
      <div className="dm-stat-grid">
        <div className="dm-stat-card">
          <div className="dm-stat-icon">
            <Flame size={18} color="#FF3B5C" />
          </div>
          <div className="dm-stat-value">{streak}</div>
          <div className="dm-stat-label">day streak</div>
        </div>
        <div className="dm-stat-card">
          <div className="dm-stat-icon">
            <Zap size={18} color="#FFB020" />
          </div>
          <div className="dm-stat-value">{Math.max(bestStreak || 0, streak || 0)}</div>
          <div className="dm-stat-label">best streak</div>
        </div>
        <div className="dm-stat-card">
          <div className="dm-stat-icon">
            <Sparkles size={18} />
          </div>
          <div className="dm-stat-value">{totalWords}</div>
          <div className="dm-stat-label">words saved</div>
        </div>
        <div className="dm-stat-card">
          <div className="dm-stat-icon">
            <Layers size={18} />
          </div>
          <div className="dm-stat-value">{stackCount}</div>
          <div className="dm-stat-label">{stackCount === 1 ? "stack" : "stacks"}</div>
        </div>
        <div className="dm-stat-card">
          <div className="dm-stat-icon">
            <UsersIcon size={18} />
          </div>
          <div className="dm-stat-value">{familyCount}</div>
          <div className="dm-stat-label">{familyCount === 1 ? "family" : "families"}</div>
        </div>
        <div className="dm-stat-card">
          <div className="dm-stat-icon">
            <Check size={18} />
          </div>
          <div className="dm-stat-value">{mastered}</div>
          <div className="dm-stat-label">mastered</div>
        </div>
        <div className="dm-stat-card">
          <div className="dm-stat-icon">
            <Clock size={18} />
          </div>
          <div className="dm-stat-value">{dueCount || 0}</div>
          <div className="dm-stat-label">due today</div>
        </div>
        <div className="dm-stat-card">
          <div className="dm-stat-icon">
            <Star size={18} color="#FFB020" />
          </div>
          <div className="dm-stat-value">{favoriteCount}</div>
          <div className="dm-stat-label">favorites</div>
        </div>
      </div>
      <div className="dm-settings-section-label">Your progress</div>
      <div className="dm-settings-row">
        <div
          style={{
            width: "100%",
          }}
        >
          <div className="dm-settings-row-title">{`${masteryPct}% mastered overall`}</div>
          <div className="dm-settings-row-sub">{`${mastered} mastered · ${learning} still learning`}</div>
          <RevealProgressBar pct={masteryPct} />
        </div>
      </div>
      {!!dailyGoal && (
        <div className="dm-settings-row">
          <div
            style={{
              width: "100%",
            }}
          >
            <div className="dm-settings-row-title">{`${Math.min(todayReviews || 0, dailyGoal)} / ${dailyGoal} reviews today`}</div>
            <div className="dm-settings-row-sub">
              {(todayReviews || 0) >= dailyGoal
                ? "Daily goal reached — nice work!"
                : `${Math.max(0, dailyGoal - (todayReviews || 0))} more to hit today's goal.`}
            </div>
            <RevealProgressBar
              pct={Math.min(100, Math.round(((todayReviews || 0) / dailyGoal) * 100))}
            />
          </div>
        </div>
      )}
      <div className="dm-settings-section-label">Word types</div>
      <div className="dm-split-card">
        <BarChart
          items={[
            {
              label: "Nouns",
              value: typeCounts.noun,
              color: "var(--cyan)",
            },
            {
              label: "Verbs",
              value: typeCounts.verb,
              color: "var(--gold)",
            },
            {
              label: "Adjectives",
              value: typeCounts.adj,
              color: "var(--green)",
            },
            {
              label: "Other",
              value: typeCounts.other,
              color: "var(--text-dim)",
            },
          ]}
        />
      </div>
      {nounCount > 0 && <div className="dm-settings-section-label">Noun genders</div>}
      {nounCount > 0 && (
        <div className="dm-split-card">
          <BarChart
            items={[
              {
                label: "der",
                value: genderCounts.der,
                color: ARTICLE_COLOR.der,
              },
              {
                label: "die",
                value: genderCounts.die,
                color: ARTICLE_COLOR.die,
              },
              {
                label: "das",
                value: genderCounts.das,
                color: ARTICLE_COLOR.das,
              },
            ]}
          />
        </div>
      )}
      <div className="dm-settings-section-label">CEFR levels</div>
      <div className="dm-split-card">
        <SplitBar
          segments={[
            ...levelCounts.order.map((lv) => ({
              label: lv,
              value: levelCounts.c[lv],
              color: LEVEL_COLOR[lv],
            })),
            {
              label: "Unrated",
              value: levelCounts.unrated,
              color: "var(--text-dim)",
            },
          ]}
        />
      </div>
    </div>
  );
}
export function AppAboutSettings({ onBack }) {
  const [openId, setOpenId] = useState(null);
  const FAQS = [
    {
      id: "stack",
      icon: <Layers size={20} />,
      q: "What is a stack?",
      a: "A stack is a themed set of vocabulary words, like “Kitchen” or “Travel.” You can add words to a stack yourself, import them, or ask the AI Tutor to build one for you. Each stack can be studied on its own with flashcards, games, and quizzes.",
    },
    {
      id: "family",
      icon: <UsersIcon size={20} />,
      q: "What is a family?",
      a: "A family groups several related stacks together, for example all your travel stacks. It lets you see combined progress across those stacks and play games that pull words from all of them at once.",
    },
    {
      id: "srs",
      icon: <Zap size={20} />,
      q: "How does spaced repetition work?",
      a: "Every word has a level that tracks how well you know it. Answer correctly and the word is scheduled further out before it comes up again; get it wrong and it comes back sooner. This keeps your review time focused on the words you find hardest, instead of ones you already know well.",
    },
    {
      id: "cefr",
      icon: <GraduationCap size={20} />,
      q: "What are CEFR levels?",
      a: "A1 through C2 is the standard European scale for language difficulty, from complete beginner (A1) to near-native (C2). wwordy uses it to label how advanced a word is, so you can see the mix of easy and hard words in your stacks.",
    },
    {
      id: "games",
      icon: <Grid3x3 size={20} />,
      q: "What are the practice games?",
      a: "Beyond flashcards, you can drill a stack with games like Matching, Multiple Choice, Memory, Scramble, Write, and more. They all pull from the same words and update the same progress, just with different ways of testing recall.",
    },
    {
      id: "streak",
      icon: <Flame size={20} />,
      q: "What is a streak?",
      a: "Your streak counts the consecutive days you've completed at least one review. It resets if you miss a day, and your best streak is saved separately so you can see your longest run.",
    },
    {
      id: "ai",
      icon: <Bot size={20} />,
      q: "What does the AI Tutor do?",
      a: "The AI Tutor is a built-in chat for German questions — grammar, articles, plurals, verb forms, and example sentences. It can also add words or build a whole stack for you directly when you ask it to.",
    },
    {
      id: "translator",
      icon: <Languages size={20} />,
      q: "What does the Translator do?",
      a: "Type a German or English word or phrase to get a quick translation, its grammar forms (like article, plural, or past tense), and an example sentence — then add it straight to a stack with one tap.",
    },
    {
      id: "data",
      icon: <LockIcon size={20} />,
      q: "Where is my data stored?",
      a: "Your stacks, families, and progress are stored locally on your device. If you create an account, a copy is also stored in the cloud so it can sync to your other devices; you can delete it any time from Settings > Account. The text you send to the AI Tutor or Translator is sent to an AI service to generate a response. You can also move data with a file export/import or a QR code.",
    },
  ];
  return (
    <div className="dm-view dm-settings-subview">
      <div className="dm-topbar">
        <IconBtn onClick={onBack}>
          <ChevronLeft size={20} />
        </IconBtn>
        <div className="dm-topbar-title">About</div>
      </div>
      <div className="dm-header">
        <div>
          <div className="dm-eyebrow">WWORDY</div>
          <h1 className="dm-h1">How it works</h1>
        </div>
      </div>
      <p className="dm-settings-hint">
        A quick guide to the ideas behind the app. Tap a question to see the answer.
      </p>
      <div className="dm-faq-list">
        {FAQS.map((f) => {
          const isOpen = openId === f.id;
          return (
            <div
              key={f.id}
              className={`dm-faq-item ${isOpen ? "dm-faq-open" : ""}`}
              onClick={isOpen ? () => setOpenId(null) : undefined}
            >
              <button
                type="button"
                className="dm-faq-question"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenId(isOpen ? null : f.id);
                }}
              >
                <div className="dm-faq-icon">{f.icon}</div>
                <div className="dm-faq-question-text">{f.q}</div>
                <ChevronDown size={16} className="dm-faq-chevron" />
              </button>
              <div className="dm-faq-answer-wrap">
                <div className="dm-faq-answer-inner">
                  <div className="dm-faq-answer">{f.a}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <p className="dm-settings-hint" style={{ marginTop: 20 }}>
        <a href="/privacy.html" target="_blank" rel="noopener" style={{ display: "inline-block", padding: "12px 4px" }}>Privacy Policy</a>
        {" · "}
        <a href="/terms.html" target="_blank" rel="noopener" style={{ display: "inline-block", padding: "12px 4px" }}>Terms of Use</a>
      </p>
    </div>
  );
}
