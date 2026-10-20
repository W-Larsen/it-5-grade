/* Рівні уроку 2 «Біт у процесорі».
   map: цифра — висота плитки (1–4), «t» — транзистор, «.» — порожньо; рядки зверху вниз, x — вправо.
   start.dir: N вгору, E вправо, S вниз, W вліво.
   `best` перевіряє tools/check-levels.js (node tools/check-levels.js) — міняючи карту, запускай його. */

/* ----- Тренування ----- */
BitGame.level("2-01", {
  title: "Перший крок",
  map: ["1 1 1t"],
  start: { x: 0, y: 0, dir: "E" },
  commands: ["forward", "light"],
  slots: 5, best: 3,
  say: "Іди вперед і увімкни транзистор!"
});

BitGame.level("2-02", {
  title: "Поворот",
  map: ["1 1 1",
        ". . 1t"],
  start: { x: 0, y: 0, dir: "E" },
  commands: ["forward", "right", "light"],
  slots: 7, best: 5,
  say: "Щоб піти вниз, Біт спершу повертає праворуч."
});

BitGame.level("2-03", {
  title: "Два транзистори",
  map: [". . 1t",
        ". . 1",
        "1 1t 1"],
  start: { x: 0, y: 2, dir: "E" },
  commands: ["forward", "left", "right", "light"],
  slots: 9, best: 7,
  say: "Спершу один транзистор, потім інший."
});

/* ----- Стрибки ----- */
BitGame.level("2-04", {
  title: "Перший стрибок",
  map: ["1 1 2 2t"],
  start: { x: 0, y: 0, dir: "E" },
  commands: ["forward", "left", "right", "jump", "light"],
  slots: 6, best: 4,
  say: "Біт не вміє літати, зате вміє стрибати!"
});

BitGame.level("2-05", {
  title: "Сходи",
  map: ["1 2 3",
        ". . 4",
        ". . 4t"],
  start: { x: 0, y: 0, dir: "E" },
  commands: ["forward", "left", "right", "jump", "light"],
  slots: 8, best: 6,
  say: "Сходи вгору: стрибок за стрибком."
});

BitGame.level("2-06", {
  title: "Вниз і вгору",
  map: ["3 3 1t 2 3t"],
  start: { x: 0, y: 0, dir: "E" },
  commands: ["forward", "left", "right", "jump", "light"],
  slots: 8, best: 6,
  say: "Стрибай вниз, а потім знову вгору!"
});

/* ----- Іспит диспетчерської ----- */
BitGame.level("2-07", {
  title: "Іспит: змійка",
  map: ["1 1 1t",
        ". . 1",
        "1t 1 1"],
  start: { x: 0, y: 0, dir: "E" },
  commands: ["forward", "left", "right", "jump", "light"],
  slots: 11, best: 10,
  say: "Іспит! Команд мало, тож думай наперед."
});

BitGame.level("2-08", {
  title: "Іспит: вежа",
  map: ["1 2 3t",
        ". . 3",
        "1t 2 2"],
  start: { x: 0, y: 0, dir: "E" },
  commands: ["forward", "left", "right", "jump", "light"],
  slots: 11, best: 10,
  say: "Тут і сходи, і повороти. Склади план!"
});

BitGame.level("2-09", {
  title: "Іспит: диспетчерська",
  map: ["1 2 3",
        "1 . 4t",
        "1t 2 3t"],
  start: { x: 0, y: 0, dir: "E" },
  commands: ["forward", "left", "right", "jump", "light"],
  slots: 12, best: 11,
  say: "Останній іспит. Ти вже майже програміст!"
});

/* ----- Бонус: команд рівно скільки треба ----- */
BitGame.level("2-b1", {
  title: "Бонус: драбина",
  map: ["4 3 2t",
        "3 . 1",
        ". 1t 1t"],
  start: { x: 0, y: 0, dir: "E" },
  commands: ["forward", "left", "right", "jump", "light"],
  slots: 10, best: 10,
  say: "Бонус! Команд рівно стільки, скільки треба."
});

BitGame.level("2-b2", {
  title: "Бонус: подвійна вежа",
  map: ["1 2 3t",
        "1 . 4",
        "1t 2 4t"],
  start: { x: 0, y: 0, dir: "E" },
  commands: ["forward", "left", "right", "jump", "light"],
  slots: 11, best: 11,
  say: "Спробуй знайти найкоротший шлях."
});

BitGame.level("2-b3", {
  title: "Бонус: велика вежа",
  map: ["1 2 3 4t",
        ". . . 4",
        "1t 1 2 3"],
  start: { x: 0, y: 0, dir: "E" },
  commands: ["forward", "left", "right", "jump", "light"],
  slots: 12, best: 12,
  say: "Найскладніший! Тільки для найсміливіших."
});
