/* components/privacy-settings/privacy-settings.jsx
 * Privacy settings section.
 */

import { Fragment, useState } from "react";
import { dmAnalyticsConsent, dmSetAnalyticsConsent } from "../../services/config-and-validation";
import { FormsToggle } from "../games/setup-controls";

export function PrivacySettingsSection() {
  const [on, setOn] = useState(() => dmAnalyticsConsent());
  const toggle = (v) => {
    const next = typeof v === "boolean" ? v : !on;
    setOn(next);
    dmSetAnalyticsConsent(next);
  };
  return (
    <>
      <div className="dm-settings-section-label">Privacy</div>
      <div className="dm-settings-row">
        <div>
          <div className="dm-settings-row-title">Share anonymous usage statistics</div>
          <div className="dm-settings-row-sub">
            Helps improve the app. Never includes your words, decks or API key. Off by default.
          </div>
        </div>
        <FormsToggle checked={on} onChange={toggle} compact />
      </div>
    </>
  );
}
