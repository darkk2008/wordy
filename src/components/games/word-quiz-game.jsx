/* components/games/word-quiz-game.jsx
 * Word quiz (swipe a word left -> Quiz): a short "treatment" for ONE word you struggle with.
 *
 * Look -> Recall (type it, with optional hints) -> Article -> Look-alikes -> Forms -> Last check.
 * The point is active recall, not copying: the word is shown once at the start, every later
 * stage makes you pull it out of memory, the wrong options are look-alike words, and the
 * last check has no hints. Missing a stage replays it a few stages later. A hinted or missed
 * answer counts as a miss for the review schedule, so a shaky word comes back sooner (and
 * becomes a "hard" word after repeated misses, see bumpSrs).
 * Stages that don't apply are skipped (article only for nouns with an article, forms only
 * when the word has saved forms).
 */

import { Fragment, useRef, useState } from "react";
import { ARTICLE_SETS } from "../../core/constants";
import { currentLearningLangCode } from "../../core/speech-voices";
import { shuffle } from "../../core/srs-and-seed-data";
import { stripArticle } from "../word-forms/word-forms";
import { GameDone, GameTopBar } from "./game-chrome";
import { ChoiceStage, LookStage, TypeStage } from "./word-quiz-stages";
import { buildFormQuestions } from "./write-game";

let stageUid = 0;
const mkStage = (id, label, extra = {}) => ({ uid: ++stageUid, id, label, retry: false, ...extra });

function hasArticleStage(w) {
  const set = ARTICLE_SETS[currentLearningLangCode];
  return !!(w.type === "noun" && w.article && set && set.includes(w.article));
}
function buildWordQuizStages(w, alikeCount) {
  const stages = [
    mkStage("look", "Look", { scored: false }),
    mkStage("recall", "Recall"),
  ];
  if (hasArticleStage(w)) stages.push(mkStage("article", "Article"));
  // Needs at least one other word in the stack to make wrong options from.
  if (alikeCount > 0) stages.push(mkStage("similar", "Look-alikes"));
  if (buildFormQuestions(w).length) stages.push(mkStage("forms", "Word forms"));
  stages.push(mkStage("final", "Last check", { noRetry: true }));
  return stages;
}
// The list after a missed stage: replay it a few stages later, so the learner has to pull the
// word out of memory again instead of echoing what was just shown.
function withRetry(list, idx, cur) {
  const copy = list.slice();
  copy.splice(Math.min(idx + 3, copy.length), 0, mkStage(cur.id, `${cur.label} (retry)`, { retry: true }));
  return copy;
}
function editDistance(a, b) {
  const m = a.length;
  const n = b.length;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[n];
}
// Wrong options that actually tempt you: same word type first, then the most similar spelling.
function pickLookAlikes(target, pool, count = 3) {
  const base = stripArticle(target.de).toLowerCase();
  const seen = new Set([target.de]);
  const scored = pool
    .filter((x) => x.id !== target.id && x.de && !seen.has(x.de) && seen.add(x.de))
    .map((x) => {
      const other = stripArticle(x.de).toLowerCase();
      const dist = editDistance(base, other) / Math.max(base.length, other.length, 1);
      return { x, score: dist + (x.type === target.type ? 0 : 0.35) };
    })
    .sort((a, b) => a.score - b.score);
  return scored.slice(0, count).map((s) => s.x.de);
}

