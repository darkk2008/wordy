/* components/bottom-nav/bottom-nav.jsx
 * BottomNav (tab bar / desktop sidebar).
 */

import { useLayoutEffect, useRef, useState } from "react";
import { Gamepad2, Home, IconBase, Star } from "../icons/icons";
import { SettingsIcon } from "../icons/settings-icons";
import { uiNavLabel } from "../../services/ui-translation";

export function BottomNav({ tab, setTab, hidden, learningLanguage }) {
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
  return (
    <div ref={navRef} className={`dm-bottomnav ${hidden ? "dm-bottomnav-hidden" : ""}`}>
      {items.map((it) => {
        return (
          <button
            key={it.id}
            className={`dm-navbtn ${tab === it.id ? "dm-navbtn-active" : ""}`}
            title={it.label}
            aria-label={it.label}
            onClick={() => setTab(it.id)}
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
    </div>
  );
}
