/* <bit-game levels="2-01,2-02" lang="uk"> — Біт-програміст.
   Needs engine.js and a levels-*.js loaded first. Shadow DOM; colours/fonts come from page CSS variables with fallbacks. */
(function () {
"use strict";
if (!window.customElements || !window.BitGame) return;
var B = window.BitGame;
var NS = "http://www.w3.org/2000/svg";

/* ---------- isometric geometry ---------- */
var HW = B.ISO.HW, HH = B.ISO.HH, HZ = B.ISO.HZ;   // half tile width, half tile height, pixels per height unit
var TOP_COLORS = ["#6FE3B8", "#52CFD0", "#4AA8E8", "#8A82FF"];   // by height 1..4

function shade(hex, k) {
  var n = parseInt(hex.slice(1), 16);
  var r = Math.round(((n >> 16) & 255) * k), g = Math.round(((n >> 8) & 255) * k), b = Math.round((n & 255) * k);
  return "rgb(" + r + "," + g + "," + b + ")";
}
function iso(x, y, h) { return { x: (x - y) * HW, y: (x + y) * HH - h * HZ }; }
/* The item (command or loop) at `path` of a program tree. */
function itemAt(program, path) {
  var it = { body: program };
  path.forEach(function (i) { it = it.body[i]; });
  return it;
}
function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
function el(tag, attrs, parent) {
  var n = document.createElementNS(NS, tag);
  for (var k in attrs) n.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(n);
  return n;
}

var STEP_MS = 450;
var store = {
  get: function (k) { try { return localStorage.getItem("bitgame:" + k); } catch (e) { return null; } },
  set: function (k, v) { try { localStorage.setItem("bitgame:" + k, v); } catch (e) { /* in-memory only */ } }
};
function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

/* ---------- sound (synthesised; page can mute with BitGame.muted = true) ---------- */
var Sound = (function () {
  var ctx = null;
  function ac() {
    if (!ctx) { var C = window.AudioContext || window.webkitAudioContext; if (!C) return null; try { ctx = new C(); } catch (e) { return null; } }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }
  function tone(f, d, type, v, f2, delay) {
    if (B.muted) return; var c = ac(); if (!c) return;
    var t = c.currentTime + (delay || 0), o = c.createOscillator(), g = c.createGain();
    o.type = type || "sine"; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v || .15, t + .012); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + d + .05);
  }
  return {
    unlock: ac,
    click: function () { tone(1300, .04, "square", .03); },
    pop: function () { tone(560, .12, "sine", .18, 280); },
    ding: function () { tone(880, .5, "sine", .13); tone(1320, .6, "sine", .07, null, .06); },
    dark: function () { tone(220, .1, "triangle", .06); },
    buzz: function () { tone(150, .2, "square", .05, 110); },
    win: function () { [523, 659, 784, 1046].forEach(function (f, i) { tone(f, .25, "triangle", .1, null, i * .1); }); }
  };
})();

/* The «where am I looking» arrow lies on the floor in front of Bit: a flat arrow in tile-plane units (forward, sideways). */
var GRID_DIR = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };
var ARROW = [[.95, 0], [.62, .27], [.62, .1], [.38, .1], [.38, -.1], [.62, -.1], [.62, -.27]];
function arrowPath(p, face) {
  var d = GRID_DIR[face], q = [-d[1], d[0]];
  return "M" + ARROW.map(function (a) {
    var gx = d[0] * a[0] + q[0] * a[1], gy = d[1] * a[0] + q[1] * a[1];
    return (p.x + (gx - gy) * HW).toFixed(1) + " " + (p.y + 3 + (gx + gy) * HH).toFixed(1);
  }).join("L") + "Z";
}

/* ---------- command icons (24×24, stroke) ---------- */
var ICONS = {
  forward: '<path d="M12 20V5M5 11l7-7 7 7"/>',
  left: '<path d="M9 4L4 9l5 5"/><path d="M4 9h9a6 6 0 0 1 0 12h-3"/>',
  right: '<path d="M15 4l5 5-5 5"/><path d="M20 9h-9a6 6 0 0 0 0 12h3"/>',
  jump: '<path d="M3 19C5 7 14 5 18 12"/><path d="M13 12h6v-6"/>',
  light: '<path d="M13 2L5 14h6l-1 8 8-12h-6z"/>',
  repeat: '<path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3"/><path d="M18 3v4h-4M6 21v-4h4"/>'
};
var LABELS = { forward: "вперед", left: "ліворуч", right: "праворуч", jump: "стрибок", light: "увімкнути", repeat: "цикл" };
var CMD_COLORS = { forward: "#2F80ED", left: "#7A5CFA", right: "#7A5CFA", jump: "#E5487B", light: "#FFC93C", repeat: "#0E9C8D" };
function icon(cmd, size) {
  return '<svg viewBox="0 0 24 24" width="' + size + '" height="' + size + '" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONS[cmd] + '</svg>';
}

/* ---------- Біт (same drawing as lesson 1) ---------- */
function bitInner() {
  return '<ellipse cx="60" cy="124" rx="32" ry="5" fill="rgba(22,25,58,.25)"/>' +
    '<g class="bit-flip"><g class="bit-body">' +
      '<line x1="60" y1="31" x2="60" y2="14" stroke="#16193A" stroke-width="4" stroke-linecap="round"/>' +
      '<circle cx="60" cy="11" r="7" fill="#FFC93C" stroke="#16193A" stroke-width="3"/>' +
      '<rect x="40" y="104" width="13" height="16" rx="5" fill="#16193A"/><rect x="67" y="104" width="13" height="16" rx="5" fill="#16193A"/>' +
      '<rect x="15" y="30" width="90" height="80" rx="20" fill="#FF8A3D" stroke="#16193A" stroke-width="4"/>' +
      '<path d="M53 32h14v18l-7-4-7 4z" fill="#FFD7B5" stroke="#16193A" stroke-width="2.5" stroke-linejoin="round"/>' +
      /* face: shown when Bit looks towards the camera */
      '<g class="bit-front">' +
        '<g class="bit-eyes">' +
          '<ellipse cx="44" cy="70" rx="11.5" ry="13.5" fill="#fff" stroke="#16193A" stroke-width="3"/>' +
          '<ellipse cx="76" cy="70" rx="11.5" ry="13.5" fill="#fff" stroke="#16193A" stroke-width="3"/>' +
          '<g class="bit-pupils">' +
            '<circle cx="46.5" cy="72" r="6.5" fill="#16193A"/><circle cx="73.5" cy="72" r="6.5" fill="#16193A"/>' +
            '<circle cx="49" cy="69" r="2.2" fill="#fff"/><circle cx="76" cy="69" r="2.2" fill="#fff"/>' +
          '</g>' +
        '</g>' +
        '<ellipse cx="29" cy="88" rx="7" ry="4" fill="#FF5E7E" opacity=".5"/><ellipse cx="91" cy="88" rx="7" ry="4" fill="#FF5E7E" opacity=".5"/>' +
        '<path d="M51 90 Q60 99 69 90" fill="none" stroke="#16193A" stroke-width="4" stroke-linecap="round"/>' +
      '</g>' +
      /* back: shown when Bit walks away from the camera (a vent panel instead of the face) */
      '<g class="bit-back" display="none">' +
        '<rect x="56" y="54" width="34" height="40" rx="9" fill="#E2632A" stroke="#16193A" stroke-width="3"/>' +
        '<path d="M64 66h18M64 75h18M64 84h10" stroke="#16193A" stroke-width="3.5" stroke-linecap="round"/>' +
      '</g>' +
    '</g></g>';
}

