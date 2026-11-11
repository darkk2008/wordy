// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { createRoot } from "react-dom/client";
import { act, useState } from "react";
import { StackSelect } from "../stack-select";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const mk = (id, name, n) => ({
  id,
  name,
  emoji: "book",
  words: Array.from({ length: n }, (_, i) => ({ id: `${id}${i}`, de: "x", en: "y" })),
});
const stacks = [mk("a", "verbs", 10), mk("b", "nouns", 1), mk("c", "adjectives", 3)];

function Harness({ variant = "dropdown", withSwitch = true }) {
  const [value, setValue] = useState("a");
  const [multi, setMulti] = useState(false);
  const [vals, setVals] = useState(["a"]);
  return (
    <StackSelect
      stacks={stacks}
      value={value}
      onChange={setValue}
      variant={variant}
      multi={multi}
      values={vals}
      onMultiChange={
        withSwitch
          ? (on) => {
              if (on) setVals([value]);
              else setValue(vals[0] || value);
              setMulti(on);
            }
          : undefined
      }
      onChangeValues={setVals}
    />
  );
}
let root, el;
function mount(props) {
  el = document.createElement("div");
  document.body.appendChild(el);
  root = createRoot(el);
  act(() => root.render(<Harness {...props} />));
}
afterEach(() => {
  act(() => root.unmount());
  document.body.innerHTML = "";
});
const click = (n) => act(() => n.dispatchEvent(new MouseEvent("click", { bubbles: true })));
const open = () => click(el.querySelector(".dm-stackselect-trigger"));
const sw = () => el.querySelector('[role="switch"]');
const opts = () => [...el.querySelectorAll(".dm-ss-opt")];
const sub = () => el.querySelector(".dm-ss-sub").textContent;

describe("StackSelect: several stacks at once", () => {
  it("has no switch unless the parent supports it", () => {
    mount({ withSwitch: false });
    open();
    expect(sw()).toBeNull();
    expect(el.querySelector(".dm-ss-head-actions")).toBeNull();
  });

  it("the switch turns on multi mode; rows become checkboxes that toggle and keep the sheet open", () => {
    mount();
    open();
    expect(sw().getAttribute("aria-checked")).toBe("false");
    expect(sub()).toBe("3 stacks");
    click(sw());
    expect(sw().getAttribute("aria-checked")).toBe("true");
    expect(el.querySelector(".dm-ss-title").textContent).toBe("Practice stacks");
    expect(el.querySelector('[role="listbox"]').getAttribute("aria-multiselectable")).toBe("true");
    expect(sub()).toBe("1 selected · 10 words"); // starts from the stack that was chosen
    click(opts()[1]);
    click(opts()[2]);
    expect(sub()).toBe("3 selected · 14 words");
    expect(opts().every((o) => o.getAttribute("aria-selected") === "true")).toBe(true);
    expect(el.querySelector(".dm-ss-sheet")).toBeTruthy(); // still open
    click(opts()[0]);
    click(opts()[1]);
    expect(sub()).toBe("1 selected · 3 words");
    click(opts()[2]); // the last one cannot be taken away
    expect(sub()).toBe("1 selected · 3 words");
    expect(opts()[2].getAttribute("aria-selected")).toBe("true");
  });

  it("Select all (a check box) and Done sit in the title row, between the title and the close button", () => {
    mount();
    open();
    expect(el.querySelector(".dm-ss-head-actions")).toBeNull(); // single mode: nothing extra
    click(sw());
    const head = el.querySelector(".dm-ss-head");
    expect([...head.children].map((c) => c.className.split(" ")[0])).toEqual([
      "dm-ss-head-text",
      "dm-ss-head-actions",
      "dm-ss-close",
    ]);
    expect(el.querySelector(".dm-ss-foot")).toBeNull(); // no footer that makes the sheet taller
  });

  it("Select all is a check box: it ticks when every stack is picked, and unticking keeps one", () => {
    mount();
    open();
    click(sw());
    const all = () => el.querySelector(".dm-ss-all");
    expect(all().getAttribute("role")).toBe("checkbox");
    expect(all().getAttribute("aria-label")).toBe("Select all");
    expect(all().textContent).toBe("All");
    expect(all().getAttribute("aria-checked")).toBe("false");
    expect(all().querySelector("svg")).toBeNull(); // empty box
    click(all());
    expect(sub()).toBe("3 selected · 14 words");
    expect(all().getAttribute("aria-checked")).toBe("true");
    expect(all().querySelector(".dm-ss-all-box svg")).toBeTruthy(); // the check mark
    expect(all().textContent).toBe("All"); // the label stays, the box shows the state
    click(all());
    expect(sub()).toBe("1 selected · 10 words");
    expect(all().getAttribute("aria-checked")).toBe("false");
    // picking every row by hand ticks it too
    click(opts()[1]);
    click(opts()[2]);
    expect(all().getAttribute("aria-checked")).toBe("true");
  });

  it("Done closes the sheet and the trigger shows a summary", () => {
    mount();
    open();
    click(sw());
    click(el.querySelector(".dm-ss-all"));
    expect(el.querySelector(".dm-ss-done").getAttribute("aria-label")).toBe("Done");
    click(el.querySelector(".dm-ss-done"));
    expect(el.querySelector(".dm-ss-sheet")).toBeNull();
    expect(el.querySelector(".dm-stackselect-name").textContent).toBe("3 stacks");
    expect(el.querySelector(".dm-stackselect-count").textContent).toBe("14 words");
  });

  it("with one stack picked the trigger looks as before; turning the switch off goes back to single choice", () => {
    mount();
    open();
    click(sw());
    click(opts()[1]);
    click(opts()[0]);
    click(el.querySelector(".dm-ss-done"));
    expect(el.querySelector(".dm-stackselect-name").textContent).toBe("nouns");
    open();
    click(sw());
    expect(el.querySelector('[role="listbox"]').getAttribute("aria-multiselectable")).toBeNull();
    expect(el.querySelector(".dm-ss-head-actions")).toBeNull();
    expect(opts()[1].getAttribute("aria-selected")).toBe("true"); // keeps the first picked stack
    click(opts()[2]); // single mode again: picks and closes
    expect(el.querySelector(".dm-ss-sheet")).toBeNull();
    expect(el.querySelector(".dm-stackselect-name").textContent).toBe("adjectives");
  });

  it("the rail (open practice settings) works the same way", () => {
    mount({ variant: "rail" });
    const items = () => [...el.querySelectorAll(".dm-stackrail-item")];
    expect(items()[0].getAttribute("role")).toBe("radio");
    click(sw());
    expect(items()[0].getAttribute("role")).toBe("checkbox");
    click(items()[2]);
    expect(items().map((i) => i.getAttribute("aria-checked"))).toEqual(["true", "false", "true"]);
    click(items()[0]);
    click(items()[2]); // last one stays
    expect(items().map((i) => i.getAttribute("aria-checked"))).toEqual(["false", "false", "true"]);
  });
});
