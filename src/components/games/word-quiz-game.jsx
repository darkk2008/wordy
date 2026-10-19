/* components/games/word-quiz-game.jsx
 * Word quiz game (staged quiz on one word).
 */

import { Fragment, useRef, useState } from "react";
import { ArrowRight, RotateCcw } from "../icons/icons";
import { AdjEndingsGame } from "./adj-endings-game";
import { CasesGame, isRealNoun } from "./cases-game";
import { GameTopBar } from "./game-chrome";
import { MultipleChoiceGame } from "./multiple-choice-game";
import { ScrambleGame } from "./scramble-game";
import { SpeedFormsGame } from "./speed-forms-game";
import { WriteGame } from "./write-game";

function wordQuizHasForms(w) {
  return !!(
    w &&
    ((w.type === "noun" && w.plural) ||
      (w.type === "verb" && w.de) ||
      (w.type === "adj" && (w.komparativ || w.superlativ)))
  );
}
// Stages go from easy to hard on purpose (it used to be shuffled, so "Type the Word" could
// come first, before the learner had seen the word once):
// recognise -> assemble -> recall -> grammar forms -> reverse choice -> timed sprint.
let stageUid = 0;
const mkStage = (id, label, retry = false) => ({ uid: ++stageUid, id, label, retry });
function buildWordQuizStages(w, learningLanguage) {
  const stages = [mkStage("choose", "Recognise"), mkStage("scramble", "Word Scramble"), mkStage("write", "Type the Word")];
  if (learningLanguage === "de" && wordQuizHasForms(w)) stages.push(mkStage("speedforms", "Speed Forms"));
  if (learningLanguage === "de" && w && w.type === "adj" && w.de) stages.push(mkStage("adjendings", "Adjective Endings"));
  if (learningLanguage === "de" && isRealNoun(w)) stages.push(mkStage("cases", "Case Drill"));
  stages.push(mkStage("quiz", "Reverse Choice"));
  stages.push(mkStage("sprint", "Sprint"));
  return stages;
}
// The list after a missed stage: it is replayed two stages later (used by goNext and the label preview).
function withRetry(list, idx, cur) {
  const copy = list.slice();
  copy.splice(Math.min(idx + 3, copy.length), 0, mkStage(cur.id, `${cur.label} (retry)`, true));
  return copy;
}
function WordQuizSummary({ word, tally, weak, onExit, onRestart }) {
  const percent = tally.total ? Math.round((tally.correct / tally.total) * 100) : 100;
  return (
    <div className="dm-game-play dm-game-done">
      <h2 className="dm-h1 dm-done-heading">Quiz complete!</h2>
      <p className="dm-done-sub">{`“${word.de}” — ${tally.correct}/${tally.total} correct on the first try (${percent}%).`}</p>
      {weak.length > 0 && <p className="dm-done-sub">{`Needed a second go: ${weak.join(", ")}.`}</p>}
      <div className="dm-done-btn-row">
        <button className="dm-btn-secondary dm-done-again" onClick={onRestart}>
          <RotateCcw size={16} />
          {" Quiz again"}
        </button>
        <button className="dm-btn-primary dm-done-back" onClick={onExit}>
          <ArrowRight size={16} />
          {" Done"}
        </button>
      </div>
    </div>
  );
}
export function WordQuizGame({
  words,
  pool,
  onAnswer,
  onExit,
  onPlayAgain,
  apiKey,
  onOpenAI,
  learningLanguage,
  nativeLanguage,
}) {
  const target = words[0];
  const distractorPool = pool && pool.length ? pool : words;
  const [stages, setStages] = useState(() => buildWordQuizStages(target, learningLanguage));
  const [stageIdx, setStageIdx] = useState(0);
  // Did the learner miss anything in the stage that is on screen right now?
  const missedRef = useRef(false);
  // Stage labels that needed a second try (shown on the results screen).
  const [weak, setWeak] = useState([]);
  const [tally, setTally] = useState({
    correct: 0,
    total: 0,
  });
  const restart = () => {
    missedRef.current = false;
    setStages(buildWordQuizStages(target, learningLanguage));
    setWeak([]);
    setStageIdx(0);
    setTally({
      correct: 0,
      total: 0,
    });
  };
  const handleAnswer = (wordId, correct) => {
    if (!correct) missedRef.current = true;
    // The score counts first attempts only, so a repeated stage cannot hide a mistake.
    // Retries still reach onAnswer, so the word's SRS record sees the corrected answer.
    if (!stages[stageIdx].retry)
      setTally((t) => ({
        correct: t.correct + (correct ? 1 : 0),
        total: t.total + 1,
      }));
    onAnswer(wordId, correct);
  };
  const goNext = () => {
    const cur = stages[stageIdx];
    const missed = missedRef.current;
    missedRef.current = false;
    if (missed && !cur.retry) {
      // Missed a stage: replay it after a different exercise, so the learner has to pull the
      // word out of memory again instead of echoing the answer they just saw.
      setStages((list) => withRetry(list, stageIdx, cur));
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
    return <WordQuizSummary word={target} tally={tally} weak={weak} onExit={onExit} onRestart={restart} />;
  }
  const stage = stages[stageIdx];
  // If the learner already missed something here, this stage will be replayed: label the button for that.
  const upcoming = missedRef.current && !stage.retry ? withRetry(stages, stageIdx, stage) : stages;
  const nextLabel = stageIdx < upcoming.length - 1 ? `Next: ${upcoming[stageIdx + 1].label}` : "Finish";
  const isLastStage = stageIdx === upcoming.length - 1;
  const common = {
    onExit,
    onAnswer: handleAnswer,
    onPlayAgain: goNext,
    onNext: goNext,
    nextLabel,
    showRing: isLastStage,
    progressOverride: `${stageIdx + 1}/${stages.length}`,
    learningLanguage,
    nativeLanguage,
  };
  let stageEl = null;
  if (stage.id === "choose")
    stageEl = (
      <MultipleChoiceGame
        {...common}
        words={[target]}
        pool={distractorPool}
        timed={false}
        direction="de2en"
      />
    );
  else if (stage.id === "sprint")
    stageEl = (
      <MultipleChoiceGame
        {...common}
        words={[target]}
        pool={distractorPool}
        timed
        direction="de2en"
      />
    );
  else if (stage.id === "quiz")
    stageEl = (
      <MultipleChoiceGame
        {...common}
        words={[target]}
        pool={distractorPool}
        timed={false}
        direction="en2de"
      />
    );
  else if (stage.id === "scramble") stageEl = <ScrambleGame {...common} words={[target]} />;
  else if (stage.id === "write") stageEl = <WriteGame {...common} words={[target]} />;
  else if (stage.id === "speedforms") stageEl = <SpeedFormsGame {...common} words={[target]} />;
  else if (stage.id === "adjendings")
    stageEl = <AdjEndingsGame {...common} words={[target]} apiKey={apiKey} onOpenAI={onOpenAI} />;
  else if (stage.id === "cases") stageEl = <CasesGame {...common} words={[target]} />;
  return (
    <Fragment key={stage.uid}>
      <div className="dm-wordquiz-stagebar">{`Stage ${stageIdx + 1}/${stages.length} • ${stage.label}`}</div>
      {stageEl}
    </Fragment>
  );
}
