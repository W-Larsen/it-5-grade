/* Біт-програміст — pure game logic (no DOM). Browser: window.BitGame. Node: module.exports. */
(function (root) {
"use strict";

var DIRS = ["N", "E", "S", "W"];
var DX = { N: 0, E: 1, S: 0, W: -1 };
var DY = { N: -1, E: 0, S: 1, W: 0 };
var COMMANDS = ["forward", "left", "right", "jump", "light"];
var MAX_SLOTS = 12;
var MAX_HEIGHT = 4;

var CODE = {
  uk: { forward: "вперед()", left: "ліворуч()", right: "праворуч()", jump: "стрибнути()", light: "увімкнути()" },
  en: { forward: "forward()", left: "turn_left()", right: "turn_right()", jump: "jump()", light: "switch_on()" }
};

var registry = {};
var order = [];

function fail(id, msg) { throw new Error("Level " + id + ": " + msg); }
function key(x, y) { return x + "," + y; }

function parseLevel(id, def) {
  var rows = def.map;
  if (!Array.isArray(rows) || !rows.length) fail(id, "map must be a non-empty array of rows");
  var cells = [], targets = [], w = 0;
  rows.forEach(function (row, y) {
    var tokens = String(row).trim().split(/\s+/);
    if (y === 0) w = tokens.length;
    else if (tokens.length !== w) fail(id, "row " + y + " has " + tokens.length + " cells, expected " + w);
    cells.push(tokens.map(function (tok, x) {
      if (tok === ".") return null;
      var m = /^([1-4])(t?)$/.exec(tok);
      if (!m) fail(id, "bad map token '" + tok + "' at " + x + "," + y);
      if (m[2]) targets.push({ x: x, y: y });
      return { h: +m[1], t: !!m[2] };
    }));
  });
  if (!targets.length) fail(id, "map needs at least one transistor (t)");

  var s = def.start || {};
  if (DIRS.indexOf(s.dir) < 0) fail(id, "start.dir must be one of N, E, S, W");
  if (!cells[s.y] || !cells[s.y][s.x]) fail(id, "start must be on a tile");

  var cmds = def.commands;
  if (!Array.isArray(cmds) || !cmds.length) fail(id, "commands must be a non-empty array");
  cmds.forEach(function (c) { if (COMMANDS.indexOf(c) < 0) fail(id, "unknown command '" + c + "'"); });

  if (!(def.slots >= 1 && def.slots <= MAX_SLOTS)) fail(id, "slots must be 1.." + MAX_SLOTS);
  if (!(def.best >= 1)) fail(id, "best must be >= 1");
  if (def.slots < def.best) fail(id, "slots (" + def.slots + ") < best (" + def.best + ")");

  return {
    id: id, title: def.title || "", say: def.say || "",
    w: w, h: rows.length, cells: cells,
    start: { x: s.x, y: s.y, dir: s.dir },
    commands: cmds.slice(), slots: def.slots, best: def.best, targets: targets
  };
}

function level(id, def) {
  var lv = parseLevel(id, def);
  if (!registry[id]) order.push(id);
  registry[id] = lv;
}
function getLevel(id) { return registry[id] || null; }
function levelIds() { return order.slice(); }

function initialState(lv) {
  return { x: lv.start.x, y: lv.start.y, dir: lv.start.dir, lit: [] };
}

function cellAt(lv, x, y) {
  return (y >= 0 && y < lv.h && x >= 0 && x < lv.w) ? lv.cells[y][x] : null;
}

function step(lv, st, cmd) {
  var next = { x: st.x, y: st.y, dir: st.dir, lit: st.lit.slice() };
  var event;
  var here = cellAt(lv, st.x, st.y);

  if (cmd === "left") {
    next.dir = DIRS[(DIRS.indexOf(st.dir) + 3) % 4]; event = "turn";
  } else if (cmd === "right") {
    next.dir = DIRS[(DIRS.indexOf(st.dir) + 1) % 4]; event = "turn";
  } else if (cmd === "forward" || cmd === "jump") {
    var nx = st.x + DX[st.dir], ny = st.y + DY[st.dir];
    var to = cellAt(lv, nx, ny);
    if (!to) event = "bump-edge";
    else if (cmd === "forward") {
      if (to.h === here.h) { next.x = nx; next.y = ny; event = "move"; } else event = "bump-step";
    } else if (to.h === here.h) event = "bump-flat";
    else if (to.h > here.h + 1) event = "bump-high";
    else { next.x = nx; next.y = ny; event = "jump"; }
  } else if (cmd === "light") {
    if (!here.t) event = "no-target";
    else {
      var k = key(st.x, st.y), i = next.lit.indexOf(k);
      if (i >= 0) { next.lit.splice(i, 1); event = "off"; }
      else { next.lit.push(k); next.lit.sort(); event = "on"; }
    }
  } else {
    throw new Error("Unknown command '" + cmd + "'");
  }
  return { state: next, event: event };
}

function isWon(lv, st) {
  return lv.targets.every(function (t) { return st.lit.indexOf(key(t.x, t.y)) >= 0; });
}

function run(lv, program) {
  var st = initialState(lv), trace = [];
  for (var i = 0; i < program.length; i++) {
    var r = step(lv, st, program[i]);
    st = r.state;
    trace.push({ cmd: program[i], event: r.event, state: st });
    if (isWon(lv, st)) break;
  }
  return { won: isWon(lv, st), trace: trace };
}

function stars(lv, length, won) {
  if (!won) return 0;
  if (length <= lv.best) return 3;
  if (length <= lv.best + 2) return 2;
  return 1;
}

function stateKey(st) { return st.x + "," + st.y + st.dir + "|" + st.lit.join(";"); }

/* Breadth-first search over (position, direction, lit set): shortest winning program or null. */
function solve(lv) {
  var start = initialState(lv);
  var seen = {}; seen[stateKey(start)] = true;
  var queue = [{ st: start, path: [] }];
  for (var head = 0; head < queue.length; head++) {
    var cur = queue[head];
    for (var i = 0; i < lv.commands.length; i++) {
      var c = lv.commands[i], r = step(lv, cur.st, c), k = stateKey(r.state);
      if (seen[k]) continue;
      seen[k] = true;
      var path = cur.path.concat(c);
      if (isWon(lv, r.state)) return path;
      queue.push({ st: r.state, path: path });
    }
  }
  return null;
}

function remainingText(n) {
  var m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return "Залишився ще " + n + " транзистор";
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return "Залишилось ще " + n + " транзистори";
  return "Залишилось ще " + n + " транзисторів";
}

/* Stars per level, stored as JSON {"2-01": 3, …} under bitgame:v1. Falls back to memory if storage is unusable. */
var STORAGE_KEY = "bitgame:v1";

function createProgress(storage) {
  var data = {};
  try {
    var parsed = JSON.parse(storage.getItem(STORAGE_KEY));
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) data = parsed;
  } catch (e) { /* no storage, or corrupted: start empty */ }

  function save() {
    try { storage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) { /* memory only */ }
  }
  function get(id) { return data[id] || 0; }
  return {
    get: get,
    record: function (id, n) {
      if (n > get(id)) { data[id] = n; save(); }
      return get(id);
    },
    total: function (ids) {
      return ids.reduce(function (sum, id) { return sum + get(id); }, 0);
    },
    clear: function (ids) {
      ids.forEach(function (id) { delete data[id]; });
      save();
    }
  };
}

function browserStorage() {
  try { return root.localStorage || null; } catch (e) { return null; }
}

/* ---------- camera: the board is drawn isometrically and can be turned in quarter turns ---------- */
var ISO = { HW: 48, HH: 24, HZ: 18 };   // half tile width, half tile height, pixels per height unit

/* Where logical cell (x, y) lands when the board is turned `rot` quarter turns clockwise. */
function viewPos(lv, rot, x, y) {
  if (rot === 1) return { x: lv.h - 1 - y, y: x };
  if (rot === 2) return { x: lv.w - 1 - x, y: lv.h - 1 - y };
  if (rot === 3) return { x: y, y: lv.w - 1 - x };
  return { x: x, y: y };
}
function viewSize(lv, rot) { return rot % 2 ? { w: lv.h, h: lv.w } : { w: lv.w, h: lv.h }; }
function viewDir(rot, dir) { return DIRS[(DIRS.indexOf(dir) + rot) % 4]; }

/* Is screen point (px, py) inside the silhouette (top face + two sides) of tile `d`? */
function inSilhouette(d, px, py) {
  var dx = Math.abs(px - d.sx);
  if (dx > ISO.HW) return false;
  var top = d.sy - ISO.HH + dx / ISO.HW * ISO.HH, bottom = d.sy + ISO.HH + d.h * ISO.HZ - dx / ISO.HW * ISO.HH;
  return py >= top && py <= bottom;
}

/* Tiles as seen after `rot` turns, with the screen position of each top face. */
function seenTiles(lv, rot) {
  var tiles = [];
  for (var y = 0; y < lv.h; y++) for (var x = 0; x < lv.w; x++) {
    var cell = lv.cells[y][x];
    if (!cell) continue;
    var v = viewPos(lv, rot, x, y);
    tiles.push({
      sum: v.x + v.y, h: cell.h, t: cell.t, start: x === lv.start.x && y === lv.start.y,
      sx: (v.x - v.y) * ISO.HW, sy: (v.x + v.y) * ISO.HH - cell.h * ISO.HZ
    });
  }
  return tiles;
}

/* Five sample points on a tile's top face: how many of them are covered by a tile nearer the camera. */
var SAMPLES = [[0, 0], [-ISO.HW / 2, 0], [ISO.HW / 2, 0], [0, -ISO.HH / 2], [0, ISO.HH / 2]];
function hiddenSamples(tiles, c) {
  return SAMPLES.filter(function (o) {
    return tiles.some(function (d) { return d.sum > c.sum && inSilhouette(d, c.sx + o[0], c.sy + o[1]); });
  }).length;
}

/* Weighted amount of important tiles (transistors, start) and ordinary tiles that taller tiles hide. */
function occlusionBy(lv, rot, weigh) {
  var tiles = seenTiles(lv, rot);
  return tiles.reduce(function (sum, c) { return sum + weigh(c) * hiddenSamples(tiles, c); }, 0);
}
function occlusion(lv, rot) { return occlusionBy(lv, rot, function (c) { return c.t ? 10 : c.start ? 5 : 1; }); }
function hiddenTargets(lv, rot) { return occlusionBy(lv, rot, function (c) { return c.t ? 1 : 0; }); }

/* The turn (0–3) that hides the least; keeps 0 when it is already as good as any. */
function bestRotation(lv) {
  var best = 0, bestScore = occlusion(lv, 0);
  for (var r = 1; r < 4; r++) {
    var s = occlusion(lv, r);
    if (s < bestScore) { best = r; bestScore = s; }
  }
  return best;
}

var BitGame = root.BitGame || {};
BitGame.ISO = ISO;
BitGame.viewPos = viewPos;
BitGame.viewSize = viewSize;
BitGame.viewDir = viewDir;
BitGame.occlusion = occlusion;
BitGame.hiddenTargets = hiddenTargets;
BitGame.bestRotation = bestRotation;
BitGame.keyOf = key;
BitGame.createProgress = createProgress;
BitGame.progress = createProgress(browserStorage());
BitGame.COMMANDS = COMMANDS;
BitGame.CODE = CODE;
BitGame.level = level;
BitGame.getLevel = getLevel;
BitGame.levelIds = levelIds;
BitGame.parseLevel = parseLevel;
BitGame.initialState = initialState;
BitGame.step = step;
BitGame.isWon = isWon;
BitGame.run = run;
BitGame.stars = stars;
BitGame.solve = solve;
BitGame.remainingText = remainingText;
root.BitGame = BitGame;
if (typeof module !== "undefined" && module.exports) module.exports = BitGame;
})(typeof window !== "undefined" ? window : globalThis);
