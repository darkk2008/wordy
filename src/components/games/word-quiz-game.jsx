/* components/games/word-quiz-game.jsx
 * Word quiz game (staged quiz on one word).
 */

import { Fragment, useRef, useState } from "react";
import { GameDone, GameTopBar } from "./game-chrome";
import { MultipleChoiceGame } from "./multiple-choice-game";
import { ScrambleGame } from "./scramble-game";
import { WriteGame } from "./write-game";

// Stages go from easy to hard on purpose (it used to be shuffled, so "Type the Word" could
// come first, before the learner had seen the word once):
// assemble -> recall -> timed sprint.
// Translation-only: no word-form stages (speed forms, adjective endings, cases).
let stageUid = 0;
const mkStage = (id, label, retry = false) => ({ uid: ++stageUid, id, label, retry });
function buildWordQuizStages(w, learningLanguage) {
  const stages = [mkStage("scramble", "Word Scramble"), mkStage("write", "Type the Word")];
  stages.push(mkStage("sprint", "Sprint"));
  return stages;
}
// The list after a missed stage is replayed two stages later (shared by goNext and the label preview).
function withRetry(list, idx, cur) {
  const copy = list.slice();
  copy.splice(Math.min(idx + 3, copy.length), 0, mkStage(cur.id, `${cur.label} (retry)`, true));
  return copy;
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
      // Missed a stage: play it again two stages later (after a different exercise),
      // so the learner has to pull the word out of memory again instead of echoing it.
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
    // One single results screen (ring + overall score) for the whole word quiz.
    return (
      <GameDone
        onExit={onExit}
        onPlayAgain={restart}
        playAgainLabel="Quiz again"
        label="Word quiz"
        score={tally.total ? `${tally.correct}/${tally.total}` : undefined}
        subtitle={
          weak.length
            ? `“${target.de}” — ${tally.correct}/${tally.total} on the first try. Needed a second go: ${weak.join(", ")}.`
            : `“${target.de}” — ${tally.correct}/${tally.total} correct on the first try`
        }
      />
    );
  }
  const stage = stages[stageIdx];
  // If the learner already missed something here, this stage will be replayed: label the button for that.
  const upcoming = missedRef.current && !stage.retry ? withRetry(stages, stageIdx, stage) : stages;
  const nextLabel = stageIdx < upcoming.length - 1 ? `Next: ${upcoming[stageIdx + 1].label}` : "Finish";
  const common = {
    onExit,
    onAnswer: handleAnswer,
    onPlayAgain: goNext,
    onNext: goNext,
    nextLabel,
    showRing: false, // the stages hand over silently; the final results screen is shown once, above
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
  return (
    <Fragment key={stage.uid}>
      <div className="dm-wordquiz-stagebar">{`Stage ${stageIdx + 1}/${stages.length} • ${stage.label}`}</div>
      {stageEl}
    </Fragment>
  );
}