/* ---------- styles ---------- */
var CSS = [
":host{display:block;position:relative;width:100%;height:100%;min-height:540px;color:var(--ink,#16193A);font-family:var(--f-body,'Nunito','Segoe UI',system-ui,sans-serif);-webkit-tap-highlight-color:transparent;touch-action:manipulation;outline:none}",
"*{box-sizing:border-box}",
"[hidden]{display:none !important}",
"button{font-family:inherit;color:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation}",
"button:focus-visible{outline:3px solid #2F80ED;outline-offset:3px}",
".root{position:absolute;inset:0;display:grid;grid-template-columns:minmax(0,1fr) 300px;grid-template-rows:auto minmax(0,1fr) auto;gap:10px 14px}",
".tabs{grid-column:1/-1;display:flex;align-items:center;gap:10px;min-height:48px;padding-bottom:10px}",
".tab{position:relative;width:48px;height:48px;border-radius:50%;border:3px solid var(--ink,#16193A);background:var(--paper,#fff);font:800 20px/1 var(--f-display,'Unbounded',sans-serif);box-shadow:0 4px 0 var(--ink,#16193A);display:grid;place-items:center;padding:0}",
".tab.on{background:var(--sun,#FFC93C)}",
".tab:active{transform:translateY(3px);box-shadow:0 1px 0 var(--ink,#16193A)}",
".tab .st{position:absolute;bottom:-17px;left:50%;transform:translateX(-50%);font:800 12px/1 var(--f-body,sans-serif);letter-spacing:1px;color:#B07A00;white-space:nowrap;pointer-events:none}",
".tab[disabled]{opacity:.5;cursor:default}",
".ttl{font:800 clamp(15px,2.2vw,20px)/1.2 var(--f-display,'Unbounded',sans-serif);margin-left:6px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
".lang{margin-left:auto}",
".field{grid-column:1;grid-row:2;position:relative;overflow:hidden;border:3px solid var(--ink,#16193A);border-radius:24px;box-shadow:5px 5px 0 var(--ink,#16193A);background:radial-gradient(circle at 30% 20%,#1E5A7A 0%,#0F3550 60%,#0A2740 100%)}",
".field::before{content:'';position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,.07) 2px,transparent 2.5px);background-size:28px 28px;pointer-events:none}",
".rot-btn{position:absolute;right:12px;top:12px;z-index:3;width:54px;height:54px;border-radius:50%;border:3px solid var(--ink,#16193A);background:var(--paper,#fff);box-shadow:0 4px 0 var(--ink,#16193A);font:800 28px/1 var(--f-body,sans-serif);padding:0;display:grid;place-items:center}",
".rot-btn:active{transform:translateY(3px);box-shadow:0 1px 0 var(--ink,#16193A)}",
".board{position:absolute;inset:0;width:100%;height:100%;display:block}",
".trace{stroke:rgba(255,255,255,.5);stroke-width:3;stroke-linecap:round;fill:none;transition:stroke .3s}",
".pad{fill:rgba(255,255,255,.55)}",
".halo{opacity:0;fill:#FFE680}",
".lit .halo{opacity:.55;animation:pulse 1.4s ease-in-out infinite}",
"@keyframes pulse{50%{opacity:.25}}",
".powered .trace{stroke:#FFE680}",
".powered .tile{animation:glow .9s ease-in-out 2}",
"@keyframes glow{50%{opacity:.78}}",
".bit-body{transform-box:fill-box;transform-origin:50% 100%;animation:idle 2.4s ease-in-out infinite}",
"@keyframes idle{50%{transform:scaleY(.97) translateY(1px)}}",
".bit-pupils{transform:translate(5px,1px)}",
".arrow{animation:arrowPulse 1.3s ease-in-out infinite;pointer-events:none}",
"@keyframes arrowPulse{50%{opacity:.65}}",
".hop .bit-body{animation:hop .4s cubic-bezier(.3,1.6,.5,1)}",
"@keyframes hop{40%{transform:translateY(-10px) scale(1.04)}}",
".bubble{position:absolute;left:14px;top:14px;max-width:min(360px,70%);background:var(--paper,#fff);border:3px solid var(--ink,#16193A);border-radius:20px;padding:10px 14px;font:800 16px/1.35 var(--f-body,sans-serif);box-shadow:4px 4px 0 var(--ink,#16193A);z-index:2}",
".bubble.pop{animation:pop .4s cubic-bezier(.3,1.6,.5,1)}",
"@keyframes pop{0%{transform:scale(.85)}100%{transform:scale(1)}}",
".side{grid-column:2;grid-row:2;display:flex;flex-direction:column;gap:10px;min-height:0}",
".panel{background:var(--paper,#fff);border:3px solid var(--ink,#16193A);border-radius:20px;box-shadow:4px 4px 0 var(--ink,#16193A);padding:10px 12px;min-height:0}",
".prog-head{display:flex;justify-content:space-between;align-items:center;font:800 13px/1 var(--f-display,sans-serif);letter-spacing:.5px;margin-bottom:8px}",
".count{font:800 15px/1 var(--f-mono,monospace);background:var(--bg-soft,#E9F0FB);border-radius:999px;padding:5px 10px}",
".slots{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}",
".slot{aspect-ratio:1;border:3px dashed #B9C6E0;border-radius:12px;background:#F4F7FD;display:grid;place-items:center;padding:0;color:#fff;position:relative}",
".slot.full{border:3px solid var(--ink,#16193A);box-shadow:0 3px 0 var(--ink,#16193A)}",
".slot.now{outline:4px solid #FFC93C;outline-offset:2px}",
".slot .n{position:absolute;left:4px;top:2px;font:800 10px/1 var(--f-mono,monospace);color:rgba(255,255,255,.85)}",
".code{flex:1;display:flex;flex-direction:column;background:#1B2040;color:#EAF0FF;overflow:hidden}",
".code-head{display:flex;justify-content:space-between;align-items:center;font:800 13px/1 var(--f-display,sans-serif);letter-spacing:.5px;margin-bottom:8px;color:#9FB0E8}",
".code-body{flex:1;overflow:auto;font:700 17px/1.7 var(--f-mono,'JetBrains Mono',ui-monospace,Menlo,Consolas,monospace)}",
".ln{display:flex;gap:10px;padding:0 6px;border-radius:8px}",
".ln i{font-style:normal;color:#6F7DB8;width:1.4em;text-align:right;flex:none}",
".ln.now{background:#FFC93C;color:#16193A}.ln.now i{color:#8A6500}",
".ln span{white-space:pre}",
".ln.empty{color:#6F7DB8}",
".mem{flex:1;display:flex;gap:3px;margin:0 10px}",
".cell{flex:1;height:12px;border-radius:4px;border:2px solid var(--ink,#16193A);background:#F4F7FD}",
".cell.full{background:#0E9C8D}",
".prog{display:flex;flex-wrap:wrap;gap:6px;align-items:flex-start;align-content:flex-start;min-height:60px;overflow:auto;padding:2px}",
".side.tree .prog-panel{flex:0 0 61%;display:flex;flex-direction:column;padding:8px 10px}",
".side.tree .prog{flex:1 1 0;min-height:0}",
".side.tree .code{flex:1 1 0;min-height:0;padding:6px 10px}",
".side.tree .code-head{margin-bottom:2px}",
".side.tree .code-head .btn.small{min-height:26px;padding:0 10px;font-size:12px;box-shadow:0 2px 0 var(--ink,#16193A)}",
".side.tree .code-body{font-size:13px;line-height:1.35}",
".chip{width:34px;height:34px;border-radius:12px;border:3px solid var(--ink,#16193A);box-shadow:0 3px 0 var(--ink,#16193A);display:grid;place-items:center;padding:0}",
".chip.now{outline:4px solid #FFC93C;outline-offset:2px}",
".chip:active{transform:translateY(2px);box-shadow:0 1px 0 var(--ink,#16193A)}",
".loop{flex:1 1 100%;border:3px solid #0E9C8D;border-radius:14px;background:#E8F7F4;padding:5px;box-shadow:0 3px 0 #0E9C8D}",
".loop-head{display:flex;align-items:center;gap:8px;color:#0E9C8D;margin-bottom:2px}",
".loop-head svg{flex:none}",
".times{font:800 15px/1 var(--f-mono,monospace);min-width:48px;height:32px;border-radius:999px;border:3px solid var(--ink,#16193A);background:#fff;box-shadow:0 3px 0 var(--ink,#16193A);padding:0 10px}",
".times:active,.del:active{transform:translateY(2px);box-shadow:0 1px 0 var(--ink,#16193A)}",
".lap{font:800 13px/1 var(--f-body,sans-serif);color:#0A6F63;flex:1;white-space:nowrap}",
".loop{position:relative}",
".loop.jump{animation:loopJump .7s ease-out}",
".loop.jump > .loop-head .lap{animation:lapFlash .7s ease-out}",
".loop.jump > .loop-head .lap::before{content:'⤴ '}",
"@keyframes loopJump{0%{box-shadow:inset 0 0 0 5px rgba(255,201,60,.95),0 3px 0 #0E9C8D}100%{box-shadow:inset 0 0 0 5px rgba(255,201,60,0),0 3px 0 #0E9C8D}}",
"@keyframes lapFlash{0%,60%{background:#FFC93C;border-radius:999px;padding:3px 8px;margin:-3px -8px}100%{background:transparent;padding:3px 8px;margin:-3px -8px}}",
".del{width:30px;height:30px;border-radius:50%;border:3px solid var(--ink,#16193A);background:#fff;box-shadow:0 3px 0 var(--ink,#16193A);font:900 14px/1 var(--f-body,sans-serif);padding:0;display:grid;place-items:center;margin-left:auto}",
".loop-body{display:flex;flex-wrap:wrap;gap:5px;align-items:center;min-height:44px;border:2px dashed #9BD6CC;border-radius:10px;padding:3px}",
".tail{flex:1 1 100%;min-height:26px;display:flex;align-items:center;border:2px dashed #B9C6E0;border-radius:10px;padding:2px 3px}",
".tail .caret{height:20px}",
".caret{display:inline-grid;place-items:center;width:24px;height:38px;border-radius:8px;border:2px dashed #2F80ED;color:#2F80ED;font:900 18px/1 var(--f-mono,monospace);animation:blink 1.1s steps(2,jump-none) infinite;pointer-events:none}",
"@keyframes blink{50%{opacity:.25}}",
".deck{grid-column:1/-1;grid-row:3;display:flex;align-items:stretch;gap:12px;flex-wrap:wrap;padding-bottom:6px}",
".cmds{display:flex;gap:10px;flex-wrap:wrap}",
".ctl{display:flex;gap:10px;margin-left:auto;flex-wrap:wrap}",
".cmd{min-width:84px;height:72px;border-radius:18px;border:3px solid var(--ink,#16193A);box-shadow:0 5px 0 var(--ink,#16193A);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;padding:6px 10px;color:#fff;font:800 13px/1 var(--f-body,sans-serif)}",
".cmd.dark{color:var(--ink,#16193A)}",
".cmd:active{transform:translateY(4px);box-shadow:0 1px 0 var(--ink,#16193A)}",
".btn{font:800 17px/1 var(--f-body,sans-serif);background:var(--sun,#FFC93C);border:3px solid var(--ink,#16193A);border-radius:999px;padding:0 20px;min-height:56px;box-shadow:0 5px 0 var(--ink,#16193A);display:inline-flex;align-items:center;gap:8px;align-self:center}",
".btn.ghost{background:var(--paper,#fff)}",
".btn.small{font-size:14px;padding:0 14px;min-height:40px;box-shadow:0 3px 0 var(--ink,#16193A)}",
".btn:active{transform:translateY(3px);box-shadow:0 1px 0 var(--ink,#16193A)}",
".btn:disabled{opacity:.45;cursor:default;transform:none}",
".cmd:disabled,.slot:disabled,.tab:disabled{opacity:.55;cursor:default;transform:none}",
".count.shake{animation:shake .4s}",
"@keyframes shake{20%,60%{transform:translateX(-5px)}40%,80%{transform:translateX(5px)}}",
".hint-chip{display:inline-flex;align-items:center;gap:4px;vertical-align:middle;background:var(--ink,#16193A);color:#fff;border-radius:8px;padding:2px 8px;margin:0 2px;font:800 13px/1.4 var(--f-mono,monospace)}",
".win{position:absolute;inset:0;display:grid;place-items:center;z-index:5;background:rgba(10,39,64,.55);animation:fade .3s}",
"@keyframes fade{from{opacity:0}}",
".win-x{position:absolute;right:10px;top:10px;width:42px;height:42px;border-radius:50%;border:3px solid var(--ink,#16193A);background:var(--paper,#fff);box-shadow:0 3px 0 var(--ink,#16193A);font:900 16px/1 var(--f-body,sans-serif);padding:0;display:grid;place-items:center}",
".win-x:active{transform:translateY(2px);box-shadow:0 1px 0 var(--ink,#16193A)}",
".win-card{position:relative;background:var(--paper,#fff);border:3px solid var(--ink,#16193A);border-radius:26px;box-shadow:6px 6px 0 var(--ink,#16193A);padding:22px 30px;text-align:center;max-width:90%;animation:pop .5s cubic-bezier(.3,1.6,.5,1)}",
".win-card h3{margin:0 0 6px;font:800 clamp(20px,3vw,28px)/1.2 var(--f-display,sans-serif)}",
".win-stars{font-size:46px;letter-spacing:6px;color:#FFB400;text-shadow:0 3px 0 var(--ink,#16193A);margin:4px 0}",
".win-stars .off{color:#D5DCEE;text-shadow:none}",
".win-card p{margin:0 0 14px;font:800 16px/1.4 var(--f-body,sans-serif);color:var(--ink-soft,#4E5584)}",
".win-card .btn{margin:0 4px}",
".missing{position:absolute;inset:0;display:grid;place-items:center}",
".missing div{background:var(--paper,#fff);border:3px solid var(--ink,#16193A);border-radius:24px;padding:24px 32px;font:800 20px/1.4 var(--f-body,sans-serif);box-shadow:5px 5px 0 var(--ink,#16193A);text-align:center}",
"@media (prefers-reduced-motion:reduce){*{animation-duration:.01ms !important;animation-iteration-count:1 !important;transition-duration:.01ms !important}}"
].join("\n");

