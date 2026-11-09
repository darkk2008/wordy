import { describe, expect, it } from "vitest";
import { nativeFormPhrase } from "../english-forms";
import { russianPastPhrase } from "../russian-forms";

const past = (v) => russianPastPhrase("past", v);
const part = (v) => russianPastPhrase("participle", v);

describe("Russian past forms", () => {
  it("regular verbs", () => {
    expect(past("сжигать")).toBe("сжигал");
    expect(part("сжигать")).toBe("сжигавший");
    expect(past("говорить")).toBe("говорил");
    expect(past("вернуть")).toBe("вернул");
    expect(past("быть")).toBe("был");
    expect(past("читать")).toBe("читал");
  });
  it("irregular verbs and prefixes", () => {
    expect([past("сжечь"), part("сжечь")]).toEqual(["сжёг", "сжёгший"]);
    expect([past("идти"), part("идти")]).toEqual(["шёл", "шедший"]);
    expect(past("найти")).toBe("нашёл");
    expect(past("прийти")).toBe("пришёл");
    expect(past("выйти")).toBe("вышел");
    expect([past("нести"), part("нести")]).toEqual(["нёс", "несший"]);
    expect(past("принести")).toBe("принёс");
    expect(past("вынести")).toBe("вынес");
    expect(past("помочь")).toBe("помог");
    expect([past("есть"), part("есть")]).toEqual(["ел", "евший"]);
    expect(past("сесть")).toBe("сел");
    expect(past("лезть")).toBe("лез");
    expect([past("умереть"), part("умереть")]).toEqual(["умер", "умерший"]);
    expect(past("стереть")).toBe("стёр");
    expect(past("вытереть")).toBe("вытер");
    expect(past("гаснуть")).toBe("гас");
  });
  it("reflexive verbs and phrases", () => {
    expect([past("учиться"), part("учиться")]).toEqual(["учился", "учившийся"]);
    expect(past("разойтись")).toBe("разошёлся");
    expect(past("открывать дверь")).toBe("открывал дверь");
  });
  it("unknown words are not guessed", () => {
    expect(past("дом")).toBeNull();
    expect(past("")).toBeNull();
  });
  it("nativeFormPhrase uses it for ru, and falls back to the base word", () => {
    expect(nativeFormPhrase("participle", "сжигать", "ru")).toBe("сжигавший");
    expect(nativeFormPhrase("past", "сжигать, поджигать", "ru")).toBe("сжигал");
    expect(nativeFormPhrase("past", "дом", "ru")).toBe("дом");
    expect(nativeFormPhrase("plural", "дом", "ru")).toBe("дом");
    expect(nativeFormPhrase("past", "to wait", "en")).toBe("waited");
  });
});
