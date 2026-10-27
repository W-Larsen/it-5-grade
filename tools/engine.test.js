"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const BitGame = require("../shared/bit-game/engine.js");

const ALL = ["forward", "left", "right", "jump", "light"];
const def = (over) => Object.assign({
  title: "T", map: ["1 1 2t", ". 1 3"], start: { x: 0, y: 0, dir: "E" },
  commands: ALL, slots: 8, best: 3
}, over);
const L = BitGame.parseLevel("t", def());
const at = (x, y, dir, lit) => ({ x, y, dir, lit: lit || [] });

test("parseLevel reads size, heights, transistors and targets", () => {
  assert.equal(L.w, 3);
  assert.equal(L.h, 2);
  assert.deepEqual(L.cells[0][2], { h: 2, t: true });
  assert.equal(L.cells[1][0], null);
  assert.deepEqual(L.targets, [{ x: 2, y: 0 }]);
});

test("parseLevel rejects invalid definitions", () => {
  const bad = (over) => assert.throws(() => BitGame.parseLevel("b", def(over)));
  bad({ map: ["1 1", "1"] });
  bad({ map: ["1 x 2t"] });
  bad({ map: [". 1 2t"] });
  bad({ map: ["1 1 2"] });
  bad({ slots: 13 });
  bad({ slots: 2, best: 3 });
  bad({ commands: ["fly"] });
  bad({ start: { x: 0, y: 0, dir: "Q" } });
});

test("step forward moves onto a tile of the same height", () => {
  const before = at(0, 0, "E");
  const r = BitGame.step(L, before, "forward");
  assert.equal(r.event, "move");
  assert.equal(r.state.x, 1);
  assert.equal(before.x, 0, "input state is not mutated");
});

test("step forward bumps into a step, then jump climbs it", () => {
  assert.equal(BitGame.step(L, at(1, 0, "E"), "forward").event, "bump-step");
  assert.equal(BitGame.step(L, at(1, 0, "E"), "forward").state.x, 1);
  const j = BitGame.step(L, at(1, 0, "E"), "jump");
  assert.equal(j.event, "jump");
  assert.equal(j.state.x, 2);
});

test("step jump bumps when the tile is more than one higher", () => {
  assert.equal(BitGame.step(L, at(1, 1, "E"), "jump").event, "bump-high");
});

test("step bumps at the map edge and at empty cells", () => {
  assert.equal(BitGame.step(L, at(0, 0, "N"), "forward").event, "bump-edge");
  assert.equal(BitGame.step(L, at(0, 0, "S"), "forward").event, "bump-edge");
});

test("step forward moves south along y", () => {
  const r = BitGame.step(L, at(1, 0, "S"), "forward");
  assert.equal(r.event, "move");
  assert.equal(r.state.y, 1);
});

test("step jump down any height works", () => {
  const lv = BitGame.parseLevel("d", def({ map: ["3 1t"], best: 2 }));
  const r = BitGame.step(lv, at(0, 0, "E"), "jump");
  assert.equal(r.event, "jump");
  assert.equal(r.state.x, 1);
});

test("turning rotates counter-clockwise for left and clockwise for right", () => {
  assert.equal(BitGame.step(L, at(0, 0, "N"), "left").state.dir, "W");
  assert.equal(BitGame.step(L, at(0, 0, "W"), "right").state.dir, "N");
  assert.equal(BitGame.step(L, at(0, 0, "N"), "right").state.dir, "E");
});

test("light toggles a transistor and reports no-target elsewhere", () => {
  const on = BitGame.step(L, at(2, 0, "E"), "light");
  assert.equal(on.event, "on");
  assert.deepEqual(on.state.lit, ["2,0"]);
  const off = BitGame.step(L, on.state, "light");
  assert.equal(off.event, "off");
  assert.deepEqual(off.state.lit, []);
  assert.equal(BitGame.step(L, at(0, 0, "E"), "light").event, "no-target");
});

test("run stops right after the winning step", () => {
  const r = BitGame.run(L, ["forward", "jump", "light", "forward"]);
  assert.equal(r.won, true);
  assert.equal(r.trace.length, 3);
});

test("run reports a loss when transistors stay dark", () => {
  assert.equal(BitGame.run(L, ["forward"]).won, false);
});

test("stars grade program length against best", () => {
  assert.equal(BitGame.stars(L, 3, true), 3);
  assert.equal(BitGame.stars(L, 5, true), 2);
  assert.equal(BitGame.stars(L, 6, true), 1);
  assert.equal(BitGame.stars(L, 3, false), 0);
});

test("solve finds the shortest program, or null when unreachable", () => {
  assert.deepEqual(BitGame.solve(L), ["forward", "jump", "light"]);
  const u = BitGame.parseLevel("u", def({ map: ["1 3t"], slots: 4, best: 1 }));
  assert.equal(BitGame.solve(u), null);
});

