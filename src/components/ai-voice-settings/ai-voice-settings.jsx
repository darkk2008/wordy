/* components/ai-voice-settings/ai-voice-settings.jsx
 * Voice and AI-model settings sections.
 */

import { useEffect, useState } from "react";
import {
  DM_VOICE_FALLBACKS,
  DM_VOICE_SAMPLES,
  currentLearningLangCode,
  dmLoadVoices,
  dmVoicePref,
  dmVoiceRate,
  dmVoicesForLang,
  speak,
} from "../../core/speech-voices";
import { DM_DEFAULT_MODEL, dmLowResourceNote, dmParseJson } from "../../services/ai-groq";
import { dmIsProxyKey } from "../../services/config-and-validation";
import { Input } from "../common/Input";
import { Loader2, Sparkles, Volume2 } from "../icons/icons";
import { getLangName } from "../language-settings/language-settings";

export function VoiceSettingsSection() {
  const code = currentLearningLangCode;
  const langName = getLangName(code);
  const [voices, setVoices] = useState(() => dmLoadVoices());
  const [pref, setPref] = useState(() => dmVoicePref(code));
  const [rate, setRate] = useState(() => dmVoiceRate());
  useEffect(() => {
    const refresh = () => setVoices(dmLoadVoices().slice());
    try {
      window.speechSynthesis.addEventListener("voiceschanged", refresh);
    } catch (e) {}
    const t = setTimeout(refresh, 800);
    return () => {
      clearTimeout(t);
      try {
        window.speechSynthesis.removeEventListener("voiceschanged", refresh);
      } catch (e) {}
    };
  }, []);
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;
  const matches = dmVoicesForLang(code);
  const keyOf = (v) => v.voiceURI || v.name;
  const matchKeys = new Set(matches.map((x) => keyOf(x.voice)));
  const fb = DM_VOICE_FALLBACKS[code] || [];
  const others = voices
    .filter((v) => !matchKeys.has(keyOf(v)))
    .sort((a, b) => {
      const fa = fb.indexOf(
          String(a.lang || "")
            .slice(0, 2)
            .toLowerCase()
        ),
        fbb = fb.indexOf(
          String(b.lang || "")
            .slice(0, 2)
            .toLowerCase()
        );
      const ra = fa < 0 ? 99 : fa,
        rb = fbb < 0 ? 99 : fbb;
      return (
        ra - rb ||
        String(a.lang).localeCompare(String(b.lang)) ||
        String(a.name).localeCompare(String(b.name))
      );
    });
  const choose = (val) => {
    try {
      if (val) window.localStorage.setItem("deutschmaster-voice-" + code, val);
      else window.localStorage.removeItem("deutschmaster-voice-" + code);
    } catch (e) {}
    setPref(val);
  };
  const changeRate = (val) => {
    const r = Math.min(1.2, Math.max(0.5, parseFloat(val) || 0.88));
    try {
      window.localStorage.setItem("deutschmaster-voice-rate", String(r));
    } catch (e) {}
    setRate(r);
  };
  const status = !supported
    ? "This browser can't play speech."
    : matches.length
      ? matches.length +
        " " +
        langName +
        " voice" +
        (matches.length > 1 ? "s" : "") +
        " found on this device."
      : voices.length
        ? "No " +
          langName +
          " voice is installed on this device. Install one in your system's text-to-speech settings" +
          (fb.length
            ? ", or pick a similar-sounding voice below (pronunciation will be approximate)."
            : ".")
        : "Loading voices…";
  return (
    <>
      <div className="dm-settings-section-label">Voice</div>
      <div
        className="dm-settings-row"
        style={{
          flexDirection: "column",
          alignItems: "stretch",
          gap: 10,
        }}
      >
        <div>
          <div className="dm-settings-row-title">{langName + " voice"}</div>
          <div className="dm-settings-row-sub">{status}</div>
        </div>
        {supported && (
          <select
            className="dm-input"
            value={pref}
            onChange={(e) => choose(e.target.value)}
            aria-label="Voice"
          >
            <option value="">Auto (best available)</option>
            {matches.length > 0 && (
              <optgroup label={langName + " voices"}>
                {matches.map((x) => (
                  <option key={keyOf(x.voice)} value={keyOf(x.voice)}>
                    {x.voice.name + " (" + x.voice.lang + ")"}
                  </option>
                ))}
              </optgroup>
            )}
            {others.length > 0 && (
              <optgroup label="Other voices (approximate pronunciation)">
                {others.map((v) => (
                  <option key={keyOf(v)} value={keyOf(v)}>
                    {v.name + " (" + v.lang + ")"}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        )}
        <div>
          <div className="dm-settings-row-sub">{"Speed " + rate.toFixed(2) + "×"}</div>
          <Input
            type="range"
            min={0.5}
            max={1.2}
            step={0.02}
            value={rate}
            onChange={(e) => changeRate(e.target.value)}
            style={{
              width: "100%",
            }}
            aria-label="Speech speed"
          />
        </div>
        <button
          type="button"
          className="dm-autofill-btn"
          onClick={() => speak(DM_VOICE_SAMPLES[code] || "Hello")}
        >
          <Volume2 size={15} />
          {" Test voice"}
        </button>
      </div>
    </>
  );
}
export function AiModelSettingsSection() {
  const [model, setModel] = useState(() => {
    try {
      return window.localStorage.getItem("deutschmaster-ai-model") || "";
    } catch (e) {
      return "";
    }
  });
  const [testMsg, setTestMsg] = useState("");
  const [testing, setTesting] = useState(false);
  const save = (val) => {
    setModel(val);
    setTestMsg("");
    try {
      if (val.trim()) window.localStorage.setItem("deutschmaster-ai-model", val.trim());
      else window.localStorage.removeItem("deutschmaster-ai-model");
    } catch (e) {}
  };
  const test = async () => {
    let apiKey = "";
    try {
      apiKey = window.localStorage.getItem("deutschmaster-groq-key") || "";
    } catch (e) {}
    if (!apiKey) {
      setTestMsg("Add a Groq API key in the AI Tutor first.");
      return;
    }
    if (dmIsProxyKey(apiKey)) {
      setTestMsg(
        "You're using the built-in AI service, which always uses its default model. Add your own Groq key in the AI Tutor to test a custom model."
      );
      return;
    }
    const m = (model || "").trim() || DM_DEFAULT_MODEL;
    setTesting(true);
    setTestMsg("");
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: m,
          messages: [
            {
              role: "system",
              content: 'Reply with the JSON object {"ok":true} and nothing else.',
            },
            {
              role: "user",
              content: "ping",
            },
          ],
          response_format: {
            type: "json_object",
          },
        }),
      });
      if (res.ok) {
        const d = await res.json();
        dmParseJson(
          d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content
        );
        setTestMsg("✓ " + m + " works.");
      } else {
        let msg = "Request failed (" + res.status + ")";
        try {
          const ej = await res.json();
          if (ej && ej.error && ej.error.message) msg = ej.error.message;
        } catch (e) {}
        setTestMsg("✗ " + msg);
      }
    } catch (e) {
      setTestMsg("✗ " + ((e && e.message) || "Couldn't reach Groq."));
    } finally {
      setTesting(false);
    }
  };
  const low = dmLowResourceNote();
  return (
    <>
      <div className="dm-settings-section-label">AI model</div>
      <div
        className="dm-settings-row"
        style={{
          flexDirection: "column",
          alignItems: "stretch",
          gap: 10,
        }}
      >
        <div>
          <div className="dm-settings-row-title">Model (advanced)</div>
          <div className="dm-settings-row-sub">
            {"Leave empty to use " +
              DM_DEFAULT_MODEL +
              ". Groq changes its model list often (see console.groq.com/docs/models). If a model you enter is unavailable, the app falls back to the default automatically."}
          </div>
        </div>
        <Input
          className="dm-input"
          value={model}
          placeholder={DM_DEFAULT_MODEL}
          onChange={(e) => save(e.target.value)}
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          aria-label="AI model"
        />
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <button type="button" className="dm-autofill-btn" onClick={test} disabled={testing}>
            {testing ? <Loader2 size={15} className="dm-autofill-spin" /> : <Sparkles size={15} />}
            {testing ? " Testing…" : " Test model"}
          </button>
          {model && (
            <button type="button" className="dm-autofill-btn" onClick={() => save("")}>
              Reset
            </button>
          )}
        </div>
        {testMsg && (
          <div className={/^\u2713/.test(testMsg) ? "dm-autofill-hint" : "dm-autofill-error"}>
            {testMsg}
          </div>
        )}
        {low && <div className="dm-autofill-hint">{low}</div>}
      </div>
    </>
  );
}
