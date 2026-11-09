// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { setTranslateFormPrompts } from "../../../core/form-prompt-setting";
import { buildFormQuestions } from "../write-game";

const verb = { id: "1", type: "verb", de: "verbrennen", en: "сжигать", praeteritum: "verbrannte", partizipII: "verbrannt" };

afterEach(() => setTranslateFormPrompts(true));

describe("Guardrails: Translate form cards", () => {
  it("on (default): prompt is the native meaning, badge names the form", () => {
    const qs = buildFormQuestions(verb);
    const part = qs.find((q) => q.answer === "verbrannt");
    expect(part.badge).toBe("Past participle of verbrennen");
    expect(part.prompt).not.toBe(part.badge);
  });
  it("off: prompt is the untranslated label, no duplicate badge", () => {
    setTranslateFormPrompts(false);
    const qs = buildFormQuestions(verb);
    const part = qs.find((q) => q.answer === "verbrannt");
    expect(part.prompt).toBe("Past participle of verbrennen");
    expect(part.badge).toBe("");
    expect(qs.find((q) => q.answer === "verbrannte").prompt).toBe("Past tense of verbrennen");
    const adj = buildFormQuestions({ id: "2", type: "adj", de: "schön", en: "красивый" });
    expect(adj[0].prompt).toBe("Comparative of schön");
  });
});
