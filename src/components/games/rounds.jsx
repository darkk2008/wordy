/* components/games/rounds.jsx
 * Splits a stack into rounds for games that only handle a fixed number of words
 * (Matching, Memory, ...): the first N words are round 1, the next N round 2, and so on.
 */

import { createContext, useContext, useMemo, useState } from "react";
import { shuffle } from "../../core/srs-and-seed-data";

// Words per round for each game type.
export const ROUND_SIZES = {
  matching: 6,
  memory: 6,
  ladder: 6,
  paradigm: 6,
  listening: 8,
  speaking: 12,
  dailymix: 12,
};

// A leftover of fewer words than this is folded into the previous round instead of
// becoming a tiny round of its own (e.g. 13 words at 6 per round -> 6 + 7, not 6 + 6 + 1).
const MIN_LAST_ROUND = 3;

export function chunkIntoRounds(words, size) {
  if (!size || words.length <= size) return [words];
  const rounds = [];
  for (let i = 0; i < words.length; i += size) rounds.push(words.slice(i, i + size));
  const last = rounds[rounds.length - 1];
  if (rounds.length > 1 && last.length < MIN_LAST_ROUND) {
    rounds.pop();
    rounds[rounds.length - 1] = [...rounds[rounds.length - 1], ...last];
  }
  return rounds;
}

// { round (1-based), total, hasNext, onNextRound } while a multi-round game is running, else null.
export const GameRoundsContext = createContext(null);
export function useGameRounds() {
  return useContext(GameRoundsContext);
}

// Wrapper: shuffles the words once per run, cuts them into rounds and renders
// `children(roundWords, roundNumber)` for the current round.
export function GameRounds({ words, size, runKey, children }) {
  const rounds = useMemo(() => chunkIntoRounds(shuffle(words), size), [words, size, runKey]);
  const [state, setState] = useState({ runKey, index: 0 });
  // A new run (play again) starts back at round 1.
  const index = state.runKey === runKey ? Math.min(state.index, rounds.length - 1) : 0;
  const total = rounds.length;
  const ctx = useMemo(
    () => ({
      round: index + 1,
      total,
      hasNext: index < total - 1,
      onNextRound: () => setState({ runKey, index: index + 1 }),
    }),
    [index, total, runKey]
  );
  return (
    <GameRoundsContext.Provider value={ctx}>
      {children(rounds[index], index + 1)}
    </GameRoundsContext.Provider>
  );
}
