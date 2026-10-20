"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const BitGame = require("../shared/bit-game/engine.js");
const { checkLevel, marginFor } = require("./check-levels.js");

const ALL = ["forward", "left", "right", "jump", "light"];
const mk = (id, over) => BitGame.parseLevel(id, Object.assign({
  title: "T", map: ["1 1 1t"], start: { x: 0, y: 0, dir: "E" },
  commands: ["forward", "light"], slots: 5, best: 3
}, over));

test("a correct level has no problems", () => {
  assert.deepEqual(checkLevel(mk("2-01"), []), []);
});

test("wrong best is reported with the real optimum", () => {
  const p = checkLevel(mk("2-01", { best: 4, slots: 6 }), []);
  assert.equal(p.length, 1);
  assert.match(p[0], /best 4/);
  assert.match(p[0], /3/);
});

test("unsolvable level is reported", () => {
  const p = checkLevel(mk("2-01", { map: ["1 3t"], commands: ALL, best: 1, slots: 4 }), []);
  assert.match(p.join("\n"), /unsolvable/i);
});

test("slots must leave room above best by the level's margin", () => {
  assert.equal(marginFor("2-03"), 2);
  assert.equal(marginFor("2-07"), 1);
  assert.equal(marginFor("2-b1"), 0);
  assert.match(checkLevel(mk("2-01", { slots: 4 }), []).join("\n"), /slots/);
  assert.deepEqual(checkLevel(mk("2-b1", { slots: 3 }), []), []);
});

test("a newly introduced command must appear in the optimal solution", () => {
  const lv = mk("2-02", { commands: ["forward", "jump", "light"] });
  assert.match(checkLevel(lv, ["forward", "light"]).join("\n"), /jump/);
  assert.deepEqual(checkLevel(lv, ["forward", "light", "jump"]), []);
});