test("level registry stores levels in registration order", () => {
  BitGame.level("reg-1", def());
  BitGame.level("reg-2", def());
  assert.equal(BitGame.getLevel("reg-1").id, "reg-1");
  assert.equal(BitGame.getLevel("nope"), null);
  const ids = BitGame.levelIds();
  assert.ok(ids.indexOf("reg-1") < ids.indexOf("reg-2"));
});

test("CODE has ukrainian and english names for every command", () => {
  assert.equal(BitGame.CODE.uk.light, "увімкнути()");
  assert.equal(BitGame.CODE.en.left, "turn_left()");
  ALL.forEach((c) => {
    assert.ok(BitGame.CODE.uk[c]);
    assert.ok(BitGame.CODE.en[c]);
  });
});

test("remainingText declines the noun correctly", () => {
  assert.equal(BitGame.remainingText(1), "Залишився ще 1 транзистор");
  assert.equal(BitGame.remainingText(2), "Залишилось ще 2 транзистори");
  assert.equal(BitGame.remainingText(5), "Залишилось ще 5 транзисторів");
  assert.equal(BitGame.remainingText(11), "Залишилось ще 11 транзисторів");
  assert.equal(BitGame.remainingText(21), "Залишився ще 21 транзистор");
  assert.equal(BitGame.remainingText(22), "Залишилось ще 22 транзистори");
});

/* ---------- progress ---------- */
const memStorage = () => {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)); },
    removeItem: (k) => { m.delete(k); }
  };
};
const throwingStorage = () => {
  const boom = () => { throw new Error("denied"); };
  return { getItem: boom, setItem: boom, removeItem: boom };
};

test("progress keeps the best star count only", () => {
  const p = BitGame.createProgress(memStorage());
  assert.equal(p.get("2-01"), 0);
  assert.equal(p.record("2-01", 2), 2);
  assert.equal(p.record("2-01", 1), 2);
  assert.equal(p.record("2-01", 3), 3);
  assert.equal(p.get("2-01"), 3);
});

test("progress total sums stars over the given ids", () => {
  const p = BitGame.createProgress(memStorage());
  p.record("2-01", 3);
  p.record("2-02", 2);
  assert.equal(p.total(["2-01", "2-02", "2-03"]), 5);
});

test("progress clear removes only the given ids", () => {
  const p = BitGame.createProgress(memStorage());
  p.record("2-01", 3);
  p.record("2-02", 2);
  p.clear(["2-01"]);
  assert.equal(p.get("2-01"), 0);
  assert.equal(p.get("2-02"), 2);
});

test("progress persists across instances on the same storage", () => {
  const s = memStorage();
  BitGame.createProgress(s).record("2-01", 3);
  assert.equal(BitGame.createProgress(s).get("2-01"), 3);
  assert.ok(JSON.parse(s.getItem("bitgame:v1"))["2-01"] === 3);
});

test("progress works in memory when storage throws or is missing", () => {
  [throwingStorage(), null].forEach((s) => {
    const p = BitGame.createProgress(s);
    assert.equal(p.get("2-01"), 0);
    assert.equal(p.record("2-01", 2), 2);
    assert.equal(p.get("2-01"), 2);
    p.clear(["2-01"]);
    assert.equal(p.get("2-01"), 0);
  });
});

test("progress ignores corrupted stored data", () => {
  const s = memStorage();
  s.setItem("bitgame:v1", "{not json");
  assert.equal(BitGame.createProgress(s).get("2-01"), 0);
  s.setItem("bitgame:v1", "[1,2]");
  assert.equal(BitGame.createProgress(s).get("2-01"), 0);
});

test("keyOf builds the lit-set key", () => {
  assert.equal(BitGame.keyOf(2, 0), "2,0");
});

test("jump onto a tile of the same height is bump-flat, not bump-step", () => {
  const r = BitGame.step(L, at(0, 0, "E"), "jump");
  assert.equal(r.event, "bump-flat");
  assert.equal(r.state.x, 0);
  assert.equal(BitGame.step(L, at(1, 0, "E"), "forward").event, "bump-step");
});

/* ---------- camera: rotating the isometric view ---------- */
test("viewPos rotates grid cells in quarter turns and viewSize swaps w and h", () => {
  // L is 3 wide, 2 high; the transistor is at (2,0)
  assert.deepEqual(BitGame.viewPos(L, 0, 2, 0), { x: 2, y: 0 });
  assert.deepEqual(BitGame.viewPos(L, 1, 2, 0), { x: 1, y: 2 });
  assert.deepEqual(BitGame.viewPos(L, 2, 2, 0), { x: 0, y: 1 });
  assert.deepEqual(BitGame.viewPos(L, 3, 2, 0), { x: 0, y: 0 });
  assert.deepEqual(BitGame.viewSize(L, 1), { w: 2, h: 3 });
  assert.deepEqual(BitGame.viewSize(L, 2), { w: 3, h: 2 });
});