/* ---------- component ---------- */
class BitGameElement extends HTMLElement {
  static get observedAttributes() { return ["levels", "lang"]; }
}
var P = BitGameElement.prototype;

P.connectedCallback = function () {
  if (!this.shadowRoot) this.attachShadow({ mode: "open" });
  this.setAttribute("data-noswipe", "");
  if (!this.hasAttribute("tabindex")) this.setAttribute("tabindex", "0");
  if (!this._keyBound) { this._keyBound = true; this.addEventListener("keydown", this.onKey.bind(this)); }
  this._ready = true;
  this.setup();
};
P.attributeChangedCallback = function () { if (this._ready) this.setup(); };

P.setup = function () {
  var ids = (this.getAttribute("levels") || "").split(",").map(function (s) { return s.trim(); }).filter(Boolean);
  this.ids = ids;
  var attrLang = this.getAttribute("lang");
  this.codeLang = attrLang === "en" || attrLang === "uk" ? attrLang : (store.get("lang") === "en" ? "en" : "uk");
  var idx = this.index != null && this.index < ids.length ? this.index : 0;
  this.shadowRoot.innerHTML = "<style>" + CSS + "</style>";
  var known = ids.length && ids.every(function (id) { return B.getLevel(id); });
  if (!known) {
    var card = document.createElement("div");
    card.className = "missing";
    card.innerHTML = "<div>Рівень не знайдено 🤔</div>";
    this.shadowRoot.appendChild(card);
    return;
  }
  this.build();
  this.loadLevel(idx);
};

