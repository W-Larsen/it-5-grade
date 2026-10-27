"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const BitGame = require("../shared/bit-game/engine.js");
const { shortestProgram } = require("./program-search.js");

const LOOPS = ["forward", "left", "right", "jump", "light", "repeat"];
const lv = (id, map, over) => BitGame.parseLevel(id, Object.assign({
  title: "T", map, start: { x: 0, y: 0, dir: "E" }, commands: LOOPS, slots: 8, best: 1,
  solution: [{ repeat: 2, body: ["forward"] }]
}, over));

test("finds a loop for a long corridor", () => {
  const level = lv("c", ["1 1 1 1 1 1 1 1t"]);
  const p = shortestProgram(level, { maxSize: 6, nest: 1 });
  assert.equal(BitGame.size(p), 3);
  assert.equal(BitGame.run(level, p).won, true);
});

test("nesting beats a flat loop on a 5×5 ring with lit corners", () => {
  const ring = ["1t 1 1 1 1t", "1 . . . 1", "1 . . . 1", "1 . . . 1", "1t 1 1 1 1t"];
  const level = lv("r", ring, { nest: 2 });
  const nested = shortestProgram(level, { maxSize: 7, nest: 2 });
  assert.equal(BitGame.size(nested), 5);
  assert.equal(BitGame.run(level, nested).won, true);
  assert.equal(BitGame.size(shortestProgram(level, { maxSize: 7, nest: 1 })), 7);
});

test("returns null when nothing fits", () => {
  assert.equal(shortestProgram(lv("c", ["1 1 1 1 1 1 1 1t"]), { maxSize: 2, nest: 1 }), null);
});

test("without repeat it matches the flat BFS", () => {
  const flat = BitGame.parseLevel("f", { title: "T", map: ["1 1 1t"], start: { x: 0, y: 0, dir: "E" },
    commands: ["forward", "light"], slots: 5, best: 3 });
  assert.equal(BitGame.size(shortestProgram(flat, { maxSize: 5, nest: 0 })), 3);
});

test("a ring search with maxSize 8 finishes within 20 seconds", () => {
  const ring7 = ["2t 1 1 1 1 1 2t", "1 . . . . . 1", "1 . . . . . 1", "1 . . . . . 1",
                 "1 . . . . . 1", "1 . . . . . 1", "2t 1 1 1 1 1 2t"];
  const t0 = Date.now();
  shortestProgram(lv("t", ring7, { nest: 1 }), { maxSize: 8, nest: 1 });
  assert.ok(Date.now() - t0 < 20000);
});

test("switching on at every step is a valid shortcut and the search sees it", () => {
  const level = lv("w", ["1 1 1t 1 1t"]);   // transistors on every second tile: the extra switch-ons are harmless
  const p = shortestProgram(level, { maxSize: 5, nest: 1 });
  assert.equal(BitGame.size(p), 3);
  assert.equal(BitGame.run(level, p).won, true);
});
