/* services/sync-merge.js
 * Three-way merge of this device's data with the cloud copy.
 *
 * The old merge only added missing stacks/words and let the cloud win for everything it already had,
 * so offline progress was overwritten, deleted words came back, and the first pull after a restart
 * replaced local edits outright. A three-way merge fixes that by also looking at the BASE: what the
 * cloud held the last time this device synced. Comparing each item with its base tells us who changed
 * it, or who deleted it:
 *   - only one side changed an item      -> that side's version wins
 *   - one side deleted, other untouched  -> the deletion wins
 *   - one side deleted, other edited     -> the edit wins (nothing is lost)
 *   - both changed the same item         -> local wins; for a word's `srs` the more-reviewed copy wins
 *   - no base known (first sync)         -> plain union, the cloud wins on shared ids; nothing is deleted
 *
 * The base is stored as small hashes (snapshot()), not as a second copy of all the data.
 */

// JSON with sorted keys: Postgres jsonb reorders keys, so plain JSON.stringify is not comparable.
export function stable(v) {
  if (Array.isArray(v)) return "[" + v.map(stable).join(",") + "]";
  if (v && typeof v === "object") {
    return (
      "{" +
      Object.keys(v)
        .filter((k) => v[k] !== undefined)
        .sort()
        .map((k) => JSON.stringify(k) + ":" + stable(v[k]))
        .join(",") +
      "}"
    );
  }
  return JSON.stringify(v === undefined ? null : v);
}

// Two independent 32-bit FNV-1a style hashes (different seeds) + length: plenty for change detection.
export function hashOf(v) {
  const s = stable(v);
  let a = 2166136261;
  let b = 5381;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    a = Math.imul(a ^ c, 16777619) >>> 0;
    b = (Math.imul(b, 33) ^ c) >>> 0;
  }
  return a.toString(36) + b.toString(36) + s.length.toString(36);
}

const splitStack = (st) => {
  const { words, ...meta } = st || {};
  return { meta, words: Array.isArray(words) ? words : [] };
};

// What the cloud (or this device) holds, as hashes only.
export function snapshot(d) {
  const snap = { s: {}, f: {}, m: {}, fav: hashOf(d && d.favMiniStack ? d.favMiniStack : null) };
  for (const st of (d && d.stacks) || []) {
    if (!st || st.id == null) continue;
    const { meta, words } = splitStack(st);
    const w = {};
    for (const x of words) if (x && x.id != null) w[x.id] = hashOf(x);
    snap.s[st.id] = { m: hashOf(meta), w };
  }
  for (const f of (d && d.families) || []) if (f && f.id != null) snap.f[f.id] = hashOf(f);
  const mini = (d && d.miniStacks) || {};
  for (const k of Object.keys(mini)) snap.m[k] = hashOf(mini[k]);
  return snap;
}

export function sameSnapshot(a, b) {
  return !!a && !!b && stable(a) === stable(b);
}

const reviews = (s) => (s ? (s.correct || 0) + (s.wrong || 0) : 0);
const moreReviewed = (a, b) => (!a ? b : !b ? a : reviews(a) >= reviews(b) ? a : b);

// Picks between a local and a remote version of the same item. `bh` is the base hash (or undefined).
function pick(local, remote, bh, both) {
  if (bh === undefined) return remote; // no base: the cloud wins
  const lh = hashOf(local);
  const rh = hashOf(remote);
  if (lh === rh) return local;
  if (lh === bh) return remote; // only the cloud changed it
  if (rh === bh) return local; // only this device changed it
  return both ? both(local, remote) : local; // both changed it: local wins
}

