/* behaviors/haptics-confetti.js
 * Haptic feedback, confetti, and DOM-observer triggers (plain DOM behaviour).
 */

export function initHapticsAndConfetti() {
  /* ---------- Haptics ---------- */
  function haptic(pattern) {
    try {
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(pattern);
      }
    } catch (e) {}
  }
  window.__dmHaptic = haptic;
  const STRONG_SELECTORS = [
    {
      sel: ".dm-btn-correct, .dm-fox-step-btn-primary",
      pattern: 14,
    },
    {
      sel: ".dm-btn-wrong",
      pattern: [10, 40, 10],
    },
    {
      sel: ".dm-flip-wrap, .dm-card.flipped, .dm-memory-card",
      pattern: 12,
    },
    {
      sel: ".dm-btn-primary:not(:disabled)",
      pattern: 10,
    },
    {
      sel: ".dm-btn-danger:not(:disabled)",
      pattern: [10, 30, 10],
    },
    {
      sel: ".dm-theme-toggle",
      pattern: 9,
    },
    {
      sel: ".dm-navbtn",
      pattern: 7,
    },
    {
      sel: ".dm-emoji-pick, .dm-seg, .dm-letter-tile, .dm-letter-chip, .dm-case-option, .dm-tr-stackpick-item, .dm-stackselect-item",
      pattern: 6,
    },
  ];
  const GENERIC_SELECTOR =
    "button, .dm-navbtn, .dm-iconbtn, .dm-seg, .dm-stack-card, .dm-game-card, .dm-settings-card, .dm-card, .dm-due-banner, .dm-stackselect-trigger, .dm-tr-stackpick-trigger, [role='button']";
  document.addEventListener(
    "click",
    function (e) {
      const target = e.target;
      if (!target || !target.closest) return;
      if (target.closest("[disabled]")) return;
      let matchedEl = null;
      for (let i = 0; i < STRONG_SELECTORS.length; i++) {
        var hit = target.closest(STRONG_SELECTORS[i].sel);
        if (hit) {
          matchedEl = hit;
          haptic(STRONG_SELECTORS[i].pattern);
          break;
        }
      }
      if (!matchedEl) {
        const generic = target.closest(GENERIC_SELECTOR);
        if (generic) {
          matchedEl = generic;
          haptic(8);
        }
      }
      const svgTarget =
        !target.closest(".dm-navbtn") &&
        (target.closest("svg") || (matchedEl && matchedEl.querySelector("svg")));
      if (svgTarget) {
        svgTarget.classList.remove("dm-icon-tap");
        void svgTarget.offsetWidth;
        svgTarget.classList.add("dm-icon-tap");
      }
    },
    true
  );

  /* ---------- Confetti ---------- */
  const CONFETTI_COLORS = ["#6EE7F9", "#FFB020", "#43D9A3", "#FF6B9D", "#FF3B5C"];
  let confettiCanvas = null;
  let confettiCtx = null;
  let confettiRunning = false;
  function ensureCanvas() {
    if (confettiCanvas) return confettiCanvas;
    const c = document.createElement("canvas");
    c.style.position = "fixed";
    c.style.inset = "0";
    c.style.width = "100%";
    c.style.height = "100%";
    c.style.pointerEvents = "none";
    c.style.zIndex = "9999";
    document.body.appendChild(c);
    c.width = window.innerWidth * (window.devicePixelRatio || 1);
    c.height = window.innerHeight * (window.devicePixelRatio || 1);
    confettiCanvas = c;
    confettiCtx = c.getContext("2d");
    confettiCtx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    return c;
  }
  function fireConfetti(opts) {
    opts = opts || {};
    const count = opts.count || 90;
    const spread = opts.spread || 1;
    const c = ensureCanvas();
    const w = window.innerWidth,
      h = window.innerHeight;
    const particles = [];
    for (let i = 0; i < count; i++) {
      var angle = Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.9 * spread;
      var speed = 5 + Math.random() * 9;
      particles.push({
        x: w / 2 + (Math.random() - 0.5) * w * 0.5,
        y: h * 0.28 + (Math.random() - 0.5) * 40,
        vx: Math.cos(angle) * speed * (Math.random() < 0.5 ? -1 : 1),
        vy: -Math.sin(angle) * speed - 3,
        size: 5 + Math.random() * 6,
        color: CONFETTI_COLORS[(Math.random() * CONFETTI_COLORS.length) | 0],
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 0.3,
        shape: Math.random() < 0.5 ? "rect" : "circle",
        life: 1,
      });
    }
    const gravity = 0.22;
    const drag = 0.985;
    const start = performance.now();
    const duration = 2600;
    function frame(now) {
      const t = now - start;
      confettiCtx.clearRect(0, 0, w, h);
      let alive = false;
      for (let i = 0; i < particles.length; i++) {
        var p = particles[i];
        if (p.life <= 0) continue;
        p.vy += gravity;
        p.vx *= drag;
        p.vy *= drag;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vrot;
        p.life = 1 - t / duration;
        if (p.life <= 0 || p.y > h + 40) continue;
        alive = true;
        confettiCtx.save();
        confettiCtx.globalAlpha = Math.max(0, p.life);
        confettiCtx.translate(p.x, p.y);
        confettiCtx.rotate(p.rot);
        confettiCtx.fillStyle = p.color;
        if (p.shape === "rect") {
          confettiCtx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.66);
        } else {
          confettiCtx.beginPath();
          confettiCtx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          confettiCtx.fill();
        }
        confettiCtx.restore();
      }
      if (alive && t < duration) {
        requestAnimationFrame(frame);
      } else {
        confettiCtx.clearRect(0, 0, w, h);
        confettiRunning = false;
      }
    }
    confettiRunning = true;
    requestAnimationFrame(frame);
  }
  window.__dmConfetti = function (opts) {
    fireConfetti(opts);
  };

  /* ---------- Contextual triggers via DOM observation ---------- */
  /* Works regardless of internal component structure: watches for the
     success/perfect-score markers the app already renders. */
  let celebratedStreaks = {};
  try {
    const stored = localStorage.getItem("dm_celebrated_streaks");
    if (stored) celebratedStreaks = JSON.parse(stored) || {};
  } catch (e) {}
  const MILESTONES = [3, 7, 14, 21, 30, 50, 75, 100, 150, 200, 365];
  function maybeCelebrateStreak(node) {
    const span = node.querySelector ? node.querySelector("span") : null;
    const txt = span ? span.textContent : node.textContent;
    const n = parseInt((txt || "").trim(), 10);
    if (!n || MILESTONES.indexOf(n) === -1) return;
    if (celebratedStreaks[n]) return;
    celebratedStreaks[n] = true;
    try {
      localStorage.setItem("dm_celebrated_streaks", JSON.stringify(celebratedStreaks));
    } catch (e) {}
    haptic([15, 60, 15, 60, 30]);
    fireConfetti({
      count: 130,
      spread: 1.2,
    });
  }
  const processed = new WeakSet();
  const mo = new MutationObserver(function (mutations) {
    for (let i = 0; i < mutations.length; i++) {
      var m = mutations[i];
      if (m.type !== "childList") continue;
      for (var j = 0; j < m.addedNodes.length; j++) {
        var node = m.addedNodes[j];
        if (node.nodeType !== 1 || processed.has(node)) continue;
        processed.add(node);
        if (node.matches) {
          if (node.matches(".dm-tf-result.dm-ok") || node.matches(".dm-case-blank-ok")) {
            haptic(14);
          } else if (node.matches(".dm-tf-result.dm-bad") || node.matches(".dm-case-blank-bad")) {
            haptic([10, 40, 10]);
          } else if (node.matches(".dm-fox-correct-bubble")) {
            haptic(14);
          } else if (node.matches(".dm-fox-explain-bubble")) {
            haptic([10, 40, 10]);
          } else if (node.matches(".dm-ring-inner")) {
            var t1 = (node.textContent || "").trim();
            if (t1 === "100%") {
              haptic([15, 60, 15, 60, 30]);
              fireConfetti({
                count: 140,
                spread: 1.3,
              });
            }
          } else if (node.matches(".dm-gstat-overview-num")) {
            var t2 = (node.textContent || "").trim();
            if (t2 === "100%") {
              fireConfetti({
                count: 110,
                spread: 1.1,
              });
            }
          } else if (node.matches(".dm-streak")) {
            maybeCelebrateStreak(node);
          }
        }
        if (node.querySelector) {
          var streakEl =
            node.classList && node.classList.contains("dm-streak")
              ? node
              : node.querySelector(".dm-streak");
          if (streakEl) maybeCelebrateStreak(streakEl);
        }
      }
    }
  });
  mo.observe(document.body, {
    childList: true,
    subtree: true,
  });
}
