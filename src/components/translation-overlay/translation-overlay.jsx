/* components/translation-overlay/translation-overlay.jsx
 * Full-screen overlay shown while the UI translates.
 */

export function TranslationLoadingOverlay({ percent, etaSeconds, languageName, strings }) {
  const clamped = Math.max(0, Math.min(100, percent));
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (clamped / 100) * circumference;
  const etaLabel =
    etaSeconds === null || etaSeconds === undefined
      ? strings
        ? strings.estimating
        : "Estimating time…"
      : etaSeconds <= 1
        ? strings
          ? strings.almost
          : "Almost done…"
        : etaSeconds < 60
          ? strings
            ? strings.seconds.replace("{{0}}", etaSeconds)
            : `About ${etaSeconds}s left`
          : strings
            ? strings.minutes.replace("{{0}}", Math.ceil(etaSeconds / 60))
            : `About ${Math.ceil(etaSeconds / 60)} min left`;
  const titleText = strings ? strings.title : `Translating wwordy into ${languageName}`;
  return (
    <div className="dm-i18n-overlay notranslate" translate="no">
      <div className="dm-i18n-card">
        <div className="dm-i18n-ring-wrap">
          <svg viewBox="0 0 120 120" className="dm-i18n-ring-svg">
            <circle cx={60} cy={60} r={54} className="dm-i18n-ring-track" />
            <circle
              cx={60}
              cy={60}
              r={54}
              className="dm-i18n-ring-fill"
              style={{
                strokeDasharray: circumference,
                strokeDashoffset: offset,
              }}
            />
          </svg>
          <div className="dm-i18n-ring-label">{clamped}%</div>
        </div>
        <h2 className="dm-i18n-title">{titleText}</h2>
        <p className="dm-i18n-sub">{etaLabel}</p>
      </div>
    </div>
  );
}
