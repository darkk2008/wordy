/* components/games/word-lookup-popup.jsx
 * Tap-a-word lookup popup used by listening/sentence games.
 */

import { Fragment, useEffect, useState } from "react";
import {
  DM_DE_FORM_RULES,
  GENDER_SETS,
  ROMAN_LANGS,
  uid,
  usesGenderTag,
} from "../../core/constants";
import { currentLearningLangCode } from "../../core/speech-voices";
import { LEVELS, LEVEL_COLOR } from "../../core/srs-and-seed-data";
import {
  dmGroqFetch,
  dmLookupPrompt,
  dmLookupTerm,
  dmParseJson,
  dmStripLangArticle,
} from "../../services/ai-groq";
import { IconBtn } from "../common/common";
import { Check, Plus, Volume2, X } from "../icons/icons";
import { getLangName } from "../language-settings/language-settings";
import { StackPickerUp } from "../stack-select/stack-select";
import { mainSuperlativ, stripArticle } from "../word-forms/word-forms";
import { normTok, stripPunct } from "./speaking-game";

export function WordLookupPopup({
  token,
  targetWord,
  apiKey,
  stacks,
  onAddWord,
  onSpeak,
  onClose,
  nativeLanguage,
}) {
  const nativeLangName = getLangName(nativeLanguage || "en");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [stackId, setStackId] = useState(stacks[0]?.id || null);
  const [stackMenuOpen, setStackMenuOpen] = useState(false);
  const [added, setAdded] = useState(false);
  const [closing, setClosing] = useState(false);
  const closeWithAnim = () => {
    if (closing) return;
    setClosing(true);
    setTimeout(() => onClose(), 220);
  };
  useEffect(() => {
    const clean = stripPunct(token);
    if (targetWord && normTok(token) === normTok(targetWord.de)) {
      setData({
        de: targetWord.de,
        en: targetWord.en,
        type: targetWord.type,
        level: targetWord.level,
        article: targetWord.article,
        plural: targetWord.plural,
        praeteritum: targetWord.praeteritum,
        partizipII: targetWord.partizipII,
        komparativ: targetWord.komparativ,
        superlativ: targetWord.superlativ,
        gender: targetWord.gender,
        roman: targetWord.roman,
      });
      return;
    }
    if (!apiKey) {
      setError("Add a Groq API key in the AI Tutor to look up words.");
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError("");
    (async () => {
      try {
        const sysPrompt =
          currentLearningLangCode === "de"
            ? 'You are a German dictionary engine built into a vocabulary app. The user gives you a single German word or short phrase exactly as it appeared inside a sentence (it may be inflected or capitalized mid-sentence). Respond ONLY with a single JSON object (no prose, no markdown fences) describing its dictionary base form, with these exact keys: de (dictionary base form — nominative singular for nouns WITHOUT the article, infinitive for verbs, positive form for adjectives, or the word itself for other types; for a REFLEXIVE verb, this MUST include the leading "sich ", e.g. "sich erinnern", "sich freuen" — never just the bare infinitive), en (a concise translation in ' +
              nativeLangName +
              '), type (one of "noun", "verb", "adj", "other"), level (CEFR: one of "A1","A2","B1","B2","C1","C2", chosen honestly), article ("der"/"die"/"das" — REQUIRED if type is noun, else empty string; SINGULAR gender only — plural always uses "die" regardless, don\'t let that bias this field), plural (REQUIRED if type is noun, else empty string; BARE plural noun, no article), praeteritum (REQUIRED if type is verb, else empty string), partizipII (REQUIRED if type is verb, else empty string), reflexiv (REQUIRED if type is verb, else false; true/false — whether the verb is typically used reflexively with sich, e.g. sich freuen, sich erinnern — true; regular verbs like gehen, essen — false), komparativ (empty string if not adj or not gradable), superlativ (empty string if not adj or not gradable).' +
              ' ' +
              DM_DE_FORM_RULES
            : dmLookupPrompt(currentLearningLangCode, nativeLangName);
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
                content: clean,
              },
            ],
            temperature: 0.2,
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
        const resData = await res.json();
        const content = resData.choices?.[0]?.message?.content;
        if (!content) throw new Error("(no response)");
        let parsed;
        try {
          parsed = dmParseJson(content);
        } catch (e) {
          throw new Error("Couldn't parse the response. Try again.");
        }
        if (!cancelled) {
          const isReflexivVerb =
            parsed.type === "verb" &&
            (parsed.reflexiv === true ||
              parsed.reflexiv === "true" ||
              parsed.reflexiv === 1 ||
              parsed.reflexiv === "1");
          if (isReflexivVerb && parsed.de && !/^sich\s/i.test(parsed.de)) {
            parsed.de = `sich ${parsed.de}`;
          }
          setData(parsed);
        }
      } catch (e) {
        if (!cancelled) setError(e.message || "Something went wrong. Try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);
  const addToStack = () => {
    if (!data) return;
    const targetStack = stacks.find((s) => s.id === stackId) || stacks[0];
    if (!targetStack) return;
    const lookupLang = currentLearningLangCode;
    const rawGender = String(data.article || data.gender || "")
      .toLowerCase()
      .trim();
    const genderVal =
      data.type === "noun" && (GENDER_SETS[lookupLang] || []).includes(rawGender) ? rawGender : "";
    const article = genderVal && !usesGenderTag(lookupLang) ? genderVal : "";
    const de =
      article && lookupLang === "de"
        ? `${article} ${stripArticle(data.de || "")}`
        : data.type === "noun"
          ? dmStripLangArticle(data.de || "")
          : data.de || "";
    const word = {
      id: uid(),
      de,
      en: data.en || "",
      type: data.type || "other",
      level: LEVELS.includes(data.level) ? data.level : "",
      article,
      gender: genderVal && usesGenderTag(lookupLang) ? genderVal : "",
      roman: ROMAN_LANGS[lookupLang] ? String(data.roman || "").trim() : "",
      plural: stripArticle(data.plural || ""),
      praeteritum: data.praeteritum || "",
      partizipII: data.partizipII || "",
      reflexiv:
        data.type === "verb" &&
        (data.reflexiv === true ||
          data.reflexiv === "true" ||
          data.reflexiv === 1 ||
          data.reflexiv === "1"),
      komparativ: data.komparativ || "",
      superlativ: mainSuperlativ(data.superlativ || ""),
      favorite: false,
      srs: {
        level: 0,
        next: Date.now(),
        correct: 0,
        wrong: 0,
      },
    };
    onAddWord(targetStack.id, word);
    setAdded(true);
  };
  return (
    <div
      className={`dm-modal-backdrop dm-modal-review-backdrop${closing ? " dm-modal-backdrop-closing" : ""}`}
      onClick={closeWithAnim}
    >
      <div
        className={`dm-modal dm-word-popup dm-modal-review${closing ? " dm-modal-closing" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dm-modal-head">
          <div className="dm-tr-badges">
            {data?.level && (
              <span
                className="dm-level-badge"
                style={{
                  color: LEVEL_COLOR[data.level],
                  borderColor: (LEVEL_COLOR[data.level] || "#8B93A7") + "55",
                  background: (LEVEL_COLOR[data.level] || "#8B93A7") + "1a",
                }}
              >
                {data.level}
              </span>
            )}
            {data?.type && <span className="dm-tr-type-badge">{data.type.toUpperCase()}</span>}
          </div>
          <IconBtn onClick={closeWithAnim}>
            <X size={18} />
          </IconBtn>
        </div>
        {loading && (
          <div className="dm-ai-msg dm-ai-msg-assistant dm-ai-typing dm-tr-loading">
            <span />
            <span />
            <span />
          </div>
        )}
        {error && <div className="dm-autofill-error">{error}</div>}
        {data && (
          <>
            <div className="dm-tr-term-row">
              <span className="dm-tr-term">{dmLookupTerm(data)}</span>
              <button
                className="dm-speak-btn dm-speak-inline dm-tr-speak"
                type="button"
                onClick={() => onSpeak(data.de)}
              >
                <Volume2 size={16} />
              </button>
            </div>
            <div className="dm-tr-translation">{data.en}</div>
            <div className="dm-tr-footer">
              <StackPickerUp
                stacks={stacks}
                value={stackId}
                onChange={setStackId}
                open={stackMenuOpen}
                setOpen={setStackMenuOpen}
              />
              <button
                className={`dm-btn-primary dm-tr-add-btn ${added ? "dm-tr-added" : ""}`}
                type="button"
                onClick={addToStack}
              >
                {added ? <Check size={16} /> : <Plus size={16} />}
                {added ? " Added" : " Add to stack"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
