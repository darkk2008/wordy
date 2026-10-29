/* components/appearance-settings/appearance-settings.jsx
 * Themes and AppearanceSettings screen.
 */

import { FREE_THEME_LIMIT } from "../../services/premium-status";
import { IconBtn } from "../common/common";
import { Check, ChevronLeft } from "../icons/icons";
import { LockIcon } from "../icons/settings-icons";

export const THEMES = [
  {
    id: "dark",
    name: "Dark",
    swatch: "#0a0c11",
    accent: "#6EE7F9",
  },
  {
    id: "light",
    name: "Light",
    swatch: "#F5F6FA",
    accent: "#0E9BB5",
  },
  {
    id: "midnight",
    name: "Midnight",
    swatch: "#0b0a17",
    accent: "#B58FFF",
  },
  {
    id: "sunset",
    name: "Sunset",
    swatch: "#170e0c",
    accent: "#FF8C5A",
  },
  {
    id: "forest",
    name: "Forest",
    swatch: "#F4F8F3",
    accent: "#1E8F5E",
  },
  {
    id: "ocean",
    name: "Ocean",
    swatch: "#EEF6F9",
    accent: "#0B84A6",
  },
  {
    id: "peach",
    name: "Peach",
    swatch: "#FFF1E8",
    accent: "#E8743B",
  },
  {
    id: "emerald",
    name: "Emerald",
    swatch: "#0a1511",
    accent: "#34D399",
  },
  {
    id: "rose",
    name: "Rose",
    swatch: "#FBF0F4",
    accent: "#D6396F",
  },
  {
    id: "slate",
    name: "Slate",
    swatch: "#10141c",
    accent: "#7C93B8",
  },
  {
    id: "amber",
    name: "Amber",
    swatch: "#FCF6E9",
    accent: "#C97A00",
  },
  {
    id: "aurora",
    name: "Aurora",
    swatch: "#081414",
    accent: "#2FE0B5",
  },
  {
    id: "crimson",
    name: "Crimson",
    swatch: "#17090c",
    accent: "#FF4D6D",
  },
  {
    id: "cobalt",
    name: "Cobalt",
    swatch: "#070c16",
    accent: "#4C8DFF",
  },
  {
    id: "graphite",
    name: "Graphite",
    swatch: "#101114",
    accent: "#C9CED9",
  },
  {
    id: "lavender",
    name: "Lavender",
    swatch: "#F6F3FC",
    accent: "#8B5CF6",
  },
  {
    id: "mint",
    name: "Mint",
    swatch: "#EFFBF7",
    accent: "#14B8A6",
  },
  {
    id: "cocoa",
    name: "Cocoa",
    swatch: "#FBF3EA",
    accent: "#A9642E",
  },
  {
    id: "nord",
    name: "Nord",
    swatch: "#2E3440",
    accent: "#88C0D0",
  },
  {
    id: "clay",
    name: "Clay",
    swatch: "#E0C9A6",
    accent: "#B5502E",
  },
  {
    id: "lagoon",
    name: "Lagoon",
    swatch: "#16302E",
    accent: "#2DD4BF",
  },
  {
    id: "mauve",
    name: "Mauve",
    swatch: "#D9BFC4",
    accent: "#8C3B4A",
  },
  {
    id: "onyx",
    name: "Onyx",
    swatch: "#0c0b09",
    accent: "#E5B454",
  },
  {
    id: "plum",
    name: "Plum",
    swatch: "#150b17",
    accent: "#E879F9",
  },
  {
    id: "sage",
    name: "Sage",
    swatch: "#EDF1E8",
    accent: "#5F8A55",
  },
  {
    id: "citrus",
    name: "Citrus",
    swatch: "#FBFAE8",
    accent: "#8DB600",
  },
];
export function AppearanceSettings({ theme, onSelectTheme, onBack, isPremium, onOpenPremium }) {
  return (
    <div className="dm-view dm-settings-subview dm-appearance-view">
      <div className="dm-topbar">
        <IconBtn onClick={onBack}>
          <ChevronLeft size={20} />
        </IconBtn>
        <div className="dm-topbar-title">Appearance</div>
      </div>
      <p className="dm-settings-hint">
        Pick a theme for the app. The quick toggle on the Home screen only switches between Dark and
        Light.
        {!isPremium &&
          " Free accounts get the first " +
            FREE_THEME_LIMIT +
            " themes — upgrade to Premium to unlock them all."}
      </p>
      <div className="dm-theme-grid">
        {THEMES.map((t, i) => {
          const locked = !isPremium && i >= FREE_THEME_LIMIT;
          return (
            <button
              key={t.id}
              type="button"
              className={`dm-theme-card ${theme === t.id ? "dm-theme-card-active" : ""} ${locked ? "dm-theme-card-locked" : ""}`}
              style={{
                animationDelay: `${i * 0.07}s`,
              }}
              onClick={() => (locked ? onOpenPremium && onOpenPremium() : onSelectTheme(t.id))}
            >
              <span
                className="dm-theme-swatch"
                style={{
                  background: t.swatch,
                  borderColor: t.accent,
                }}
              >
                <span
                  className="dm-theme-swatch-dot"
                  style={{
                    background: t.accent,
                  }}
                />
                {locked && (
                  <span className="dm-theme-lock-badge">
                    <LockIcon size={12} />
                  </span>
                )}
              </span>
              <span className="dm-theme-name">{t.name}</span>
              {theme === t.id && <Check size={15} className="dm-theme-check" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
