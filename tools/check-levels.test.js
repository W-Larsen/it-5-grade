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

/* ---------- levels with loops ---------- */
const LOOPS = ALL.concat("repeat");
const mkLoop = (id, over) => BitGame.parseLevel(id, Object.assign({
  title: "T", map: ["1 1 1 1 1 1 1 1t"], start: { x: 0, y: 0, dir: "E" }, commands: LOOPS,
  slots: 5, best: 3, solution: [{ repeat: 7, body: ["forward"] }, "light"]
}, over));

test("a correct loop level has no problems", () => {
  assert.deepEqual(checkLevel(mkLoop("3-01"), ALL), []);
});

test("solution that does not win or does not match best is reported", () => {
  assert.match(checkLevel(mkLoop("3-01", { solution: [{ repeat: 6, body: ["forward"] }, "light"] }), ALL).join("\n"), /solution/);
  const longer = mkLoop("3-01", { best: 4, slots: 6, solution: ["forward", { repeat: 6, body: ["forward"] }, "light"] });
  assert.match(checkLevel(longer, ALL).join("\n"), /shorter/);
});

test("a level solvable without a loop is reported", () => {
  const lv = mkLoop("3-01", { map: ["1 1 1t"], slots: 5, best: 3, solution: [{ repeat: 2, body: ["forward"] }, "light"] });
  assert.match(checkLevel(lv, ALL).join("\n"), /without a loop/);
});

test("a nested-set level solvable with one loop level is reported", () => {
  const p = checkLevel(mkLoop("3-07", { nest: 2 }), ALL);
  assert.equal(p.length, 1);
  assert.match(p[0], /without nesting/);
  assert.deepEqual(checkLevel(mkLoop("3-b1", { nest: 2, slots: 3 }), ALL), []);   // bonus: rule skipped
});

test("a loop that the solution never uses is reported when repeat is new", () => {
  const lv = mkLoop("3-01", { map: ["1 1t"], slots: 5, best: 2, solution: ["forward", "light"] });
  assert.match(checkLevel(lv, ALL).join("\n"), /repeat/);
});

test("margins for lesson 3 ids", () => {
  assert.equal(marginFor("3-01"), 2);
  assert.equal(marginFor("3-i1"), 2);
  assert.equal(marginFor("3-00"), 0);
  assert.equal(marginFor("3-05"), 1);
  assert.equal(marginFor("3-b2"), 0);
});

test("a reference solution that bumps into walls is reported", () => {
  const lv = mkLoop("3-01", { solution: [{ repeat: 9, body: ["forward"] }, "light"] });   // the corridor is shorter than 9 steps
  assert.equal(BitGame.run(lv, lv.solution).won, true);
  assert.match(checkLevel(lv, ALL).join("\n"), /bump/);
});

/* ---------- levels with conditions ---------- */
const IFS = ALL.concat("repeat", "if");
const LAMP_SOL = [{ repeat: 7, body: ["forward", { if: "transistor", then: ["light"] }] }];
const mkIf = (id, over) => BitGame.parseLevel(id, Object.assign({
  title: "T", map: ["1 1t 1 1t 1t 1 1 1t"], start: { x: 0, y: 0, dir: "E" }, commands: IFS, conditions: ["transistor"],
  nest: 2, slots: 5, best: 4, solution: LAMP_SOL
}, over));
const STAIRS_MAP = ["1 2 2 3 2 3 4 4 3t"];
const STAIRS_SOL = [{ repeat: 8, body: [{ if: "step", then: ["jump"], else: ["forward"] }] }, "light"];
const mkStairs = (id, over) => mkIf(id, Object.assign({ map: STAIRS_MAP, conditions: ["step"], else: true, solution: STAIRS_SOL, best: 5, slots: 6 }, over));

test("a correct if level has no problems", () => {
  assert.deepEqual(checkLevel(mkIf("4-07"), IFS.filter((c) => c !== "if")), []);
  assert.deepEqual(checkLevel(mkStairs("4-05"), IFS), []);
});
test("an if level with a wrong best is reported", () => {
  assert.match(checkLevel(mkIf("4-02", { best: 5, slots: 6 }), ALL.concat("repeat")).join("\n"), /best 5/);
});
test("an if level solvable without an if is reported", () => {
  const lv = mkIf("4-02", { map: ["1 1t 1t 1t 1t"], solution: [{ repeat: 4, body: ["forward", { if: "transistor", then: ["light"] }] }] });
  assert.match(checkLevel(lv, ALL.concat("repeat")).join("\n"), /without an if/);
});
test("a stairs level that needs no else is reported", () => {
  const lv = mkStairs("4-05", { map: ["1 2 2 3 3t"], solution: [{ repeat: 4, body: [{ if: "step", then: ["jump"], else: ["forward"] }] }, "light"] });
  assert.match(checkLevel(lv, IFS).join("\n"), /without else/);
});
test("a solution that switches a transistor off again is reported", () => {
  const lv = mkIf("4-03", { map: ["1t 1t"], commands: ["forward", "light", "repeat", "if"], best: 5, slots: 6, solution: ["light", "light", "light", "forward", { if: "transistor", then: ["light"] }] });
  assert.match(checkLevel(lv, ALL.concat("repeat")).join("\n"), /twice|off/);
});
test("margins for lesson 4 ids", () => {
  assert.equal(marginFor("4-i1"), 2);
  assert.equal(marginFor("4-01"), 2);
  assert.equal(marginFor("4-03"), 1);
  assert.equal(marginFor("4-00"), 0);
  assert.equal(marginFor("4-08"), 0);
  assert.equal(marginFor("4-05"), 1);
  assert.equal(marginFor("4-b1"), 0);
});
