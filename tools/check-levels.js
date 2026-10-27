#!/usr/bin/env node
"use strict";
/* Checks every registered Біт-програміст level: solvable, `best` is the real optimum,
   slots leave room, and each newly introduced command is actually needed.
   Usage: node tools/check-levels.js   (exit 1 on any problem) */
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const BitGame = require("../shared/bit-game/engine.js");
const { shortestProgram } = require("./program-search.js");

/* Extra slots above `best`: easy levels are forgiving, exams tight, bonus levels exact. */
function marginFor(id) {
  if (/^2-0[1-6]$/.test(id) || /^3-0[1-3]$/.test(id) || /^3-i\d$/.test(id)) return 2;
  if (/-b\d+$/.test(id) || id === "3-00") return 0;
  return 1;
}

const show = (program) => BitGame.codeLines(program, "uk").map((l) => l.text).join(" ");

/* `seen` = commands offered by earlier levels. Returns a list of problem strings. */
function checkLevel(lv, seen) {
  const problems = [];
  const sol = BitGame.solve(lv);
  if (!sol) return ["unsolvable"];
  if (lv.commands.indexOf("repeat") >= 0) return checkLoopLevel(lv, seen, sol.length);
  if (sol.length !== lv.best) {
    problems.push("best " + lv.best + " but the real optimum is " + sol.length + " (" + sol.join(" ") + ")");
  }
  const margin = marginFor(lv.id);
  if (lv.slots < lv.best + margin) {
    problems.push("slots " + lv.slots + " < best + " + margin + " = " + (lv.best + margin));
  }
  lv.commands.forEach((c) => {
    if (seen.indexOf(c) < 0 && sol.indexOf(c) < 0) {
      problems.push("command '" + c + "' is introduced here but the optimal solution never uses it");
    }
  });
  return problems;
}

/* Levels with the loop command: `solution` is the reference; `flatLength` is the shortest program without loops. */
function checkLoopLevel(lv, seen, flatLength) {
  const problems = [], sol = lv.solution;
  if (!BitGame.run(lv, sol).won) return ["solution does not win: " + show(sol)];
  const cells = BitGame.size(sol);
  if (cells !== lv.best) problems.push("best " + lv.best + " but the solution takes " + cells + " cells (" + show(sol) + ")");
  const shorter = lv.best > 1 ? shortestProgram(lv, { maxSize: lv.best - 1, nest: lv.nest }) : null;
  if (shorter) problems.push("best " + lv.best + " but a shorter program exists: " + show(shorter));
  if (flatLength <= lv.slots) problems.push("solvable without a loop in " + flatLength + " cells (slots " + lv.slots + ")");
  if (lv.nest === 2 && !/-b\d+$/.test(lv.id)) {
    const flatLoops = shortestProgram(lv, { maxSize: lv.slots, nest: 1 });
    if (flatLoops) problems.push("solvable without nesting: " + show(flatLoops));
  }
  const margin = marginFor(lv.id);
  if (lv.slots < lv.best + margin) problems.push("slots " + lv.slots + " < best + " + margin + " = " + (lv.best + margin));
  const used = BitGame.expand(sol).map((x) => x.cmd);
  if (BitGame.depth(sol) > 0) used.push("repeat");
  lv.commands.forEach((c) => {
    if (seen.indexOf(c) < 0 && used.indexOf(c) < 0) {
      problems.push("command '" + c + "' is introduced here but the solution never uses it");
    }
  });
  return problems;
}

function main() {
  const dir = path.join(__dirname, "..", "shared", "bit-game");
  const counts = {};
  const original = BitGame.level;
  BitGame.level = function (id, def) { counts[id] = (counts[id] || 0) + 1; return original(id, def); };
  fs.readdirSync(dir).filter((f) => /^levels-.*\.js$/.test(f)).sort().forEach((f) => {
    vm.runInThisContext(fs.readFileSync(path.join(dir, f), "utf8"), { filename: f });
  });
  BitGame.level = original;

  let bad = 0, seen = [];
  const ids = BitGame.levelIds();
  if (!ids.length) { console.log("✗ no levels registered"); process.exit(1); }
  ids.forEach((id) => {
    const lv = BitGame.getLevel(id);
    const problems = checkLevel(lv, seen);
    if (counts[id] > 1) problems.push("id registered " + counts[id] + " times");
    if (problems.length) {
      bad++;
      console.log("✗ " + id + " " + lv.title);
      problems.forEach((p) => console.log("    " + p));
    } else {
      console.log("✓ " + id + " " + lv.title + " — best " + lv.best + ", slots " + lv.slots + (lv.solution ? ", solution " + show(lv.solution) : ""));
    }
    lv.commands.forEach((c) => { if (seen.indexOf(c) < 0) seen.push(c); });
  });
  process.exit(bad ? 1 : 0);
}

module.exports = { checkLevel, marginFor };
if (require.main === module) main();
