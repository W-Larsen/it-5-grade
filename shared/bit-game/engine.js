/* Біт-програміст — pure game logic (no DOM). Browser: window.BitGame. Node: module.exports. */
(function (root) {
"use strict";

var DIRS = ["N", "E", "S", "W"];
var DX = { N: 0, E: 1, S: 0, W: -1 };
var DY = { N: -1, E: 0, S: 1, W: 0 };
var COMMANDS = ["forward", "left", "right", "jump", "light"];
var MAX_SLOTS = 12;
var MAX_HEIGHT = 4;
var MIN_REPEAT = 2;
var MAX_REPEAT = 9;

var CODE = {
  uk: { forward: "вперед()", left: "ліворуч()", right: "праворуч()", jump: "стрибнути()", light: "увімкнути()", repeat: "повтори" },
  en: { forward: "forward()", left: "turn_left()", right: "turn_right()", jump: "jump()", light: "switch_on()", repeat: "repeat" }
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

/* ---------- programs with loops ----------
   Program = Item[]; Item = command string | { repeat: N, body: Program }.
   Path = indices from the top; a cursor is the path of the container new items go into ([] = top level, [i] = body of loop i). */
function isLoop(item) { return !!item && typeof item === "object" && !Array.isArray(item); }

function size(program) {
  return program.reduce(function (sum, it) { return sum + (isLoop(it) ? 1 + size(it.body) : 1); }, 0);
}

function depth(program) {
  return program.reduce(function (d, it) { return Math.max(d, isLoop(it) ? 1 + depth(it.body) : 0); }, 0);
}

function hasEmptyLoop(program) {
  return program.some(function (it) { return isLoop(it) && (!it.body.length || hasEmptyLoop(it.body)); });
}

/* Unrolls loops into the flat list of steps the game animates.
   laps: every loop around the step with its current lap; jumps: loops that jump back to their first command right after it. */
function expand(program) {
  var out = [];
  (function walk(items, prefix, laps) {
    items.forEach(function (it, i) {
      var path = prefix.concat(i);
      if (!isLoop(it)) { out.push({ cmd: it, path: path, laps: laps, jumps: [] }); return; }
      for (var lap = 1; lap <= it.repeat; lap++) {
        var before = out.length;
        walk(it.body, path, laps.concat({ path: path, lap: lap, of: it.repeat }));
        if (lap < it.repeat && out.length > before) out[out.length - 1].jumps.push(path);
      }
    });
  })(program, [], []);
  return out;
}

function codeLines(program, lang) {
  var code = CODE[lang], lines = [];
  (function walk(items, prefix, d) {
    items.forEach(function (it, i) {
      var path = prefix.concat(i);
      if (!isLoop(it)) { lines.push({ text: code[it], depth: d, path: path, kind: "cmd" }); return; }
      lines.push({ text: code.repeat + "(" + it.repeat + ") {", depth: d, path: path, kind: "open" });
      walk(it.body, path, d + 1);
      lines.push({ text: "}", depth: d, path: path, kind: "close" });
    });
  })(program, [], 0);
  return lines;
}

function validateProgram(program, nest, commands) {
  (function walk(items, d) {
    if (!Array.isArray(items)) throw new Error("program must be an array");
    items.forEach(function (it) {
      if (!isLoop(it)) {
        if (COMMANDS.indexOf(it) < 0 || commands.indexOf(it) < 0) throw new Error("command '" + it + "' is not allowed here");
        return;
      }
      if (commands.indexOf("repeat") < 0) throw new Error("loops are not allowed here");
      if (!(it.repeat % 1 === 0 && it.repeat >= MIN_REPEAT && it.repeat <= MAX_REPEAT)) throw new Error("repeat must be " + MIN_REPEAT + ".." + MAX_REPEAT);
      if (d + 1 > nest) throw new Error("loops nested deeper than " + nest);
      walk(it.body, d + 1);
    });
  })(program, 0);
}

function clone(program) { return JSON.parse(JSON.stringify(program)); }
function containerAt(program, path) {
  var list = program;
  path.forEach(function (i) { list = list[i].body; });
  return list;
}

function addItem(program, cursor, item) {
  var next = clone(program);
  containerAt(next, cursor).push(item);
  return next;
}

function removeItem(program, path) {
  var next = clone(program);
  containerAt(next, path.slice(0, -1)).splice(path[path.length - 1], 1);
  return next;
}

function setRepeat(program, path, n) {
  var next = clone(program);
  containerAt(next, path.slice(0, -1))[path[path.length - 1]].repeat = n;
  return next;
}

/* The longest part of the cursor that still leads to a loop (after something was removed). */
function fixCursor(program, cursor) {
  var list = program, fixed = [];
  for (var k = 0; k < cursor.length; k++) {
    var it = list[cursor[k]];
    if (!isLoop(it)) break;
    fixed.push(cursor[k]);
    list = it.body;
  }
  return fixed;
}

/* A stretch of ≥ 2 commands that repeats ≥ 2 times in a row: most covered, then longest, then earliest. */
function findRepeat(cmds) {
  var best = null, bestCover = 0;
  for (var len = 2; len * 2 <= cmds.length; len++) {
    for (var start = 0; start + len * 2 <= cmds.length; start++) {
      var times = 1;
      while (start + (times + 1) * len <= cmds.length && same(start, start + times * len, len)) times++;
      if (times < 2) continue;
      var cover = len * times;
      if (cover > bestCover || (cover === bestCover && len > best.len)) { best = { start: start, len: len, times: times }; bestCover = cover; }
    }
  }
  return best;
  function same(a, b, n) {
    for (var i = 0; i < n; i++) if (cmds[a + i] !== cmds[b + i]) return false;
    return true;
  }
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
BitGame.MIN_REPEAT = MIN_REPEAT;
BitGame.MAX_REPEAT = MAX_REPEAT;
BitGame.size = size;
BitGame.depth = depth;
BitGame.hasEmptyLoop = hasEmptyLoop;
BitGame.expand = expand;
BitGame.codeLines = codeLines;
BitGame.validateProgram = validateProgram;
BitGame.addItem = addItem;
BitGame.removeItem = removeItem;
BitGame.setRepeat = setRepeat;
BitGame.fixCursor = fixCursor;
BitGame.findRepeat = findRepeat;
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
