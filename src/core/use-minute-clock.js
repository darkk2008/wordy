/* core/use-minute-clock.js
 * A number that changes once a minute (and when the app comes back to the foreground). Use it as a
 * dependency of anything computed from "now", like which words are due, so it does not go stale while
 * the app stays open.
 */
import { useEffect, useState } from "react";

const minuteNow = () => Math.floor(Date.now() / 60000);

export function useMinuteClock() {
  const [minute, setMinute] = useState(minuteNow);
  useEffect(() => {
    const tick = () => setMinute(minuteNow());
    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    const id = setInterval(tick, 15000);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
  return minute;
}