// Merges two keyed collections. `bh` maps key -> base hash (or null when there is no base).
// Items are kept in the cloud's order, followed by items that exist only here.
function mergeKeyed(localItems, remoteItems, keyOf, bh, pickItem, hashItem = hashOf) {
  const lMap = new Map();
  for (const x of localItems) if (x && keyOf(x) != null) lMap.set(String(keyOf(x)), x);
  const out = [];
  const seen = new Set();
  const unchangedSinceBase = (x, k) => !!bh && k in bh && hashItem(x) === bh[k];
  for (const r of remoteItems) {
    if (!r || keyOf(r) == null) continue;
    const k = String(keyOf(r));
    seen.add(k);
    const l = lMap.get(k);
    if (!l) {
      // Only in the cloud: deleted here (and untouched there) -> stays deleted, otherwise keep.
      if (!unchangedSinceBase(r, k)) out.push(r);
    } else {
      out.push(pickItem(l, r, bh && k in bh ? bh[k] : undefined, k));
    }
  }
  for (const [k, l] of lMap) {
    if (seen.has(k)) continue;
    // Only here: deleted in the cloud (and untouched here) -> deleted, otherwise keep.
    if (!unchangedSinceBase(l, k)) out.push(l);
  }
  return out;
}

function mergeWords(localWords, remoteWords, baseWords) {
  return mergeKeyed(localWords, remoteWords, (w) => w.id, baseWords || null, (l, r, bh) =>
    pick(l, r, bh, (lw, rw) => ({ ...lw, srs: moreReviewed(lw.srs, rw.srs) }))
  );
}

function mergeStacks(localStacks, remoteStacks, baseStacks) {
  // A stack counts as untouched when its settings and every word hash still match the base.
  const untouched = (st) => {
    const b = baseStacks && baseStacks[st.id];
    return !!b && stable(b) === stable(snapshot({ stacks: [st] }).s[st.id]);
  };
  const lMap = new Map(localStacks.filter((s) => s && s.id != null).map((s) => [String(s.id), s]));
  const out = [];
  const seen = new Set();
  for (const r of remoteStacks) {
    if (!r || r.id == null) continue;
    seen.add(String(r.id));
    const l = lMap.get(String(r.id));
    if (!l) {
      // Only in the cloud: deleted here (and untouched there) -> stays deleted, otherwise keep.
      if (!untouched(r)) out.push(r);
      continue;
    }
    const b = baseStacks && baseStacks[r.id];
    const L = splitStack(l);
    const R = splitStack(r);
    const meta = pick(L.meta, R.meta, b ? b.m : undefined);
    out.push({ ...meta, words: mergeWords(L.words, R.words, b ? b.w : null) });
  }
  for (const l of localStacks) {
    if (!l || l.id == null || seen.has(String(l.id))) continue;
    // Only here: deleted in the cloud (and untouched here) -> deleted, otherwise keep.
    if (!untouched(l)) out.push(l);
  }
  return out;
}

// base: snapshot() of the last synced state or null. local/remote: { stacks, families, miniStacks, favMiniStack }.
export function mergeThreeWay(base, local, remote) {
  const stacks = mergeStacks(local.stacks || [], remote.stacks || [], base ? base.s : null);
  const families = mergeKeyed(
    local.families || [],
    remote.families || [],
    (f) => f.id,
    base ? base.f : null,
    (l, r, bh) => pick(l, r, bh)
  );
  // Mini stacks are an object keyed by stack id.
  const lm = local.miniStacks || {};
  const rm = remote.miniStacks || {};
  const miniEntries = mergeKeyed(
    Object.keys(lm).map((k) => ({ k, v: lm[k] })),
    Object.keys(rm).map((k) => ({ k, v: rm[k] })),
    (e) => e.k,
    base ? base.m : null,
    (l, r, bh) => ({ k: l.k, v: pick(l.v, r.v, bh) }),
    (e) => hashOf(e.v)
  );
  const miniStacks = {};
  for (const e of miniEntries) miniStacks[e.k] = e.v;
  let favMiniStack;
  const lf = local.favMiniStack || null;
  const rf = remote.favMiniStack || null;
  if (!base) favMiniStack = lf || rf;
  else if (hashOf(lf) === base.fav) favMiniStack = rf;
  else if (hashOf(rf) === base.fav) favMiniStack = lf;
  else favMiniStack = lf || rf;
  return { stacks, families, miniStacks, favMiniStack };
}