P.build = function () {
  var root = this.root = document.createElement("div");
  root.className = "root";
  root.innerHTML =
    '<div class="tabs"></div>' +
    '<div class="field"><svg class="board" aria-hidden="true"></svg><div class="bubble"></div><button class="rot-btn" type="button" data-act="rotate" aria-label="Повернути поле" title="Повернути поле">⟳</button></div>' +
    '<aside class="side">' +
      '<div class="panel prog-panel"><div class="prog-head"><span class="prog-title">ПРОГРАМА</span><div class="mem" hidden></div><span class="count"></span></div><div class="slots"></div><div class="prog" hidden></div></div>' +
      '<div class="panel code"><div class="code-head"><span>КОД</span><button class="btn small ghost lang" type="button"></button></div><div class="code-body"></div></div>' +
    '</aside>' +
    '<div class="deck"><div class="cmds"></div><div class="ctl">' +
      '<button class="btn" data-act="run" type="button">▶ Запуск</button>' +
      '<button class="btn ghost" data-act="step" type="button">⏭ Крок</button>' +
      '<button class="btn ghost" data-act="hint" type="button" hidden>💡 Підказка</button>' +
      '<button class="btn ghost" data-act="reset" type="button" aria-label="Спочатку">⟲</button>' +
    '</div></div>';
  this.shadowRoot.appendChild(root);
  this.q = function (sel) { return root.querySelector(sel); };
  this.board = this.q(".board");
  this.wire();
};

P.renderTabs = function () {
  var self = this, tabs = this.q(".tabs");
  tabs.innerHTML = "";
  if (this.ids.length > 1) {
    this.ids.forEach(function (id, i) {
      var b = document.createElement("button");
      b.className = "tab" + (i === self.index ? " on" : "");
      b.type = "button";
      b.setAttribute("aria-label", "Рівень " + (i + 1) + ": " + B.getLevel(id).title);
      var s = B.progress.get(id);
      b.innerHTML = (i + 1) + '<span class="st">' + (s ? "★".repeat(s) + "☆".repeat(3 - s) : "") + "</span>";
      b.dataset.i = i;
      tabs.appendChild(b);
    });
  }
  var t = document.createElement("div");
  t.className = "ttl";
  t.textContent = this.level.title;
  tabs.appendChild(t);
};

P.loadLevel = function (i) {
  this.runId = (this.runId || 0) + 1;
  this.index = i;
  this.level = B.getLevel(this.ids[i]);
  this.program = [];
  this.cursor = [];
  this.steps = [];
  this.curStep = -1;
  this.tree = this.level.commands.indexOf("repeat") >= 0;
  this.fails = 0;
  this.hintCache = null;
  this.running = this.busy = this.won = false;
  this.stepIdx = -1;
  this.curStep = -1;
  this.state = B.initialState(this.level);
  this.removeWin();
  this.rot = B.bestRotation(this.level);   // start from the side that hides the fewest tiles
  this.renderTabs();
  this.buildBoard();
  this.renderSide();
  this.renderDeck();
  this.q('[data-act="hint"]').hidden = true;
  this.say(this.level.say);
  this.syncUI();
};

/* `html` = true lets the bubble carry markup built by this file (never page or user text). */
P.say = function (text, html) {
  var b = this.q(".bubble");
  if (html) b.innerHTML = text; else b.textContent = text || "";
  b.style.display = text ? "" : "none";
  b.classList.remove("pop"); void b.offsetWidth; b.classList.add("pop");
};

