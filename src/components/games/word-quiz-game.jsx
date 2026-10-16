/* components/games/word-quiz-game.jsx
 * Word quiz game (staged quiz on one word).
 */

import { Fragment, useState } from "react";
import { shuffle } from "../../core/srs-and-seed-data";
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
function buildWordQuizStages(w, learningLanguage) {
  const stages = [
    {
      id: "sprint",
      label: "Sprint",
    },
    {
      id: "scramble",
      label: "Word Scramble",
    },
    {
      id: "write",
      label: "Type the Word",
    },
    {
      id: "quiz",
      label: "Multiple Choice",
    },
  ];
  if (learningLanguage === "de" && wordQuizHasForms(w))
    stages.push({
      id: "speedforms",
      label: "Speed Forms",
    });
  if (learningLanguage === "de" && w && w.type === "adj" && w.de)
    stages.push({
      id: "adjendings",
      label: "Adjective Endings",
    });
  if (learningLanguage === "de" && isRealNoun(w))
    stages.push({
      id: "cases",
      label: "Case Drill",
    });
  return shuffle(stages);
}
function WordQuizSummary({ word, tally, onExit, onRestart }) {
  const percent = tally.total ? Math.round((tally.correct / tally.total) * 100) : 100;
  return (
    <div className="dm-game-play dm-game-done">
      <h2 className="dm-h1 dm-done-heading">Quiz complete!</h2>
      <p className="dm-done-sub">{`“${word.de}” — ${tally.correct}/${tally.total} correct across all rounds (${percent}%).`}</p>
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
  const [stages] = useState(() => buildWordQuizStages(target, learningLanguage));
  const [stageIdx, setStageIdx] = useState(0);
  const [tally, setTally] = useState({
    correct: 0,
    total: 0,
  });
  const restart = () => {
    setStageIdx(0);
    setTally({
      correct: 0,
      total: 0,
    });
  };
  const handleAnswer = (wordId, correct) => {
    setTally((t) => ({
      correct: t.correct + (correct ? 1 : 0),
      total: t.total + 1,
    }));
    onAnswer(wordId, correct);
  };
  const goNext = () => setStageIdx((i) => i + 1);
  if (!stages.length || !target) {
    return (
      <div className="dm-game-play">
        <GameTopBar onExit={onExit} progress="0/0" title="Word Quiz" />
        <div className="dm-empty">Nothing to quiz for this word yet.</div>
      </div>
    );
  }
  if (stageIdx >= stages.length) {
    return <WordQuizSummary word={target} tally={tally} onExit={onExit} onRestart={restart} />;
  }
  const stage = stages[stageIdx];
  const nextLabel = stageIdx < stages.length - 1 ? `Next: ${stages[stageIdx + 1].label}` : "Finish";
  const isLastStage = stageIdx === stages.length - 1;
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
  if (stage.id === "sprint")
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
    <Fragment key={stage.id}>
      <div className="dm-wordquiz-stagebar">{`Stage ${stageIdx + 1}/${stages.length} • ${stage.label}`}</div>
      {stageEl}
    </Fragment>
  );
}
