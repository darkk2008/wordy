/* components/stats/stats.jsx
 * StatsView.
 */

import { Check, Clock, Flame, Layers, Sparkles, Star, Zap } from "../icons/icons";

function StatsView({ stacks, streak, todayReviews }) {
  const totalWords = stacks.reduce((s, st) => s + st.words.length, 0);
  const favorites = stacks.reduce((s, st) => s + st.words.filter((w) => w.favorite).length, 0);
  const mastered = stacks.reduce(
    (s, st) => s + st.words.filter((w) => w.srs && w.srs.level >= 5).length,
    0
  );
  const dueNow = stacks.reduce(
    (s, st) => s + st.words.filter((w) => w.srs && w.srs.next <= Date.now()).length,
    0
  );
  const items = [
    {
      label: "Total words",
      value: totalWords,
      icon: <Sparkles size={16} />,
    },
    {
      label: "Stacks",
      value: stacks.length,
      icon: <Layers size={16} />,
    },
    {
      label: "Favorites",
      value: favorites,
      icon: <Star size={16} />,
    },
    {
      label: "Mastered",
      value: mastered,
      icon: <Check size={16} />,
    },
    {
      label: "Due today",
      value: dueNow,
      icon: <Clock size={16} />,
    },
    {
      label: "Reviewed today",
      value: todayReviews,
      icon: <Zap size={16} />,
    },
  ];
  return (
    <div className="dm-view">
      <div className="dm-header">
        <div>
          <div className="dm-eyebrow">Your progress</div>
          <h1 className="dm-h1">Statistics</h1>
        </div>
        <div className="dm-streak">
          <Flame size={18} color="#FF3B5C" />
          <span>{streak}</span>
        </div>
      </div>
      <div className="dm-stat-grid">
        {items.map((it) => (
          <div key={it.label} className="dm-stat-card">
            <div className="dm-stat-icon">{it.icon}</div>
            <div className="dm-stat-value">{it.value}</div>
            <div className="dm-stat-label">{it.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
