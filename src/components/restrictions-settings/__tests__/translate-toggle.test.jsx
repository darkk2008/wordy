// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { RestrictionsSettings } from "../restrictions-settings";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("Guardrails screen", () => {
  it("has the Translate form cards toggle wired to its handler", () => {
    const onToggle = vi.fn();
    const el = document.createElement("div");
    document.body.appendChild(el);
    act(() => {
      createRoot(el).render(
        <RestrictionsSettings onBack={() => {}} translateForms={true} onToggleTranslateForms={onToggle} />
      );
    });
    const rows = [...el.querySelectorAll(".dm-settings-row")];
    const row = rows.find((r) => r.textContent.includes("Translate form cards"));
    expect(row).toBeTruthy();
    const control = row.querySelector("button, input, [role='switch']");
    act(() => control.dispatchEvent(new MouseEvent("click", { bubbles: true })));
    expect(onToggle).toHaveBeenCalledWith(false);
  });
});
