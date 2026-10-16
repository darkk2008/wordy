/* components/qr-share/qr-share.jsx
 * QR share / scan modals (currently feature-flagged off).
 */

import { Fragment, useEffect, useRef, useState } from "react";
import {
  QR_MAX_BYTES,
  QR_MAX_FRAMES,
  createQRAssembler,
  decodeQRPayload,
  encodeFamilyForQR,
  encodeStackForQR,
  isQRChunk,
  loadExternalScript,
  splitQRPayload,
} from "../../core/sharing-and-export";
import { IconBtn } from "../common/common";
import { Check, ChevronLeft, ChevronRight, Loader2, X } from "../icons/icons";

// QR-code device-to-device sync/sharing (scan-to-import, share-via-QR) is disabled
// now that accounts handle cross-device sync. Flip this back to true to re-enable
// the entry points below without touching the modal components themselves.
export const QR_SHARING_ENABLED = false;
const QRCODE_LIB_SRC = "/vendor/qrcode.js";
const JSQR_LIB_SRC = "/vendor/jsqr.js";
// Shows one QR code, or several in turn when the data is too big for a single code.
// load() resolves to { payload, wordCount, stackCount? }.
export function QRSendModal({ title, name, load, onClose }) {
  const wrapRef = useRef(null);
  const [status, setStatus] = useState("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [frames, setFrames] = useState([]);
  const [meta, setMeta] = useState(null);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const enc = await load();
        if (cancelled) return;
        setMeta(enc);
        const list = enc.payload.length <= QR_MAX_BYTES ? [enc.payload] : splitQRPayload(enc.payload);
        if (list.length > QR_MAX_FRAMES) {
          setStatus("toolarge");
          return;
        }
        await loadExternalScript(QRCODE_LIB_SRC, () => typeof window.QRCode !== "undefined");
        if (cancelled) return;
        setFrames(list);
        setStatus("ready");
      } catch (e) {
        if (cancelled) return;
        setErrorMsg(e && e.message ? e.message : "Could not generate QR code");
        setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    if (status !== "ready" || !wrapRef.current || !frames[idx]) return;
    wrapRef.current.innerHTML = "";
    new window.QRCode(wrapRef.current, {
      text: frames[idx],
      width: 300,
      height: 300,
      correctLevel: window.QRCode.CorrectLevel.L,
    });
  }, [status, frames, idx]);
  useEffect(() => {
    if (status !== "ready" || frames.length < 2 || !playing) return;
    const timer = setInterval(() => setIdx((i) => (i + 1) % frames.length), 1200);
    return () => clearInterval(timer);
  }, [status, frames, playing]);
  const multi = frames.length > 1;
  const step = (d) => {
    setPlaying(false);
    setIdx((i) => (i + d + frames.length) % frames.length);
  };
  return (
    <div className="dm-modal-backdrop" onClick={onClose}>
      <div className="dm-modal dm-qr-modal" onClick={(e) => e.stopPropagation()}>
        <div className="dm-modal-head">
          <h3>{title}</h3>
          <IconBtn onClick={onClose}>
            <X size={18} />
          </IconBtn>
        </div>
        <p className="dm-qr-sub">
          On the other device open Settings, tap Sync via QR, then Scan a code, and point the camera
          at this screen.
          {multi ? " Keep it pointed here until every part has been read." : ""}
        </p>
        {status === "loading" && (
          <div className="dm-qr-status">
            <Loader2 size={22} className="dm-spin" />
            {" Preparing code…"}
          </div>
        )}
        {status === "error" && <div className="dm-qr-status dm-qr-error">{errorMsg}</div>}
        {status === "toolarge" && (
          <div className="dm-qr-status dm-qr-error">
            {`This is too big for QR codes (${meta && meta.wordCount ? meta.wordCount : "many"} words). Send one stack at a time, or export a backup file in Data & Backup.`}
          </div>
        )}
        <div
          ref={wrapRef}
          className="dm-qr-canvas-wrap"
          style={{ display: status === "ready" ? "flex" : "none" }}
        />
        {status === "ready" && multi && (
          <div className="dm-qr-parts">
            <div className="dm-qr-parts-controls">
              <button type="button" className="dm-qr-step" aria-label="Previous part" onClick={() => step(-1)}>
                <ChevronLeft size={18} />
              </button>
              <button type="button" className="dm-qr-play" onClick={() => setPlaying((v) => !v)}>
                {playing ? "Pause" : "Play"}
              </button>
              <button type="button" className="dm-qr-step" aria-label="Next part" onClick={() => step(1)}>
                <ChevronRight size={18} />
              </button>
            </div>
            <div className="dm-qr-parts-label">{`Part ${idx + 1} of ${frames.length}`}</div>
            <div className="dm-qr-dots" aria-hidden="true">
              {frames.map((_, i) => (
                <span key={i} className={i === idx ? "on" : ""} />
              ))}
            </div>
          </div>
        )}
        {status === "ready" && meta && (
          <div className="dm-qr-meta">
            {meta.stackCount ? `${meta.stackCount} stack${meta.stackCount === 1 ? "" : "s"} • ` : ""}
            {`${meta.wordCount} word${meta.wordCount === 1 ? "" : "s"}`}
            {name ? ` • ${name}` : ""}
          </div>
        )}
      </div>
    </div>
  );
}
export function QRShareModal({ stack, onClose }) {
  const containerRef = useRef(null);
  const [status, setStatus] = useState("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [meta, setMeta] = useState(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { payload, byteLength, wordCount } = await encodeStackForQR(stack);
        if (cancelled) return;
        setMeta({
          byteLength,
          wordCount,
        });
        if (byteLength > QR_MAX_BYTES) {
          setStatus("toolarge");
          return;
        }
        await loadExternalScript(QRCODE_LIB_SRC, () => typeof window.QRCode !== "undefined");
        if (cancelled) return;
        if (containerRef.current) {
          containerRef.current.innerHTML = "";
          new window.QRCode(containerRef.current, {
            text: payload,
            width: 300,
            height: 300,
            correctLevel: window.QRCode.CorrectLevel.L,
          });
        }
        setStatus("ready");
      } catch (e) {
        if (cancelled) return;
        setErrorMsg(e && e.message ? e.message : "Could not generate QR code");
        setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [stack]);
  return (
    <div className="dm-modal-backdrop" onClick={onClose}>
      <div className="dm-modal dm-qr-modal" onClick={(e) => e.stopPropagation()}>
        <div className="dm-modal-head">
          <h3>Sync to phone</h3>
          <IconBtn onClick={onClose}>
            <X size={18} />
          </IconBtn>
        </div>
        <p className="dm-qr-sub">
          Open wwordy on your phone, tap the scan button, and point the camera at this code.
        </p>
        {status === "loading" && (
          <div className="dm-qr-status">
            <Loader2 size={22} className="dm-spin" />
            {" Preparing code…"}
          </div>
        )}
        {status === "error" && (
          <div className="dm-qr-status dm-qr-error">
            {errorMsg || "Something went wrong. Check your connection and try again."}
          </div>
        )}
        {status === "toolarge" && (
          <div className="dm-qr-status dm-qr-error">{`"${stack.name}" has ${meta ? meta.wordCount : stack.words.length} words — that's too much to fit in one QR code. Try splitting it into smaller stacks, or use the Share button to send it as a file instead.`}</div>
        )}
        <div
          ref={containerRef}
          className="dm-qr-canvas-wrap"
          style={{
            display: status === "ready" ? "flex" : "none",
          }}
        />
        {status === "ready" && meta && (
          <div className="dm-qr-meta">
            {meta.wordCount}
            {" word"}
            {meta.wordCount === 1 ? "" : "s"}
            {" • "}
            {stack.name}
          </div>
        )}
      </div>
    </div>
  );
}
export function FamilyQRShareModal({ familyName, familyEmoji, stacks, onClose }) {
  const containerRef = useRef(null);
  const [status, setStatus] = useState("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [meta, setMeta] = useState(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { payload, byteLength, wordCount, stackCount } = await encodeFamilyForQR(
          familyName,
          stacks,
          familyEmoji
        );
        if (cancelled) return;
        setMeta({
          byteLength,
          wordCount,
          stackCount,
        });
        if (byteLength > QR_MAX_BYTES) {
          setStatus("toolarge");
          return;
        }
        await loadExternalScript(QRCODE_LIB_SRC, () => typeof window.QRCode !== "undefined");
        if (cancelled) return;
        if (containerRef.current) {
          containerRef.current.innerHTML = "";
          new window.QRCode(containerRef.current, {
            text: payload,
            width: 300,
            height: 300,
            correctLevel: window.QRCode.CorrectLevel.L,
          });
        }
        setStatus("ready");
      } catch (e) {
        if (cancelled) return;
        setErrorMsg(e && e.message ? e.message : "Could not generate QR code");
        setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [familyName, familyEmoji, stacks]);
  const totalWords = (stacks || []).reduce((s, st) => s + st.words.length, 0);
  return (
    <div className="dm-modal-backdrop" onClick={onClose}>
      <div className="dm-modal dm-qr-modal" onClick={(e) => e.stopPropagation()}>
        <div className="dm-modal-head">
          <h3>Sync family to phone</h3>
          <IconBtn onClick={onClose}>
            <X size={18} />
          </IconBtn>
        </div>
        <p className="dm-qr-sub">
          Open wwordy on your phone, tap the scan button, and point the camera at this code. All
          stacks in this family will be imported together.
        </p>
        {status === "loading" && (
          <div className="dm-qr-status">
            <Loader2 size={22} className="dm-spin" />
            {" Preparing code…"}
          </div>
        )}
        {status === "error" && (
          <div className="dm-qr-status dm-qr-error">
            {errorMsg || "Something went wrong. Check your connection and try again."}
          </div>
        )}
        {status === "toolarge" && (
          <div className="dm-qr-status dm-qr-error">{`"${familyName}" has ${meta ? meta.wordCount : totalWords} words across ${meta ? meta.stackCount : (stacks || []).length} stacks — that's too much to fit in one QR code. Try syncing individual stacks instead.`}</div>
        )}
        <div
          ref={containerRef}
          className="dm-qr-canvas-wrap"
          style={{
            display: status === "ready" ? "flex" : "none",
          }}
        />
        {status === "ready" && meta && (
          <div className="dm-qr-meta">
            {meta.stackCount}
            {" stack"}
            {meta.stackCount === 1 ? "" : "s"}
            {" • "}
            {meta.wordCount}
            {" word"}
            {meta.wordCount === 1 ? "" : "s"}
            {" • "}
            {familyName}
          </div>
        )}
      </div>
    </div>
  );
}
export function QRScanModal({ onImport, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const [status, setStatus] = useState("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [imported, setImported] = useState(null);
  const [slowHint, setSlowHint] = useState(false);
  const [progress, setProgress] = useState(null);
  const asmRef = useRef(null);
  if (!asmRef.current) asmRef.current = createQRAssembler();
  const hintTimerRef = useRef(null);
  const stopCamera = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };
  // Returns true when scanning should stop (finished or an invalid code was shown).
  const handleScan = (text) => {
    if (isQRChunk(text)) {
      const r = asmRef.current.add(text);
      if (r.error) {
        setErrorMsg(r.error);
        return true;
      }
      setErrorMsg("");
      setProgress({ got: r.got, total: r.total });
      if (!r.complete) return false;
      handlePayload(r.payload);
      return true;
    }
    handlePayload(text);
    return true;
  };
  const handlePayload = async (text) => {
    try {
      const newStack = await decodeQRPayload(text);
      stopCamera();
      setImported(newStack);
      setStatus("done");
      onImport(newStack);
    } catch (e) {
      setErrorMsg("That code isn't a valid wwordy stack.");
    }
  };
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadExternalScript(JSQR_LIB_SRC, () => typeof window.jsQR !== "undefined");
        if (cancelled) return;
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setStatus("nocamera");
          return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: {
              ideal: 1280,
            },
            height: {
              ideal: 1280,
            },
          },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setStatus("scanning");
        hintTimerRef.current = setTimeout(() => {
          if (!cancelled) setSlowHint(true);
        }, 6000);
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d", {
          willReadFrequently: true,
        });
        const tick = () => {
          if (cancelled) return;
          const video = videoRef.current;
          if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = window.jsQR(imageData.data, imageData.width, imageData.height);
            if (code && code.data) {
              if (handleScan(code.data)) return;
            }
          }
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      } catch (e) {
        if (cancelled) return;
        setErrorMsg(e && e.message ? e.message : "Could not access the camera.");
        setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
      stopCamera();
    };
  }, []);
  const close = () => {
    stopCamera();
    onClose();
  };
  return (
    <div className="dm-modal-backdrop" onClick={close}>
      <div className="dm-modal dm-qr-modal" onClick={(e) => e.stopPropagation()}>
        <div className="dm-modal-head">
          <h3>Scan stack</h3>
          <IconBtn onClick={close}>
            <X size={18} />
          </IconBtn>
        </div>
        {status === "done" && imported ? (
          <div className="dm-qr-status">
            <Check size={22} />
            {imported.__isFamily
              ? ` Added family "${imported.name}" with ${imported.stacks.length} stack${imported.stacks.length === 1 ? "" : "s"}.`
              : ` Added "${imported.name}" with ${imported.words.length} word${imported.words.length === 1 ? "" : "s"}.`}
          </div>
        ) : (
          <>
            {status !== "nocamera" && (
              <p className="dm-qr-sub">
                Point your camera at the QR code shown on the other device.
              </p>
            )}
            {progress && status === "scanning" && (
              <div className="dm-qr-progress">
                <div className="dm-qr-progress-bar">
                  <span style={{ width: `${Math.round((progress.got / progress.total) * 100)}%` }} />
                </div>
                <div className="dm-qr-progress-label">
                  {`Read ${progress.got} of ${progress.total} parts. Keep pointing at the code.`}
                </div>
              </div>
            )}
            {slowHint && !progress && status === "scanning" && (
              <p className="dm-qr-hint">
                Still looking… try moving a bit closer, filling more of the frame with the code, and
                cutting glare on the other screen (lower its brightness slightly if it's washing
                out).
              </p>
            )}
            {status !== "nocamera" && (
              <div className="dm-qr-video-wrap">
                <video ref={videoRef} playsInline muted className="dm-qr-video" />
                <canvas
                  ref={canvasRef}
                  style={{
                    display: "none",
                  }}
                />
              </div>
            )}
            {status === "loading" && (
              <div className="dm-qr-status">
                <Loader2 size={22} className="dm-spin" />
                {" Starting camera…"}
              </div>
            )}
            {status === "error" && <div className="dm-qr-status dm-qr-error">{errorMsg}</div>}
            {errorMsg && status === "scanning" && (
              <div className="dm-qr-status dm-qr-error">{errorMsg}</div>
            )}
            {status === "nocamera" && (
              <div className="dm-qr-status dm-qr-error">No camera available on this device.</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
