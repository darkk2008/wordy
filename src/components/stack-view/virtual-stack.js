/* components/stack-view/virtual-stack.js
 * Helpers for "virtual" stacks (Favorites, mini stacks): StackView shows words that really live in
 * other stacks. Each such word carries stackId / stackName, which must never be saved back.
 */

export function stripVirtual(word) {
  const { stackId, stackName, ...clean } = word; // eslint-disable-line no-unused-vars
  return clean;
}

// StackView hands back the whole virtual stack after an edit. Find the words that changed and
// apply each one to the stack it belongs to.
export function applyVirtualEdits(oldWords, nextWords, onUpdateWord) {
  const before = new Map(oldWords.map((w) => [w.id, w]));
  nextWords.forEach((nw) => {
    const old = before.get(nw.id);
    if (!old) return;
    if (JSON.stringify(old) !== JSON.stringify(nw)) {
      const clean = stripVirtual(nw);
      onUpdateWord(old.stackId, nw.id, () => clean);
    }
  });
}

// Applies the order chosen by the shuffle button (ids not in the list keep their place at the end).
export function orderWords(words, orderIds) {
  if (!orderIds) return words;
  const pos = new Map(orderIds.map((id, i) => [id, i]));
  return words
    .map((w, i) => ({ w, k: pos.has(w.id) ? pos.get(w.id) : orderIds.length + i }))
    .sort((a, b) => a.k - b.k)
    .map((x) => x.w);
}
