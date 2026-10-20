/* Slide-deck chassis for lessons 2+ (lesson 1 keeps its own copy).
   A fixed 1200×800 stage scaled to the screen, route line, stamps, "for the curious" drawer, sound, keyboard + swipe.
   Usage in a lesson page:
     const D = Deck.create({ prefix: "bit-cpu:", stamps: {...}, passport: "badge" });
     D.H.slideKey = { init(el){}, enter(el){}, leave(el){} };   // per-slide logic
     D.start();
   Markup (topbar, #viewport/#deck, bottombar, #thDrawer, #stampFx) lives in the lesson page. Styles: deck.css. */
(function () {
"use strict";

var NS = "http://www.w3.org/2000/svg";
function $(s, el) { return (el || document).querySelector(s); }
function $$(s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
function svgEl(tag, attrs, parent) {
  var e = document.createElementNS(NS, tag);
  for (var k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}

/* ---------- icons (24×24 stroke); lessons add their own with Object.assign(Deck.RI, {...}) ---------- */
var RI = {
  star: '<path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/>',
  question: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 1 1 3.4 2.4c-.6.3-1 .8-1 1.5v.6"/><path d="M12 17h.01"/>',
  wifi: '<path d="M2.5 9a14 14 0 0 1 19 0M5.8 12.4a9.3 9.3 0 0 1 12.4 0M9.2 15.8a4.6 4.6 0 0 1 5.6 0"/><path d="M12 19.3h.01"/>',
  bolt: '<path d="M13 2.5L4.5 13.5h6.5l-1 8 8.5-11h-6.5z"/>',
  book: '<path d="M2.5 5h6.5a3 3 0 0 1 3 3v12a2.5 2.5 0 0 0-2.5-2.5h-7zM21.5 5H15a3 3 0 0 0-3 3v12a2.5 2.5 0 0 1 2.5-2.5h7z"/>',
  grid: '<rect x="3" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5"/>',
  term: '<rect x="2.5" y="4" width="19" height="16" rx="2.5"/><path d="M7 9.5l3 2.5-3 2.5M12.5 15h4.5"/>',
  back: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  shield: '<path d="M12 2.8l8 3v6.1c0 4.9-3.4 8.2-8 9.3-4.6-1.1-8-4.4-8-9.3V5.8z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
  quiz: '<path d="M4 4h16v12H9l-5 4z"/><path d="M10 8.2a2 2 0 1 1 2.6 1.9c-.4.2-.6.5-.6 1v.3"/><path d="M12 13.3h.01"/>',
  passport: '<rect x="5" y="2.5" width="14" height="19" rx="2"/><circle cx="12" cy="10" r="3.5"/><path d="M9 16.5h6"/>',
  home: '<path d="M3.5 11L12 4l8.5 7"/><path d="M5.5 9.5V20h13V9.5"/><path d="M10 20v-5h4v5"/>',
  full: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  game: '<path d="M7 8h10a4 4 0 0 1 4 4v1.5a3.5 3.5 0 0 1-6.3 2.1L14 15h-4l-.7.6A3.5 3.5 0 0 1 3 13.5V12a4 4 0 0 1 4-4z"/><path d="M7.5 10.5v3M6 12h3M16 11.5h.01M18 13h.01"/>',
  bin: '<rect x="3.5" y="5" width="7" height="14" rx="3.5"/><path d="M15 8l3-2.5V19M15 19h6"/>',
  soundOn: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4.5 4.5 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11"/>',
  soundOff: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/>'
};
function ri(n, extra) {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" ' + (extra || "") + ">" + RI[n] + "</svg>";
}

/* Mascot — same drawing as lesson 1. */
function bitSVG() {
  return '<svg class="bit" viewBox="0 0 120 130" aria-hidden="true">' +
    '<ellipse cx="60" cy="124" rx="32" ry="5" fill="rgba(22,25,58,.15)"/>' +
    '<g class="bit-body">' +
      '<line x1="60" y1="31" x2="60" y2="14" stroke="#16193A" stroke-width="4" stroke-linecap="round"/>' +
      '<circle class="bit-ant" cx="60" cy="11" r="7" fill="#FFC93C" stroke="#16193A" stroke-width="3"/>' +
      '<rect x="40" y="104" width="13" height="16" rx="5" fill="#16193A"/><rect x="67" y="104" width="13" height="16" rx="5" fill="#16193A"/>' +
      '<rect x="15" y="30" width="90" height="80" rx="20" fill="#FF8A3D" stroke="#16193A" stroke-width="4"/>' +
      '<path d="M53 32h14v18l-7-4-7 4z" fill="#FFD7B5" stroke="#16193A" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<g class="bit-eyes">' +
        '<ellipse cx="44" cy="70" rx="11.5" ry="13.5" fill="#fff" stroke="#16193A" stroke-width="3"/>' +
        '<ellipse cx="76" cy="70" rx="11.5" ry="13.5" fill="#fff" stroke="#16193A" stroke-width="3"/>' +
        '<circle cx="46.5" cy="72" r="6.5" fill="#16193A"/><circle cx="73.5" cy="72" r="6.5" fill="#16193A"/>' +
        '<circle cx="49" cy="69" r="2.2" fill="#fff"/><circle cx="76" cy="69" r="2.2" fill="#fff"/>' +
      '</g>' +
      '<ellipse cx="29" cy="88" rx="7" ry="4" fill="#FF5E7E" opacity=".5"/><ellipse cx="91" cy="88" rx="7" ry="4" fill="#FF5E7E" opacity=".5"/>' +
      '<path d="M51 90 Q60 99 69 90" fill="none" stroke="#16193A" stroke-width="4" stroke-linecap="round"/>' +
    "</g></svg>";
}

function create(cfg) {
  var prefix = cfg.prefix, STAMPS = cfg.stamps, STAMP_KEYS = Object.keys(STAMPS);

  /* ---------- storage (best effort; page works without it) ---------- */
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(prefix + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(prefix + k, JSON.stringify(v)); } catch (e) { /* in-memory only */ } }
  };

  /* ---------- sound (synthesised, no files) ---------- */
  var Sound = (function () {
    var ctx = null, on = store.get("sound", true);
    function ac() {
      if (!ctx) { var C = window.AudioContext || window.webkitAudioContext; if (!C) return null; try { ctx = new C(); } catch (e) { return null; } }
      if (ctx.state === "suspended") ctx.resume();
      return ctx;
    }
    function tone(f, d, type, v, f2, delay) {
      if (!on) return; var c = ac(); if (!c) return;
      var t = c.currentTime + (delay || 0), o = c.createOscillator(), g = c.createGain();
      o.type = type || "sine"; o.frequency.setValueAtTime(f, t);
      if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v || .15, t + .012); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + d + .05);
    }
    function noise(d, f1, f2, v, delay) {
      if (!on) return; var c = ac(); if (!c) return;
      var t = c.currentTime + (delay || 0), buf = c.createBuffer(1, Math.floor(c.sampleRate * d), c.sampleRate), data = buf.getChannelData(0);
      for (var i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      var src = c.createBufferSource(); src.buffer = buf;
      var bp = c.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 1.2;
      bp.frequency.setValueAtTime(f1, t); bp.frequency.exponentialRampToValueAtTime(f2, t + d);
      var g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + d * .3); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      src.connect(bp); bp.connect(g); g.connect(c.destination); src.start(t); src.stop(t + d + .05);
    }
    return {
      unlock: ac,
      pop: function () { tone(560, .12, "sine", .18, 280); },
      click: function () { tone(1300, .04, "square", .03); },
      ding: function () { tone(880, .5, "sine", .13); tone(1320, .6, "sine", .07, null, .06); },
      whoosh: function () { noise(.32, 300, 2600, .07); },
      buzz: function () { tone(150, .2, "square", .05, 110); },
      flash: function () { tone(1500, .1, "sine", .07, 2400); },
      dark: function () { tone(220, .1, "triangle", .06); },
      stamp: function () { tone(120, .2, "sine", .3, 55); noise(.09, 1800, 700, .12); },
      win: function () { [523, 659, 784, 1046].forEach(function (f, i) { tone(f, .25, "triangle", .1, null, i * .1); }); },
      toggle: function () { on = !on; store.set("sound", on); return on; },
      get on() { return on; }
    };
  })();

  /* ---------- stamps ---------- */
  function stampSVG(key, rot) {
    var s = STAMPS[key];
    return '<svg viewBox="0 0 140 140" aria-label="Штамп ' + s.label + '"><g transform="rotate(' + rot + ' 70 70)" style="color:' + s.c + '">' +
      '<circle cx="70" cy="70" r="64" fill="#fff" fill-opacity=".9"/>' +
      '<circle cx="70" cy="70" r="62" fill="none" stroke="currentColor" stroke-width="5"/>' +
      '<circle cx="70" cy="70" r="53" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="3 5"/>' +
      '<g transform="translate(48 30) scale(1.85)" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' + RI[s.ico] + "</g>" +
      '<text x="70" y="102" text-anchor="middle" font-family="Unbounded, Arial, sans-serif" font-size="12.5" font-weight="800" fill="currentColor" letter-spacing=".5">' + s.label + "</text>" +
      "</g></svg>";
  }
  var stamps = new Set(store.get("stamps", []).filter(function (k) { return STAMPS[k]; }));

  /* ---------- deck ---------- */
  var deck = $("#deck"), viewport = $("#viewport"), slides = $$(".slide", deck);
  var cur = 0, scale = 1, booted = false, H = {};

  function fit() {
    var w = viewport.clientWidth, h = viewport.clientHeight;
    scale = Math.min(w / 1200, h / 800);
    deck.style.transform = "translate(" + (w - 1200 * scale) / 2 + "px," + (h - 800 * scale) / 2 + "px) scale(" + scale + ")";
  }

  function buildRoute() {
    var route = $("#route");
    slides.forEach(function (s, i) {
      var b = document.createElement("button");
      b.className = "stop"; b.title = s.dataset.title; b.setAttribute("aria-label", (i + 1) + ". " + s.dataset.title);
      b.dataset.label = s.dataset.title;
      b.style.setProperty("--sc", s.style.getPropertyValue("--c"));
      b.innerHTML = ri(s.dataset.ico);
      b.addEventListener("click", function () { go(i); });
      route.appendChild(b);
    });
  }

  function updateChrome() {
    var stops = $$(".stop");
    stops.forEach(function (b, i) {
      var key = slides[i].dataset.key;
      b.classList.toggle("current", i === cur);
      b.classList.toggle("passed", i < cur);
      b.classList.toggle("done", stamps.has(key));
    });
    var fill = $("#routeFill"), route = $("#route");
    if (stops[cur]) {
      var r = route.getBoundingClientRect(), s = stops[cur].getBoundingClientRect();
      fill.style.width = Math.max(0, s.left + s.width / 2 - r.left - 12) + "px";
    }
    $("#whereNum").textContent = (cur + 1) + " / " + slides.length;
    $("#whereTitle").textContent = slides[cur].dataset.title;
    $("#passCount").textContent = stamps.size + "/" + STAMP_KEYS.length;
    $("#prevBtn").disabled = cur === 0;
    $("#homeBtn").disabled = cur === 0;
    $("#nextBtn").disabled = cur === slides.length - 1;
    $("#nextBtn").classList.toggle("ready", stamps.has(slides[cur].dataset.key));
  }

  function go(i) {
    i = clamp(i, 0, slides.length - 1);
    if (booted && i === cur) return;
    closeTheory();
    var old = slides[cur];
    if (booted) {
      old.classList.remove("active");
      if (H[old.dataset.key] && H[old.dataset.key].leave) H[old.dataset.key].leave(old);
      Sound.whoosh();
    }
    cur = i;
    var el = slides[i];
    el.classList.add("active");
    if (H[el.dataset.key] && H[el.dataset.key].enter) H[el.dataset.key].enter(el);
    try { history.replaceState(null, "", "#s" + (i + 1)); } catch (e) { /* file:// or sandbox */ }
    updateChrome();
  }
  function next() { go(cur + 1); }
  function prev() { go(cur - 1); }

  function stamp(key) {
    if (!STAMPS[key] || stamps.has(key)) return;
    stamps.add(key); store.set("stamps", Array.from(stamps));
    var fx = $("#stampFx");
    fx.innerHTML = '<div class="fx">' + stampSVG(key, 0) + "</div>";
    Sound.stamp();
    setTimeout(function () { fx.innerHTML = ""; }, 1950);
    var pc = $("#passCount"); pc.classList.remove("bump"); void pc.offsetWidth; pc.classList.add("bump");
    updateChrome();
  }

  /* ---------- small slide helpers ---------- */
  function say(slideEl, text) {
    var b = $(".say .bubble", slideEl) || $(".bubble", slideEl);
    if (!b || b.textContent === text) return;
    b.textContent = text; b.classList.remove("pop"); void b.offsetWidth; b.classList.add("pop");
  }
  function happy(slideEl) {
    var s = $(".say svg.bit", slideEl); if (!s) return;
    s.classList.remove("happy"); void s.getBoundingClientRect(); s.classList.add("happy");
  }

  /* ---------- "for the curious" drawer ---------- */
  var thDrawer = $("#thDrawer"), thBack = $("#thBack"), thBody = $("#thBody"), thOpen = false;
  function openTheory(slide) {
    var t = $("template.theory", slide); if (!t) return;
    thBody.innerHTML = ""; thBody.appendChild(t.content.cloneNode(true)); thBody.scrollTop = 0;
    thDrawer.style.setProperty("--th-c", slide.style.getPropertyValue("--c"));
    thDrawer.classList.add("open"); thBack.classList.add("open"); thDrawer.setAttribute("aria-hidden", "false");
    thOpen = true; Sound.pop(); setTimeout(function () { $("#thClose").focus(); }, 60);
  }
  function closeTheory() {
    if (!thOpen) return;
    thDrawer.classList.remove("open"); thBack.classList.remove("open"); thDrawer.setAttribute("aria-hidden", "true"); thOpen = false;
  }

  function paintSound() {
    $("#soundBtn").innerHTML = ri(Sound.on ? "soundOn" : "soundOff");
    $("#soundBtn").setAttribute("aria-label", Sound.on ? "Вимкнути звук" : "Увімкнути звук");
    if (cfg.onSoundChange) cfg.onSoundChange(Sound.on);
  }

  function toggleFS() {
    var d = document, r = d.documentElement;
    try {
      if (d.fullscreenElement || d.webkitFullscreenElement) { (d.exitFullscreen || d.webkitExitFullscreen).call(d); }
      else { var p = (r.requestFullscreen || r.webkitRequestFullscreen); if (p) { var res = p.call(r); if (res && res.catch) res.catch(function () {}); } }
    } catch (e) { /* not supported */ }
  }

  /* Call once, after every H.<slideKey> handler is registered. */
  function start() {
    $$("[data-bit]").forEach(function (n) { n.insertAdjacentHTML("afterbegin", bitSVG()); });
    $$("[data-ri]").forEach(function (n) { n.innerHTML = ri(n.dataset.ri); });
    buildRoute();
    slides.forEach(function (s) { var h = H[s.dataset.key]; if (h && h.init) h.init(s); });

    $("#thClose").addEventListener("click", closeTheory);
    thBack.addEventListener("click", closeTheory);
    slides.forEach(function (s) {
      var k = $(".kicker", s); if (!k || !$("template.theory", s)) return;
      var row = document.createElement("div"); row.className = "kick-row";
      k.parentNode.insertBefore(row, k); row.appendChild(k);
      var b = document.createElement("button"); b.className = "more-btn";
      b.innerHTML = ri("book") + (s.dataset.key === cfg.passport ? "Словничок" : "Детальніше");
      b.addEventListener("click", function () { openTheory(s); }); row.appendChild(b);
    });

    $$("[data-next]").forEach(function (b) { b.addEventListener("click", next); });
    $("#nextBtn").addEventListener("click", next);
    $("#prevBtn").addEventListener("click", prev);
    $("#homeBtn").addEventListener("click", function () { go(0); });
    $("#brandBtn").addEventListener("click", function () { go(0); });
    $("#passBtn").addEventListener("click", function () { go(slides.findIndex(function (s) { return s.dataset.key === cfg.passport; })); });
    $("#soundBtn").addEventListener("click", function () { Sound.toggle(); paintSound(); });
    paintSound();
    $("#fsBtn").addEventListener("click", toggleFS);

    document.addEventListener("keydown", function (e) {
      if (thOpen) { if (e.key === "Escape") closeTheory(); return; }
      var t = e.target;
      if (t.closest && (t.closest("input,textarea") || t.closest('[role="slider"]'))) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); next(); }
      else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); prev(); }
      else if (e.key === "Home") { e.preventDefault(); go(0); }
      else if (e.key === " " && !(t.closest && (t.closest("button") || t.closest("bit-game")))) { e.preventDefault(); next(); }
      else if (e.code === "KeyF") { toggleFS(); }
      else if (e.code === "KeyM") { Sound.toggle(); paintSound(); }
    });

    var sw = null;
    viewport.addEventListener("pointerdown", function (e) {
      Sound.unlock();
      if (e.pointerType === "mouse") { sw = null; return; }
      if (e.target.closest("[data-noswipe],button,input,a")) { sw = null; return; }
      sw = { x: e.clientX, y: e.clientY, t: Date.now() };
    });
    viewport.addEventListener("pointerup", function (e) {
      if (!sw) return;
      var dx = e.clientX - sw.x, dy = e.clientY - sw.y;
      if (Math.abs(dx) > 60 && Math.abs(dy) < 70 && Date.now() - sw.t < 800) { if (dx < 0) next(); else prev(); }
      sw = null;
    });

    window.addEventListener("resize", function () { fit(); updateChrome(); });
    if (window.ResizeObserver) new ResizeObserver(function () { fit(); updateChrome(); }).observe(viewport);
    fit();
    var m = /^#s(\d+)$/.exec(location.hash || "");
    go(m ? clamp(+m[1] - 1, 0, slides.length - 1) : 0);
    booted = true;
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(updateChrome);
  }

  return {
    H: H, slides: slides, store: store, Sound: Sound, start: start,
    go: go, next: next, prev: prev, current: function () { return cur; },
    stamp: stamp, hasStamp: function (k) { return stamps.has(k); }, stampCount: function () { return stamps.size; },
    stampKeys: STAMP_KEYS, stampSVG: stampSVG, stampLabel: function (k) { return STAMPS[k].label; },
    clearStamps: function () { stamps = new Set(); store.set("stamps", []); updateChrome(); },
    updateChrome: updateChrome, say: say, happy: happy, openTheory: openTheory, closeTheory: closeTheory
  };
}

window.Deck = { create: create, RI: RI, ri: ri, bitSVG: bitSVG, $: $, $$: $$, clamp: clamp, wait: wait, svgEl: svgEl };
})();
