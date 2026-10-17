/* components/restrictions-settings/restrictions-settings.jsx
 * Restrictions / guardrails settings, built from the standard settings rows.
 */

import { IconBtn } from "../common/common";
import { ChevronLeft } from "../icons/icons";
import { FormsToggle } from "../games/setup-controls";

function SettingToggle({ title, sub, checked, onChange }) {
  return (
    <div className="dm-settings-row">
      <div>
        <div className="dm-settings-row-title">{title}</div>
        <div className="dm-settings-row-sub">{sub}</div>
      </div>
      <FormsToggle checked={checked} onChange={onChange} compact title={title} />
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
  showLevelBadge,
  onToggleShowLevelBadge,
}) {
  return (
    <div className="dm-view dm-settings-subview">
      <div className="dm-topbar">
        <IconBtn onClick={onBack}>
          <ChevronLeft size={20} />
        </IconBtn>
        <div className="dm-topbar-title">Guardrails</div>
      </div>
      <div className="dm-settings-section-label">Privacy</div>
      <SettingToggle
        title="Restrict copying messages"
        sub="Prevent selecting or copying message text anywhere in the app."
        checked={restrictCopy}
        onChange={onToggleRestrictCopy}
      />
      <div className="dm-settings-section-label">Home layout</div>
      <SettingToggle
        title="Family filters on Home"
        sub="Show the row of family filter chips (All + each family) above your stacks on Home."
        checked={!hideFamilyFilters}
        onChange={(val) => onToggleHideFamilyFilters(!val)}
      />
      <SettingToggle
        title="Family progress on Home"
        sub="Show the stats card and due-words review banner on Home when a family filter is selected."
        checked={showFamilyStats}
        onChange={onToggleShowFamilyStats}
      />
      <div className="dm-settings-section-label">Word display</div>
      <SettingToggle
        title="Hide noun articles"
        sub="When on, der/die/das is hidden everywhere a noun is shown. When off, nouns are shown with their article."
        checked={hideArticles}
        onChange={onToggleHideArticles}
      />
      <SettingToggle
        title="Show level badge"
        sub="When on, the level badge (A1, B2, …) is shown on word cards. Turn off for a cleaner card."
        checked={showLevelBadge}
        onChange={onToggleShowLevelBadge}
      />
    </div>
  );
}
