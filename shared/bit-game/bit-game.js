/* <bit-game levels="2-01,2-02" lang="uk"> — Біт-програміст.
   Needs engine.js and a levels-*.js loaded first. Shadow DOM; colours/fonts come from page CSS variables with fallbacks. */
(function () {
"use strict";
if (!window.customElements || !window.BitGame) return;
var B = window.BitGame;
var NS = "http://www.w3.org/2000/svg";

/* ---------- isometric geometry ---------- */
var HW = 48, HH = 24, HZ = 22;                 // half tile width, half tile height, pixels per height unit
var TOP_COLORS = ["#6FE3B8", "#52CFD0", "#4AA8E8", "#8A82FF"];   // by height 1..4
var DIR_VEC = { N: [HW, -HH], E: [HW, HH], S: [-HW, HH], W: [-HW, -HH] };   // screen step for one cell

function shade(hex, k) {
  var n = parseInt(hex.slice(1), 16);
  var r = Math.round(((n >> 16) & 255) * k), g = Math.round(((n >> 8) & 255) * k), b = Math.round((n & 255) * k);
  return "rgb(" + r + "," + g + "," + b + ")";
}
function iso(x, y, h) { return { x: (x - y) * HW, y: (x + y) * HH - h * HZ }; }
function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
function el(tag, attrs, parent) {
  var n = document.createElementNS(NS, tag);
  for (var k in attrs) n.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(n);
  return n;
}

/* ---------- command icons (24×24, stroke) ---------- */
var ICONS = {
  forward: '<path d="M12 20V5M5 11l7-7 7 7"/>',
  left: '<path d="M9 4L4 9l5 5"/><path d="M4 9h9a6 6 0 0 1 0 12h-3"/>',
  right: '<path d="M15 4l5 5-5 5"/><path d="M20 9h-9a6 6 0 0 0 0 12h3"/>',
  jump: '<path d="M3 19C5 7 14 5 18 12"/><path d="M13 12h6v-6"/>',
  light: '<path d="M13 2L5 14h6l-1 8 8-12h-6z"/>'
};
var LABELS = { forward: "вперед", left: "ліворуч", right: "праворуч", jump: "стрибок", light: "увімкнути" };
var CMD_COLORS = { forward: "#2F80ED", left: "#7A5CFA", right: "#7A5CFA", jump: "#E5487B", light: "#FFC93C" };
function icon(cmd, size) {
  return '<svg viewBox="0 0 24 24" width="' + size + '" height="' + size + '" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONS[cmd] + '</svg>';
}

/* ---------- Біт (same drawing as lesson 1) ---------- */
function bitInner() {
  return '<ellipse cx="60" cy="124" rx="32" ry="5" fill="rgba(22,25,58,.25)"/>' +
    '<g class="bit-body">' +
      '<line x1="60" y1="31" x2="60" y2="14" stroke="#16193A" stroke-width="4" stroke-linecap="round"/>' +
      '<circle cx="60" cy="11" r="7" fill="#FFC93C" stroke="#16193A" stroke-width="3"/>' +
      '<rect x="40" y="104" width="13" height="16" rx="5" fill="#16193A"/><rect x="67" y="104" width="13" height="16" rx="5" fill="#16193A"/>' +
      '<rect x="15" y="30" width="90" height="80" rx="20" fill="#FF8A3D" stroke="#16193A" stroke-width="4"/>' +
      '<path d="M53 32h14v18l-7-4-7 4z" fill="#FFD7B5" stroke="#16193A" stroke-width="2.5" stroke-linejoin="round"/>' +
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
    '</g>';
}
var PUPIL_SHIFT = { N: [0, -4], E: [5, 1], S: [0, 4], W: [-5, 1] };

/* ---------- styles ---------- */
var CSS = [
":host{display:block;position:relative;width:100%;height:100%;min-height:540px;color:var(--ink,#16193A);font-family:var(--f-body,'Nunito','Segoe UI',system-ui,sans-serif);-webkit-tap-highlight-color:transparent;touch-action:manipulation;outline:none}",
"*{box-sizing:border-box}",
"button{font-family:inherit;color:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation}",
"button:focus-visible{outline:3px solid #2F80ED;outline-offset:3px}",
".root{position:absolute;inset:0;display:grid;grid-template-columns:minmax(0,1fr) 300px;grid-template-rows:auto minmax(0,1fr) auto;gap:10px 14px}",
".tabs{grid-column:1/-1;display:flex;align-items:center;gap:10px;min-height:48px}",
".tab{position:relative;width:48px;height:48px;border-radius:50%;border:3px solid var(--ink,#16193A);background:var(--paper,#fff);font:800 20px/1 var(--f-display,'Unbounded',sans-serif);box-shadow:0 4px 0 var(--ink,#16193A);display:grid;place-items:center;padding:0}",
".tab.on{background:var(--sun,#FFC93C)}",
".tab:active{transform:translateY(3px);box-shadow:0 1px 0 var(--ink,#16193A)}",
".tab .st{position:absolute;bottom:-17px;left:50%;transform:translateX(-50%);font:800 12px/1 var(--f-body,sans-serif);letter-spacing:1px;color:#B07A00;white-space:nowrap;pointer-events:none}",
".tab[disabled]{opacity:.5;cursor:default}",
".ttl{font:800 clamp(15px,2.2vw,20px)/1.2 var(--f-display,'Unbounded',sans-serif);margin-left:6px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
".lang{margin-left:auto}",
".field{grid-column:1;grid-row:2;position:relative;overflow:hidden;border:3px solid var(--ink,#16193A);border-radius:24px;box-shadow:5px 5px 0 var(--ink,#16193A);background:radial-gradient(circle at 30% 20%,#1E5A7A 0%,#0F3550 60%,#0A2740 100%)}",
".field::before{content:'';position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,.07) 2px,transparent 2.5px);background-size:28px 28px;pointer-events:none}",
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
".bit-pupils{transition:transform .2s}",
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
".ln.empty{color:#6F7DB8}",
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
  this._ready = true;
  this.setup();
};
P.attributeChangedCallback = function () { if (this._ready) this.setup(); };

P.setup = function () {
  var ids = (this.getAttribute("levels") || "").split(",").map(function (s) { return s.trim(); }).filter(Boolean);
  this.ids = ids;
  this.codeLang = this.getAttribute("lang") === "en" ? "en" : "uk";
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
    '<div class="field"><svg class="board" aria-hidden="true"></svg><div class="bubble"></div></div>' +
    '<aside class="side">' +
      '<div class="panel"><div class="prog-head"><span>ПРОГРАМА</span><span class="count"></span></div><div class="slots"></div></div>' +
      '<div class="panel code"><div class="code-head"><span>КОД</span><button class="btn small ghost lang" type="button"></button></div><div class="code-body"></div></div>' +
    '</aside>' +
    '<div class="deck"><div class="cmds"></div><div class="ctl">' +
      '<button class="btn" data-act="run" type="button">▶ Запуск</button>' +
      '<button class="btn ghost" data-act="step" type="button">⏭ Крок</button>' +
      '<button class="btn ghost" data-act="reset" type="button" aria-label="Спочатку">⟲</button>' +
    '</div></div>';
  this.shadowRoot.appendChild(root);
  this.q = function (sel) { return root.querySelector(sel); };
  this.board = this.q(".board");
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
  this.index = i;
  this.level = B.getLevel(this.ids[i]);
  this.state = B.initialState(this.level);
  this.program = [];
  this.renderTabs();
  this.buildBoard();
  this.renderSide();
  this.renderDeck();
  this.say(this.level.say);
};

P.say = function (text) {
  var b = this.q(".bubble");
  b.textContent = text || "";
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
    var p = iso(x, y, c.h);
    minX = Math.min(minX, p.x - HW); maxX = Math.max(maxX, p.x + HW);
    minY = Math.min(minY, p.y - HH - 95); maxY = Math.max(maxY, p.y + HH + c.h * HZ);
    order.push({ x: x, y: y, c: c, p: p });
  }
  var pad = 36;
  svg.setAttribute("viewBox", [minX - pad, minY - pad, maxX - minX + pad * 2, maxY - minY + pad * 2].join(" "));
  order.sort(function (a, b) { return (a.x + a.y) - (b.x + b.y) || a.c.h - b.c.h; });

  var layer = this.tileLayer = el("g", { "class": "tiles" }, svg);
  this.tileEls = {};
  order.forEach(function (o) {
    var g = el("g", { transform: "translate(" + o.p.x + " " + o.p.y + ")", "class": "tile", "data-sum": o.x + o.y }, layer);
    g.innerHTML = tileMarkup(o.x, o.y, o.c);
    this.tileEls[B.keyOf(o.x, o.y)] = g;
  }, this);

  this.bitG = el("g", { "class": "bit" }, svg);
  this.bitG.innerHTML = bitInner();
  this.arrow = el("path", { "class": "arrow", fill: "#16193A", opacity: ".85" }, svg);
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
P.placeBit = function (st, at) {
  var c = this.level.cells[st.y][st.x], p = iso(st.x, st.y, c.h);
  var px = at ? at.x : p.x, py = (at ? at.y : p.y) + 6;
  this.bitG.setAttribute("transform", "translate(" + px + " " + py + ") scale(.62) translate(-60 -124)");
  var pup = PUPIL_SHIFT[st.dir];
  this.bitG.querySelector(".bit-pupils").setAttribute("transform", "translate(" + pup[0] + " " + pup[1] + ")");
  var v = DIR_VEC[st.dir], len = Math.sqrt(v[0] * v[0] + v[1] * v[1]), ux = v[0] / len, uy = v[1] / len, qx = -uy, qy = ux;
  var cx = p.x + ux * 20, cy = p.y + uy * 10 + 2;
  this.arrow.setAttribute("d", "M" + (cx + ux * 22) + " " + (cy + uy * 11) + "L" + (cx + qx * 10) + " " + (cy + qy * 5) + "L" + (cx - qx * 10) + " " + (cy - qy * 5) + "Z");
  this.zPlace(st.x + st.y);
};

/* Draw Bit after every tile that is behind or level with him. */
P.zPlace = function (sum) {
  var layer = this.tileLayer, last = null;
  for (var n = layer.firstChild; n; n = n.nextSibling) {
    if (+n.getAttribute("data-sum") <= sum) last = n;
  }
  var ref = last ? last.nextSibling : layer.firstChild;
  layer.insertBefore(this.arrow, ref);
  layer.insertBefore(this.bitG, ref);
};

/* ----- side panel and deck (static for now) ----- */
P.renderSide = function () {
  var lv = this.level, slots = this.q(".slots");
  slots.innerHTML = "";
  for (var i = 0; i < lv.slots; i++) {
    var d = document.createElement("button");
    d.className = "slot"; d.type = "button"; d.setAttribute("aria-label", "Клітинка " + (i + 1));
    slots.appendChild(d);
  }
  this.q(".count").textContent = "0/" + lv.slots;
  this.q(".lang").textContent = this.codeLang === "uk" ? "EN" : "УКР";
  this.renderCode();
};

P.renderCode = function () {
  var body = this.q(".code-body");
  body.innerHTML = '<div class="ln empty">' + (this.codeLang === "uk" ? "# натискай команди внизу" : "# tap commands below") + "</div>";
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

customElements.define("bit-game", BitGameElement);
})();
