/* components/word-forms/form-pick.jsx
 * "Pick a form" for the FORMS filter of a stack.
 *
 * By default the forms line of a card shows one fixed thing per word type (noun: plural,
 * adjective: comparative -> superlative, verb: past -> participle). Long-pressing the FORMS filter
 * lets the user choose any other form from the same tables the "All forms" modal shows; the
 * choice is kept per word type, and every card of that type then shows that form instead.
 *
 * A pick is a small plain object: { section, label, tag }
 *   section  title of the table the form lives in ("Singular", "Präsens", ...)
 *   label    row label inside that table ("Dativ", "ich", "Komparativ", ...)
 *   tag      short text shown on the card so the user can see which form this is
 * Nothing is stored on the words: the forms are computed by getWordFormSections (the same rules as
 * the "All forms" modal), so a pick works for every language the modal works for.
 */

import { useMemo } from "react";
import { FormSpeakBtn } from "../common/common";
import { WordFormsLine, getWordFormSections } from "./word-forms";

export const FORM_TYPES = ["noun", "adj", "verb"];

// Names used by the picker menu (group headings and the "default" row of each group).
export const FORM_TYPE_INFO = {
  noun: { title: "Nouns", defaultText: "Plural" },
  adj: { title: "Adjectives", defaultText: "Comparative → Superlative" },
  verb: { title: "Verbs", defaultText: "Past → Participle" },
};

// The first row of an adjective table is the word itself (Positiv / Base): nothing to pick there.
const ADJ_BASE_ROW = /^(positiv|positive|base)\b/i;

export function samePick(a, b) {
  return !!a && !!b && a.section === b.section && a.label === b.label;
}

/* Every form the user can pick for the words of a stack, grouped by word type and by table:
 *   { noun: [{ title, items: [{ section, label, tag }] }], adj: [...], verb: [...] }
 * Only types that occur in `words` are present. The lists are the union over all words, in the order
 * they first appear, so a stack with AI paradigms of different shapes still offers every row. */
export function getFormOptions(words) {
  const out = {};
  const seen = {};
  (words || []).forEach((w) => {
    if (!w || !FORM_TYPES.includes(w.type)) return;
    const sections = getWordFormSections(w);
    if (!out[w.type]) {
      out[w.type] = [];
      seen[w.type] = {};
    }
    const groups = out[w.type];
    sections.forEach((sec) => {
      let group = groups.find((g) => g.title === sec.title);
      if (!group) {
        group = { title: sec.title, items: [] };
        groups.push(group);
      }
      sec.rows.forEach((row) => {
        if (w.type === "adj" && ADJ_BASE_ROW.test(row.label)) return;
        const k = `${sec.title}\u0001${row.label}`;
        if (seen[w.type][k]) return;
        seen[w.type][k] = true;
        group.items.push({ section: sec.title, label: row.label });
      });
    });
  });
  // The tag: "Singular · Dativ" when a type has several tables, only "Komparativ" when it has one.
  Object.keys(out).forEach((type) => {
    out[type] = out[type].filter((g) => g.items.length);
    const single = out[type].length === 1;
    out[type].forEach((g) =>
      g.items.forEach((it) => {
        it.tag = single ? it.label : `${it.section} · ${it.label}`;
      })
    );
    if (!out[type].length) delete out[type];
  });
  return out;
}

/* The chosen form of one word: { tag, value }, or null when this word does not have it
 * (then the card falls back to its normal forms line). */
export function resolvePickedForm(w, pick) {
  if (!w || !pick) return null;
  const sec = getWordFormSections(w).find((s) => s.title === pick.section);
  const row = sec && sec.rows.find((r) => r.label === pick.label);
  if (!row) return null;
  return { tag: pick.tag || row.label, value: row.value };
}

/* Drop-in for <WordFormsLine>: shows the picked form, or the normal line when there is no pick. */
export function PickableFormsLine({ w, showAudio, pick }) {
  const picked = useMemo(() => resolvePickedForm(w, pick), [w, pick]);
  if (!picked) return <WordFormsLine w={w} showAudio={showAudio} />;
  return (
    <div className="dm-meta dm-meta-picked">
      <span className="dm-meta-tag">{picked.tag}</span>
      <span className="dm-mono dm-forms-only">{picked.value}</span>
      {showAudio && <FormSpeakBtn text={picked.value} />}
    </div>
  );
}
