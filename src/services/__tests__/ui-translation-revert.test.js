// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { setUiTranslationLanguage } from "../ui-translation";

const tick = () => new Promise((r) => setTimeout(r, 20));

describe("switching the interface language back to English", () => {
  afterEach(() => {
    setUiTranslationLanguage("en");
    document.body.innerHTML = "";
  });

  it("restores translated text, but keeps text the app changed in the meantime", async () => {
    document.body.innerHTML = '<div id="root"><p id="a">Languages</p><p id="b">Russian</p></div>';
    setUiTranslationLanguage("ru");
    await tick();
    expect(document.getElementById("a").textContent).toBe("Языки");
    expect(document.getElementById("b").textContent).toBe("Русский");

    // the app swaps in new text in place (what React does for a text child) while the language flips
    document.getElementById("b").firstChild.nodeValue = "English";
    setUiTranslationLanguage("en");
    expect(document.getElementById("a").textContent).toBe("Languages"); // translation undone
    expect(document.getElementById("b").textContent).toBe("English"); // not overwritten with stale "Russian"
  });
});