/* ----- board ----- */
P.buildBoard = function () {
  var lv = this.level, svg = this.board;
  svg.innerHTML = "";
  var minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9, order = [];
  for (var y = 0; y < lv.h; y++) for (var x = 0; x < lv.w; x++) {
    var c = lv.cells[y][x];
    if (!c) continue;
    var v = this.vpos(x, y), p = iso(v.x, v.y, c.h);
    minX = Math.min(minX, p.x - HW); maxX = Math.max(maxX, p.x + HW);
    minY = Math.min(minY, p.y - HH - 95); maxY = Math.max(maxY, p.y + HH + c.h * HZ);
    order.push({ x: x, y: y, c: c, p: p, s: v.x + v.y });
  }
  var pad = 36;
  svg.setAttribute("viewBox", [minX - pad, minY - pad, maxX - minX + pad * 2, maxY - minY + pad * 2].join(" "));
  order.sort(function (a, b) { return a.s - b.s || a.c.h - b.c.h; });

  var layer = this.tileLayer = el("g", { "class": "tiles" }, svg);
  this.tileEls = {};
  order.forEach(function (o) {
    var g = el("g", { transform: "translate(" + o.p.x + " " + o.p.y + ")", "class": "tile", "data-sum": o.s }, layer);
    g.innerHTML = tileMarkup(o.x, o.y, o.c);
    this.tileEls[B.keyOf(o.x, o.y)] = g;
  }, this);

  this.bitG = el("g", { "class": "bit" }, svg);
  this.bitG.innerHTML = bitInner();
  this.arrow = el("path", { "class": "arrow", fill: "#FFC93C", stroke: "#16193A", "stroke-width": "3.5", "stroke-linejoin": "round" }, svg);   // above all tiles
  this.placeBit(this.state);
  this.renderLit();
};

function tileMarkup(x, y, c) {
  var h = c.h, H = h * HZ, topC = TOP_COLORS[h - 1];
  var s = "";
  s += '<path d="M-48 0L0 24L0 ' + (24 + H) + 'L-48 ' + H + 'Z" fill="' + shade(topC, 0.62) + '" stroke="#16193A" stroke-width="3" stroke-linejoin="round"/>';
  s += '<path d="M0 24L48 0L48 ' + H + 'L0 ' + (24 + H) + 'Z" fill="' + shade(topC, 0.45) + '" stroke="#16193A" stroke-width="3" stroke-linejoin="round"/>';
  for (var k = 1; k < h; k++) {
    s += '<path d="M-48 ' + k * HZ + 'L0 ' + (24 + k * HZ) + 'L48 ' + k * HZ + '" fill="none" stroke="#16193A" stroke-opacity=".5" stroke-width="2"/>';
  }
  s += '<path d="M0 -24L48 0L0 24L-48 0Z" fill="' + topC + '" stroke="#16193A" stroke-width="3" stroke-linejoin="round"/>';
  var flip = (x * 7 + y * 3) % 2;
  var a = flip ? "-24 -12" : "24 -12", b = flip ? "24 12" : "-24 12";
  s += '<path class="trace" d="M' + a + 'L' + b + '"/><circle class="pad" cx="' + a.split(" ")[0] + '" cy="' + a.split(" ")[1] + '" r="3"/><circle class="pad" cx="' + b.split(" ")[0] + '" cy="' + b.split(" ")[1] + '" r="3"/>';
  if (c.t) {
    s += '<g class="chip">' +
      '<ellipse class="halo" cx="0" cy="-4" rx="46" ry="23"/>' +
      '<path class="c-l" d="M-26 -8L0 5L0 13L-26 0Z" fill="#262F57" stroke="#16193A" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<path class="c-r" d="M0 5L26 -8L26 0L0 13Z" fill="#1E2646" stroke="#16193A" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<path class="c-t" d="M0 -21L26 -8L0 5L-26 -8Z" fill="#39467A" stroke="#16193A" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<text class="c-n" x="0" y="-4" text-anchor="middle" font-family="JetBrains Mono,monospace" font-weight="800" font-size="15" fill="#8794D6">0</text>' +
    '</g>';
  }
  return s;
}

P.renderLit = function () {
  var lit = this.state.lit, self = this;
  this.level.targets.forEach(function (t) {
    var k = B.keyOf(t.x, t.y), on = lit.indexOf(k) >= 0, g = self.tileEls[k];
    g.classList.toggle("lit", on);
    var chip = g.querySelector(".chip");
    chip.querySelector(".c-t").setAttribute("fill", on ? "#FFD84D" : "#39467A");
    chip.querySelector(".c-l").setAttribute("fill", on ? "#E0A800" : "#262F57");
    chip.querySelector(".c-r").setAttribute("fill", on ? "#B98200" : "#1E2646");
    var n = chip.querySelector(".c-n");
    n.textContent = on ? "1" : "0";
    n.setAttribute("fill", on ? "#16193A" : "#8794D6");
  });
};

/* Bit stands at the centre of the top face. `at` = {x, y, lift} in screen coordinates. */
/* The board can be viewed from any of four sides; logical (x, y) → screen position for the current view. */
P.vpos = function (x, y) { return B.viewPos(this.level, this.rot || 0, x, y); };
P.vsum = function (x, y) { var v = this.vpos(x, y); return v.x + v.y; };
P.isoAt = function (x, y) { var v = this.vpos(x, y); return iso(v.x, v.y, this.level.cells[y][x].h); };

P.bitTransform = function (x, y) {
  this.bitG.setAttribute("transform", "translate(" + x + " " + (y + 6) + ") scale(.62) translate(-60 -124)");
};

P.placeBit = function (st) {
  var p = this.isoAt(st.x, st.y), face = B.viewDir(this.rot, st.dir), g = this.bitG;
  this.bitTransform(p.x, p.y);
  /* East/south look at the camera (face), north/west walk away (back); south/west are drawn mirrored. */
  var front = face === "E" || face === "S", mirror = face === "S" || face === "W";
  g.querySelector(".bit-front").setAttribute("display", front ? "inline" : "none");
  g.querySelector(".bit-back").setAttribute("display", front ? "none" : "inline");
  g.querySelector(".bit-flip").setAttribute("transform", mirror ? "translate(120 0) scale(-1 1)" : "");
  this.arrow.setAttribute("d", arrowPath(p, face));
  this.arrow.setAttribute("visibility", "visible");
  this.zPlace(this.vsum(st.x, st.y));
};

/* Draw Bit after every tile that is behind or level with him. */
P.zPlace = function (sum) {
  var layer = this.tileLayer, last = null;
  for (var n = layer.firstChild; n; n = n.nextSibling) {
    if (+n.getAttribute("data-sum") <= sum) last = n;
  }
  var ref = last ? last.nextSibling : layer.firstChild;
  layer.insertBefore(this.bitG, ref);
};

