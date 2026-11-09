// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { ArchivedStacksSettings } from "../../archived-stacks-settings/archived-stacks-settings";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("archived stacks use the home stack tile", () => {
  it("renders icon, name and the one-line meta with the family chip", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    const root = createRoot(el);
    const stacks = [{ id: "a", name: "verbs", emoji: "book", familyId: "f1", words: [{ id: "1" }, { id: "2" }] }];
    act(() =>
      root.render(
        <ArchivedStacksSettings
          archivedStacks={stacks}
          families={[{ id: "f1", name: "German" }]}
          onBack={() => {}}
          onUnarchiveStack={() => {}}
        />
      )
    );
    expect(el.querySelector(".dm-stack-grid-v2 .dm-stack-deck")).not.toBeNull();
    const card = el.querySelector(".dm-stack-card");
    expect(card.querySelector(".dm-stack-meta .dm-stack-count").textContent).toBe("2 words");
    expect(card.querySelector(".dm-stack-meta .dm-stack-family-badge").textContent).toBe("German");
    expect(card.querySelector(".dm-stack-name").textContent).toBe("verbs");
  });
});
