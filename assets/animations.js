/*
 * Background animation switcher and the optional kitty animation.
 *
 * Modes: "fluid" (default, WebGL), "kitty" (original pastel cat illustration)
 * and "off". One tap on the segmented control switches; the choice is stored
 * locally and never sent anywhere.
 */
(function () {
  "use strict";

  var STORE_KEY = "elifberaa.animation";
  var MODES = ["fluid", "kitty", "off"];
  var reducedQuery = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : null;

  var dock = document.getElementById("anim-dock");
  var kittyLayer = document.getElementById("kitty-layer");
  var kittyEl = document.getElementById("kitty");
  var sparkLayer = document.getElementById("kitty-sparks");
  var sayEl = document.getElementById("kitty-say");
  var dustLayer = document.getElementById("princess-dust");
  var sayTimer = 0;
  var statusEl = document.getElementById("anim-status");
  var PHRASES = ["mrrp", "hi", "meow", "prr"];

  var mode = "fluid";
  var suspended = false;
  var finePointer = window.matchMedia
    ? window.matchMedia("(pointer: fine)")
    : null;
  var coarsePointer = window.matchMedia
    ? window.matchMedia("(pointer: coarse)")
    : null;
  var lastPointer = {
    x: window.innerWidth * 0.5,
    y: window.innerHeight * 0.62,
  };

  window.addEventListener(
    "pointermove",
    function (event) {
      lastPointer.x = event.clientX;
      lastPointer.y = event.clientY;
      var hit = document.elementFromPoint(event.clientX, event.clientY);
      var overUi = !!(
        hit &&
        hit.closest(
          'a,button,input,textarea,select,label,[role="button"],form,' +
            '[style*="border-radius"]'
        )
      );
      document.body.classList.toggle("kitty-over-ui", overUi);
    },
    { passive: true }
  );

  function readStored() {
    try {
      var value = window.localStorage.getItem(STORE_KEY);
      return MODES.indexOf(value) !== -1 ? value : "";
    } catch (error) {
      return "";
    }
  }

  function store(value) {
    try {
      window.localStorage.setItem(STORE_KEY, value);
    } catch (error) {
      /* Storage can be unavailable; the choice still applies this visit. */
    }
  }

  /* Kitty ---------------------------------------------------------------- */

  var KITTY = {
    x: 0,
    y: 0,
    tx: 0,
    ty: 0,
    vx: 0,
    vy: 0,
    raf: 0,
    last: 0,
    lastHeart: 0,
    lastMove: 0,
    nextWander: 0,
    nextChat: 0,
    running: false,
    particles: 0,
  };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function svgIcon(pathData, color, size) {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("width", String(size));
    svg.setAttribute("height", String(size));
    var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", pathData);
    path.setAttribute("fill", color);
    svg.appendChild(path);
    return svg;
  }

  var STAR_PATH =
    "M12 2l2.8 6.8L22 11l-7.2 2.2L12 20l-2.8-6.8L2 11l7.2-2.2z";

  function buildDust(count) {
    if (!dustLayer) return;
    dustLayer.textContent = "";
    if (!count) {
      dustLayer.hidden = true;
      return;
    }
    var colors = ["#f7c948", "#ff8fb8", "#c686ff", "#ffd1e8"];
    for (var i = 0; i < count; i += 1) {
      var span = document.createElement("span");
      span.className = "dust";
      span.style.left = (Math.random() * 100).toFixed(2) + "%";
      span.style.top = (18 + Math.random() * 82).toFixed(2) + "%";
      var duration = 7 + Math.random() * 7;
      span.style.setProperty("--dust-duration", duration.toFixed(2) + "s");
      span.style.setProperty(
        "--dust-delay",
        (-Math.random() * duration).toFixed(2) + "s"
      );
      var star = i % 3 !== 0;
      span.appendChild(
        svgIcon(
          star
            ? STAR_PATH
            : "M12 21s-7.5-4.7-9.6-9A5.6 5.6 0 0 1 12 6a5.6 5.6 0 0 1 9.6 6c-2.1 4.3-9.6 9-9.6 9z",
          colors[i % colors.length],
          18
        )
      );
      dustLayer.appendChild(span);
    }
    dustLayer.hidden = false;
  }

  function heartNode(size, color) {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("width", String(size));
    svg.setAttribute("height", String(size));
    svg.classList.add("kitty-heart");
    var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute(
      "d",
      "M12 21s-7.5-4.7-9.6-9A5.6 5.6 0 0 1 12 6a5.6 5.6 0 0 1 9.6 6c-2.1 4.3-9.6 9-9.6 9z"
    );
    path.setAttribute("fill", color);
    svg.appendChild(path);
    return svg;
  }

  function spawnHeart(burst) {
    if (!sparkLayer || KITTY.particles > 16) return;
    var size = 8 + Math.random() * 8;
    var hue = ["#ff8fb8", "#f5b9ea", "#c686ff", "#ffba71"][
      Math.floor(Math.random() * 4)
    ];
    var el = heartNode(Math.round(size), hue);
    var left = KITTY.x + (Math.random() - 0.5) * 46;
    var top = KITTY.y + (Math.random() - 0.5) * 34;
    el.style.left = left + "px";
    el.style.top = top + "px";
    sparkLayer.appendChild(el);
    KITTY.particles += 1;
    var drift = (Math.random() - 0.5) * (burst ? 70 : 30);
    var rise = burst ? 60 + Math.random() * 50 : 40 + Math.random() * 40;
    var life = burst ? 1100 : 900 + Math.random() * 400;
    var animation = el.animate(
      [
        { transform: "translate(-50%, -50%) scale(.4)", opacity: 0 },
        {
          transform: "translate(-50%, -50%) scale(1)",
          opacity: 0.9,
          offset: 0.15,
        },
        {
          transform:
            "translate(calc(-50% + " +
            drift +
            "px), calc(-50% - " +
            rise +
            "px)) scale(.7)",
          opacity: 0,
        },
      ],
      { duration: life, easing: "cubic-bezier(.2,.7,.3,1)" }
    );
    animation.onfinish = function () {
      if (el.parentNode) el.parentNode.removeChild(el);
      KITTY.particles -= 1;
    };
  }

  function kittyFrame(now) {
    if (!KITTY.running) return;
    var dt = Math.min(32, now - (KITTY.last || now));
    KITTY.last = now;
    var ease = 1 - Math.pow(0.000001, dt / 1000);
    KITTY.vx = (KITTY.tx - KITTY.x) * ease;
    KITTY.vy = (KITTY.ty - KITTY.y) * ease;
    KITTY.x += KITTY.vx;
    KITTY.y += KITTY.vy;
    var speed = Math.min(1.2, Math.abs(KITTY.vx) + Math.abs(KITTY.vy));
    var halfW = kittyEl.offsetWidth / 2;
    var halfH = kittyEl.offsetHeight / 2;
    kittyEl.style.transform =
      "translate3d(" +
      (KITTY.x - halfW).toFixed(1) +
      "px," +
      (KITTY.y - halfH).toFixed(1) +
      "px,0)";
    if (speed > 0.5 && now - KITTY.lastHeart > 220) {
      KITTY.lastHeart = now;
      spawnHeart(false);
    }
    KITTY.raf = window.requestAnimationFrame(kittyFrame);
  }

  function target(event) {
    var lift = event.pointerType === "touch" ? -38 : 0;
    KITTY.tx = clamp(event.clientX, 64, window.innerWidth - 64);
    KITTY.ty = clamp(event.clientY + lift, 64, window.innerHeight - 64);
  }

  function announce(text) {
    if (statusEl) statusEl.textContent = text;
  }

  function say(text) {
    if (!sayEl) return;
    sayEl.textContent = text;
    sayEl.style.left = KITTY.x + "px";
    sayEl.style.top = KITTY.y - 56 + "px";
    sayEl.classList.add("is-on");
    if (sayTimer) window.clearTimeout(sayTimer);
    sayTimer = window.setTimeout(function () {
      sayEl.classList.remove("is-on");
    }, 950);
  }

  function kittyMove(event) {
    KITTY.lastMove = performance.now();
    target(event);
  }

  function kittyDown(event) {
    KITTY.lastMove = performance.now();
    var dx = event.clientX - KITTY.x;
    var dy = event.clientY - KITTY.y;
    var near = Math.sqrt(dx * dx + dy * dy) < 120;
    target(event);
    if (near) {
      kittyEl.classList.add("is-happy");
      window.setTimeout(function () {
        kittyEl.classList.remove("is-happy");
      }, 720);
    }
    for (var i = 0; i < (near ? 10 : 6); i += 1) spawnHeart(true);
    say(PHRASES[Math.floor(Math.random() * PHRASES.length)]);
  }

  function startKitty() {
    if (!kittyLayer || !kittyEl || KITTY.running) return;
    kittyLayer.hidden = false;
    KITTY.running = true;
    KITTY.last = 0;
    KITTY.lastMove = performance.now();
    KITTY.nextWander = KITTY.lastMove + 5000;
    KITTY.nextChat = KITTY.lastMove + 9000;
    var width = window.innerWidth;
    var height = window.innerHeight;
    if (!KITTY.x) {
      KITTY.x = lastPointer.x;
      KITTY.y = lastPointer.y;
    }
    KITTY.tx = KITTY.x;
    KITTY.ty = KITTY.y;
    var halfW = kittyEl.offsetWidth / 2;
    var halfH = kittyEl.offsetHeight / 2;
    kittyEl.style.transform =
      "translate3d(" +
      (KITTY.x - halfW) +
      "px," +
      (KITTY.y - halfH) +
      "px,0)";
    window.addEventListener("pointermove", kittyMove, { passive: true });
    window.addEventListener("pointerdown", kittyDown, { passive: true });
    KITTY.raf = window.requestAnimationFrame(kittyFrame);
  }

  function stopKitty() {
    if (!kittyLayer) return;
    KITTY.running = false;
    if (KITTY.raf) window.cancelAnimationFrame(KITTY.raf);
    KITTY.raf = 0;
    window.removeEventListener("pointermove", kittyMove);
    window.removeEventListener("pointerdown", kittyDown);
    if (sparkLayer) sparkLayer.textContent = "";
    KITTY.particles = 0;
    if (kittyEl) kittyEl.style.transform = "";
    kittyLayer.hidden = true;
  }

  /* Mode switching ------------------------------------------------------- */

  function setCursor(hidden) {
    var fine = !finePointer || finePointer.matches;
    document.body.classList.toggle(
      "kitty-cursor",
      !!hidden && fine && mode === "kitty" && !suspended
    );
    if (!hidden || mode !== "kitty" || suspended) {
      document.body.classList.remove("kitty-over-ui");
    }
  }

  function stopAll() {
    if (window.FluidBg) window.FluidBg.stop();
    stopKitty();
  }

  function syncDock() {
    if (!dock) return;
    var items = dock.querySelectorAll("[data-anim]");
    Array.prototype.forEach.call(items, function (item) {
      var active = item.getAttribute("data-anim") === mode;
      item.setAttribute("aria-pressed", active ? "true" : "false");
      item.classList.toggle("is-active", active);
    });
  }

  function apply(next) {
    if (MODES.indexOf(next) === -1) next = "fluid";
    mode = next;
    stopAll();
    if (!suspended) {
      var base = next === "kitty" ? 18 : next === "fluid" ? 10 : 0;
      var count =
        window.innerWidth < 600 ? Math.round(base * 0.6) : base;
      if (reducedQuery && reducedQuery.matches) count = 0;
      buildDust(count);
    }
    if (!suspended) {
      if (next === "fluid" && window.FluidBg) window.FluidBg.start();
      if (next === "kitty") startKitty();
    }
    setCursor(next === "kitty" && !suspended);
    syncDock();
  }

  function choose(next, notify) {
    apply(next);
    store(next);
    if (notify) {
      announce(
        next === "fluid"
          ? "Fluid background"
          : next === "kitty"
            ? "Kitty background"
            : "Background animation off"
      );
    }
  }

  function bindDock() {
    if (!dock) return;
    dock.addEventListener("click", function (event) {
      var item = event.target.closest("[data-anim]");
      if (item) choose(item.getAttribute("data-anim"), true);
    });

    var lastY = window.scrollY || 0;
    window.addEventListener(
      "scroll",
      function () {
        if (window.innerWidth >= 1000) {
          dock.classList.remove("is-hidden");
          return;
        }
        var y = window.scrollY || 0;
        if (y > lastY + 8 && y > 240) {
          dock.classList.add("is-hidden");
        } else if (y < lastY - 8 || y < 40) {
          dock.classList.remove("is-hidden");
        }
        lastY = y;
      },
      { passive: true }
    );
  }

  function init() {
    var pageView = document.getElementById("page-view");
    if (pageView && pageView.hidden) suspended = true;
    var stored = readStored();
    if (stored && !(coarsePointer && coarsePointer.matches && stored === "kitty")) {
      apply(stored);
    } else if (reducedQuery && reducedQuery.matches) {
      apply("off");
    } else {
      apply("fluid");
    }

    bindDock();

    document.addEventListener("keydown", function (event) {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      var target = event.target;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
      var pageView = document.getElementById("page-view");
      if (pageView && pageView.hidden) return;
      var map = { 1: "fluid", 2: "kitty", 3: "off" };
      var next = map[event.key];
      if (!next) return;
      choose(next, true);
    });

    if (coarsePointer && coarsePointer.addEventListener) {
      coarsePointer.addEventListener("change", function (event) {
        if (event.matches && mode === "kitty") apply("fluid");
      });
    }

    if (reducedQuery) {
      var onChange = function (event) {
        if (event.matches) {
          apply("off");
          store("off");
        }
      };
      if (reducedQuery.addEventListener) {
        reducedQuery.addEventListener("change", onChange);
      } else if (reducedQuery.addListener) {
        reducedQuery.addListener(onChange);
      }
    }
  }

  window.Background = {
    suspend: function () {
      suspended = true;
      stopAll();
      setCursor(false);
      if (dustLayer) dustLayer.hidden = true;
    },
    resume: function () {
      suspended = false;
      apply(mode);
    },
    set: function (next) {
      apply(next);
      store(next);
    },
    get mode() {
      return mode;
    },
  };

  function decorateAvatars() {
    var avatars = document.querySelectorAll(
      '#page-view button[aria-label="Who are you?"]'
    );
    Array.prototype.forEach.call(avatars, function (button) {
      if (button.querySelector(".avatar-ring")) return;
      var ring = document.createElement("span");
      ring.className = "avatar-ring";
      ring.setAttribute("aria-hidden", "true");
      button.appendChild(ring);
    });
  }

  function bindButtonSparkles() {
    var pageView = document.getElementById("page-view");
    if (!pageView) return;
    var reduce = window.matchMedia
      ? window.matchMedia("(prefers-reduced-motion: reduce)")
      : null;
    var STAR =
      "M12 2l2.8 6.8L22 11l-7.2 2.2L12 20l-2.8-6.8L2 11l7.2-2.2z";
    pageView.addEventListener(
      "pointerdown",
      function (event) {
        if (reduce && reduce.matches) return;
        var button = event.target.closest("button");
        if (!button || button.closest("#anim-dock")) return;
        var rect = button.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        for (var i = 0; i < 5; i += 1) {
          var spark = svgIcon(
            STAR,
            ["#f7c948", "#ff8fb8", "#c686ff"][i % 3],
            10
          );
          spark.classList.add("btn-spark");
          spark.style.left = event.clientX - rect.left + "px";
          spark.style.top = event.clientY - rect.top + "px";
          button.appendChild(spark);
          var angle = Math.random() * Math.PI * 2;
          var distance = 18 + Math.random() * 26;
          var animation = spark.animate(
            [
              { transform: "translate(-50%, -50%) scale(.4)", opacity: 0 },
              {
                transform: "translate(-50%, -50%) scale(1)",
                opacity: 0.95,
                offset: 0.2,
              },
              {
                transform:
                  "translate(calc(-50% + " +
                  Math.cos(angle) * distance +
                  "px), calc(-50% + " +
                  Math.sin(angle) * distance +
                  "px)) scale(.5)",
                opacity: 0,
              },
            ],
            { duration: 620, easing: "cubic-bezier(.2,.7,.3,1)" }
          );
          animation.onfinish = (function (node) {
            return function () {
              if (node.parentNode) node.parentNode.removeChild(node);
            };
          })(spark);
        }
      },
      { passive: true }
    );
  }

  bindButtonSparkles();
  init();
  decorateAvatars();
})();
