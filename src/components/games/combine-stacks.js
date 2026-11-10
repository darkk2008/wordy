/* components/games/combine-stacks.js
 * Play with several stacks at once: the picked stacks are merged into one "virtual" stack that every
 * game takes like a normal stack (family play and Favorites already work this way).
 *
 * Each word carries `_stackId`, the stack it really lives in, so an answer is still saved to the right
 * stack (see onAnswer in app.jsx). A word that is in more than one picked stack, or that is a favorite
 * of a picked stack (the Favorites stack holds copies), is only included once.
 */

export const MULTI_STACK_ID = "__multi__";

function uniqueWords(stacks) {
  const seen = new Set();
  const out = [];
  (stacks || []).forEach((s) => {
    if (!s) return;
    (s.words || []).forEach((w) => {
      if (!w || seen.has(w.id)) return;
      seen.add(w.id);
      out.push({ ...w, _stackId: w._stackId || s.id });
    });
  });
  return out;
}

export function uniqueWordCount(stacks) {
  const seen = new Set();
  (stacks || []).forEach((s) => s && (s.words || []).forEach((w) => w && seen.add(w.id)));
  return seen.size;
}

export function combineStacks(stacks) {
  const list = (stacks || []).filter(Boolean);
  return {
    id: MULTI_STACK_ID,
    name: `${list.length} stacks`,
    emoji: "layers",
    words: uniqueWords(list),
  };
}
