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
