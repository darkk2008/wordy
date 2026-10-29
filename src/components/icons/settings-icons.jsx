/* components/icons/settings-icons.jsx
 * Icons used by the settings screens.
 */

import { IconBase } from "./icons";

export const GraduationCap = (p) => (
  <IconBase {...p}>
    <path d="M2 9l10-5 10 5-10 5-10-5z" />
    <path d="M6 11.5V17c0 1.5 2.7 3 6 3s6-1.5 6-3v-5.5" />
    <path d="M22 9v6" />
  </IconBase>
);
export const SettingsIcon = (p) => (
  <IconBase {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </IconBase>
);
export const PaletteIcon = (p) => (
  <IconBase {...p}>
    <path d="M12 2a10 10 0 1 0 0 20c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.3-.5-.8-.5-1.2 0-.9.7-1.6 1.6-1.6H16a4 4 0 0 0 4-4c0-5.5-4.5-9.9-8-9.9z" />
    <circle cx="7.5" cy="10.5" r="1.2" />
    <circle cx="11.5" cy="6.8" r="1.2" />
    <circle cx="16" cy="9" r="1.2" />
  </IconBase>
);
export const BellIcon = (p) => (
  <IconBase {...p}>
    <path d="M6 8a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6" />
    <path d="M10.5 21a1.5 1.5 0 0 0 3 0" />
  </IconBase>
);
export const InfoIcon = (p) => (
  <IconBase {...p}>
    <circle cx="12" cy="12" r="9" />
    <line x1="12" y1="11" x2="12" y2="16" />
    <line x1="12" y1="7.5" x2="12.01" y2="7.5" />
  </IconBase>
);
export const UsersIcon = (p) => (
  <IconBase {...p}>
    <circle cx="9" cy="8" r="3.1" />
    <path d="M2.3 20c0-3.7 3-6.7 6.7-6.7s6.7 3 6.7 6.7" />
    <circle cx="17" cy="8.3" r="2.6" />
    <path d="M15.3 13.7c2.7.4 4.7 2.8 4.7 5.9" />
  </IconBase>
);
export const BarChartIcon = (p) => (
  <IconBase {...p}>
    <path d="M3 3v18h18" />
    <rect x="7" y="12" width="3" height="6" />
    <rect x="12.5" y="8" width="3" height="10" />
    <rect x="18" y="5" width="3" height="13" />
  </IconBase>
);
export const DmBadgeLock = (p) => (
  <svg width={p.size || 10} height={p.size || 10} viewBox="0 0 24 24" aria-hidden="true">
    <rect x="4.5" y="10.5" width="15" height="10.5" rx="2.6" fill="currentColor" stroke="none" />
    <path
      d="M8 10.5V7.5a4 4 0 0 1 8 0v3"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
    />
  </svg>
);
export const LockIcon = (p) => (
  <IconBase {...p}>
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </IconBase>
);
export const ShieldIcon = (p) => (
  <IconBase {...p}>
    <path d="M12 3l7 3.2v5.3c0 4.6-3 8.6-7 9.5-4-.9-7-4.9-7-9.5V6.2z" />
    <path d="M9 12.2l2 2 4-4.4" />
  </IconBase>
);
export const PinIcon = (p) => (
  <IconBase {...p}>
    <path d="M4 8V6a2 2 0 0 1 2-2h2" />
    <path d="M16 4h2a2 2 0 0 1 2 2v2" />
    <path d="M20 16v2a2 2 0 0 1-2 2h-2" />
    <path d="M8 20H6a2 2 0 0 1-2-2v-2" />
    <circle cx="12" cy="12" r="2.25" fill="currentColor" stroke="none" />
  </IconBase>
);
export const ArchiveIcon = (p) => (
  <IconBase {...p}>
    <rect x="2" y="3" width="20" height="5" rx="1" />
    <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />
    <path d="M10 12h4" />
  </IconBase>
);
export const CrownIcon = (p) => (
  <IconBase {...p}>
    <path d="M3 19h18l-1.6-8.4-4.4 3.2L12 6l-3 7.8-4.4-3.2L3 19z" />
    <path d="M5.5 21.5h13" />
  </IconBase>
);
export const TagIcon = (p) => (
  <IconBase {...p}>
    <path d="M20.6 12.3 12.3 20.6a1.9 1.9 0 0 1-2.7 0l-7-7A1.9 1.9 0 0 1 2 12.2V4.4C2 3.1 3.1 2 4.4 2h7.8c.5 0 1 .2 1.35.55l7 7c.75.75.75 1.95.05 2.75z" />
    <circle cx="7.5" cy="7.5" r="1.6" />
  </IconBase>
);
const SadFaceIcon = (p) => (
  <IconBase {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8.5 15.5c1-1.2 2.2-1.8 3.5-1.8s2.5.6 3.5 1.8" />
    <line x1="9" y1="9.5" x2="9.01" y2="9.5" />
    <line x1="15" y1="9.5" x2="15.01" y2="9.5" />
  </IconBase>
);
const BookOpenIcon = (p) => (
  <IconBase {...p}>
    <path d="M12 6c-2-1.3-4.5-2-7-2v13c2.5 0 5 .7 7 2" />
    <path d="M12 6c2-1.3 4.5-2 7-2v13c-2.5 0-5 .7-7 2" />
    <path d="M12 6v13" />
  </IconBase>
);
const LightbulbIcon = (p) => (
  <IconBase {...p}>
    <path d="M9 18h6M10 21h4" />
    <path d="M12 3a6 6 0 0 0-3.6 10.8c.5.4.8 1 .8 1.7V16h5.6v-.5c0-.7.3-1.3.8-1.7A6 6 0 0 0 12 3z" />
  </IconBase>
);
const ChatBubbleIcon = (p) => (
  <IconBase {...p}>
    <path d="M4 5h16v11H8l-4 4V5z" />
  </IconBase>
);
export const GlobeIcon = (p) => (
  <IconBase {...p}>
    <circle cx="12" cy="12" r="9" />
    <ellipse cx="12" cy="12" rx="4" ry="9" />
    <path d="M3 12h18" />
    <path d="M4.5 7.5h15M4.5 16.5h15" />
  </IconBase>
);