/* ----- side panel, code and deck ----- */
P.renderSide = function () {
  var lv = this.level, slots = this.q(".slots"), mem = this.q(".mem");
  slots.innerHTML = mem.innerHTML = "";
  slots.hidden = this.tree;
  mem.hidden = this.q(".prog").hidden = !this.tree;
  this.q(".side").classList.toggle("tree", this.tree);
  this.q(".prog-title").textContent = this.tree ? "ПАМ'ЯТЬ" : "ПРОГРАМА";
  for (var i = 0; i < lv.slots; i++) {
    if (this.tree) {
      var c = document.createElement("span");
      c.className = "cell";
      mem.appendChild(c);
    } else {
      var d = document.createElement("button");
      d.className = "slot"; d.type = "button"; d.dataset.i = i;
      slots.appendChild(d);
    }
  }
  this.q(".lang").textContent = this.codeLang === "uk" ? "EN" : "УКР";
  this.renderProgram();
};

/* The program as blocks (memory mode): commands are chips, a loop is a frame; the caret sits at the end of the container new commands go into. */
P.treeHTML = function (items, prefix) {
  var self = this, html = "";
  items.forEach(function (it, i) {
    var path = prefix.concat(i), key = path.join(".");
    if (typeof it === "string") {
      html += '<button class="chip" type="button" data-path="' + key + '" style="background:' + CMD_COLORS[it] + ";color:" + (it === "light" ? "#16193A" : "#fff") +
        '" aria-label="' + LABELS[it] + ' (прибрати)">' + icon(it, 22) + "</button>";
    } else {
      html += '<div class="loop" data-path="' + key + '"><div class="loop-head">' + icon("repeat", 20) +
        '<button class="times" type="button" data-path="' + key + '" aria-label="Скільки разів повторити">×' + it.repeat + "</button>" +
        '<span class="lap"></span><button class="del" type="button" data-path="' + key + '" aria-label="Прибрати цикл">✕</button></div>' +
        '<div class="loop-body">' + self.treeHTML(it.body, path) + "</div></div>";
    }
  });
  var caret = prefix.join(".") === this.cursor.join(".") ? '<span class="caret">+</span>' : "";
  if (prefix.length) return html + caret;   // inside a loop the caret closes the body
  return html + '<div class="tail" aria-label="Додати після усього">' + caret + "</div>";
};

/* Redraws memory/slots, counter and code from this.program; `now` = index of the step being executed in this.steps. */
P.renderProgram = function (now, flash) {
  var lv = this.level, prog = this.program, st = now != null ? this.steps[now] : null, cells = B.size(prog);
  if (this.tree) {
    var cs = this.q(".mem").children;
    for (var k = 0; k < cs.length; k++) cs[k].classList.toggle("full", k < cells);
    var box = this.q(".prog"), lk = this.locked();
    box.innerHTML = this.treeHTML(prog, []);
    [].forEach.call(box.querySelectorAll("button"), function (b) { b.disabled = lk; });
    if (st) {
      var chip = box.querySelector('.chip[data-path="' + st.path.join(".") + '"]');
      if (chip) chip.classList.add("now");
      st.laps.forEach(function (l) {
        var lap = box.querySelector('.loop[data-path="' + l.path.join(".") + '"] > .loop-head .lap');
        if (lap) lap.textContent = "коло " + l.lap + "/" + l.of;
      });
      /* the loops that jumped back right before this step flash «⤴ назад» */
      var before = flash && now > 0 ? this.steps[now - 1].jumps : [];
      before.forEach(function (path) {
        var fr = box.querySelector('.loop[data-path="' + path.join(".") + '"]');
        if (fr) { fr.classList.add("jump"); setTimeout(function () { fr.classList.remove("jump"); }, 700); }
      });
    }
  } else {
    var slots = this.q(".slots").children;
    for (var i = 0; i < slots.length; i++) {
      var d = slots[i], c = prog[i];
      d.className = "slot" + (c ? " full" : "") + (st && st.path[0] === i ? " now" : "");
      d.style.background = c ? CMD_COLORS[c] : "";
      d.style.color = c === "light" ? "#16193A" : "#fff";
      d.innerHTML = c ? icon(c, 26) + '<span class="n">' + (i + 1) + "</span>" : "";
      d.setAttribute("aria-label", c ? "Команда " + (i + 1) + ": " + LABELS[c] + " (прибрати)" : "Порожня клітинка " + (i + 1));
    }
  }
  this.q(".count").textContent = cells + "/" + lv.slots;
  var lines = B.codeLines(prog, this.codeLang), body = this.q(".code-body");
  if (!lines.length) {
    body.innerHTML = '<div class="ln empty">' + (this.codeLang === "uk" ? "# натискай команди внизу" : "# tap commands below") + "</div>";
  } else {
    body.innerHTML = lines.map(function (l, n) {
      var cur = st && l.kind === "cmd" && l.path.join(".") === st.path.join(".");
      return '<div class="ln' + (cur ? " now" : "") + '"><i>' + (n + 1) + "</i><span>" + esc(new Array(l.depth * 4 + 1).join(" ") + l.text) + "</span></div>";
    }).join("");
    var cur_ = body.querySelector(".now");
    if (cur_ && cur_.scrollIntoView) cur_.scrollIntoView({ block: "nearest" });
  }
};

P.renderDeck = function () {
  var box = this.q(".cmds");
  box.innerHTML = "";
  this.level.commands.forEach(function (c) {
    var b = document.createElement("button");
    b.className = "cmd" + (c === "light" ? " dark" : "");
    b.type = "button"; b.dataset.cmd = c;
    b.style.background = CMD_COLORS[c];
    b.innerHTML = icon(c, 28) + "<span>" + LABELS[c] + "</span>";
    box.appendChild(b);
  });
};

P.locked = function () { return this.running || this.busy || !!this.won; };

/* Buttons are inert while the program runs; ⟲ always works. */
P.syncUI = function () {
  var locked = this.locked(), empty = !B.size(this.program);
  [].forEach.call(this.root.querySelectorAll(".cmd,.slot,.tab,.chip,.times,.del"), function (b) { b.disabled = locked; });
  var rep = this.q('.cmd[data-cmd="repeat"]');
  if (rep && this.cursor.length >= this.level.nest) rep.disabled = true;   // loops nest only so deep
  this.q('[data-act="run"]').disabled = locked || empty;
  this.q('[data-act="step"]').disabled = locked || empty;
};

/* ----- editing: any change to the program behaves like ⟲ ----- */
P.edited = function () {
  this.steps = B.expand(this.program);
  this.resetRun(true);
};

