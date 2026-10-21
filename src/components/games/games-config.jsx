/* components/games/games-config.jsx
 * Game catalogue (GAME_LIST) and which games need direction/level/forms.
 */

import {
  CardsIcon,
  Check,
  CloudRainIcon,
  DiceIcon,
  Grid2x2,
  Grid3x3,
  Headphones,
  LadderIcon,
  Layers,
  Mic,
  Pencil,
  Shuffle,
  TableIcon,
  Type,
  Zap,
} from "../icons/icons";

export const GAME_LIST = [
  {
    id: "flashcards",
    name: "Flashcards",
    desc: "Flip & reveal",
    icon: <Layers size={22} />,
  },
  {
    id: "sprint",
    name: "Sprint",
    desc: "Beat the clock",
    icon: <Zap size={22} />,
  },
  {
    id: "matching",
    name: "Matching",
    desc: "Pair them up",
    icon: <Grid3x3 size={22} />,
  },
  {
    id: "truefalse",
    name: "True or False",
    desc: "Right or wrong?",
    icon: <Check size={22} />,
  },
  {
    id: "memory",
    name: "Memory",
    desc: "Flip two, find pairs",
    icon: <CardsIcon size={22} />,
  },
  {
    id: "scramble",
    name: "Word Scramble",
    desc: "Unscramble letters",
    icon: <Shuffle size={22} />,
  },
  {
    id: "write",
    name: "Write the Word",
    desc: "Listen & type",
    icon: <Type size={22} />,
    premium: true,
  },
  {
    id: "quiz",
    name: "Multiple Choice",
    desc: "Pick the answer",
    icon: <Check size={22} />,
    premium: true,
  },
  {
    id: "wordforms",
    name: "Word Forms",
    desc: "Each word's 3 main forms",
    icon: <TableIcon size={22} />,
    premium: true,
    germanOnly: true,
  },
  {
    id: "speedforms",
    name: "Speed Forms",
    desc: "Type word forms in time",
    icon: <Zap size={22} />,
    premium: true,
    germanOnly: true,
  },
  {
    id: "tensemixer",
    name: "Verb Tense Mixer",
    desc: "Practice tenses",
    icon: <Shuffle size={22} />,
    germanOnly: true,
  },
  {
    id: "adjendings",
    name: "Adjective Endings",
    desc: "Drill -e / -en endings",
    icon: <Grid2x2 size={22} />,
    germanOnly: true,
  },
  {
    id: "sentence",
    name: "Sentence Practice",
    desc: "Write a sentence",
    icon: <Pencil size={22} />,
    premium: true,
    germanOnly: true,
  },
  {
    id: "listening",
    name: "Listening Dictation",
    desc: "Type the sentence",
    icon: <Headphones size={22} />,
    premium: true,
  },
  {
    id: "cases",
    name: "Cases Drill",
    desc: "All tenses in one",
    icon: <Grid2x2 size={22} />,
    germanOnly: true,
  },
  {
    id: "ladder",
    name: "Conjugation Ladder",
    desc: "Conjugate to climb",
    icon: <LadderIcon size={22} />,
    germanOnly: true,
  },
  {
    id: "paradigm",
    name: "Grammar Forms",
    desc: "Conjugations & cases: pick the right form",
    icon: <TableIcon size={22} />,
    premium: true,
    nonGermanOnly: true,
  },
  {
    id: "dailymix",
    name: "Daily Mix",
    desc: "Play all games",
    icon: <DiceIcon size={22} />,
    premium: true,
  },
  {
    id: "wordrain",
    name: "Word Rain",
    desc: "Tap the translation in time",
    icon: <CloudRainIcon size={22} />,
    premium: true,
  },
  {
    id: "speaking",
    name: "Speaking Practice",
    desc: "Say it out loud, get scored",
    icon: <Mic size={22} />,
  },
];
export const DIRECTION_GAMES = ["flashcards", "sprint", "quiz", "wordrain", "truefalse"];
export const LEVEL_GAMES = ["listening"];
export const FORMS_ONLY_GAMES = [
  "flashcards",
  "sprint",
  "quiz",
  "wordrain",
  "matching",
  "memory",
  "scramble",
  "write",
  "truefalse",
];

// Games that need word forms (plurals, conjugations, cases, comparatives...).
// Hidden from pickers that should offer translation-only games.
export const FORMS_REQUIRED_GAMES = [
  "wordforms",
  "speedforms",
  "tensemixer",
  "adjendings",
  "cases",
  "ladder",
  "paradigm",
];
