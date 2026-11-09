// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { initModalExit } from "../modal-exit";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const tick = () => new Promise((r) => setTimeout(r, 0));

function Demo({ open }) {
  return (
    <div className="dm-app">
      <button id="keep">x</button>
      {open && (
        <div className="dm-modal-backdrop">
          <div className="dm-modal">
            <button id="confirm">Delete</button>
          </div>
        </div>
      )}
    </div>
  );
}

describe("modal exit animation", () => {
  it("keeps a non-interactive closing copy of a removed modal, then removes it", async () => {
    initModalExit();
    const el = document.createElement("div");
    document.body.appendChild(el);
    const root = createRoot(el);
    await act(async () => root.render(<Demo open />));
    expect(el.querySelectorAll(".dm-modal-backdrop").length).toBe(1);

    await act(async () => root.render(<Demo open={false} />));
    await tick();
    const ghost = el.querySelector(".dm-modal-ghost");
    expect(ghost).toBeTruthy();
    expect(ghost.classList.contains("dm-modal-backdrop-closing")).toBe(true);
    expect(ghost.querySelector(".dm-modal").classList.contains("dm-modal-closing")).toBe(true);
    expect(ghost.getAttribute("aria-hidden")).toBe("true");
    expect(ghost.parentElement.className).toBe("dm-app"); // stays inside the app (theme styles)

    await new Promise((r) => setTimeout(r, 320));
    expect(el.querySelector(".dm-modal-ghost")).toBeNull();
  });

  it("does not copy a modal that already animated out itself", async () => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    const host = document.createElement("div");
    host.className = "dm-app";
    el.appendChild(host);
    const m = document.createElement("div");
    m.className = "dm-modal-backdrop dm-modal-backdrop-closing";
    host.appendChild(m);
    await tick();
    m.remove();
    await tick();
    expect(host.querySelector(".dm-modal-ghost")).toBeNull();
  });

  it("a modal that opens with a focused text field only fades (no slide next to the keyboard)", async () => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    const host = document.createElement("div");
    host.className = "dm-app";
    el.appendChild(host);
    const m = document.createElement("div");
    m.className = "dm-modal-backdrop";
    m.innerHTML = '<div class="dm-modal"><input id="name" type="text" /></div>';
    host.appendChild(m);
    m.querySelector("#name").focus();
    await tick();
    expect(m.classList.contains("dm-modal-kb")).toBe(true);

    const plain = document.createElement("div");
    plain.className = "dm-modal-backdrop";
    plain.innerHTML = '<div class="dm-modal"><button>ok</button></div>';
    document.activeElement.blur();
    host.appendChild(plain);
    await tick();
    expect(plain.classList.contains("dm-modal-kb")).toBe(false);
  });

  it("a modal closing while the keyboard is up leaves with a fade only", async () => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    const host = document.createElement("div");
    host.className = "dm-app";
    el.appendChild(host);
    const m = document.createElement("div");
    m.className = "dm-modal-backdrop";
    m.innerHTML = '<div class="dm-modal"></div>';
    host.appendChild(m);
    await tick();
    document.documentElement.classList.add("dm-kb-open");
    m.remove();
    await tick();
    document.documentElement.classList.remove("dm-kb-open");
    const ghost = host.querySelector(".dm-modal-ghost");
    expect(ghost.classList.contains("dm-modal-ghost-fade")).toBe(true);
  });
});
