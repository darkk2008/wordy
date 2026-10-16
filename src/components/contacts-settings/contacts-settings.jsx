/* components/contacts-settings/contacts-settings.jsx
 * Contact (Telegram) settings.
 */

import { IconBtn } from "../common/common";
import { BugIcon, ChevronLeft, LightbulbSuggestIcon, SendIcon } from "../icons/icons";
import { UsersIcon } from "../icons/settings-icons";

const TELEGRAM_CONTACT_URL = "https://t.me/calledww";
function openTelegramContact() {
  try {
    window.open(TELEGRAM_CONTACT_URL, "_blank", "noopener,noreferrer");
  } catch (e) {}
}
export function openTelegramPurchase(itemLabel, priceLabel) {
  try {
    const message = `Hi! I'd like to buy ${itemLabel} for ${priceLabel}`;
    const url = `${TELEGRAM_CONTACT_URL}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  } catch (e) {}
}
export function ContactsSettings({ onBack }) {
  const ROWS = [
    {
      id: "feedback",
      icon: <SendIcon size={18} />,
      title: "General feedback",
      sub: "Thoughts, questions, anything else",
    },
    {
      id: "bug",
      icon: <BugIcon size={18} />,
      title: "Report a bug",
      sub: "Something broken or not working right",
    },
    {
      id: "idea",
      icon: <LightbulbSuggestIcon size={18} />,
      title: "Suggest a feature",
      sub: "An idea for something new",
    },
  ];
  return (
    <div className="dm-view dm-settings-subview">
      <div className="dm-topbar">
        <IconBtn onClick={onBack}>
          <ChevronLeft size={20} />
        </IconBtn>
        <div className="dm-topbar-title">Contacts</div>
      </div>
      <div className="dm-header">
        <div>
          <div className="dm-eyebrow">GET IN TOUCH</div>
          <h1 className="dm-h1">Contact us</h1>
        </div>
      </div>
      <p className="dm-settings-hint">
        Have a question, found a bug, or want to suggest something? Reach out any time — every
        option below opens the same chat.
      </p>
      {ROWS.map((r) => (
        <div key={r.id} className="dm-settings-row">
          <div>
            <div className="dm-settings-row-title">{r.title}</div>
            <div className="dm-settings-row-sub">{r.sub}</div>
          </div>
          <button type="button" className="dm-icon-action-btn" onClick={openTelegramContact}>
            {r.icon}
            {" Message"}
          </button>
        </div>
      ))}
      <div className="dm-settings-section-label">Business</div>
      <div className="dm-settings-row">
        <div>
          <div className="dm-settings-row-title">{"Business & Partnerships"}</div>
          <div className="dm-settings-row-sub">Advertising, sponsorships or collaborations</div>
        </div>
        <button type="button" className="dm-icon-action-btn" onClick={openTelegramContact}>
          <UsersIcon size={18} />
          {" Message"}
        </button>
      </div>
    </div>
  );
}
