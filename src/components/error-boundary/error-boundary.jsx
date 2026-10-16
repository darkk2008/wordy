/* components/error-boundary/error-boundary.jsx
 * Shows a friendly screen instead of a blank page when something crashes. If a screen fails to load
 * because a new version was deployed (old file names no longer exist), the page reloads once.
 */
import { Component } from "react";

const RELOAD_KEY = "wwordy-chunk-reload";

function isChunkError(err) {
  const msg = String((err && (err.message || err)) || "");
  return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Loading chunk/i.test(msg);
}

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error) {
    try {
      if (isChunkError(error) && !window.sessionStorage.getItem(RELOAD_KEY)) {
        window.sessionStorage.setItem(RELOAD_KEY, "1");
        window.location.reload();
        return;
      }
    } catch (e) {}
    try {
      console.error(error);
    } catch (e) {}
  }
  render() {
    if (!this.state.error) return this.props.children;
    const wrap = {
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 14,
      padding: 24,
      textAlign: "center",
      background: "#0a0c11",
      color: "#eef1f6",
      fontFamily: "Inter, system-ui, sans-serif",
    };
    const btn = {
      minHeight: 44,
      padding: "12px 22px",
      border: 0,
      borderRadius: 14,
      font: "700 15px Sora, system-ui, sans-serif",
      color: "#0b0c10",
      background: "linear-gradient(135deg,#6ee7f9,#f5b841)",
      cursor: "pointer",
    };
    return (
      <div style={wrap} role="alert">
        <h1 style={{ margin: 0, fontFamily: "Sora, system-ui, sans-serif", fontSize: 26 }}>Something went wrong</h1>
        <p style={{ margin: 0, color: "#8b93a7", maxWidth: 340 }}>
          Your words are safe. Reload the page to continue.
        </p>
        <button type="button" style={btn} onClick={() => window.location.reload()}>
          Reload
        </button>
      </div>
    );
  }
}
