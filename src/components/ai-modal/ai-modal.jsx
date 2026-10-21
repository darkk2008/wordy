/* components/ai-modal/ai-modal.jsx
 * AI tutor modal (chat, key setup, suggestions).
 */

import { Fragment, useEffect, useRef, useState } from "react";
import {
  DM_DE_FORM_RULES,
  DM_DE_SPELLING_RULES,
  GENDER_SETS,
  ROMAN_LANGS,
  dmArticleProp,
  dmNonGermanFieldRule,
  uid,
  usesGenderTag,
  wordGender,
} from "../../core/constants";
import { ICON_IDS } from "../../core/icon-registry";
import { speak } from "../../core/speech-voices";
import {
  LEVELS,
  LEVEL_COLOR,
  checkAdjReference,
  checkNounReference,
} from "../../core/srs-and-seed-data";
import { dmGroqFetch, dmParseJson } from "../../services/ai-groq";
import {
  FREE_TRANSLATE_LIMIT,
  getFreeTranslateCount,
  incFreeTranslateCount,
} from "../../services/premium-gems-store";
import { IconBtn } from "../common/common";
import { Input } from "../common/Input";
import {
  ArrowLeftRight,
  ArrowRight,
  Bot,
  Check,
  Languages,
  Plus,
  Volume2,
  X,
} from "../icons/icons";
import { LockIcon } from "../icons/settings-icons";
import { getLangName } from "../language-settings/language-settings";
import { StackPickerUp } from "../stack-select/stack-select";
import { mainSuperlativ, stripArticle } from "../word-forms/word-forms";

