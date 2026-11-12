/* components/bottom-nav/bottom-nav.jsx
 * BottomNav (tab bar / desktop sidebar).
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Gamepad2, Home, IconBase, Star } from "../icons/icons";
import { ArchiveIcon, PaletteIcon, SettingsIcon, UsersIcon } from "../icons/settings-icons";
import { uiNavLabel } from "../../services/ui-translation";

const LONG_PRESS_MS = 450;
const LONG_PRESS_MOVE_PX = 10;

// Quick access shown by a long press (or right-click / the context-menu key) on Settings.
// `section` is a SettingsView section id.
const SETTINGS_QUICK_ITEMS = [
  { section: "archived", label: "Archived Stacks", Icon: ArchiveIcon },
  { section: "families", label: "Families", Icon: UsersIcon },
  { section: "appearance", label: "Appearance", Icon: PaletteIcon },
];

// While the menu is open, everything outside it is only a "closer": the press that closes the menu
// must not also trigger the button under the finger. Its pointerdown is stopped, and the click that
// follows it is swallowed once (with a timeout in case no click ever comes).
function swallowNextClick() {
  const kill = (ev) => {
    ev.stopPropagation();
    ev.preventDefault();
    cleanup();
  };
  let timer = null;
  const cleanup = () => {
    document.removeEventListener("click", kill, true);
    clearTimeout(timer);
  };
  document.addEventListener("click", kill, true);
  timer = setTimeout(cleanup, 800);
}

// A small menu next to the Settings icon. It is rendered in a portal inside .dm-app (the nav has
// `contain: paint`, which would clip it, and the theme variables live on .dm-app) and positioned
// from the icon's rectangle: to the right of it in the desktop sidebar, above it on the phone bar.
function SettingsQuickMenu({ anchorRect, closing, onPick, onClose, returnFocusRef }) {
  const menuRef = useRef(null);
  const [pos, setPos] = useState(null);
  useLayoutEffect(() => {
    const el = menuRef.current;
    if (!el || !anchorRect) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const gap = 10;
    const pad = 8;
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(v, Math.max(lo, hi)));
    if (vw >= 900) {
      // sidebar: open to the right, centred on the icon
      const top = clamp(anchorRect.top + anchorRect.height / 2 - h / 2, pad, vh - h - pad);
      const left = clamp(anchorRect.right + gap, pad, vw - w - pad);
      const iconY = anchorRect.top + anchorRect.height / 2 - top;
      // the corner next to the icon is the sharp one, so the menu visibly "points" at Settings
      setPos({ left, top, ox: "0%", oy: `${iconY}px`, corner: iconY <= h / 2 ? "tl" : "bl" });
    } else {
      // bottom bar: open above, right edge lined up with the icon
      const left = clamp(anchorRect.left + anchorRect.width / 2 - w + 28, pad, vw - w - pad);
      const top = clamp(anchorRect.top - h - gap, pad, vh - h - pad);
      const iconX = anchorRect.left + anchorRect.width / 2 - left;
      setPos({ left, top, ox: `${iconX}px`, oy: "100%", corner: iconX > w / 2 ? "br" : "bl" });
    }
  }, [anchorRect]);
  useEffect(() => {
    const first = menuRef.current && menuRef.current.querySelector("button");
    if (first) first.focus({ preventScroll: true });
    const onDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        e.stopPropagation();
        swallowNextClick();
        onClose();
      }
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        if (returnFocusRef && returnFocusRef.current) returnFocusRef.current.focus();
      }
    };
    const onViewport = () => onClose();
    document.addEventListener("pointerdown", onDown, true);
    document.addEventListener("keydown", onKey, true);
    window.addEventListener("resize", onViewport);
    window.addEventListener("scroll", onViewport, true);
    return () => {
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("keydown", onKey, true);
      window.removeEventListener("resize", onViewport);
      window.removeEventListener("scroll", onViewport, true);
    };
  }, [onClose, returnFocusRef]);
  const onMenuKeyDown = (e) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const items = [...menuRef.current.querySelectorAll("button")];
    const i = items.indexOf(document.activeElement);
    const next = e.key === "ArrowDown" ? (i + 1) % items.length : (i - 1 + items.length) % items.length;
    items[next].focus();
  };
  return createPortal(
    <div
      ref={menuRef}
      className={`dm-nav-quickmenu${closing ? " dm-nav-quickmenu-closing" : ""}`}
      data-corner={pos ? pos.corner : undefined}
      role="menu"
      aria-label="Settings shortcuts"
      onKeyDown={onMenuKeyDown}
      style={
        pos
          ? { left: pos.left, top: pos.top, "--ox": pos.ox, "--oy": pos.oy }
          : { left: 0, top: 0, visibility: "hidden" }
      }
    >
      {SETTINGS_QUICK_ITEMS.map(({ section, label, Icon }) => (
        <button
          key={section}
          type="button"
          role="menuitem"
          className="dm-nav-quickmenu-item"
          onClick={() => onPick(section)}
        >
          <Icon size={20} />
          <span>{label}</span>
        </button>
      ))}
    </div>,
    document.querySelector(".dm-app") || document.body
  );
}

export function BottomNav({ tab, setTab, hidden, learningLanguage, onOpenSettingsSection }) {
  const items = [
    {
      id: "home",
      Icon: Home,
      label: "Home",
    },
    {
      id: "games",
      Icon: Gamepad2,
      label: "Games",
    },
    {
      id: "favorites",
      Icon: Star,
      label: "Favorites",
    },
    {
      id: "settings",
      Icon: SettingsIcon,
      label: "Settings",
    },
  ];
  const navRef = useRef(null);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem("dm-nav-collapsed") === "1";
    } catch (e) {
      return false;
    }
  });
  useLayoutEffect(() => {
    const app = navRef.current && navRef.current.closest(".dm-app");
    if (app) app.classList.toggle("dm-nav-collapsed", collapsed);
    try {
      localStorage.setItem("dm-nav-collapsed", collapsed ? "1" : "0");
    } catch (e) {}
    if (!app) return;
    // React rewrites .dm-app's className whenever it re-renders (e.g. theme toggle),
    // which silently drops the class added above. Put it back whenever that happens.
    const mo = new MutationObserver(() => {
      if (app.classList.contains("dm-nav-collapsed") !== collapsed)
        app.classList.toggle("dm-nav-collapsed", collapsed);
    });
    mo.observe(app, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => mo.disconnect();
  }, [collapsed]);

  // Long press on Settings -> quick menu. The press is cancelled by moving the finger, lifting it
  // early, or the pointer leaving the button. After a long press the click that follows must not
  // also switch tabs.
  const settingsBtnRef = useRef(null);
  const pressRef = useRef({ timer: null, x: 0, y: 0, fired: false });
  const [quickMenu, setQuickMenu] = useState(null); // { rect, closing } while open
  const quickTimerRef = useRef(null);
  // Closing plays a short shrink-back animation toward the icon before the menu is removed.
  const closeQuickMenu = useCallback(() => {
    setQuickMenu((q) => (q && !q.closing ? { ...q, closing: true } : q));
    clearTimeout(quickTimerRef.current);
    const reduce = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    quickTimerRef.current = setTimeout(() => setQuickMenu(null), reduce ? 0 : 180);
  }, []);
  useEffect(() => () => clearTimeout(quickTimerRef.current), []);
  const cancelPress = () => {
    const p = pressRef.current;
    if (p.timer) clearTimeout(p.timer);
    p.timer = null;
  };
  const openQuickMenu = () => {
    const btn = settingsBtnRef.current;
    if (!btn) return;
    clearTimeout(quickTimerRef.current);
    setQuickMenu({ rect: btn.getBoundingClientRect(), closing: false });
  };
  useEffect(() => cancelPress, []);
  useEffect(() => {
    if (hidden) setQuickMenu(null);
  }, [hidden]);
  const settingsPressHandlers = {
    onPointerDown: (e) => {
      if (e.button !== undefined && e.button !== 0) return;
      const p = pressRef.current;
      cancelPress();
      p.fired = false;
      p.x = e.clientX;
      p.y = e.clientY;
      p.timer = setTimeout(() => {
        p.timer = null;
        p.fired = true;
        openQuickMenu();
      }, LONG_PRESS_MS);
    },
    onPointerMove: (e) => {
      const p = pressRef.current;
      if (!p.timer) return;
      if (Math.abs(e.clientX - p.x) > LONG_PRESS_MOVE_PX || Math.abs(e.clientY - p.y) > LONG_PRESS_MOVE_PX) cancelPress();
    },
    onPointerUp: cancelPress,
    onPointerCancel: cancelPress,
    onPointerLeave: cancelPress,
    // Right-click, the context-menu key and Shift+F10 open the same menu; on touch devices the
    // browser's own long-press menu is suppressed.
    onContextMenu: (e) => {
      e.preventDefault();
      cancelPress();
      openQuickMenu();
    },
    // a keyboard press is never the release of a long press
    onKeyDown: () => {
      pressRef.current.fired = false;
    },
  };
  return (
    <div ref={navRef} className={`dm-bottomnav ${hidden ? "dm-bottomnav-hidden" : ""}`}>
      {items.map((it) => {
        const isSettings = it.id === "settings";
        return (
          <button
            key={it.id}
            ref={isSettings ? settingsBtnRef : undefined}
            className={`dm-navbtn ${tab === it.id ? "dm-navbtn-active" : ""}`}
            title={it.label}
            aria-label={it.label}
            {...(isSettings
              ? { ...settingsPressHandlers, "aria-haspopup": "menu", "aria-expanded": !!quickMenu && !quickMenu.closing }
              : {})}
            onClick={(e) => {
              if (isSettings && pressRef.current.fired) {
                // this click is the release of a long press: the menu opened instead of the tab
                pressRef.current.fired = false;
                e.preventDefault();
                return;
              }
              setTab(it.id);
            }}
          >
            <it.Icon size={20} />
            <span className="dm-navbtn-label">{uiNavLabel(it.label)}</span>
          </button>
        );
      })}
      <button
        type="button"
        className="dm-nav-collapse-btn"
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-expanded={!collapsed}
        onClick={() => setCollapsed((c) => !c)}
      >
        <IconBase size={16} className="dm-nav-collapse-icon">
          <path d="M11 17l-5-5 5-5" />
          <path d="M18 17l-5-5 5-5" />
        </IconBase>
      </button>
      {quickMenu && (
        <SettingsQuickMenu
          anchorRect={quickMenu.rect}
          closing={quickMenu.closing}
          returnFocusRef={settingsBtnRef}
          onClose={closeQuickMenu}
          onPick={(section) => {
            closeQuickMenu();
            if (onOpenSettingsSection) onOpenSettingsSection(section);
            else setTab("settings");
          }}
        />
      )}
    </div>
  );
}