test("viewDir turns the facing together with the view", () => {
  assert.equal(BitGame.viewDir(1, "E"), "S");
  assert.equal(BitGame.viewDir(1, "N"), "E");
  assert.equal(BitGame.viewDir(2, "E"), "W");
  assert.equal(BitGame.viewDir(3, "E"), "N");
  assert.equal(BitGame.viewDir(0, "W"), "W");
});

test("a tall block in front hides the transistor behind it; bestRotation avoids that", () => {
  const hid = BitGame.parseLevel("hid", def({ map: ["1t .", ". 4"], best: 1, slots: 4 }));
  assert.ok(BitGame.occlusion(hid, 0) > 0, "rotation 0 hides the transistor");
  assert.equal(BitGame.occlusion(hid, 2), 0, "seen from the other side nothing is hidden");
  const r = BitGame.bestRotation(hid);
  assert.notEqual(r, 0);
  assert.equal(BitGame.occlusion(hid, r), 0);
});

test("bestRotation keeps rotation 0 when nothing is hidden", () => {
  const flat = BitGame.parseLevel("flat", def({ map: ["1 1 1t", "1 1 1"], best: 3, slots: 5 }));
  assert.equal(BitGame.occlusion(flat, 0), 0);
  assert.equal(BitGame.bestRotation(flat), 0);
});

test("every shipped level has a view in which transistors stay in sight", () => {
  // a transistor chip stands up out of its tile, so up to 2 of 5 hidden sample points still leave it visible
  globalThis.BitGame = BitGame;
  require("../shared/bit-game/levels-02.js");
  BitGame.levelIds().filter((id) => /^2-/.test(id)).forEach((id) => {
    const lv = BitGame.getLevel(id);
    assert.ok(BitGame.hiddenTargets(lv, BitGame.bestRotation(lv)) <= 2, id + " hides a transistor");
  });
});

/* ---------- loops: program trees ---------- */
const loop = (n, ...body) => ({ repeat: n, body });

test("size counts a loop as one cell plus its body", () => {
  assert.equal(BitGame.size([]), 0);
  assert.equal(BitGame.size(["forward", "light"]), 2);
  assert.equal(BitGame.size([loop(4, loop(3, "forward"), "right", "light")]), 5);
});

test("depth of flat, single and nested programs", () => {
  assert.equal(BitGame.depth(["forward"]), 0);
  assert.equal(BitGame.depth([loop(2, "forward")]), 1);
  assert.equal(BitGame.depth(["light", loop(2, loop(2, "forward"))]), 2);
});

test("expand unrolls loops with paths, laps and jump-backs", () => {
  const s = BitGame.expand(["light", loop(2, "forward", "right")]);
  assert.deepEqual(s.map((x) => x.cmd), ["light", "forward", "right", "forward", "right"]);
  assert.deepEqual(s[3].path, [1, 0]);
  assert.deepEqual(s[3].laps, [{ path: [1], lap: 2, of: 2 }]);
  assert.deepEqual(s[2].jumps, [[1]]);
  assert.deepEqual(s[4].jumps, []);
});

test("expand nested: inner laps restart on every outer lap", () => {
  const s = BitGame.expand([loop(2, loop(3, "forward"), "right")]);
  assert.equal(s.length, 8);
  assert.deepEqual(s[4].laps, [{ path: [0], lap: 2, of: 2 }, { path: [0, 0], lap: 1, of: 3 }]);
  assert.deepEqual(s[2].jumps, []);            // inner loop ends its 3rd lap: no jump
  assert.deepEqual(s[3].jumps, [[0]]);         // "right" ends outer lap 1
  assert.deepEqual(s[1].jumps, [[0, 0]]);
});

test("expand of an empty loop yields no steps", () => {
  assert.deepEqual(BitGame.expand([loop(3)]), []);
  assert.equal(BitGame.hasEmptyLoop([loop(3)]), true);
  assert.equal(BitGame.hasEmptyLoop([loop(3, "forward")]), false);
});

test("codeLines writes braces and indentation in both languages", () => {
  const p = [loop(3, "forward"), "light"];
  assert.deepEqual(BitGame.codeLines(p, "uk").map((l) => [l.depth, l.text, l.kind]), [
    [0, "повтори(3) {", "open"], [1, "вперед()", "cmd"], [0, "}", "close"], [0, "увімкнути()", "cmd"]
  ]);
  assert.equal(BitGame.codeLines(p, "en")[0].text, "repeat(3) {");
  assert.deepEqual(BitGame.codeLines(p, "uk")[2].path, [0]);
});

