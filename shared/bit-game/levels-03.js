/* Рівні уроку 3 «Біт у циклі». Формат мапи — як у levels-02.js.
   Рівні з "repeat" у commands мають:
     solution — еталонна програма-дерево: рядок-команда або { repeat: N, body: [...] }; best = кількість комірок (цикл = 1 + тіло);
     nest — скільки рівнів циклів дозволено (1 за замовчуванням, 2 — цикл у циклі); slots ≤ 8.
   Міняючи рівень, запускай node tools/check-levels.js. */

/* ----- Розминка (без циклу) і знайомство з циклом ----- */
BitGame.level("3-i1", {
  title: "Довгий коридор",
  map: ["1 1 1 1 1 1 1 1 1 1t"],
  start: { x: 0, y: 0, dir: "E" },
  commands: ["forward", "light", "repeat"],
  solution: [{ repeat: 9, body: ["forward"] }, "light"],
  slots: 8, best: 3,
  say: "Пам'яті мало! Спробуй 🔁 цикл."
});

/* ----- Коридори ----- */
BitGame.level("3-01", {
  title: "Коридор",
  map: ["1 1 1 1 1 1 1 1t"],
  start: { x: 0, y: 0, dir: "E" },
  commands: ["forward", "light", "repeat"],
  solution: [{ repeat: 7, body: ["forward"] }, "light"],
  slots: 5, best: 3,
  say: "Повтори крок кілька разів!"
});