/* Appends a command (or an empty loop, which then holds the cursor) to the container the cursor is in. */
P.addCmd = function (c) {
  if (this.locked()) return;
  var lv = this.level;
  if (B.size(this.program) >= lv.slots) {
    var cnt = this.q(".count");
    cnt.classList.remove("shake"); void cnt.offsetWidth; cnt.classList.add("shake");
    Sound.buzz();
    if (this.tree) this.say("Пам'ять заповнена!");
    return;
  }
  if (c === "repeat" && this.cursor.length >= lv.nest) return;
  Sound.click();
  var list = this.program;
  this.cursor.forEach(function (i) { list = list[i].body; });
  var idx = list.length;
  this.program = B.addItem(this.program, this.cursor, c === "repeat" ? { repeat: B.MIN_REPEAT, body: [] } : c);
  if (c === "repeat") this.cursor = this.cursor.concat(idx);
  this.edited();
};

P.removeAt = function (path) {
  if (this.locked() || !B.hasItem(this.program, path)) return;
  Sound.click();
  this.program = B.removeItem(this.program, path);
  this.cursor = B.fixCursor(this.program, B.shiftCursor(this.cursor, path));
  this.edited();
};

/* Tap on ×N: 2 → 3 → … → 9 → 2. */
P.cycleTimes = function (path) {
  if (this.locked()) return;
  var it = itemAt(this.program, path);
  Sound.click();
  this.program = B.setRepeat(this.program, path, it.repeat + 1 > B.MAX_REPEAT ? B.MIN_REPEAT : it.repeat + 1);
  this.edited();
};

P.setCursor = function (path) {
  if (this.locked()) return;
  this.cursor = path;
  this.renderProgram(this.curStep >= 0 ? this.curStep : undefined);
  this.syncUI();
};

/* ----- running ----- */
/* Puts Bit back on the start tile and clears the lit transistors; the program stays. */
P.resetRun = function (keepBubble) {
  this.runId++;
  this.running = this.busy = false;
  this.won = false;
  this.stepIdx = -1;
  this.state = B.initialState(this.level);
  this.removeWin();
  this.board.classList.remove("powered");
  this.placeBit(this.state);
  this.renderLit();
  if (!keepBubble) this.say(this.level.say);
  this.renderProgram();
  this.syncUI();
};

var BUMP_TEXT = {
  "bump-edge": "Далі нічого немає!",
  "bump-step": "Там сходинка — треба стрибнути!",
  "bump-flat": "Тут рівно, стрибати не треба. Йди вперед!",
  "bump-high": "Так високо я не дістану!",
  "no-target": "Тут немає транзистора."
};

/* Executes one command with animation; resolves false if the run was cancelled meanwhile. */
P.execOne = async function (i) {
  var id = this.runId, lv = this.level, cmd = this.steps[i].cmd;
  var r = B.step(lv, this.state, cmd), from = this.state, to = r.state, ev = r.event;
  this.curStep = i;
  this.renderProgram(i, true);
  if (i > 0 && this.steps[i - 1].jumps.length) Sound.pop();
  if (ev === "move" || ev === "jump") {
    await this.tween(from, to, ev === "jump" ? STEP_MS + 80 : STEP_MS, ev === "jump" ? 34 : 0);
  } else if (ev === "turn") {
    this.state = to; this.placeBit(to);
    this.bitG.classList.remove("hop"); void this.bitG.getBoundingClientRect(); this.bitG.classList.add("hop");
    await sleep(STEP_MS * 0.7);
  } else if (ev === "on" || ev === "off") {
    this.state = to; this.renderLit();
    if (ev === "on") Sound.ding(); else Sound.dark();
    await sleep(STEP_MS * 0.85);
  } else if (ev === "no-target" && this.tree) {
    Sound.click();
    this.say("Тут немає транзистора. Іду далі.");
    await sleep(STEP_MS * 0.45);
  } else {
    Sound.buzz();
    this.say(BUMP_TEXT[ev]);
    await this.shakeBit(from);
  }
  if (id !== this.runId) return false;
  this.state = to;
  this.placeBit(to);
  return true;
};

/* Slides (or arcs) Bit between two tiles. Timer-based so it also runs in a hidden tab. */
P.tween = function (from, to, ms, arc) {
  var self = this, lv = this.level;
  var a = this.isoAt(from.x, from.y), b = this.isoAt(to.x, to.y);
  this.zPlace(Math.max(this.vsum(from.x, from.y), this.vsum(to.x, to.y)));
  this.arrow.setAttribute("visibility", "hidden");
  var t0 = Date.now(), id = this.runId;
  return new Promise(function (resolve) {
    (function frame() {
      if (id !== self.runId) return resolve();   // ⟲ or an edit pressed mid-move: leave Bit where reset put him
      var k = Math.min(1, (Date.now() - t0) / ms), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      self.bitTransform(a.x + (b.x - a.x) * e, a.y + (b.y - a.y) * e - Math.sin(Math.PI * k) * arc);
      if (k < 1) setTimeout(frame, 16); else resolve();
    })();
  });
};

P.shakeBit = function (st) {
  var self = this, p = this.isoAt(st.x, st.y), t0 = Date.now(), ms = STEP_MS * 0.9, id = this.runId;
  return new Promise(function (resolve) {
    (function frame() {
      if (id !== self.runId) return resolve();
      var k = Math.min(1, (Date.now() - t0) / ms);
      self.bitTransform(p.x + Math.sin(k * Math.PI * 6) * 7 * (1 - k), p.y);
      if (k < 1) setTimeout(frame, 16); else { self.bitTransform(p.x, p.y); resolve(); }
    })();
  });
};

P.run = async function () {
  if (this.locked() || !B.size(this.program)) return;
  if (!this.steps.length) return this.say("У циклі нічого повторювати");
  Sound.unlock();
  this.resetRun(false);
  if (B.hasEmptyLoop(this.program)) this.say("У циклі нічого повторювати");
  var id = this.runId;
  this.running = true;
  this.syncUI();
  for (var i = 0; i < this.steps.length; i++) {
    if (!(await this.execOne(i)) || id !== this.runId) return;
    if (B.isWon(this.level, this.state)) { this.running = false; return this.win(); }
    await sleep(80);
    if (id !== this.runId) return;
  }
  this.running = false;
  this.lose();
};

P.stepOnce = async function () {
  if (this.locked() || !B.size(this.program)) return;
  if (!this.steps.length) return this.say("У циклі нічого повторювати");
  Sound.unlock();
  if (this.stepIdx < 0 || this.stepIdx >= this.steps.length) {
    this.resetRun(false); this.stepIdx = 0;
    if (B.hasEmptyLoop(this.program)) this.say("У циклі нічого повторювати");
  }
  var id = this.runId, i = this.stepIdx;
  this.busy = true;
  this.syncUI();
  var ok = await this.execOne(i);
  if (!ok || id !== this.runId) return;
  this.busy = false;
  this.stepIdx = i + 1;
  this.syncUI();
  if (B.isWon(this.level, this.state)) return this.win();
  if (this.stepIdx >= this.steps.length) { this.stepIdx = -1; this.lose(); }
};

