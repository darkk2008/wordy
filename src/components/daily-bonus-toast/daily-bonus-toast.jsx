/* components/daily-bonus-toast/daily-bonus-toast.jsx
 * DailyBonusToast: small toast shown for the daily gems bonus.
 */

import { useEffect } from "react";
import { GemIcon } from "../icons/settings-icons";

export function DailyBonusToast({ amount, streak, onDismiss }) {
  useEffect(() => {
    const t = window.setTimeout(onDismiss, 4200);
    return () => window.clearTimeout(t);
  }, []);
  return (
    <div className="dm-daily-bonus-toast" onClick={onDismiss}>
      <GemIcon size={20} className="dm-daily-bonus-icon" />
      <div className="dm-daily-bonus-text">
        <span className="dm-daily-bonus-title">{`+${amount} Gems`}</span>
        <span className="dm-daily-bonus-sub">{`Day ${streak} streak bonus`}</span>
      </div>
    </div>
  );
}
