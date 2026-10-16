/* components/notification-settings/notification-settings.jsx
 * Daily goal and reminder settings.
 */

import { useState } from "react";
import {
  AiModelSettingsSection,
  VoiceSettingsSection,
} from "../ai-voice-settings/ai-voice-settings";
import { IconBtn } from "../common/common";
import { FormsToggle, TimeSelect } from "../games/setup-controls";
import { ChevronLeft, Plus, X } from "../icons/icons";
import { PrivacySettingsSection } from "../privacy-settings/privacy-settings";

export const GOAL_OPTIONS = [10, 20, 30, 50];
export function NotificationSettings({ onBack, dailyGoal, onSetDailyGoal }) {
  const [remindersOn, setRemindersOn] = useState(() => {
    try {
      return window.localStorage.getItem("deutschmaster-reminders") !== "0";
    } catch (e) {
      return true;
    }
  });
  const [soundOn, setSoundOn] = useState(() => {
    try {
      return window.localStorage.getItem("deutschmaster-sound") !== "0";
    } catch (e) {
      return true;
    }
  });
  const [reminderTimes, setReminderTimes] = useState(() => {
    try {
      const stored = window.localStorage.getItem("deutschmaster-reminder-times");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length) return parsed;
      }
      const legacy = window.localStorage.getItem("deutschmaster-reminder-time");
      if (legacy) return [legacy];
    } catch (e) {}
    return ["18:00"];
  });
  const persistReminderTimes = (list) => {
    setReminderTimes(list);
    try {
      window.localStorage.setItem("deutschmaster-reminder-times", JSON.stringify(list));
    } catch (e) {}
  };
  const changeReminderTime = (idx, val) => {
    persistReminderTimes(reminderTimes.map((t, i) => (i === idx ? val : t)));
  };
  const addReminderTime = () => {
    if (reminderTimes.length >= 6) return;
    const last = reminderTimes[reminderTimes.length - 1] || "18:00";
    const [h, m] = last.split(":").map(Number);
    const nextH = (h + 2) % 24;
    const suggestion = `${String(nextH).padStart(2, "0")}:${String(m || 0).padStart(2, "0")}`;
    persistReminderTimes([...reminderTimes, suggestion]);
  };
  const removeReminderTime = (idx) => {
    if (reminderTimes.length <= 1) return;
    persistReminderTimes(reminderTimes.filter((_, i) => i !== idx));
  };
  const toggleReminders = (val) => {
    setRemindersOn(val);
    try {
      window.localStorage.setItem("deutschmaster-reminders", val ? "1" : "0");
    } catch (e) {}
  };
  const toggleSound = (val) => {
    setSoundOn(val);
    try {
      window.localStorage.setItem("deutschmaster-sound", val ? "1" : "0");
    } catch (e) {}
  };
  const [streakRiskOn, setStreakRiskOn] = useState(() => {
    try {
      return window.localStorage.getItem("deutschmaster-streak-risk") !== "0";
    } catch (e) {
      return true;
    }
  });
  const [streakRiskTime, setStreakRiskTime] = useState(() => {
    try {
      return window.localStorage.getItem("deutschmaster-streak-risk-time") || "21:00";
    } catch (e) {
      return "21:00";
    }
  });
  const toggleStreakRisk = (val) => {
    setStreakRiskOn(val);
    try {
      window.localStorage.setItem("deutschmaster-streak-risk", val ? "1" : "0");
    } catch (e) {}
  };
  const changeStreakRiskTime = (val) => {
    setStreakRiskTime(val);
    try {
      window.localStorage.setItem("deutschmaster-streak-risk-time", val);
    } catch (e) {}
  };
  return (
    <div className="dm-view dm-settings-subview">
      <div className="dm-topbar">
        <IconBtn onClick={onBack}>
          <ChevronLeft size={20} />
        </IconBtn>
        <div className="dm-topbar-title">{"Notifications & Goals"}</div>
      </div>
      <div className="dm-settings-section-label">Reminders</div>
      <div className="dm-settings-row">
        <div>
          <div className="dm-settings-row-title">Daily review reminders</div>
          <div className="dm-settings-row-sub">Get nudged when words are due for review.</div>
        </div>
        <FormsToggle checked={remindersOn} onChange={toggleReminders} compact />
      </div>
      {remindersOn && (
        <div
          className="dm-settings-row"
          style={{
            flexDirection: "column",
            alignItems: "stretch",
            gap: 10,
          }}
        >
          <div>
            <div className="dm-settings-row-title">Reminder times</div>
            <div className="dm-settings-row-sub">
              Add up to 6 times a day we'd nudge you, if reminders were wired up to a device.
            </div>
          </div>
          <div className="dm-reminder-time-list">
            {reminderTimes.map((t, i) => (
              <div key={i} className="dm-reminder-time-row">
                <TimeSelect value={t} onChange={(val) => changeReminderTime(i, val)} />
                {reminderTimes.length > 1 && (
                  <IconBtn title="Remove this reminder" onClick={() => removeReminderTime(i)}>
                    <X size={15} />
                  </IconBtn>
                )}
              </div>
            ))}
          </div>
          {reminderTimes.length < 6 && (
            <button type="button" className="dm-add-reminder-btn" onClick={addReminderTime}>
              <Plus size={15} />
              {" Add another time"}
            </button>
          )}
        </div>
      )}
      <div className="dm-settings-row">
        <div>
          <div className="dm-settings-row-title">Sound effects</div>
          <div className="dm-settings-row-sub">Play sounds for correct and incorrect answers.</div>
        </div>
        <FormsToggle checked={soundOn} onChange={toggleSound} compact />
      </div>
      <div className="dm-settings-section-label">Streak</div>
      <div className="dm-settings-row">
        <div>
          <div className="dm-settings-row-title">Streak-at-risk warning</div>
          <div className="dm-settings-row-sub">
            A heads-up near the end of the day if you haven't reviewed yet and your streak would
            break.
          </div>
        </div>
        <FormsToggle checked={streakRiskOn} onChange={toggleStreakRisk} compact />
      </div>
      {streakRiskOn && (
        <div className="dm-settings-row">
          <div>
            <div className="dm-settings-row-title">Warn me at</div>
            <div className="dm-settings-row-sub">
              Only fires on days you still have 0 reviews done by this time.
            </div>
          </div>
          <TimeSelect value={streakRiskTime} onChange={changeStreakRiskTime} />
        </div>
      )}
      <div className="dm-settings-section-label">Daily goal</div>
      <div
        className="dm-settings-row"
        style={{
          flexDirection: "column",
          alignItems: "stretch",
          gap: 10,
        }}
      >
        <div>
          <div className="dm-settings-row-title">Words to review per day</div>
          <div className="dm-settings-row-sub">
            Sets the target shown on your progress bar in Your Stats.
          </div>
        </div>
        <div className="dm-goal-pills">
          {GOAL_OPTIONS.map((n) => (
            <button
              key={n}
              type="button"
              className={`dm-goal-pill ${dailyGoal === n ? "dm-goal-pill-active" : ""}`}
              onClick={() => onSetDailyGoal(n)}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
      <VoiceSettingsSection />
      <AiModelSettingsSection />
      <PrivacySettingsSection />
    </div>
  );
}
