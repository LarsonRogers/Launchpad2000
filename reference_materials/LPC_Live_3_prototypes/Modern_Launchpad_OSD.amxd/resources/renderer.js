(function () {
  // Browser-side renderer for the embedded OSD HTML UI.
  // This file is intentionally dependency-free so it works inside Max's JWeb.
  const state = {
    palette: null,
    opts: {
      debugIds: false,
      overlay: true,
      mk2Exact: true,
    },
  };

  // Normalize incoming color strings to one of the three Launchpad classes.
  function overlayColorToClass(color) {
    if (!color) return "";
    const text = String(color).toLowerCase();
    if (text === "red" || text.includes("red")) return "red";
    if (text === "amber" || text.includes("amber") || text.includes("yellow")) return "amber";
    if (text === "green" || text.includes("green") || text.includes("mint")) return "green";
    return "";
  }

  // Multiply a color by a shade factor with clamping.
  function shade(rgb, factor) {
    return rgb.map((channel) => Math.max(0, Math.min(255, Math.round(channel * factor))));
  }

  // Uses CSS custom properties so we can override the base gradient without
  // touching the Launchpad button classes.
  function setOverlayGradient(el, rgb) {
    const c1 = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
    const c2 = `rgb(${shade(rgb, 0.75).join(", ")})`;
    const c3 = `rgb(${shade(rgb, 0.45).join(", ")})`;
    el.style.setProperty("--overlay-c1", c1);
    el.style.setProperty("--overlay-c2", c2);
    el.style.setProperty("--overlay-c3", c3);
    el.style.background = "radial-gradient(circle at 35% 28%, var(--overlay-c1) 0%, var(--overlay-c2) 60%, var(--overlay-c3) 100%)";
  }

  // Reset any inline overlay styles before applying a new LED frame.
  function clearOverlayStyles(doc) {
    const buttons = doc.querySelectorAll(".btn");
    buttons.forEach((btn) => {
      btn.style.removeProperty("--overlay-c1");
      btn.style.removeProperty("--overlay-c2");
      btn.style.removeProperty("--overlay-c3");
      btn.style.removeProperty("background");
    });
  }

  // Apply LED overlay colors based on the current grid LED snapshot.
  function applyOverlay(doc, gridLeds, hardwareModel, mk2Exact) {
    if (!doc || !Array.isArray(gridLeds)) return;
    const ids = [];
    for (let i = 0; i < 8; i += 1) ids.push(`t${i}`);
    for (let row = 0; row < 8; row += 1) {
      for (let col = 0; col < 8; col += 1) ids.push(`g${row}${col}`);
    }
    for (let i = 0; i < 8; i += 1) ids.push(`s${i}`);

    ids.forEach((id, index) => {
      const cell = gridLeds[index];
      const el = doc.getElementById(id);
      if (!el) return;
      if (cell === null || cell === undefined || cell === "") {
        if (typeof window.setColor === "function") {
          window.setColor(id, "");
        } else {
          el.classList.remove("red", "amber", "green");
        }
        return;
      }
      const rawValue = cell.color ?? cell;

      // MK2 palette values can be precise if we have the index -> RGB map.
      if (hardwareModel === "mk2" && mk2Exact && state.palette) {
        let paletteIndex = null;
        if (typeof rawValue === "number") {
          paletteIndex = rawValue;
        } else if (typeof rawValue === "string" && rawValue.trim().length) {
          const parsed = Number(rawValue);
          if (Number.isFinite(parsed)) {
            paletteIndex = parsed;
          }
        }
        if (paletteIndex !== null) {
          const rgb = state.palette[String(paletteIndex)];
          if (rgb) {
            setOverlayGradient(el, rgb);
            return;
          }
        }
      }

      // Fallback to coarse color labels when palette data isn't available.
      const color = overlayColorToClass(rawValue);
      if (!color) return;
      if (typeof window.setColor === "function") {
        window.setColor(id, color);
      }
    });
  }

  // Optional debug overlay that shows button IDs in the UI.
  function injectDebugOverlay(doc, enabled) {
    const container = doc.querySelector(".wrap") || doc.body;
    if (!container) return;
    if (enabled) {
      container.classList.add("debug-overlay");
      const styleId = "debug-overlay-style";
      if (!doc.getElementById(styleId)) {
        const style = doc.createElement("style");
        style.id = styleId;
        style.textContent = `
          .debug-overlay .btn { position: relative; }
          .debug-overlay .debug-id {
            position: absolute;
            top: 4px;
            left: 4px;
            background: rgba(0,0,0,0.6);
            color: #fff;
            padding: 1px 4px;
            border-radius: 4px;
            font-size: 10px;
            letter-spacing: 0.3px;
          }
        `;
        doc.head.appendChild(style);
      }
      const buttons = doc.querySelectorAll(".btn");
      buttons.forEach((btn) => {
        if (btn.querySelector(".debug-id")) return;
        const tag = doc.createElement("span");
        tag.className = "debug-id";
        tag.textContent = btn.dataset.id || btn.id || "";
        btn.appendChild(tag);
      });
    } else {
      container.classList.remove("debug-overlay");
    }
  }

  // Entry point called from Max (via controller.js -> jweb eval).
  window.applyOSDState = function (payload) {
    if (!payload || typeof payload !== "object") return;

    // Palette is sent once per session to avoid large repeated payloads.
    if (payload.palette) {
      state.palette = payload.palette;
    }

    // Allow the controller to update UI flags (overlay, debug ids, etc.).
    if (payload.opts) {
      state.opts = {
        ...state.opts,
        ...payload.opts,
      };
    }

    // Apply a new mode template to set labels and base colors.
    if (payload.template && payload.template.snapshot && typeof window.applySnapshot === "function") {
      window.applySnapshot(payload.template.snapshot);
      const titleEl = document.getElementById("title");
      if (titleEl) {
        titleEl.textContent = payload.template.title || payload.template.name || "Mode";
      }
    }

    // Clear inline styles so the next overlay frame starts clean.
    clearOverlayStyles(document);

    if (state.opts.overlay && payload.grid_leds) {
      applyOverlay(document, payload.grid_leds, payload.hardware_model, state.opts.mk2Exact);
    }

    // Debug overlay is rendered last so it stays visible above overlays.
    injectDebugOverlay(document, state.opts.debugIds);
  };
})();