P.lose = function () {
  this.fails++;
  this.curStep = -1;
  this.renderProgram();
  var left = this.level.targets.length - this.state.lit.length;
  this.say(left > 0 ? B.remainingText(left) : "Усі транзистори вже горять!");
  if (this.fails >= 2) this.q('[data-act="hint"]').hidden = false;
  this.syncUI();
};

P.win = function () {
  var self = this, lv = this.level, n = B.size(this.program);
  this.running = this.busy = false;
  this.won = true;
  this.curStep = -1;
  this.renderProgram();
  var stars = B.stars(lv, n, true), best = B.progress.record(lv.id, stars);
  Sound.win();
  this.board.classList.add("powered");
  this.say("Чип ожив!");
  this.syncUI();
  var next = this.index + 1 < this.ids.length;
  var card = document.createElement("div");
  card.className = "win";
  card.innerHTML = '<div class="win-card"><button class="win-x" data-act="close" type="button" aria-label="Закрити">✕</button><h3>Чип ожив! 🎉</h3><div class="win-stars">' +
    [1, 2, 3].map(function (k) { return k <= stars ? "★" : '<span class="off">★</span>'; }).join("") + "</div><p>" +
    (this.tree ? "Комірок: " + n + (n > lv.best ? ". Можна коротше: " + lv.best + "." : ". Найкоротша програма!")
               : "Команд: " + n + (n > lv.best ? ". Можна коротше: " + lv.best + "." : ". Найкоротший шлях!")) + "</p>" +
    '<button class="btn ghost" data-act="again" type="button">↺ Ще раз</button>' +
    '<button class="btn ghost" data-act="close" type="button">Закрити</button>' +
    (next ? '<button class="btn" data-act="next" type="button">Наступний рівень →</button>' : "") + "</div>";
  var id = this.runId;
  setTimeout(function () { if (self.won && self.runId === id) self.q(".field").appendChild(card); }, 900);
  this.renderTabs();
  this.syncUI();
  this.dispatchEvent(new CustomEvent("bitgame:win", { bubbles: true, composed: true, detail: { id: lv.id, stars: stars, best: best, program: JSON.parse(JSON.stringify(this.program)) } }));
  if (this.ids.every(function (x) { return B.progress.get(x) >= 1; })) {
    this.dispatchEvent(new CustomEvent("bitgame:solved-set", { bubbles: true, composed: true, detail: { ids: this.ids.slice() } }));
  }
};

/* Turns the board a quarter turn so tall blocks stop hiding what is behind them. */
P.rotate = function () {
  if (this.running || this.busy) return;
  Sound.pop();
  this.rot = ((this.rot || 0) + 1) % 4;
  this.buildBoard();
};

/* Cancels a running program (used when the host page leaves the slide mid-run). */
P.stop = function () {
  if (this.level && (this.running || this.busy)) this.resetRun(true);
};

/* Closes the «Чип ожив!» card: the lit board stays in view and levels/tabs work again. */
P.closeWin = function () {
  if (!this.won) return;
  this.removeWin();
  this.won = false;
  this.syncUI();
};

P.removeWin = function () {
  var w = this.root && this.q(".win");
  if (w) w.remove();
};

P.showHint = function () {
  var lv = this.level;
  if (lv.solution) {   // loops: the first lines of the reference solution
    var first = B.codeLines(lv.solution, this.codeLang).slice(0, 2).map(function (l) {
      var ico = l.kind === "open" ? "repeat" : itemAt(lv.solution, l.path);
      return '<span class="hint-chip">' + icon(ico, 14) + " " + esc(l.text) + "</span>";
    }).join(" ");
    return this.say("Почни так: " + first + " …а далі сам!", true);
  }
  var sol = this.hintCache || (this.hintCache = B.solve(this.level) || []), code = B.CODE[this.codeLang];
  var first = sol.slice(0, 2).map(function (c) {
    return '<span class="hint-chip">' + icon(c, 14) + " " + esc(code[c]) + "</span>";
  }).join(" ");
  this.say("Почни так: " + first + " …а далі сам!", true);
};

/* ----- wiring ----- */
P.wire = function () {
  var self = this;
  this.root.addEventListener("click", function (e) {
    if (e.target.classList && e.target.classList.contains("win")) return self.closeWin();   // tap on the dimmed backdrop
    var t = e.target.closest("button");
    if (!t) {   // a tap on a loop frame or on empty space of the program moves the caret there
      if (self.tree && !self.locked() && e.target.closest(".prog")) {
        var frame = e.target.closest(".loop");
        self.setCursor(frame ? frame.dataset.path.split(".").map(Number) : []);
      }
      return;
    }
    if (!self.root.contains(t) || t.disabled) return;
    Sound.unlock();
    if (t.dataset.cmd) return self.addCmd(t.dataset.cmd);
    if (t.classList.contains("slot")) return self.removeAt([+t.dataset.i]);
    if (t.classList.contains("chip") || t.classList.contains("del")) return self.removeAt(t.dataset.path.split(".").map(Number));
    if (t.classList.contains("times")) return self.cycleTimes(t.dataset.path.split(".").map(Number));
    if (t.classList.contains("tab")) { Sound.pop(); return self.loadLevel(+t.dataset.i); }
    if (t.classList.contains("lang")) {
      self.codeLang = self.codeLang === "uk" ? "en" : "uk";
      store.set("lang", self.codeLang);
      t.textContent = self.codeLang === "uk" ? "EN" : "УКР";
      return self.renderProgram(self.curStep >= 0 ? self.curStep : undefined);
    }
    switch (t.dataset.act) {
      case "run": return self.run();
      case "step": return self.stepOnce();
      case "reset": case "again": return self.resetRun(false);
      case "close": return self.closeWin();
      case "hint": return self.showHint();
      case "rotate": return self.rotate();
      case "next": Sound.pop(); return self.loadLevel(self.index + 1);
    }
  });
};

P.onKey = function (e) {
  if (e.key === "Backspace" && this.program && !this.locked() && B.size(this.program)) {
    e.preventDefault();
    var list = this.program;
    this.cursor.forEach(function (i) { list = list[i].body; });
    if (list.length) this.removeAt(this.cursor.concat(list.length - 1));
    else if (this.cursor.length) this.removeAt(this.cursor);   // an empty loop: Backspace takes the loop itself
  }
};

/* Mascot for host pages (e.g. game/index.html). */
B.bitSVG = function (cls) {
  return '<svg class="' + (cls || "bit") + '" viewBox="0 0 120 130" aria-hidden="true">' + bitInner() + "</svg>";
};

customElements.define("bit-game", BitGameElement);
})();
