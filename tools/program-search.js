"use strict";
/* Shortest winning program of a Біт-програміст level, loops included (Node only; used by check-levels).

   Dijkstra over board states: an edge is one top-level item — a single command (cost 1) or a loop (cost 1 + body size,
   N = 2..9) — so every state is expanded once, at the cheapest program that reaches it. Loop bodies are generated
   depth-first while they are simulated, and a body whose first lap bumps into a wall or a flat tile is dropped; the same
   goes for a nested loop that bumps on any lap. Those programs only waste cells, so the optimum is not affected in practice. */
const BitGame = require("../shared/bit-game/engine.js");

const isBump = (ev) => ev.indexOf("bump") === 0 || ev === "no-target";

function shortestProgram(level, opts) {
  const maxSize = opts.maxSize;
  const prims = level.commands.filter((c) => c !== "repeat");
  const nest = level.commands.indexOf("repeat") >= 0 ? opts.nest : 0;
  const key = BitGame.stateKey;
  const turnPair = (a, b) => (a === "left" && b === "right") || (a === "right" && b === "left");

  /* One pass over `cmds`: { state, won, bumped } (stops at the first win). */
  function simulate(st, cmds) {
    let bumped = false;
    for (let i = 0; i < cmds.length; i++) {
      const r = BitGame.step(level, st, cmds[i]);
      if (isBump(r.event)) bumped = true;
      st = r.state;
      if (BitGame.isWon(level, st)) return { state: st, won: true, bumped };
    }
    return { state: st, won: false, bumped };
  }

  /* Every non-empty body (items array) of size ≤ budget that runs one lap from `st` without bumping or winning.
     visit(items, size, stateAfterLap) — `items` is reused, copy it to keep it. */
  function enumBody(st, budget, nestLeft, items, size, visit) {
    if (budget < 1) return;
    const last = items[items.length - 1];
    for (const c of prims) {
      if (typeof last === "string" && turnPair(last, c)) continue;
      const r = BitGame.step(level, st, c);
      if (isBump(r.event) || BitGame.isWon(level, r.state)) continue;
      items.push(c);
      visit(items, size + 1, r.state);
      enumBody(r.state, budget - 1, nestLeft, items, size + 1, visit);
      items.pop();
    }
    if (nestLeft < 1 || budget < 2) return;
    enumBody(st, budget - 1, nestLeft - 1, [], 0, (inner, isz, st1) => {
      const flat = BitGame.expand(inner.slice()).map((x) => x.cmd);
      let cur = st1;
      for (let n = 2; n <= BitGame.MAX_REPEAT; n++) {
        const lap = simulate(cur, flat);
        if (lap.won || lap.bumped) return;
        cur = lap.state;
        items.push({ repeat: n, body: inner.slice() });
        visit(items, size + 1 + isz, cur);
        enumBody(cur, budget - 1 - isz, nestLeft, items, size + 1 + isz, visit);
        items.pop();
      }
    });
  }

  const start = BitGame.initialState(level);
  const best = new Map([[key(start), { cost: 0, from: null, item: null, st: start }]]);
  const buckets = [[key(start)]];
  let win = null;                                     // { cost, from, item }

  for (let cost = 0; cost < maxSize; cost++) {
    if (win && win.cost <= cost + 1) break;
    for (const k of buckets[cost] || []) {
      const here = best.get(k);
      if (here.cost !== cost) continue;               // stale entry
      const relax = (st, c, item) => {
        if (c > maxSize) return;
        const nk = key(st), old = best.get(nk);
        if (old && old.cost <= c) return;
        best.set(nk, { cost: c, from: k, item, st });
        (buckets[c] = buckets[c] || []).push(nk);
      };
      const record = (c, item) => { if (c <= maxSize && (!win || c < win.cost)) win = { cost: c, from: k, item }; };

      for (const c of prims) {
        const r = BitGame.step(level, here.st, c);
        if (BitGame.isWon(level, r.state)) record(cost + 1, c); else relax(r.state, cost + 1, c);
      }
      if (nest < 1) continue;
      enumBody(here.st, maxSize - cost - 1, nest - 1, [], 0, (body, b, st1) => {
        const flat = BitGame.expand(body.slice()).map((x) => x.cmd);
        let cur = st1;
        for (let n = 2; n <= BitGame.MAX_REPEAT; n++) {
          const lap = simulate(cur, flat);
          if (lap.won) { record(cost + 1 + b, { repeat: n, body: body.slice() }); return; }
          cur = lap.state;
          relax(cur, cost + 1 + b, { repeat: n, body: body.slice() });
        }
      });
    }
  }
  if (!win) return null;
  const program = [win.item];
  for (let e = best.get(win.from); e && e.from !== null; e = best.get(e.from)) program.unshift(e.item);
  return program;
}

module.exports = { shortestProgram };
