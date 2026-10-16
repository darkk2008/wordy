/* components/restrictions-settings/restrictions-settings.jsx
 * Restrictions / guardrails settings.
 */

import { IconBtn } from "../common/common";
import { Check, ChevronLeft, EyeOff, Layers } from "../icons/icons";
import { BarChartIcon, LockIcon, PinIcon, ShieldIcon } from "../icons/settings-icons";

function GuardRow({ icon, color, title, sub, checked, onChange }) {
  return (
    <div
      className={`dm-guard-row ${checked ? "dm-guard-row-on" : ""}`}
      style={{
        "--guard-color": color,
      }}
    >
      <div className="dm-guard-icon">{icon}</div>
      <div className="dm-guard-text">
        <div className="dm-guard-title">{title}</div>
        <div className="dm-guard-sub">{sub}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className={`dm-guard-switch ${checked ? "dm-guard-switch-on" : ""}`}
        onClick={() => onChange(!checked)}
      >
        <span className="dm-guard-switch-knob">
          <Check size={12} />
        </span>
      </button>
    </div>
  );
}
export function RestrictionsSettings({
  onBack,
  restrictCopy,
  onToggleRestrictCopy,
  showFamilyStats,
  onToggleShowFamilyStats,
  hideFamilyFilters,
  onToggleHideFamilyFilters,
  hideArticles,
  onToggleHideArticles,
  stickyFilters,
  onToggleStickyFilters,
}) {
  return (
    <div className="dm-view dm-settings-subview">
      <div className="dm-topbar">
        <IconBtn onClick={onBack}>
          <ChevronLeft size={20} />
        </IconBtn>
        <div className="dm-topbar-title">Guardrails</div>
      </div>
      <div className="dm-guard-hero">
        <span className="dm-guard-hero-glow" />
        <span className="dm-guard-hero-ring" />
        <div className="dm-guard-hero-icon">
          <ShieldIcon size={28} />
        </div>
        <div className="dm-guard-hero-title">Guardrails</div>
        <p className="dm-guard-hero-text">
          Shape what's copyable, visible, and pinned throughout the app.
        </p>
      </div>
      <div className="dm-guard-group">
        <div
          className="dm-guard-group-label"
          style={{
            "--guard-group-color": "var(--red)",
          }}
        >
          Privacy
        </div>
        <GuardRow
          icon={<LockIcon size={18} />}
          color="var(--red)"
          title="Restrict copying messages"
          sub="Prevent selecting or copying message text anywhere in the app."
          checked={restrictCopy}
          onChange={onToggleRestrictCopy}
        />
      </div>
      <div className="dm-guard-group">
        <div
          className="dm-guard-group-label"
          style={{
            "--guard-group-color": "var(--cyan)",
          }}
        >
          Home layout
        </div>
        <GuardRow
          icon={<Layers size={18} />}
          color="var(--cyan)"
          title="Family filters on Home"
          sub="Show the row of family filter chips (All + each family) above your stacks on Home."
          checked={!hideFamilyFilters}
          onChange={(val) => onToggleHideFamilyFilters(!val)}
        />
        <GuardRow
          icon={<BarChartIcon size={18} />}
          color="var(--green)"
          title="Family progress on Home"
          sub="Show the stats card and due-words review banner on Home when a family filter is selected."
          checked={showFamilyStats}
          onChange={onToggleShowFamilyStats}
        />
      </div>
      <div className="dm-guard-group">
        <div
          className="dm-guard-group-label"
          style={{
            "--guard-group-color": "var(--gold)",
          }}
        >
          Word display
        </div>
        <GuardRow
          icon={<EyeOff size={18} />}
          color="var(--gold)"
          title="Hide noun articles"
          sub="When on, der/die/das is hidden everywhere a noun is shown. When off, nouns are shown with their article."
          checked={hideArticles}
          onChange={onToggleHideArticles}
        />
        <GuardRow
          icon={<PinIcon size={18} />}
          color="#A78BFA"
          title="Sticky filters"
          sub="Keep the GER/ENG/BOTH/FORMS filter bar pinned to the top while scrolling a stack's word list. Off: the filter bar scrolls away with the list like any other element."
          checked={stickyFilters}
          onChange={onToggleStickyFilters}
        />
      </div>
    </div>
  );
}
