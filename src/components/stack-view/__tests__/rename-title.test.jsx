// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { StackView } from "../stack-view";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function mount(props) {
  const el = document.createElement("div");
  document.body.appendChild(el);
  const root = createRoot(el);
  act(() => {
    root.render(<StackView {...props} />);
  });
  return { el, root };
}
const base = () => ({
  stack: { id: "s1", name: "Tiere", emoji: "book", words: [] },
  onUpdateStack: vi.fn(),
  onBack: () => {},
  isPremium: true,
});
const click = (node) => act(() => node.dispatchEvent(new MouseEvent("click", { bubbles: true })));

afterEach(() => {
  document.body.innerHTML = "";
});

describe("stack title double click", () => {
  it("single click does nothing, double click opens modal, save updates name+icon", () => {
    const props = base();
    const { el } = mount(props);
    const title = el.querySelector(".dm-stack-title-main");
    click(title);
    expect(document.body.textContent).not.toContain("Edit stack");
    click(title);
    expect(document.body.textContent).toContain("Edit stack");
    const input = document.body.querySelector(".dm-modal input.dm-input");
    expect(input.value).toBe("Tiere");
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
    act(() => {
      setter.call(input, "  Haustiere ");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    const picks = document.body.querySelectorAll(".dm-emoji-pick");
    click(picks[1]);
    click(document.body.querySelector(".dm-modal .dm-btn-primary"));
    expect(props.onUpdateStack).toHaveBeenCalledTimes(1);
    const arg = props.onUpdateStack.mock.calls[0][0];
    expect(arg.name).toBe("Haustiere");
    expect(arg.id).toBe("s1");
    expect(arg.emoji).not.toBe("book");
  });
  it("favorites (virtual) stack is not editable", () => {
    const { el } = mount({ ...base(), isFavorites: true });
    const title = el.querySelector(".dm-stack-title-main");
    click(title);
    click(title);
    expect(document.body.textContent).not.toContain("Edit stack");
  });
});
