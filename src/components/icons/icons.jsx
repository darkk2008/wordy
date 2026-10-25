/* components/icons/icons.jsx
 * Small SVG icon components (IconBase + Home, Star, Search, Plus ...).
 */

import { Fragment } from "react";

export function IconBase({ size = 18, color, fill, style, className, children, ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill || "none"}
      stroke={color || "currentColor"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      className={className}
      {...rest}
    >
      {children}
    </svg>
  );
}
export const Home = (p) => (
  <IconBase {...p}>
    <path d="M3 11l9-8 9 8" />
    <path d="M5 10v10a1 1 0 0 0 1 1h3v-6h6v6h3a1 1 0 0 0 1-1V10" />
  </IconBase>
);
export const Gamepad2 = (p) => (
  <IconBase {...p}>
    <rect x="2" y="7" width="20" height="11" rx="4" />
    <path d="M7 11v3M5.5 12.5h3" />
    <circle cx="16" cy="10.5" r="1" />
    <circle cx="18.5" cy="13" r="1" />
  </IconBase>
);
export const Star = (p) => (
  <IconBase {...p}>
    <polygon points="12 2 15 9 22 9.5 17 14.5 18.5 22 12 18 5.5 22 7 14.5 2 9.5 9 9" />
  </IconBase>
);
const BarChart3 = (p) => (
  <IconBase {...p}>
    <path d="M4 20V10M12 20V4M20 20v-7" />
    <path d="M3 20h18" />
  </IconBase>
);
export const Search = (p) => (
  <IconBase {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </IconBase>
);
export const Plus = (p) => (
  <IconBase {...p}>
    <path d="M12 5v14M5 12h14" />
  </IconBase>
);
export const X = (p) => (
  <IconBase {...p}>
    <path d="M18 6L6 18M6 6l12 12" />
  </IconBase>
);
export const ChevronLeft = (p) => (
  <IconBase {...p} data-flip-rtl="true">
    <path d="M15 18l-6-6 6-6" />
  </IconBase>
);
export const ChevronRight = (p) => (
  <IconBase {...p} data-flip-rtl="true">
    <path d="M9 18l6-6-6-6" />
  </IconBase>
);
export const ChevronDown = (p) => (
  <IconBase {...p}>
    <path d="M6 9l6 6 6-6" />
  </IconBase>
);
export const ChevronUp = (p) => (
  <IconBase {...p}>
    <path d="M18 15l-6-6-6 6" />
  </IconBase>
);
export const ChevronsDownUp = (p) => (
  <IconBase {...p}>
    <path d="M7 20l5-5 5 5" />
    <path d="M7 4l5 5 5-5" />
  </IconBase>
);
export const ChevronsUpDown = (p) => (
  <IconBase {...p}>
    <path d="M7 15l5 5 5-5" />
    <path d="M7 9l5-5 5 5" />
  </IconBase>
);
export const Bot = (p) => (
  <IconBase {...p}>
    <rect x="4" y="9" width="16" height="11" rx="4" />
    <path d="M12 9V5" />
    <circle cx="12" cy="3.5" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="9" cy="14.5" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="15" cy="14.5" r="1.4" fill="currentColor" stroke="none" />
    <path d="M2 14h2M20 14h2" />
  </IconBase>
);
export const KeyIcon = (p) => (
  <IconBase {...p}>
    <circle cx="8" cy="15" r="4" />
    <path d="M10.8 12.2L20 3" />
    <path d="M16.5 6.5L19 9" />
    <path d="M13.7 9.3L16 11.5" />
  </IconBase>
);
export const UserIcon = (p) => (
  <IconBase {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7" />
  </IconBase>
);
export const SendIcon = (p) => (
  <IconBase {...p}>
    <path d="M22 2L11 13" />
    <path d="M22 2l-7 20-4-9-9-4 20-7z" />
  </IconBase>
);
export const BugIcon = (p) => (
  <IconBase {...p}>
    <rect x="7" y="8" width="10" height="11" rx="5" />
    <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    <path d="M7 12H3M7 16H3.5M17 12h4M17 16h3.5M9 3l-1.5-1.5M15 3l1.5-1.5" />
  </IconBase>
);
export const LightbulbSuggestIcon = (p) => (
  <IconBase {...p}>
    <path d="M9 18h6M10 21h4" />
    <path d="M12 3a6 6 0 0 0-4 10.5c.7.6 1 1.3 1 2.5h6c0-1.2.3-1.9 1-2.5A6 6 0 0 0 12 3z" />
  </IconBase>
);
export const Volume2 = (p) => (
  <IconBase {...p}>
    <path d="M4 9v6h4l5 5V4L8 9H4z" />
    <path d="M17.5 8.5a5 5 0 0 1 0 7M20 6a8.5 8.5 0 0 1 0 12" />
  </IconBase>
);
export const Mic = (p) => (
  <IconBase {...p}>
    <rect x="9" y="2" width="6" height="12" rx="3" />
    <path d="M5 10v1a7 7 0 0 0 14 0v-1" />
    <path d="M12 18v4M9 22h6" />
  </IconBase>
);
export const MoreVertical = (p) => (
  <IconBase {...p}>
    <circle cx="12" cy="5" r="1.3" />
    <circle cx="12" cy="12" r="1.3" />
    <circle cx="12" cy="19" r="1.3" />
  </IconBase>
);
export const MoreOrClose = ({ open, size = 16, className, ...rest }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={`dm-moc-icon${open ? " dm-moc-open" : ""}${className ? " " + className : ""}`}
    {...rest}
  >
    <line
      className="dm-moc-dot dm-moc-dot-top"
      x1="11.9"
      y1="5"
      x2="12.1"
      y2="5"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
    />
    <line
      className="dm-moc-dot dm-moc-dot-mid"
      x1="11.9"
      y1="12"
      x2="12.1"
      y2="12"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
    />
    <line
      className="dm-moc-dot dm-moc-dot-bottom"
      x1="11.9"
      y1="19"
      x2="12.1"
      y2="19"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
    />
  </svg>
);
export const MenuOrClose = ({ open, size = 16, className, ...rest }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={`dm-mnc-icon${open ? " dm-mnc-open" : ""}${className ? " " + className : ""}`}
    {...rest}
  >
    <line
      className="dm-mnc-bar dm-mnc-bar-top"
      x1="4"
      y1="7"
      x2="20"
      y2="7"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
    <line
      className="dm-mnc-bar dm-mnc-bar-mid"
      x1="4"
      y1="12"
      x2="15"
      y2="12"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
    <line
      className="dm-mnc-bar dm-mnc-bar-bottom"
      x1="4"
      y1="17"
      x2="20"
      y2="17"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
  </svg>
);
export const Flame = (p) => (
  <IconBase {...p}>
    <path d="M12 22c4 0 6.5-2.5 6.5-6 0-3-2-4.5-2.5-7-1 1.5-2 2-2 2 .5-3-1.5-6-3.5-7 .5 3-1 5-2.5 6.5C6.5 12 6 13.5 6 16c0 3.5 2.5 6 6 6z" />
  </IconBase>
);
export const Layers = (p) => (
  <IconBase {...p}>
    <polygon points="12 2 22 8 12 14 2 8 12 2" />
    <polyline points="2 13 12 19 22 13" />
    <polyline points="2 18 12 22 22 18" />
  </IconBase>
);
export const Shuffle = (p) => (
  <IconBase {...p}>
    <path d="M3 6h4l9 12h5M14 6h5v5M3 18h4l3.5-4.5M17 18l3-3-3-3" />
  </IconBase>
);
export const Clock = (p) => (
  <IconBase {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 3" />
  </IconBase>
);
export const Type = (p) => (
  <IconBase {...p}>
    <path d="M4 6h16M12 6v14M9 20h6" />
  </IconBase>
);
export const Grid3x3 = (p) => (
  <IconBase {...p}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
  </IconBase>
);
export const TableIcon = (p) => (
  <IconBase {...p}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M9 3v18M3 9h18" />
  </IconBase>
);
export const Pencil = (p) => (
  <IconBase {...p}>
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    <path d="M15 5l4 4" />
  </IconBase>
);
export const Headphones = (p) => (
  <IconBase {...p}>
    <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
  </IconBase>
);
export const Grid2x2 = (p) => (
  <IconBase {...p}>
    <rect x="3" y="3" width="8" height="8" rx="1.5" />
    <rect x="13" y="3" width="8" height="8" rx="1.5" />
    <rect x="3" y="13" width="8" height="8" rx="1.5" />
    <rect x="13" y="13" width="8" height="8" rx="1.5" />
  </IconBase>
);
export const Zap = (p) => (
  <IconBase {...p}>
    <polygon points="13 2 3 14 11 14 10 22 21 10 13 10 13 2" />
  </IconBase>
);
export const Check = (p) => (
  <IconBase {...p}>
    <path d="M20 6L9 17l-5-5" />
  </IconBase>
);
export const ListChecksIcon = (p) => (
  <IconBase {...p}>
    <path d="M4 6l1.4 1.4L8 4.6" />
    <path d="M4 12l1.4 1.4L8 10.6" />
    <path d="M4 18l1.4 1.4L8 15.6" />
    <path d="M12 6h8M12 12h8M12 18h8" />
  </IconBase>
);
export const Trash2 = (p) => (
  <IconBase {...p}>
    <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
    <path d="M10 11v6M14 11v6" />
  </IconBase>
);
export const Sparkles = (p) => (
  <IconBase {...p}>
    <path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3z" />
    <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z" />
  </IconBase>
);
export const Sun = (p) => (
  <IconBase {...p}>
    <circle cx="12" cy="12" r="4.5" />
    <path d="M12 2.5v2.5M12 19v2.5M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2.5 12h2.5M19 12h2.5M4.2 19.8L6 18M18 6l1.8-1.8" />
  </IconBase>
);
export const Moon = (p) => (
  <IconBase {...p}>
    <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z" />
  </IconBase>
);
export const Loader2 = (p) => (
  <IconBase {...p}>
    <path d="M12 3a9 9 0 1 0 9 9" opacity="0.9" />
  </IconBase>
);
export const ArrowRight = (p) => (
  <IconBase {...p} data-flip-rtl="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </IconBase>
);
export const RotateCcw = (p) => (
  <IconBase {...p}>
    <path d="M3 12a9 9 0 1 0 3-6.7" />
    <path d="M3 4v5h5" />
  </IconBase>
);
export const ArrowLeftRight = (p) => (
  <IconBase {...p}>
    <path d="M3 7h13M12 3l4 4-4 4" />
    <path d="M21 17H8m5 4l-4-4 4-4" />
  </IconBase>
);
export const Languages = (p) => (
  <IconBase {...p}>
    <path d="M3 6h9M7.5 4v2M9.5 6c-.6 3-2.6 5.5-5.5 7M6 10c1 1.2 2.2 2 4 2.6" />
    <path d="M14 21l4-9 4 9M15.3 18h5.4" />
  </IconBase>
);
export const Download = (p) => (
  <IconBase {...p}>
    <path d="M12 3v12M7 10l5 5 5-5" />
    <path d="M4 19h16" />
  </IconBase>
);
export const DatabaseIcon = (p) => (
  <IconBase {...p}>
    <ellipse cx="12" cy="5.5" rx="8" ry="3" />
    <path d="M4 5.5V12c0 1.66 3.58 3 8 3s8-1.34 8-3V5.5" />
    <path d="M4 12v6.5c0 1.66 3.58 3 8 3s8-1.34 8-3V12" />
  </IconBase>
);
export const Share2 = (p) => (
  <IconBase {...p}>
    <circle cx="18" cy="5" r="2.6" />
    <circle cx="6" cy="12" r="2.6" />
    <circle cx="18" cy="19" r="2.6" />
    <path d="M8.3 10.7l7.4-4.1M8.3 13.3l7.4 4.1" />
  </IconBase>
);
export const QrCode = (p) => (
  <IconBase {...p}>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <path d="M14 14h3v3h-3zM20 14v3M14 20h3M20 20h.01" />
  </IconBase>
);
export const CameraIcon = (p) => (
  <IconBase {...p}>
    <path d="M4 8a2 2 0 0 1 2-2h1.5l1-1.6A2 2 0 0 1 10.2 3.4h3.6a2 2 0 0 1 1.7 1L16.5 6H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
    <circle cx="12" cy="13" r="3.4" />
  </IconBase>
);
export const Upload = (p) => (
  <IconBase {...p}>
    <path d="M12 15V3M7 8l5-5 5 5" />
    <path d="M4 19h16" />
  </IconBase>
);
export const CardsIcon = (p) => (
  <IconBase {...p}>
    <rect x="3" y="6" width="11" height="15" rx="2" />
    <rect x="11" y="3" width="11" height="15" rx="2" />
    <path d="M14.5 7.5l4 4M18.5 7.5l-4 4" />
  </IconBase>
);
export const MiniStackIcon = (p) => (
  <IconBase {...p}>
    <path d="M8 3.5h9a3 3 0 0 1 3 3V16" />
    <rect x="4" y="7" width="13" height="14" rx="3" />
    <path d="M8.5 7v5.2l2-1.3 2 1.3V7" />
  </IconBase>
);
export function MiniStackBtnContent({ miniStack }) {
  const n = miniStack && miniStack.words ? miniStack.words.length : 0;
  return (
    <>
      <MiniStackIcon size={20} />
      {!miniStack && (
        <span className="dm-ministack-plus" aria-hidden="true">
          +
        </span>
      )}
      {miniStack && n > 0 && (
        <span key={n} className="dm-ministack-badge">
          {n > 99 ? "99+" : n}
        </span>
      )}
    </>
  );
}
export const LadderIcon = (p) => (
  <IconBase {...p}>
    <path d="M7 2v20M17 2v20" />
    <path d="M7 6h10M7 10.5h10M7 15h10M7 19.5h10" />
  </IconBase>
);
export const DiceIcon = (p) => (
  <IconBase {...p}>
    <rect x="3" y="3" width="18" height="18" rx="4" />
    <circle cx="8" cy="8" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="16" cy="8" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="8" cy="16" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="16" cy="16" r="1.2" fill="currentColor" stroke="none" />
  </IconBase>
);
export const CloudRainIcon = (p) => (
  <IconBase {...p}>
    <path d="M6.5 16a4.5 4.5 0 1 1 1.4-8.8A6 6 0 0 1 19 10.5 4 4 0 0 1 18 18H7" />
    <path d="M8 19l-1 2M12.5 19l-1 2M17 19l-1 2" />
  </IconBase>
);
export const Eye = (p) => (
  <IconBase {...p}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3.2" />
  </IconBase>
);
export const EyeOff = (p) => (
  <IconBase {...p}>
    <path d="M9.9 5.2A10.6 10.6 0 0 1 12 5c6.5 0 10 7 10 7a14.3 14.3 0 0 1-3.1 4M6.6 6.6A14.4 14.4 0 0 0 2 12s3.5 7 10 7a9.9 9.9 0 0 0 4.2-.9" />
    <path d="M9.9 14.1a3.2 3.2 0 0 0 4.2-4.2" />
    <path d="M3 3l18 18" />
  </IconBase>
);