export function WordQuizGame({
  words,
  pool,
  onAnswer,
  onExit,
  learningLanguage,
  nativeLanguage,
}) {
  const target = words[0];
  const distractorPool = pool && pool.length ? pool : words;
  const [alikes, setAlikes] = useState(() => (target ? pickLookAlikes(target, distractorPool) : []));
  const [stages, setStages] = useState(() =>
    target ? buildWordQuizStages(target, alikes.length) : []
  );
  const [stageIdx, setStageIdx] = useState(0);
  const missedRef = useRef(false); // missed something in the stage on screen right now?
  const finalCleanRef = useRef(null); // did the unaided last check pass first time?
  const [weak, setWeak] = useState([]);
  const [tally, setTally] = useState({ correct: 0, total: 0 });
  // Wrong options are fixed per run, so re-renders don't reshuffle the options on screen.
  const [lookAlikes, setLookAlikes] = useState(() => (target ? shuffle([target.de, ...alikes]) : []));
  const [formItems] = useState(() =>
    target
      ? shuffle(buildFormQuestions(target))
          .slice(0, 2)
          .map((q) => ({ prompt: q.prompt, badge: q.badge, answer: q.answer }))
      : []
  );
  const restart = () => {
    missedRef.current = false;
    finalCleanRef.current = null;
    const fresh = pickLookAlikes(target, distractorPool);
    setAlikes(fresh);
    setStages(buildWordQuizStages(target, fresh.length));
    setWeak([]);
    setStageIdx(0);
    setTally({ correct: 0, total: 0 });
    setLookAlikes(shuffle([target.de, ...fresh]));
  };
  const handleAnswer = (correct) => {
    const cur = stages[stageIdx];
    if (!correct) missedRef.current = true;
    if (cur.id === "final" && finalCleanRef.current === null) finalCleanRef.current = !!correct;
    // The score counts first attempts only, so a repeated stage cannot hide a mistake.
    // Retries still reach onAnswer, so the word's SRS record sees the corrected answer.
    if (!cur.retry)
      setTally((t) => ({ correct: t.correct + (correct ? 1 : 0), total: t.total + 1 }));
    onAnswer(target.id, !!correct);
  };
  const goNext = () => {
    const cur = stages[stageIdx];
    const missed = missedRef.current;
    missedRef.current = false;
    if (missed && !cur.retry) {
      if (!cur.noRetry) setStages((list) => withRetry(list, stageIdx, cur));
      setWeak((w) => (w.includes(cur.label) ? w : [...w, cur.label]));
    }
    setStageIdx((i) => i + 1);
  };
  if (!stages.length || !target) {
    return (
      <div className="dm-game-play">
        <GameTopBar onExit={onExit} progress="0/0" title="Word Quiz" />
        <div className="dm-empty">Nothing to quiz for this word yet.</div>
      </div>
    );
  }
  if (stageIdx >= stages.length) {
    const locked = finalCleanRef.current === true;
    const score = tally.total ? `${tally.correct}/${tally.total}` : undefined;
    const verdict = locked
      ? `Locked in: you recalled “${stripArticle(target.de)}” with no hints.`
      : `Not locked in yet. “${stripArticle(target.de)}” will come back sooner in your reviews.`;
    return (
      <GameDone
        onExit={onExit}
        onPlayAgain={restart}
        playAgainLabel="Quiz again"
        label="Word quiz"
        score={score}
        subtitle={`${verdict}${weak.length ? ` Needed another go: ${weak.join(", ")}.` : ""}`}
      />
    );
  }
  const stage = stages[stageIdx];
  const upcoming = missedRef.current && !stage.retry && !stage.noRetry ? withRetry(stages, stageIdx, stage) : stages;
  const nextLabel = stageIdx < upcoming.length - 1 ? `Next: ${upcoming[stageIdx + 1].label}` : "Finish";
  const common = {
    onExit,
    onAnswer: handleAnswer,
    onNext: goNext,
    nextLabel,
    progress: `${stageIdx + 1}/${stages.length}`,
    learningLanguage,
    nativeLanguage,
  };
  const base = stripArticle(target.de);
  let stageEl = null;
  if (stage.id === "look") stageEl = <LookStage {...common} title="Look" target={target} />;
  else if (stage.id === "recall")
    stageEl = (
      <TypeStage
        {...common}
        title="Recall"
        items={[{ prompt: target.en, answer: base, hintable: true }]}
      />
    );
  else if (stage.id === "article")
    stageEl = (
      <ChoiceStage
        {...common}
        title="Article"
        prompt={base}
        sub={target.en}
        speakText={target.de}
        options={ARTICLE_SETS[currentLearningLangCode]}
        correct={target.article}
      />
    );
  else if (stage.id === "similar")
    stageEl = (
      <ChoiceStage
        {...common}
        title="Look-alikes"
        prompt={target.en}
        sub="Which one is it?"
        options={lookAlikes}
        correct={target.de}
      />
    );
  else if (stage.id === "forms")
    stageEl = <TypeStage {...common} title="Word forms" items={formItems} placeholder="Type the form…" />;
  else if (stage.id === "final")
    stageEl = (
      <TypeStage
        {...common}
        title="Last check"
        items={[{ prompt: target.en, answer: base, hintable: false, badge: "No hints" }]}
      />
    );
  return (
    <Fragment key={stage.uid}>
      <div className="dm-wordquiz-stagebar">{`Stage ${stageIdx + 1}/${stages.length} — ${stage.label}`}</div>
      {stageEl}
    </Fragment>
  );
}