test("validateProgram rejects bad counts, depth and commands", () => {
  const all = ["forward", "light", "repeat"];
  assert.doesNotThrow(() => BitGame.validateProgram([loop(9, "forward")], 1, all));
  assert.throws(() => BitGame.validateProgram([loop(1, "forward")], 1, all));
  assert.throws(() => BitGame.validateProgram([loop(10, "forward")], 1, all));
  assert.throws(() => BitGame.validateProgram([loop(2, loop(2, "forward"))], 1, all));
  assert.throws(() => BitGame.validateProgram(["jump"], 1, all));
  assert.throws(() => BitGame.validateProgram([{ repeat: 2 }], 1, all));
});

test("addItem appends into the cursor's container without mutating", () => {
  const p0 = [loop(2)];
  const p1 = BitGame.addItem(p0, [0], "forward");
  assert.deepEqual(p1, [loop(2, "forward")]);
  assert.deepEqual(p0, [loop(2)]);
  assert.deepEqual(BitGame.addItem(p1, [], "light"), [loop(2, "forward"), "light"]);
});

test("removeItem and setRepeat work by path", () => {
  const p = [loop(2, "forward", loop(3, "right")), "light"];
  assert.deepEqual(BitGame.removeItem(p, [0, 0]), [loop(2, loop(3, "right")), "light"]);
  assert.deepEqual(BitGame.removeItem(p, [0]), ["light"]);
  assert.equal(BitGame.setRepeat(p, [0, 1], 7)[0].body[1].repeat, 7);
});

test("fixCursor after removing the loop that holds the cursor", () => {
  const p = BitGame.removeItem([loop(2, loop(3, "right"))], [0]);
  assert.deepEqual(BitGame.fixCursor(p, [0, 0]), []);
  const q = BitGame.removeItem([loop(2, "forward", loop(3, "right"))], [0, 1]);
  assert.deepEqual(BitGame.fixCursor(q, [0, 1]), [0]);
});

test("findRepeat finds the warm-up zigzag repetition", () => {
  const f = "forward", r = "right", l = "left";
  assert.deepEqual(BitGame.findRepeat([f, r, f, l, f, r, f, l, f, r, f, "light"]), { start: 0, len: 4, times: 2 });
  assert.deepEqual(BitGame.findRepeat([f, f, f, "light"]), null);   // len 1 does not count
  assert.deepEqual(BitGame.findRepeat([f, "jump", f, "jump", f, "jump"]), { start: 0, len: 2, times: 3 });
  assert.equal(BitGame.findRepeat([f, r, l]), null);
});

/* ---------- loops: levels ---------- */
const LOOPS = ALL.concat("repeat");
const loopDef = (over) => def(Object.assign({
  map: ["1 1 1 1t"], commands: LOOPS, slots: 5, best: 3,
  solution: [{ repeat: 3, body: ["forward"] }, "light"]
}, over));

test("parseLevel accepts repeat with nest and solution", () => {
  const lv = BitGame.parseLevel("l", loopDef({ nest: 2 }));
  assert.equal(lv.nest, 2);
  assert.deepEqual(lv.solution, [{ repeat: 3, body: ["forward"] }, "light"]);
  assert.equal(BitGame.parseLevel("l", loopDef()).nest, 1);
  assert.equal(L.solution, null);
});

test("parseLevel rejects broken loop levels", () => {
  const bad = (over) => assert.throws(() => BitGame.parseLevel("b", loopDef(over)));
  bad({ solution: undefined });
  bad({ solution: [{ repeat: 2, body: [{ repeat: 2, body: ["forward"] }] }] });   // depth 2 > nest 1
  bad({ nest: 3 });
  bad({ slots: 9, best: 3 });                                                    // > LOOP_MAX_SLOTS
  assert.throws(() => BitGame.parseLevel("b", def({ solution: ["forward"] }))); // no repeat in commands
});

test("run executes a loop program and reports paths and laps", () => {
  const lv = BitGame.parseLevel("l", loopDef());
  const r = BitGame.run(lv, lv.solution);
  assert.equal(r.won, true);
  assert.equal(r.trace.length, 4);
  assert.deepEqual(r.trace[2].laps, [{ path: [0], lap: 3, of: 3 }]);
  assert.deepEqual(r.trace[3].path, [1]);
});

test("solve ignores repeat and finds the flat optimum", () => {
  const lv = BitGame.parseLevel("l", loopDef());
  assert.deepEqual(BitGame.solve(lv), ["forward", "forward", "forward", "light"]);
});

test("CODE has a loop keyword in both languages", () => {
  assert.equal(BitGame.CODE.uk.repeat, "повтори");
  assert.equal(BitGame.CODE.en.repeat, "repeat");
  assert.equal(BitGame.LOOP_MAX_SLOTS, 8);
});