export function AiModal({
  apiKey,
  onSaveKey,
  onClose,
  contextStack,
  stacks,
  onCreateStack,
  onAddWord,
  messages,
  setMessages,
  isPremium,
  onOpenPremium,
  learningLanguage,
  nativeLanguage,
}) {
  const learnLangName = getLangName(learningLanguage || "de");
  const nativeLangName = getLangName(nativeLanguage || "en");
  const isLearningGerman = (learningLanguage || "de") === "de";
  const [keyInput, setKeyInput] = useState(apiKey || "");
  const [editingKey, setEditingKey] = useState(!apiKey);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [closing, setClosing] = useState(false);
  const stacksRef = useRef(stacks || []);
  useEffect(() => {
    stacksRef.current = stacks || [];
  }, [stacks]);
  const closeWithAnim = () => {
    if (closing) return;
    setClosing(true);
    setTimeout(() => onClose(), 240);
  };
  const listRef = useRef(null);
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, loading]);
  const [mode, setMode] = useState(() => (isPremium ? "chat" : "translate"));
  const prevModeRef = useRef("chat");
  const MODE_ORDER = {
    chat: 0,
    translate: 1,
  };
  const panelDir =
    MODE_ORDER[mode] === MODE_ORDER[prevModeRef.current]
      ? "none"
      : MODE_ORDER[mode] > MODE_ORDER[prevModeRef.current]
        ? "left"
        : "right";
  useEffect(() => {
    prevModeRef.current = mode;
  }, [mode]);
  const [direction, setDirection] = useState("de2en");
  const [tInput, setTInput] = useState("");
  const [tLoading, setTLoading] = useState(false);
  const [tError, setTError] = useState("");
  const [tResult, setTResult] = useState(null);
  const [tStackId, setTStackId] = useState((contextStack || (stacks && stacks[0]))?.id || null);
  const [tStackMenuOpen, setTStackMenuOpen] = useState(false);
  const [tAdded, setTAdded] = useState(false);
  const [tFreeCount, setTFreeCount] = useState(() => getFreeTranslateCount());
  useEffect(() => {
    if (tStackId == null && stacksRef.current[0]) setTStackId(stacksRef.current[0].id);
  }, [stacks]);
  const swapDirection = () => {
    setDirection((d) => (d === "de2en" ? "en2de" : "de2en"));
  };
  const AI_TOOLS = [
    {
      type: "function",
      function: {
        name: "create_stack",
        description: `Create a new, empty vocabulary stack (a themed collection of ${learnLangName} words) in the app.`,
        parameters: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: `Name of the new stack, e.g. 'Travel ${learnLangName}' or 'B2 Verbs'.`,
            },
            emoji: {
              type: "string",
              enum: ICON_IDS,
              description: "Icon id representing the stack theme.",
            },
          },
          required: ["name"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "add_word",
        description: `Add a new ${learnLangName} vocabulary word/flashcard to a stack. If the named stack doesn't exist yet, it is created automatically. You must always classify the word's type correctly and fill in ALL of the grammar fields that apply to that type and to ${learnLangName} — never leave a relevant field blank for a noun, verb, or adjective.`,
        parameters: {
          type: "object",
          properties: {
            stack_name: {
              type: "string",
              description:
                "Name of the stack to add the word to. Created automatically if it doesn't exist yet.",
            },
            de: {
              type: "string",
              description: `The ${learnLangName} word or phrase, in its base/dictionary form (e.g. nominative singular for nouns, infinitive for verbs, positive form for adjectives). For a German reflexive verb (reflexiv:true), this MUST include the leading "sich ", e.g. "sich erinnern", "sich freuen", "sich interessieren" — not just "erinnern".`,
            },
            en: {
              type: "string",
              description: `The translation in ${nativeLangName}.`,
            },
            type: {
              type: "string",
              enum: ["noun", "verb", "adj", "other"],
              description:
                "The grammatical type of the word. Classify accurately — this determines which grammar fields are required below.",
            },
            level: {
              type: "string",
              enum: ["A1", "A2", "B1", "B2", "C1", "C2"],
              description:
                "The CEFR difficulty level this specific word actually belongs to, based on how common/complex it is — not just whatever level the user asked for. Always set this deliberately for every word.",
            },
            article: isLearningGerman
              ? {
                  type: "string",
                  enum: ["der", "die", "das"],
                  description:
                    "REQUIRED whenever type is 'noun'. The noun's true grammatical gender in the SINGULAR (der/die/das) — fixed per word. Note: plural nouns always use 'die' regardless of this gender (e.g. das Haus → die Häuser) — don't let that influence this field; it must reflect the singular gender only. When adding multiple nouns, expect a realistic natural mix of der/die/das, not all the same.",
                }
              : dmArticleProp(learningLanguage || "de", learnLangName),
            plural: {
              type: "string",
              description:
                'REQUIRED whenever type is \'noun\'. The BARE plural noun form with NO article, e.g. Autos, Häuser, Frauen — never write "die Autos" or any other article here, the app adds "die" automatically since plural always uses "die" regardless of gender. If a noun is rarely pluralized, give the standard dictionary plural anyway (or \'—\' if it truly has none).',
            },
            praeteritum: {
              type: "string",
              description:
                "REQUIRED whenever type is 'verb'. The simple past (Präteritum) 3rd person singular form, e.g. 'ging' for gehen, 'war' for sein.",
            },
            partizipII: {
              type: "string",
              description:
                "REQUIRED whenever type is 'verb'. The past participle (Partizip II) including ge-/sein/haben usage form, e.g. 'gegangen', 'gewesen'.",
            },
            trennbar: {
              type: ["boolean", "string"],
              description:
                "REQUIRED whenever type is 'verb'. true/false (booleans, not quoted strings — but either is accepted). Whether the verb has a separable prefix (trennbares Verb), e.g. aufstehen, anrufen, mitkommen — true. Non-separable/simple verbs like besuchen, verstehen, gehen — false.",
            },
            reflexiv: {
              type: ["boolean", "string"],
              description:
                "REQUIRED whenever type is 'verb'. true/false (booleans, not quoted strings — but either is accepted). Whether the verb is typically used reflexively with sich, e.g. sich freuen, sich erinnern — true. Regular verbs like gehen, essen — false.",
            },
            komparativ: {
              type: "string",
              description:
                "REQUIRED whenever type is 'adj' and the adjective is gradable. The comparative form, e.g. 'schneller'.",
            },
            superlativ: {
              type: "string",
              description:
                "REQUIRED whenever type is 'adj' and the adjective is gradable. The superlative form. For German give the -ste form used before a noun, WITHOUT 'am', e.g. 'schnellste', 'beste', 'wütendste'.",
            },
            ...(ROMAN_LANGS[learningLanguage || "de"]
              ? {
                  roman: {
                    type: "string",
                    description:
                      "REQUIRED for every word: the " +
                      ROMAN_LANGS[learningLanguage || "de"] +
                      " of the word in Latin letters (never a translation).",
                  },
                }
              : {}),
          },
          required: ["stack_name", "de", "en", "type", "level"],
        },
      },
    },
  ];
  const toBool = (v) => v === true || v === "true" || v === 1 || v === "1";
  const runTool = (name, args) => {
    if (name === "create_stack") {
      const existing = stacksRef.current.find(
        (s) => s.name.toLowerCase() === (args.name || "").trim().toLowerCase()
      );
      if (existing)
        return {
          stack_id: existing.id,
          name: existing.name,
          note: "A stack with this name already existed; reusing it.",
        };
      const newStack = {
        id: uid(),
        name: (args.name || "New stack").trim(),
        emoji: ICON_IDS.includes(args.emoji)
          ? args.emoji
          : ICON_IDS[Math.floor(Math.random() * ICON_IDS.length)],
        words: [],
      };
      stacksRef.current = [newStack, ...stacksRef.current];
      onCreateStack(newStack);
      return {
        stack_id: newStack.id,
        name: newStack.name,
      };
    }
    if (name === "add_word") {
      const effectiveStackName =
        (args.stack_name || "").trim() || (contextStack ? contextStack.name : "");
      let stack = stacksRef.current.find(
        (s) => s.name.toLowerCase() === effectiveStackName.toLowerCase()
      );
      let createdStack = false;
      if (!stack) {
        stack = {
          id: uid(),
          name: (effectiveStackName || "New stack").trim(),
          emoji: ICON_IDS[Math.floor(Math.random() * ICON_IDS.length)],
          words: [],
        };
        stacksRef.current = [stack, ...stacksRef.current];
        onCreateStack(stack);
        createdStack = true;
      }
      let inferredType = args.type;
      if (!["noun", "verb", "adj"].includes(inferredType)) {
        if (args.article || args.plural) inferredType = "noun";
        else if (args.praeteritum || args.partizipII) inferredType = "verb";
        else if (args.komparativ || args.superlativ) inferredType = "adj";
        else inferredType = args.type || "other";
      }
      const rawDe = (args.de || "").trim();
      const bareDe = stripArticle(rawDe);
      let article = (GENDER_SETS[learningLanguage || "de"] || []).includes(
        String(args.article || "")
          .toLowerCase()
          .trim()
      )
        ? String(args.article).toLowerCase().trim()
        : "";
      let pluralValue = stripArticle(args.plural || "");
      let komparativValue = args.komparativ || "";
      let superlativValue = mainSuperlativ(args.superlativ || "");
      let referenceNote;
      if (isLearningGerman && inferredType === "noun") {
        const ref = checkNounReference(bareDe);
        if (ref && (ref.article !== article || ref.plural !== pluralValue)) {
          referenceNote = `Corrected against reference dictionary: ${bareDe} is ${ref.article}, plural ${ref.plural} (AI had suggested ${article || "?"}/${pluralValue || "?"}).`;
          article = ref.article;
          pluralValue = ref.plural;
        }
      }
      if (isLearningGerman && inferredType === "adj") {
        const adjRef = checkAdjReference(bareDe);
        if (
          adjRef &&
          (adjRef.komparativ !== komparativValue ||
            mainSuperlativ(adjRef.superlativ) !== superlativValue)
        ) {
          referenceNote = `Corrected against reference dictionary: ${bareDe} → ${adjRef.komparativ} / ${adjRef.superlativ} (AI had suggested ${komparativValue || "?"}/${superlativValue || "?"}).`;
          komparativValue = adjRef.komparativ;
          superlativValue = mainSuperlativ(adjRef.superlativ);
        }
      }
      const normalizedKey = bareDe.toLowerCase().replace(/^sich\s+/, "");
      const duplicate = stack.words.find(
        (w) =>
          stripArticle(w.de || "")
            .toLowerCase()
            .replace(/^sich\s+/, "") === normalizedKey
      );
      if (duplicate) {
        return {
          stack_id: stack.id,
          stack_name: stack.name,
          duplicate: true,
          existing_word_id: duplicate.id,
          de: duplicate.de,
          note: `"${bareDe}" already exists in "${stack.name}" — skipped adding a duplicate. Do not call add_word again for this word.`,
        };
      }
      const isReflexivVerb = inferredType === "verb" ? toBool(args.reflexiv) : false;
      let de =
        inferredType === "noun" && article && isLearningGerman ? `${article} ${bareDe}` : rawDe;
      if (inferredType === "verb" && isReflexivVerb && !/^sich\s/i.test(de)) {
        de = `sich ${de}`;
      }
      const word = {
        id: uid(),
        de,
        en: args.en || "",
        type: inferredType,
        level: LEVELS.includes(args.level) ? args.level : "",
        article: inferredType === "noun" && !usesGenderTag(learningLanguage || "de") ? article : "",
        gender: inferredType === "noun" && usesGenderTag(learningLanguage || "de") ? article : "",
        roman: ROMAN_LANGS[learningLanguage || "de"] ? String(args.roman || "").trim() : "",
        plural: inferredType === "noun" ? pluralValue : "",
        praeteritum: args.praeteritum || "",
        partizipII: args.partizipII || "",
        trennbar: inferredType === "verb" ? toBool(args.trennbar) : false,
        reflexiv: isReflexivVerb,
        komparativ: inferredType === "adj" ? komparativValue : "",
        superlativ: inferredType === "adj" ? superlativValue : "",
        favorite: false,
        srs: {
          level: 0,
          next: Date.now(),
          correct: 0,
          wrong: 0,
        },
      };
      stacksRef.current = stacksRef.current.map((s) =>
        s.id === stack.id
          ? {
              ...s,
              words: [...s.words, word],
            }
          : s
      );
      onAddWord(stack.id, word);
      const missing = [];
      if (
        word.type === "noun" &&
        ((GENDER_SETS[learningLanguage || "de"] && !wordGender(word)) || !word.plural)
      )
        missing.push("article/plural");
      if (word.type === "verb" && (!word.praeteritum || !word.partizipII))
        missing.push("praeteritum/partizipII");
      if (word.type === "adj" && (!word.komparativ || !word.superlativ))
        missing.push("komparativ/superlativ");
      return {
        stack_id: stack.id,
        stack_name: stack.name,
        word_id: word.id,
        de: word.de,
        type: word.type,
        level: word.level || "unset",
        created_stack: createdStack,
        reference_correction: referenceNote,
        warning: missing.length
          ? `Missing ${missing.join(", ")} for this ${word.type} — call add_word again is not possible, but remember to include these fields for future words of this type.`
          : undefined,
      };
    }
    return {
      error: "Unknown tool: " + name,
    };
  };
  const send = async (overrideText) => {
    const text = (typeof overrideText === "string" ? overrideText : input).trim();
    if (!text || loading) return;
    const nextMessages = [
      ...messages,
      {
        role: "user",
        content: text,
      },
    ];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError("");
    try {
      const stacksSummary = stacksRef.current.length
        ? stacksRef.current.map((s) => `"${s.name}" (${s.words.length} words)`).join(", ")
        : "no stacks yet";
      const cefrGuide = `CEFR level guide for picking ${learnLangName} vocabulary (use this seriously, don't default to A1/basics): A1 = the ~500 most essential everyday words (greetings, numbers, family, colors, basic verbs). A2 = common everyday topics (shopping, directions, daily routine, simple past). B1 = independent-user vocabulary: opinions, work, plans, travel, more abstract everyday topics, common phrasal/reflexive verbs. B2 = upper-intermediate: abstract and nuanced vocabulary, discussing debates, media, workplace nuance, less common but not rare verbs/nouns. C1 = advanced, precise, often formal or literary vocabulary, idioms, low-frequency words used by educated native speakers. C2 = near-native, highly specialized, rare or subtle vocabulary. When a user asks for words 'at B2 level' (or any specific level), you must pick words that genuinely sit at that level of difficulty and frequency, NOT simple beginner words — double-check each word against the guide above before adding it, and set the level field on every word you add accordingly.`;
      const grammarRule = isLearningGerman
        ? "Grammar fields are mandatory: for a noun, set article to its TRUE grammatical gender (der/die/das) in the singular — fixed per word, not a choice. Note: 'die' is ALSO the plural definite article for every noun regardless of its singular gender (e.g. das Haus → die Häuser) — that plural 'die' is unrelated to the gender field, so don't let it bias which singular article you pick. Always include the plural form too (bare noun, no article). For a verb, always give praeteritum, partizipII, and set trennbar/reflexiv (true/false) correctly — e.g. aufstehen is trennbar:true, sich freuen is reflexiv:true. REFLEXIVE VERBS: whenever reflexiv is true, the 'de' field itself must include the leading \"sich \" (e.g. \"sich erinnern\", \"sich freuen\", \"sich interessieren\") — never submit the bare infinitive alone (e.g. \"erinnern\") for a verb you're marking reflexiv:true. For a gradable adjective, always give komparativ and superlativ. Never leave a required field blank. When adding several words at once, diversify: mix der/die/das genders realistically instead of repeating one, avoid near-duplicate words, and if the type isn't specified mix nouns/verbs/adjectives rather than only nouns. Before calling add_word, check the existing words listed below (and any tool results) so you don't add a word that's already in the stack — the app will reject exact duplicates anyway. SPELLING: if the user types or asks to add a German word that is misspelled, or uses non-standard capitalization (e.g. a noun not capitalized), NEVER pass their raw spelling into the 'de' field of add_word — always correct it to the standard, correctly-spelled and correctly-capitalized dictionary form first, and briefly note the correction in your reply (e.g. \"added Haus (you wrote 'hauss')\"). If you are not confident what word they meant, ask instead of guessing. Never change a correctly spelled word, and if a typo has several equally plausible corrections, ask the user a short clarifying question instead of calling add_word. " +
          DM_DE_FORM_RULES
        : `${dmNonGermanFieldRule(learningLanguage || "de", learnLangName)} Use 'plural' for the plural/base form where ${learnLangName} has one, else leave it empty. Use 'praeteritum' for a simple past-tense form of the word if ${learnLangName} has one, and 'partizipII' for a past-participle form if it has one — otherwise leave those empty. For a gradable adjective, always give komparativ and superlativ in ${learnLangName} if that concept exists there. Never leave a field blank when it genuinely applies. When adding several words at once, avoid near-duplicate words, and if the type isn't specified mix nouns/verbs/adjectives rather than only nouns. Before calling add_word, check the existing words listed below (and any tool results) so you don't add a word that's already in the stack — the app will reject exact duplicates anyway. SPELLING: if the user types or asks to add a ${learnLangName} word that is misspelled or miscapitalized, NEVER pass their raw spelling into the 'de' field of add_word — always correct it to the standard, correctly-spelled dictionary form first, and briefly note the correction in your reply. If you are not confident what word they meant, ask instead of guessing.`;
      const sysPrompt =
        `You are a friendly, concise ${learnLangName}-language tutor built into a vocabulary app called wwordy. Help explain ${learnLangName} words, grammar, verb forms, and vocabulary, and give short example sentences. Keep answers short and practical. IMPORTANT LANGUAGE RULE: always write your explanations in ${nativeLangName}. Only use ${learnLangName} for the actual ${learnLangName} words or short example sentences you are teaching (1-3 words or a short phrase at a time is fine) — never write a full sentence of explanation in ${learnLangName}, and never translate your whole answer into ${learnLangName}. You can directly manage the user's flashcards: call the create_stack tool to make a new stack, and the add_word tool to add a ${learnLangName} word (with ${nativeLangName} translation, CEFR level, and any relevant grammar forms) to a stack. If the user asks you to add word(s) or build/create a stack, actually call the tools instead of just describing what to do, then briefly confirm in plain ${nativeLangName} what you added, mentioning the level(s) used. Minimize back-and-forth: pick sensible defaults yourself for things like which icon, which specific words, or which CEFR level to use — do not ask the user about those. If the user is currently viewing a stack (see below), add words there by default without asking which stack, unless they clearly say otherwise. Only ask a short clarifying question, and wait for their reply before calling any tool, when the request is missing the one piece of information you genuinely cannot infer — specifically: (a) they say 'create/add a stack' with no topic and no stack is currently open, or (b) they say 'add words' with no topic, no stack open, and no existing stacks to infer from. In every other case, just act. ` +
        grammarRule +
        " " +
        cefrGuide +
        " Existing stacks: " +
        stacksSummary +
        "." +
        (contextStack
          ? ` The user is currently viewing the "${contextStack.name}" stack: ${contextStack.words.map((w) => `${w.de} (${w.en})`).join(", ") || "no words yet"}.`
          : "");
      let convo = [
        {
          role: "system",
          content: sysPrompt,
        },
        ...nextMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      ];
      let finalReply = null;
      for (let round = 0; round < 4 && finalReply === null; round++) {
        let data = null;
        let lastErrMsg = "";
        for (let attempt = 0; attempt < 3 && !data; attempt++) {
          const res = await dmGroqFetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: "openai/gpt-oss-120b",
              messages: convo,
              temperature: 0.35,
              max_tokens: 2048,
              tools: AI_TOOLS,
              tool_choice: "auto",
            }),
          });
          if (!res.ok) {
            let msg = `Request failed (${res.status})`;
            try {
              const errJson = await res.json();
              if (errJson?.error?.message) msg = errJson.error.message;
            } catch (e) {}
            lastErrMsg = msg;
            const retriable =
              /failed to call a function|tool_use_failed|invalid.*tool|adjust your prompt|tool call validation failed|did not match schema|expected boolean|expected string|expected number/i.test(
                msg
              );
            if (retriable && attempt < 2) {
              await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
              continue;
            }
            throw new Error(msg);
          }
          data = await res.json();
        }
        if (!data) throw new Error(lastErrMsg || "Request failed after retries.");
        const msg = data.choices?.[0]?.message;
        if (!msg) throw new Error("(no response)");
        if (msg.tool_calls && msg.tool_calls.length) {
          const cleanMsg = {
            role: msg.role,
            content: msg.content ?? null,
            tool_calls: msg.tool_calls,
          };
          convo = [...convo, cleanMsg];
          for (const call of msg.tool_calls) {
            let args = {};
            try {
              args = JSON.parse(call.function.arguments || "{}");
            } catch (e) {}
            const result = runTool(call.function.name, args);
            convo = [
              ...convo,
              {
                role: "tool",
                tool_call_id: call.id,
                content: JSON.stringify(result),
              },
            ];
          }
        } else {
          finalReply = msg.content?.trim() || "Done.";
        }
      }
      if (finalReply) {
        setLoading(false);
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content: "",
            streaming: true,
          },
        ]);
        const tokens = finalReply.match(/\S+\s*/g) || [finalReply];
        let acc = "";
        for (let ti = 0; ti < tokens.length; ti++) {
          acc += tokens[ti];
          setMessages((m) => {
            const copy = m.slice();
            copy[copy.length - 1] = {
              role: "assistant",
              content: acc,
              streaming: true,
            };
            return copy;
          });
          await new Promise((r) => setTimeout(r, 14 + Math.random() * 16));
        }
        setMessages((m) => {
          const copy = m.slice();
          copy[copy.length - 1] = {
            role: "assistant",
            content: acc,
            streaming: false,
          };
          return copy;
        });
      } else {
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content: "Done.",
            streaming: false,
          },
        ]);
      }
    } catch (e) {
      setError(e.message || "Something went wrong. Check your API key and try again.");
    } finally {
      setLoading(false);
    }
  };
  const doTranslate = async () => {
    const text = tInput.trim();
    if (!text || tLoading) return;
    if (!isPremium && tFreeCount >= FREE_TRANSLATE_LIMIT) {
      setTError(
        `Free translations used up for today (${FREE_TRANSLATE_LIMIT}/${FREE_TRANSLATE_LIMIT}). Try again tomorrow or upgrade to Premium for unlimited translations.`
      );
      return;
    }
    setTLoading(true);
    setTError("");
    setTAdded(false);
    try {
      const srcLangName = direction === "de2en" ? learnLangName : nativeLangName;
      const sysPrompt = `You are a dictionary and translation engine built into a language-learning app. The user is learning ${learnLangName} and their native language is ${nativeLangName}. The user will give you a word or short phrase in ${srcLangName}. Respond ONLY with a single JSON object (no prose, no markdown fences) describing this word pair, with these exact keys: de (the word/phrase in ${learnLangName}, in dictionary base form — e.g. nominative singular for nouns with no article, infinitive for verbs, positive form for adjectives; for a German reflexive verb this MUST include the leading "sich ", e.g. "sich erinnern", "sich freuen", "sich interessieren" — never just the bare infinitive), en (the translation in ${nativeLangName}), type (one of "noun", "verb", "adj", "other"), level (CEFR: one of "A1","A2","B1","B2","C1","C2", chosen honestly based on real difficulty/frequency in ${learnLangName}), article (German-specific: "der"/"die"/"das" — REQUIRED if type is noun and ${learnLangName} is German, else empty string; SINGULAR gender only — plural always uses "die" regardless, don't let that bias this field), plural (REQUIRED if type is noun, else empty string; the BARE plural form with no article, if ${learnLangName} has one), praeteritum (German-specific simple past form: REQUIRED if type is verb and ${learnLangName} is German, else empty string unless ${learnLangName} has an equivalent simple-past form worth showing), partizipII (German-specific past participle: REQUIRED if type is verb and ${learnLangName} is German, else empty string unless ${learnLangName} has an equivalent worth showing), reflexiv (German-specific: true/false, whether the verb is typically used reflexively with "sich" — always false for non-German languages), komparativ (REQUIRED if type is adj and gradable, else empty string; the comparative form in ${learnLangName}), superlativ (REQUIRED if type is adj and gradable, else empty string; the superlative form in ${learnLangName}; for German give the -ste form used before a noun WITHOUT \"am\", e.g. \"schnellste\"), example_de (one short natural example sentence in ${learnLangName} using the word), example_en (its translation in ${nativeLangName}). Never leave a grammar field blank when it's required by the type and applicable to ${learnLangName}. If the input is already in ${learnLangName}, still return all fields about that word.${isLearningGerman ? ` ${DM_DE_FORM_RULES} ${DM_DE_SPELLING_RULES}return the same JSON with de set to the input exactly as typed, en set to a short question naming the candidates (for example "Did you mean X or Y?"), type "other", and every other field an empty string. Apply the spelling rules to the German word whether it is the input or the translation result.` : ""}`;
      const res = await dmGroqFetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          messages: [
            {
              role: "system",
              content: sysPrompt,
            },
            {
              role: "user",
              content: text,
            },
          ],
          temperature: 0.3,
          response_format: {
            type: "json_object",
          },
        }),
      });
      if (!res.ok) {
        let msg = `Request failed (${res.status})`;
        try {
          const errJson = await res.json();
          if (errJson?.error?.message) msg = errJson.error.message;
        } catch (e) {}
        throw new Error(msg);
      }
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error("(no response)");
      let parsed;
      try {
        parsed = dmParseJson(content);
      } catch (e) {
        throw new Error("Couldn't parse the response. Try again.");
      }
      if (
        parsed.type === "verb" &&
        toBool(parsed.reflexiv) &&
        parsed.de &&
        !/^sich\s/i.test(parsed.de)
      ) {
        parsed.de = `sich ${parsed.de}`;
      }
      setTResult(parsed);
      if (!isPremium) setTFreeCount(incFreeTranslateCount());
    } catch (e) {
      setTError(e.message || "Something went wrong. Check your API key and try again.");
    } finally {
      setTLoading(false);
    }
  };
  const addTranslationToStack = () => {
    if (!tResult) return;
    const targetStack = stacksRef.current.find((s) => s.id === tStackId) || stacksRef.current[0];
    const stackName = targetStack ? targetStack.name : "AI Words";
    runTool("add_word", {
      stack_name: stackName,
      de: tResult.de,
      en: tResult.en,
      type: tResult.type,
      level: tResult.level,
      article: tResult.article,
      plural: tResult.plural,
      praeteritum: tResult.praeteritum,
      partizipII: tResult.partizipII,
      reflexiv: tResult.reflexiv,
      komparativ: tResult.komparativ,
      superlativ: mainSuperlativ(tResult.superlativ),
    });
    setTAdded(true);
  };
  const keyForm = (
    <>
      <p className="dm-ai-intro">
        Connect your own Groq API key to unlock an AI tutor that can explain words, grammar, and
        give example sentences — and can add words or build new stacks for you right inside the app.
      </p>
      <label className="dm-label">Groq API key</label>
      <Input
        className="dm-input"
        type="password"
        autoFocus
        value={keyInput}
        onChange={(e) => setKeyInput(e.target.value)}
        placeholder="gsk_..."
        onKeyDown={(e) => {
          if (e.key === "Enter" && keyInput.trim()) {
            onSaveKey(keyInput.trim());
            setEditingKey(false);
          }
        }}
      />
      <p className="dm-ai-hint">
        {"Get a free key at "}
        <a
          href="https://console.groq.com/keys"
          target="_blank"
          rel="noreferrer"
          className="dm-ai-link"
        >
          console.groq.com/keys
        </a>
        . It's stored only in your browser and sent directly to Groq.
      </p>
      <div className="dm-modal-actions">
        {apiKey && (
          <button
            className="dm-btn-secondary"
            onClick={() => {
              setKeyInput(apiKey);
              setEditingKey(false);
            }}
          >
            Cancel
          </button>
        )}
        <button
          className="dm-btn-primary"
          disabled={!keyInput.trim()}
          onClick={() => {
            onSaveKey(keyInput.trim());
            setEditingKey(false);
          }}
        >
          <Check size={16} />
          {" Save key"}
        </button>
      </div>
    </>
  );
  const quickActions = contextStack
    ? [
        {
          label: "➕ Add words here",
          text: `Add 5 more relevant ${learnLangName} words to "${contextStack.name}", mixing levels and word types naturally.`,
        },
        {
          label: "📝 Example sentence",
          text: `Give me a short example sentence using one of the words already in "${contextStack.name}".`,
        },
        {
          label: "🔍 Review this stack",
          text: `Look at the words in "${contextStack.name}" and tell me if anything looks wrong or could be improved.`,
        },
      ]
    : [
        {
          label: "🗂\ufe0f New stack",
          text: "I want to create a new vocabulary stack.",
        },
        {
          label: "➕ Add words",
          text: `Add some new ${learnLangName} words for me.`,
        },
      ];
  const quickRow =
    messages.length === 0 && !loading ? (
      <div className="dm-ai-quickrow">
        {quickActions.map((qa) => (
          <button
            key={qa.label}
            type="button"
            className="dm-ai-quickbtn"
            onClick={() => send(qa.text)}
          >
            {qa.label}
          </button>
        ))}
      </div>
    ) : null;
  const chatUI = (
    <>
      <div className="dm-ai-messages" ref={listRef}>
        {messages.map((m, i) => (
          <div
            key={i}
            className={`dm-ai-msg dm-ai-msg-${m.role} ${m.streaming ? "dm-ai-msg-streaming" : "dm-ai-msg-in"}`}
          >
            {m.content}
            {m.streaming && <span className="dm-ai-cursor" />}
          </div>
        ))}
        {loading && (
          <div className="dm-ai-msg dm-ai-msg-assistant dm-ai-typing dm-ai-msg-in">
            <span />
            <span />
            <span />
          </div>
        )}
      </div>
      {error && <div className="dm-ai-error">{error}</div>}
      {quickRow}
      <div className="dm-ai-input-row">
        <Input
          className="dm-input dm-ai-input"
          value={input}
          placeholder="Ask about a word, grammar rule…"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
        />
        <button
          className="dm-ai-send"
          onClick={() => send()}
          disabled={loading || !input.trim()}
          type="button"
        >
          <ArrowRight size={18} />
        </button>
      </div>
    </>
  );
  const modeTabs = (
    <div className="dm-segmented dm-ai-tabs">
      <button
        type="button"
        className={`dm-ai-tab ${mode === "chat" ? "dm-ai-tab-active" : ""}`}
        onClick={() => setMode("chat")}
      >
        <Bot size={16} />
        {" Chat"}
      </button>
      <button
        type="button"
        className={`dm-ai-tab ${mode === "translate" ? "dm-ai-tab-active" : ""}`}
        onClick={() => setMode("translate")}
      >
        <Languages size={16} />
        {" Translator"}
      </button>
    </div>
  );
  const translatorUI = (
    <>
      <div className="dm-tr-direction-row">
        <span className="dm-direction-lang">
          {direction === "de2en" ? learnLangName : nativeLangName}
        </span>
        <button
          type="button"
          className="dm-tr-swap-btn"
          title="Swap direction"
          onClick={swapDirection}
        >
          <ArrowLeftRight size={16} />
        </button>
        <span className="dm-direction-lang">
          {direction === "de2en" ? nativeLangName : learnLangName}
        </span>
      </div>
      <div className="dm-ai-input-row dm-tr-input-row">
        <Input
          className="dm-input dm-ai-input"
          value={tInput}
          placeholder={
            "Word or phrase…"
          }
          onChange={(e) => setTInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") doTranslate();
          }}
        />
        <button
          className="dm-ai-clear"
          onClick={() => setTInput("")}
          disabled={!tInput}
          title="Clear"
          aria-label="Clear"
          type="button"
        >
          <X size={18} />
        </button>
        <button
          className="dm-ai-send"
          onClick={doTranslate}
          disabled={
            tLoading || !tInput.trim() || (!isPremium && tFreeCount >= FREE_TRANSLATE_LIMIT)
          }
          type="button"
        >
          <ArrowRight size={18} />
        </button>
      </div>
      {!isPremium && (
        <div className="dm-tr-free-banner">
          {tFreeCount >= FREE_TRANSLATE_LIMIT ? (
            <>
              {"You've used all " + FREE_TRANSLATE_LIMIT + " free translations for today. "}
              <button
                type="button"
                className="dm-tr-free-upgrade"
                onClick={() => onOpenPremium && onOpenPremium()}
              >
                Upgrade to Premium
              </button>
            </>
          ) : (
            `${FREE_TRANSLATE_LIMIT - tFreeCount} of ${FREE_TRANSLATE_LIMIT} free translations left today`
          )}
        </div>
      )}
      <div className="dm-tr-result">
        {tError && <div className="dm-ai-error">{tError}</div>}
        {tLoading && (
          <div className="dm-ai-msg dm-ai-msg-assistant dm-ai-typing dm-tr-loading">
            <span />
            <span />
            <span />
          </div>
        )}
        {!tResult && !tLoading && !tError && (
          <div className="dm-ai-empty dm-tr-empty">
            Enter a word or short phrase to see its translation, grammar forms, and an example
            sentence.
          </div>
        )}
        {tResult && !tLoading && (
          <div className="dm-tr-card">
            <div className="dm-tr-badges">
              {tResult.level && (
                <span
                  className="dm-level-badge"
                  style={{
                    color: LEVEL_COLOR[tResult.level],
                    borderColor: (LEVEL_COLOR[tResult.level] || "#8B93A7") + "55",
                    background: (LEVEL_COLOR[tResult.level] || "#8B93A7") + "1a",
                  }}
                >
                  {tResult.level}
                </span>
              )}
              {tResult.type && (
                <span className="dm-tr-type-badge">{tResult.type.toUpperCase()}</span>
              )}
            </div>
            <div className="dm-tr-term-row">
              <span className="dm-tr-term">
                {tResult.type === "noun" && tResult.article
                  ? `${tResult.article} ${stripArticle(tResult.de)}`
                  : tResult.de}
              </span>
              <button
                className="dm-speak-btn dm-speak-inline dm-tr-speak"
                type="button"
                onClick={() => speak(tResult.de)}
              >
                <Volume2 size={16} />
              </button>
            </div>
            <div className="dm-tr-translation">{tResult.en}</div>
            {(tResult.type === "noun"
              ? tResult.article || tResult.plural
              : tResult.type === "verb"
                ? tResult.praeteritum || tResult.partizipII
                : tResult.type === "adj"
                  ? tResult.komparativ || tResult.superlativ
                  : false) && (
              <div className="dm-tr-grammar">
                {tResult.type === "noun" && (
                  <>
                    <div className="dm-tr-grammar-item">
                      <span className="dm-tr-grammar-label">Article</span>
                      <span className="dm-tr-grammar-value">{tResult.article || "—"}</span>
                    </div>
                    <div className="dm-tr-grammar-item">
                      <span className="dm-tr-grammar-label">Plural</span>
                      <span className="dm-tr-grammar-value">{tResult.plural || "—"}</span>
                    </div>
                  </>
                )}
                {tResult.type === "verb" && (
                  <>
                    <div className="dm-tr-grammar-item">
                      <span className="dm-tr-grammar-label">Präteritum</span>
                      <span className="dm-tr-grammar-value">{tResult.praeteritum || "—"}</span>
                    </div>
                    <div className="dm-tr-grammar-item">
                      <span className="dm-tr-grammar-label">Partizip II</span>
                      <span className="dm-tr-grammar-value">{tResult.partizipII || "—"}</span>
                    </div>
                  </>
                )}
                {tResult.type === "adj" && (
                  <>
                    <div className="dm-tr-grammar-item">
                      <span className="dm-tr-grammar-label">Komparativ</span>
                      <span className="dm-tr-grammar-value">{tResult.komparativ || "—"}</span>
                    </div>
                    <div className="dm-tr-grammar-item">
                      <span className="dm-tr-grammar-label">Superlativ</span>
                      <span className="dm-tr-grammar-value">{tResult.superlativ || "—"}</span>
                    </div>
                  </>
                )}
              </div>
            )}
            {tResult.example_de && (
              <div className="dm-tr-example">
                <div className="dm-tr-example-de">{tResult.example_de}</div>
                {tResult.example_en && <div className="dm-tr-example-en">{tResult.example_en}</div>}
              </div>
            )}
            <div className="dm-tr-footer">
              <StackPickerUp
                stacks={stacksRef.current}
                value={tStackId}
                onChange={setTStackId}
                open={tStackMenuOpen}
                setOpen={setTStackMenuOpen}
              />
              <button
                className={`dm-btn-primary dm-tr-add-btn ${tAdded ? "dm-tr-added" : ""}`}
                type="button"
                onClick={addTranslationToStack}
              >
                {tAdded ? <Check size={16} /> : <Plus size={16} />}
                {tAdded ? " Added" : " Add to stack"}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
  const chatLockedUI = (
    <div className="dm-ai-locked">
      <LockIcon size={26} />
      <h4>AI Chat is a Premium feature</h4>
      <p>
        Upgrade to Premium to chat with the AI Tutor — ask grammar questions, get sentence examples,
        and build stacks together.
      </p>
      <button
        type="button"
        className="dm-btn-primary"
        onClick={() => onOpenPremium && onOpenPremium()}
      >
        Upgrade to Premium
      </button>
    </div>
  );
  return (
    <div
      className={`dm-modal-backdrop ${closing ? "dm-modal-backdrop-closing" : ""}`}
      onClick={closeWithAnim}
    >
      <div
        className={`dm-modal dm-ai-modal ${closing ? "dm-modal-closing" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dm-modal-head">
          <h3 className="dm-ai-title">
            <Bot size={18} />
            {" AI Tutor"}
          </h3>
          <div className="dm-ai-head-actions">
            <IconBtn onClick={closeWithAnim}>
              <X size={18} />
            </IconBtn>
          </div>
        </div>
        {modeTabs}
        <div className="dm-ai-panel">
          <div key={mode} className="dm-ai-panel-slide" data-dir={panelDir}>
            {mode === "chat" ? (isPremium ? chatUI : chatLockedUI) : translatorUI}
          </div>
        </div>
      </div>
    </div>
  );
}
