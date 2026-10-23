/*
 * Pointer-reactive fluid background.
 *
 * The renderer is the vendored MIT build in assets/fluid.js (see
 * THIRD_PARTY_NOTICES.md). This file exposes start/stop so the animation
 * switcher can swap engines without reloading the page.
 */
(function () {
  "use strict";

  var host = document.getElementById("fluid-host");
  var canvas = document.getElementById("fluid");
  if (!host || !canvas || typeof window.WebGLFluid !== "function") {
    function freshCanvas() {
    var next = canvas.cloneNode(false);
    canvas.parentNode.replaceChild(next, canvas);
    canvas = next;
    return next;
  }

  window.addEventListener("pointermove", noteMove, { passive: true });

  window.FluidBg = { start: function () {}, stop: function () {} };
    return;
  }

  var PALETTE_HEX = [
    "#FFB3D1",
    "#F5B9EA",
    "#C686FF",
    "#FF8FB8",
    "#FFD1E8",
    "#F7C948",
    "#BC82F3",
  ];

  function toRgb(hex) {
    var value = parseInt(hex.slice(1), 16);
    return {
      r: ((value >> 16) & 255) / 255,
      g: ((value >> 8) & 255) / 255,
      b: (value & 255) / 255,
    };
  }

  /* Every colour keeps at least 0.75 saturation; this is what produces the
     pastel haze instead of neon. */
  function boost(hex) {
    var rgb = toRgb(hex);
    var high = Math.max(rgb.r, rgb.g, rgb.b);
    var low = Math.min(rgb.r, rgb.g, rgb.b);
    var chroma = high === 0 ? 0 : (high - low) / high;
    var target = Math.max(chroma, 0.75);
    var scale = function (channel) {
      return chroma === 0 ? 1 : 1 - ((high - channel) / high) * (target / chroma);
    };
    return { r: scale(rgb.r), g: scale(rgb.g), b: scale(rgb.b) };
  }

  var palette = PALETTE_HEX.map(boost);
  var instance = null;
  var lastMove = 0;
  var ambientTimer = 0;

  function noteMove() {
    lastMove = Date.now();
  }

  function ambient() {
    ambientTimer = 0;
    if (!instance) return;
    if (Date.now() - lastMove > 5000) {
      var x0 = window.innerWidth * (0.18 + Math.random() * 0.5);
      var y0 = window.innerHeight * (0.32 + Math.random() * 0.4);
      var driftX = (Math.random() - 0.5) * 220;
      var driftY = 60 + Math.random() * 90;
      var target = document.body || window;
      for (var step = 0; step < 8; step += 1) {
        (function (i) {
          window.setTimeout(function () {
            if (!instance) return;
            var t = i / 7;
            target.dispatchEvent(
              new MouseEvent("mousemove", {
                clientX: x0 + driftX * t,
                clientY: y0 + driftY * t + Math.sin(t * Math.PI) * 40,
                bubbles: true,
              })
            );
          }, i * 55);
        })(step);
      }
    }
    ambientTimer = window.setTimeout(ambient, 6200);
  }

  function freshCanvas() {
    var next = canvas.cloneNode(false);
    canvas.parentNode.replaceChild(next, canvas);
    canvas = next;
    return next;
  }

  window.addEventListener("pointermove", noteMove, { passive: true });

  window.FluidBg = {
    start: function () {
      if (instance) return;
      host.hidden = false;
      var target = freshCanvas();
      try {
        instance = window.WebGLFluid(target, {
          tint: null,
          palette: palette,
          config: {
            SIM_RESOLUTION: 128,
            DYE_RESOLUTION: 1440,
            DENSITY_DISSIPATION: 0.5,
            VELOCITY_DISSIPATION: 3,
            PRESSURE: 0.1,
            PRESSURE_ITERATIONS: 20,
            CURL: 3,
            SPLAT_RADIUS: 0.2,
            SPLAT_FORCE: 6000,
            SHADING: true,
            COLOR_UPDATE_SPEED: 10,
            TRANSPARENT: true,
          },
        });
      } catch (error) {
        instance = null;
      }
      window.__fluid = instance;
      lastMove = Date.now();
      if (!ambientTimer && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        ambientTimer = window.setTimeout(ambient, 6200);
      }
    },
    stop: function () {
      if (instance && typeof instance.destroy === "function") instance.destroy();
      instance = null;
      window.__fluid = null;
      if (ambientTimer) window.clearTimeout(ambientTimer);
      ambientTimer = 0;
      host.hidden = true;
    },
  };
})();
