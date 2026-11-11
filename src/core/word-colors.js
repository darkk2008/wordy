/* core/word-colors.js
 * The colour tags a word can carry (word.color = one of these ids). A colour works like a stack
 * that cuts across all stacks: every word with that colour belongs to it.
 */

export const WORD_COLORS = [
  { id: "red", name: "Red", hex: "#f43f5e" },
  { id: "orange", name: "Orange", hex: "#fb923c" },
  { id: "green", name: "Green", hex: "#10b981" },
  { id: "blue", name: "Blue", hex: "#3b82f6" },
  { id: "purple", name: "Purple", hex: "#8b5cf6" },
];

const BY_ID = new Map(WORD_COLORS.map((c) => [c.id, c]));

export function colorById(id) {
  return (typeof id === "string" && BY_ID.get(id)) || null;
}

export function isWordColor(id) {
  return !!colorById(id);
}

// Applies (or, with a falsy id, clears) a colour on a word, never leaving an unknown value behind.
export function withColor(word, id) {
  const { color, ...rest } = word; // eslint-disable-line no-unused-vars
  return isWordColor(id) ? { ...rest, color: id } : rest;
}

// The words of every (non-archived) stack that carry the colour, each tagged with its own stack.
export function wordsWithColor(stacks, id) {
  const list = [];
  stacks.forEach((s) =>
    s.words.forEach((w) => {
      if (w.color === id) list.push({ ...w, stackId: s.id, stackName: s.name });
    })
  );
  return list;
}

export function countByColor(stacks) {
  const counts = {};
  stacks.forEach((s) =>
    s.words.forEach((w) => {
      if (colorById(w.color)) counts[w.color] = (counts[w.color] || 0) + 1;
    })
  );
  return counts;
}
