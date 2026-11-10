// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { UI_LANG_KEY, readUiLanguageChoice, resolveUiLanguage, saveUiLanguageChoice } from "../ui-language";
import { nativeFormLangCode, setNativeFormLangCode } from "../form-prompt-setting";

const CODES = ["en", "de", "ru", "uz"];

describe("interface language choice", () => {
  beforeEach(() => window.localStorage.clear());

  it("is null until one is picked (the app text follows the native language)", () => {
    expect(readUiLanguageChoice(CODES)).toBeNull();
    expect(resolveUiLanguage(null, "ru")).toBe("ru");
  });
  it("a picked language wins over the native language and is remembered", () => {
    saveUiLanguageChoice("en");
    expect(window.localStorage.getItem(UI_LANG_KEY)).toBe("en");
    expect(readUiLanguageChoice(CODES)).toBe("en");
    expect(resolveUiLanguage("en", "ru")).toBe("en");
  });
  it("saving null forgets the choice again", () => {
    saveUiLanguageChoice("de");
    saveUiLanguageChoice(null);
    expect(window.localStorage.getItem(UI_LANG_KEY)).toBeNull();
    expect(readUiLanguageChoice(CODES)).toBeNull();
  });
  it("ignores a saved code that is not a known language", () => {
    window.localStorage.setItem(UI_LANG_KEY, "xx");
    expect(readUiLanguageChoice(CODES)).toBeNull();
  });
  it("never touches the native language", () => {
    window.localStorage.setItem("deutschmaster-native-lang", "ru");
    saveUiLanguageChoice("en");
    expect(window.localStorage.getItem("deutschmaster-native-lang")).toBe("ru");
  });
});

describe("native language for form-card prompts", () => {
  it("is set on its own (not by the interface language) and falls back to English", () => {
    setNativeFormLangCode("ru");
    expect(nativeFormLangCode).toBe("ru");
    setNativeFormLangCode("");
    expect(nativeFormLangCode).toBe("en");
  });
});
