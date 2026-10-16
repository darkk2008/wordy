/* core/icon-registry.js
 * Family import parser and the ICON_SVGS registry (stack/family icons).
 */

import { DM_LIMITS, dmStr } from "../services/config-and-validation";
import { qrPayloadObjectToStack } from "./sharing-and-export";

export function parseFamilyImportText(text) {
  const trimmed = (text || "").trim();
  if (!trimmed) throw new Error("This file is empty.");
  let jsonText = trimmed;
  if (/^<!doctype html/i.test(trimmed) || /<html[\s>]/i.test(trimmed)) {
    const match = trimmed.match(
      /<script[^>]*id=["']wordifyFamilyData["'][^>]*>([\s\S]*?)<\/script>/i
    );
    if (!match) throw new Error("This HTML file doesn't contain a wwordy family export.");
    jsonText = match[1];
  }
  let data;
  try {
    data = JSON.parse(jsonText);
  } catch (e) {
    throw new Error("This file isn't a valid wwordy family export.");
  }
  if (!data || data.t !== "family") {
    throw new Error("This file isn't a wwordy family export.");
  }
  return {
    __isFamily: true,
    name: dmStr(data.n, 80) || "Imported family",
    emoji: data.e || "family",
    stacks: (Array.isArray(data.s) ? data.s : [])
      .slice(0, DM_LIMITS.families)
      .map(qrPayloadObjectToStack),
  };
}
export const ICON_SVGS = {
  sprout: `<svg viewBox="0 0 48 48" style="overflow:visible" xmlns="http://www.w3.org/2000/svg"><g class="dm-ic-sprout-leaf"><path d="M24 36 C24 24 14 20 10 10 C22 10 28 18 24 30" fill="#43D9A3" opacity="0.95"/><path d="M24 36 C24 22 34 18 38 8 C26 8 20 16 24 28" fill="#2fb98a" opacity="0.95"/></g><line x1="24" y1="36" x2="24" y2="42" stroke="#43D9A3" stroke-width="2.4" stroke-linecap="round"/></svg>`,
  bolt: `<svg viewBox="0 0 48 48" style="overflow:visible" xmlns="http://www.w3.org/2000/svg"><path class="dm-ic-bolt-flash" d="M26 5 L13 27 H22 L17 43 L35 19 H25 L30 5 Z" fill="#FFB020"/></svg>`,
  plane: `<svg viewBox="0 0 48 48" style="overflow:visible" xmlns="http://www.w3.org/2000/svg"><g class="dm-ic-plane-trail"><line x1="2" y1="31" x2="9" y2="29.5" stroke="#6EE7F9" stroke-width="1.6" stroke-linecap="round" opacity="0.5"/><line x1="2" y1="37" x2="8" y2="35.5" stroke="#6EE7F9" stroke-width="1.6" stroke-linecap="round" opacity="0.3"/></g><g class="dm-ic-plane-fly"><path d="M6 27 L41 13 L33 25 L41 35 L6 27 Z" fill="none" stroke="#6EE7F9" stroke-width="2.2" stroke-linejoin="round"/><path d="M19 23 L15 31" stroke="#6EE7F9" stroke-width="2" stroke-linecap="round"/></g></svg>`,
  book: `<svg viewBox="0 0 48 48" style="overflow:visible" xmlns="http://www.w3.org/2000/svg"><path d="M24 12 C18 8 10 8 6 10 V38 C10 36 18 36 24 40 C30 36 38 36 42 38 V10 C38 8 30 8 24 12 Z" fill="none" stroke="#A78BFA" stroke-width="2.2" stroke-linejoin="round"/><line x1="24" y1="12" x2="24" y2="40" stroke="#A78BFA" stroke-width="2"/><path class="dm-ic-book-page" d="M24 12 C30 8 38 8 42 10 V26 C38 24 30 24 24 28 Z" fill="rgba(167,139,250,0.4)"/></svg>`,
  school: `<svg viewBox="0 0 48 48" style="overflow:visible" xmlns="http://www.w3.org/2000/svg"><path d="M8 40 V20 L24 10 L40 20 V40" fill="none" stroke="#FF8A3D" stroke-width="2.2" stroke-linejoin="round"/><rect x="14" y="26" width="6" height="14" fill="none" stroke="#FF8A3D" stroke-width="2"/><rect x="28" y="26" width="6" height="14" fill="none" stroke="#FF8A3D" stroke-width="2"/><line x1="24" y1="10" x2="24" y2="2" stroke="#FF8A3D" stroke-width="2" stroke-linecap="round"/><path class="dm-ic-school-flag" d="M24 2 L34 5 L24 8 Z" fill="#FF8A3D"/></svg>`,
  briefcase: `<svg viewBox="0 0 48 48" style="overflow:visible" xmlns="http://www.w3.org/2000/svg"><path class="dm-ic-brief-handle" d="M18 16 V11 C18 8 20 6 24 6 C28 6 30 8 30 11 V16" fill="none" stroke="#6EE7F9" stroke-width="2.2" stroke-linecap="round"/><rect x="8" y="16" width="32" height="24" rx="4" fill="none" stroke="#6EE7F9" stroke-width="2.2"/><line x1="8" y1="26" x2="40" y2="26" stroke="#6EE7F9" stroke-width="2"/><rect x="21" y="23" width="6" height="6" rx="1.4" fill="#6EE7F9"/></svg>`,
  food: `<svg viewBox="0 0 48 48" style="overflow:visible" xmlns="http://www.w3.org/2000/svg"><ellipse cx="24" cy="32" rx="16" ry="7" fill="none" stroke="#FF3B5C" stroke-width="2.2"/><ellipse cx="24" cy="30" rx="10" ry="4" fill="none" stroke="#FF3B5C" stroke-width="1.6" opacity="0.6"/><path class="dm-ic-food-steam s1" d="M16 22 C14 18 18 16 16 12" stroke="#FF3B5C" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.7"/><path class="dm-ic-food-steam s2" d="M24 20 C22 16 26 14 24 10" stroke="#FF3B5C" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.7"/><path class="dm-ic-food-steam s3" d="M32 22 C30 18 34 16 32 12" stroke="#FF3B5C" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.7"/></svg>`,
  target: `<svg viewBox="0 0 48 48" style="overflow:visible" xmlns="http://www.w3.org/2000/svg"><circle class="dm-ic-target-ring" cx="24" cy="24" r="18" fill="none" stroke="#FFB020" stroke-width="2"/><circle cx="24" cy="24" r="11" fill="none" stroke="#FFB020" stroke-width="2"/><circle cx="24" cy="24" r="4" fill="#FF3B5C"/><g class="dm-ic-target-arrow"><line x1="6" y1="42" x2="21" y2="27" stroke="#6EE7F9" stroke-width="2.4" stroke-linecap="round"/><path d="M21 27 L18 27 M21 27 L21 30" stroke="#6EE7F9" stroke-width="2.4" stroke-linecap="round" fill="none"/></g></svg>`,
  family: `<svg viewBox="0 0 48 48" style="overflow:visible" xmlns="http://www.w3.org/2000/svg"><g class="dm-ic-fam-figs"><circle cx="16" cy="16" r="6" fill="none" stroke="#43D9A3" stroke-width="2.2"/><path d="M6 40 C6 30 12 26 18 26 C22 26 25 28 27 31" fill="none" stroke="#43D9A3" stroke-width="2.2" stroke-linecap="round"/></g><g class="dm-ic-fam-figs2"><circle cx="33" cy="17" r="5" fill="none" stroke="#6EE7F9" stroke-width="2.2"/><path d="M25 40 C25 32 29 27 34 27 C39 27 43 32 43 40" fill="none" stroke="#6EE7F9" stroke-width="2.2" stroke-linecap="round"/></g><g class="dm-ic-fam-heart"><path d="M24 8.5 C22.8 6.6 19.9 6.9 19.9 9.4 C19.9 11.5 24 14.3 24 14.3 C24 14.3 28.1 11.5 28.1 9.4 C28.1 6.9 25.2 6.6 24 8.5 Z" fill="#FF3B5C"/></g></svg>`,
  heart: `<svg viewBox="0 0 48 48" style="overflow:visible" xmlns="http://www.w3.org/2000/svg"><path d="M24 40 C10 31 4 23 4 15.5 C4 9.5 9 5.5 14.5 5.5 C19 5.5 22 8.5 24 12 C26 8.5 29 5.5 33.5 5.5 C39 5.5 44 9.5 44 15.5 C44 23 38 31 24 40 Z" fill="none" stroke="#FF3B5C" stroke-width="2.4" stroke-linejoin="round"/></svg>`,
  star: `<svg viewBox="0 0 48 48" style="overflow:visible" xmlns="http://www.w3.org/2000/svg"><path d="M24 4 L29.6 18.8 L45 20 L33 30 L37 45 L24 36.5 L11 45 L15 30 L3 20 L18.4 18.8 Z" fill="none" stroke="#FFB020" stroke-width="2.2" stroke-linejoin="round"/></svg>`,
  home: `<svg viewBox="0 0 48 48" style="overflow:visible" xmlns="http://www.w3.org/2000/svg"><rect x="30" y="8" width="4" height="7" fill="#A78BFA" opacity="0.55"/><g class="dm-ic-fam-smoke s1"><path d="M32 8 C30 5 33.5 3 31.5 0.5" stroke="#A78BFA" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="0.55"/></g><g class="dm-ic-fam-smoke s2"><path d="M32 6 C30 3 33.5 1 31.5 -1.5" stroke="#A78BFA" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="0.55"/></g><path d="M7 24 L24 9 L41 24" fill="none" stroke="#A78BFA" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M11.5 21 V40 H36.5 V21" fill="none" stroke="#A78BFA" stroke-width="2.2" stroke-linejoin="round"/><rect x="20" y="27" width="8" height="13" rx="1.5" fill="none" stroke="#A78BFA" stroke-width="2"/><g class="dm-ic-home-heart"><path d="M24 19.5 C22.6 17.9 19.4 18.3 19.4 20.9 C19.4 23 24 25.7 24 25.7 C24 25.7 28.6 23 28.6 20.9 C28.6 18.3 25.4 17.9 24 19.5 Z" fill="#FF3B5C"/></g></svg>`,
  tree: `<svg viewBox="0 0 48 48" style="overflow:visible" xmlns="http://www.w3.org/2000/svg"><rect class="dm-ic-tree-trunk" x="21" y="30" width="6" height="14" rx="2" fill="#8a6a45"/><g class="dm-ic-fam-canopy"><circle cx="24" cy="16" r="12" fill="#43D9A3"/><circle cx="14" cy="23" r="8.5" fill="#2fb98a"/><circle cx="34" cy="23" r="8.5" fill="#2fb98a"/></g></svg>`,
  nest: `<svg viewBox="0 0 48 48" style="overflow:visible" xmlns="http://www.w3.org/2000/svg"><g class="dm-ic-fam-nestbody"><path d="M4 30 Q24 40 44 30" fill="none" stroke="#FF8A3D" stroke-width="2.4" stroke-linecap="round"/><path d="M7 26 Q24 34.5 41 26" fill="none" stroke="#FF8A3D" stroke-width="2" stroke-linecap="round" opacity="0.65"/><path d="M10.5 22.5 Q24 29 37.5 22.5" fill="none" stroke="#FF8A3D" stroke-width="1.8" stroke-linecap="round" opacity="0.45"/></g><ellipse class="dm-ic-fam-egg e1" cx="16.5" cy="22" rx="4.4" ry="5.6" fill="#FF3B5C"/><ellipse class="dm-ic-fam-egg e2" cx="24" cy="19" rx="4.4" ry="5.6" fill="#FFB020"/><ellipse class="dm-ic-fam-egg e3" cx="31.5" cy="22" rx="4.4" ry="5.6" fill="#6EE7F9"/></svg>`,
  folder: `<svg viewBox="0 0 48 48" style="overflow:visible" xmlns="http://www.w3.org/2000/svg"><path d="M6 16.5 C6 14.3 7.8 12.5 10 12.5 H18 L22 16.5 H38 C40.2 16.5 42 18.3 42 20.5 V33.5 C42 35.7 40.2 37.5 38 37.5 H10 C7.8 37.5 6 35.7 6 33.5 Z" fill="none" stroke="#6EE7F9" stroke-width="2.2" stroke-linejoin="round"/><g class="dm-ic-fam-lid"><path d="M6 20 C6 18 7.6 16.5 9.6 16.5 H38.4 C40.4 16.5 42 18 42 20 V22 H6 Z" fill="rgba(110,231,249,0.22)"/></g><g class="dm-ic-folder-dots"><circle class="d1" cx="16" cy="27" r="2.3" fill="#43D9A3"/><circle class="d2" cx="24" cy="27" r="2.3" fill="#FF3B5C"/><circle class="d3" cx="32" cy="27" r="2.3" fill="#FFB020"/></g></svg>`,
  orbit: `<svg viewBox="0 0 48 48" style="overflow:visible" xmlns="http://www.w3.org/2000/svg"><circle cx="24" cy="24" r="10" fill="none" stroke="#FFB020" stroke-width="1.4" opacity="0.35"/><circle cx="24" cy="24" r="17" fill="none" stroke="#6EE7F9" stroke-width="1.4" opacity="0.3"/><g class="dm-ic-fam-core"><circle cx="24" cy="24" r="4.2" fill="#FF3B5C"/></g><g class="dm-ic-fam-orbit1"><circle cx="24" cy="14" r="2.6" fill="#FFB020"/></g><g class="dm-ic-fam-orbit2"><circle cx="24" cy="7" r="2.2" fill="#6EE7F9"/></g></svg>`,
  puzzle: `<svg viewBox="0 0 48 48" style="overflow:visible" xmlns="http://www.w3.org/2000/svg"><g class="dm-ic-puzzle-a"><path d="M7 7 H22.5 V13.4 C25.8 11.6 25.8 16.4 22.5 14.6 V22.5 H14.6 C16.4 25.8 11.6 25.8 13.4 22.5 H7 Z" fill="#FF3B5C"/></g><g class="dm-ic-puzzle-b"><path d="M41 7 H25.5 V13.4 C22.2 11.6 22.2 16.4 25.5 14.6 V22.5 H33.4 C31.6 25.8 36.4 25.8 34.6 22.5 H41 Z" fill="#FFB020"/></g><g class="dm-ic-puzzle-c"><path d="M7 41 H22.5 V34.6 C25.8 36.4 25.8 31.6 22.5 33.4 V25.5 H14.6 C16.4 22.2 11.6 22.2 13.4 25.5 H7 Z" fill="#6EE7F9"/></g><g class="dm-ic-puzzle-d"><path d="M41 41 H25.5 V34.6 C22.2 36.4 22.2 31.6 25.5 33.4 V25.5 H33.4 C31.6 22.2 36.4 22.2 34.6 25.5 H41 Z" fill="#43D9A3"/></g></svg>`,
  crown: `<svg viewBox="0 0 48 48" style="overflow:visible" xmlns="http://www.w3.org/2000/svg"><g class="dm-ic-fam-crownbody"><path d="M8 34 L9.5 17 L18 25.5 L24 13 L30 25.5 L38.5 17 L40 34 Z" fill="none" stroke="#FFB020" stroke-width="2.2" stroke-linejoin="round"/><line x1="8" y1="34" x2="40" y2="34" stroke="#FFB020" stroke-width="2.2" stroke-linecap="round"/></g><circle class="dm-ic-fam-gem g1" cx="16" cy="24" r="1.8" fill="#FF3B5C"/><circle class="dm-ic-fam-gem g2" cx="24" cy="21" r="2.1" fill="#6EE7F9"/><circle class="dm-ic-fam-gem g3" cx="32" cy="24" r="1.8" fill="#43D9A3"/></svg>`,
  spark: `<svg viewBox="0 0 48 48" style="overflow:visible" xmlns="http://www.w3.org/2000/svg"><g class="dm-ic-spark-core"><path d="M24 3 C24 15 20 21 10 24 C20 27 24 33 24 45 C24 33 28 27 38 24 C28 21 24 15 24 3 Z" fill="#FFD24C"/></g><circle class="dm-ic-spark-dot d1" cx="8" cy="10" r="2.1" fill="#6EE7F9"/><circle class="dm-ic-spark-dot d2" cx="40" cy="12" r="1.7" fill="#FF3B5C"/><circle class="dm-ic-spark-dot d3" cx="39" cy="36" r="1.9" fill="#43D9A3"/></svg>`,
  gem: `<svg viewBox="0 0 48 48" style="overflow:visible" xmlns="http://www.w3.org/2000/svg"><path d="M11 18 L24 5 L37 18 L24 44 Z" fill="none" stroke="#A78BFA" stroke-width="2.2" stroke-linejoin="round"/><path d="M11 18 H37 M18 18 L24 44 M30 18 L24 44 M24 5 L18 18 M24 5 L30 18" stroke="#A78BFA" stroke-width="1.2" opacity="0.5" fill="none" stroke-linejoin="round"/><path class="dm-ic-gem-shine" d="M15.5 12.5 L19.5 16.5" stroke="#fff" stroke-width="2.2" stroke-linecap="round" opacity="0"/></svg>`,
  magnet: `<svg viewBox="0 0 48 48" style="overflow:visible" xmlns="http://www.w3.org/2000/svg"><path d="M14 6 V23 A10 10 0 0 0 34 23 V6" fill="none" stroke="#FF6B6B" stroke-width="4.2" stroke-linecap="round"/><rect x="9.6" y="3" width="8.4" height="7.5" rx="1.6" fill="#EDEDED"/><rect x="30" y="3" width="8.4" height="7.5" rx="1.6" fill="#EDEDED"/><g class="dm-ic-magnet-bit b1"><circle cx="6" cy="36" r="2.3" fill="#6EE7F9"/></g><g class="dm-ic-magnet-bit b2"><circle cx="15" cy="42" r="1.9" fill="#43D9A3"/></g><g class="dm-ic-magnet-bit b3"><circle cx="27" cy="42.5" r="2.1" fill="#FFB020"/></g></svg>`,
  comet: `<svg viewBox="0 0 48 48" style="overflow:visible" xmlns="http://www.w3.org/2000/svg"><g class="dm-ic-comet-tail"><path d="M40 8 C33 11 19 21 9 41" stroke="#6EE7F9" stroke-width="2.1" fill="none" stroke-linecap="round" opacity="0.55"/><path d="M40 8 C35 12 25 25 15 39" stroke="#6EE7F9" stroke-width="1.4" fill="none" stroke-linecap="round" opacity="0.35"/></g><circle class="dm-ic-comet-head" cx="40" cy="8" r="5.2" fill="#FFD24C"/></svg>`,
  beacon: `<svg viewBox="0 0 48 48" style="overflow:visible" xmlns="http://www.w3.org/2000/svg"><path d="M20 45 L22 21 H26 L28 45 Z" fill="none" stroke="#FF8A3D" stroke-width="2.2" stroke-linejoin="round"/><rect x="18.5" y="12" width="11" height="9.5" rx="1.6" fill="none" stroke="#FF8A3D" stroke-width="2.1"/><path class="dm-ic-beacon-ray r1" d="M23 12 L8 5" stroke="#FFD24C" stroke-width="2.1" stroke-linecap="round"/><path class="dm-ic-beacon-ray r2" d="M25 12 L40 5" stroke="#FFD24C" stroke-width="2.1" stroke-linecap="round"/><path class="dm-ic-beacon-ray r3" d="M24 10 L24 1.5" stroke="#FFD24C" stroke-width="2.1" stroke-linecap="round"/></svg>`,
};
export const ICON_IDS = [
  "book",
  "sprout",
  "bolt",
  "plane",
  "school",
  "briefcase",
  "food",
  "target",
];
export const FAMILY_ICON_IDS = [
  "family",
  "home",
  "tree",
  "nest",
  "folder",
  "orbit",
  "puzzle",
  "crown",
];
export const MINISTACK_ICON_IDS = ["spark", "gem", "magnet", "comet", "beacon"];
const LEGACY_EMOJI_TO_ICON = {
  "🌱": "sprout",
  "⚡": "bolt",
  "✈\ufe0f": "plane",
  "📚": "book",
  "🏫": "school",
  "💼": "briefcase",
  "🍽\ufe0f": "food",
  "🎯": "target",
};
export function resolveIconId(idOrEmoji) {
  if (idOrEmoji && ICON_SVGS[idOrEmoji]) return idOrEmoji;
  if (idOrEmoji && LEGACY_EMOJI_TO_ICON[idOrEmoji]) return LEGACY_EMOJI_TO_ICON[idOrEmoji];
  return "sprout";
}
