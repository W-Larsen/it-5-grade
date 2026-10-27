/* Рівні уроку 3 «Біт у циклі». Формат мапи — як у levels-02.js.
   Рівні з "repeat" у commands мають:
     solution — еталонна програма-дерево: рядок-команда або { repeat: N, body: [...] }; best = кількість комірок (цикл = 1 + тіло);
     nest — скільки рівнів циклів дозволено (1 за замовчуванням, 2 — цикл у циклі); slots ≤ 8.
   Міняючи рівень, запускай node tools/check-levels.js: він перевіряє, що solution проходить рівень, що коротшої програми немає
   і що без циклу (а в наборі «Цикл у циклі» — без вкладеного) рівень у пам'ять не влазить. */

/* ----- Розминка: без циклу (учень знаходить повтор у власній програмі) ----- */
BitGame.level("3-00", {
  title: "Довгі сходи",
  map: ["1 1 . .",
        ". 1 1 .",
        ". . 1 1",
        ". . . 1t"],
  start: { x: 0, y: 0, dir: "E" },
  commands: ["forward", "left", "right", "light"],
  slots: 12, best: 12,
  say: "Згадай урок 2: дійди до транзистора!"
});

/* ----- Знайомство з циклом (слайд «Цикл») ----- */
BitGame.level("3-i1", {
  title: "Довгий коридор",
  map: ["1 1 1 1 1 1 1 1 1 1t"],
  start: { x: 0, y: 0, dir: "E" },
  commands: ["forward", "light", "repeat"],
  solution: [{ repeat: 9, body: ["forward"] }, "light"],
  slots: 8, best: 3,
  say: "Пам'яті мало! Спробуй 🔁 цикл."
});

/* ----- Коридори: один цикл ----- */
BitGame.level("3-01", {
  title: "Коридор",
  map: ["1 1 1 1 1 1 1 1t"],
  start: { x: 0, y: 0, dir: "E" },
  commands: ["forward", "light", "repeat"],
  solution: [{ repeat: 7, body: ["forward"] }, "light"],
  slots: 5, best: 3,
  say: "Повтори крок кілька разів!"
});

BitGame.level("3-02", {
  title: "Гірка",
  map: ["1 2 3 4 3 2 1t"],
  start: { x: 0, y: 0, dir: "E" },
  commands: ["forward", "jump", "light", "repeat"],
  solution: [{ repeat: 6, body: ["jump"] }, "light"],
  slots: 5, best: 3,
  say: "Вгору й униз — тими самими стрибками."
});

BitGame.level("3-03", {
  title: "Сходинки",
  map: ["1 1 2 2 3 3 4t"],
  start: { x: 0, y: 0, dir: "E" },
  commands: ["forward", "jump", "light", "repeat"],
  solution: [{ repeat: 3, body: ["forward", "jump"] }, "light"],
  slots: 6, best: 4,
  say: "У циклі може бути кілька команд."
});

/* ----- Візерунки: цикл із поворотами; команди до й після циклу ----- */
BitGame.level("3-04", {
  title: "Довгий зигзаг",
  map: ["1 1 . . .",
        ". 1 1 . .",
        ". . 1 1 .",
        ". . . 1 1",
        ". . . . 1t"],
  start: { x: 0, y: 0, dir: "E" },
  commands: ["forward", "left", "right", "light", "repeat"],
  solution: [{ repeat: 4, body: ["forward", "right", "forward", "left"] }, "light"],
  slots: 7, best: 6,
  say: "Пам'ятаєш сходи з розминки?"
});

BitGame.level("3-05", {
  title: "Квадрат навколо вежі",
  map: ["1t 1 1t",
        "1 2 1",
        "1t 1 1t"],
  start: { x: 0, y: 0, dir: "E" },
  commands: ["forward", "right", "light", "repeat"],
  solution: [{ repeat: 4, body: ["forward", "forward", "right", "light"] }],
  slots: 6, best: 5,
  say: "Обійди вежу й увімкни кожен кут."
});

BitGame.level("3-06", {
  title: "До й після циклу",
  map: ["1 1 1 1 1 1 2t"],
  start: { x: 0, y: 0, dir: "N" },
  commands: ["forward", "right", "jump", "light", "repeat"],
  solution: ["right", { repeat: 5, body: ["forward"] }, "jump", "light"],
  slots: 6, best: 5,
  say: "Деякі команди — до циклу, деякі — після."
});

/* ----- Цикл у циклі ----- */
BitGame.level("3-07", {
  title: "Великий квадрат",
  map: ["1t 1 1 1 1t",
        "1 . . . 1",
        "1 . . . 1",
        "1 . . . 1",
        "1t 1 1 1 1t"],
  start: { x: 0, y: 0, dir: "E" },
  commands: ["forward", "left", "right", "light", "repeat"],
  nest: 2,
  solution: [{ repeat: 4, body: [{ repeat: 4, body: ["forward"] }, "right", "light"] }],
  slots: 6, best: 5,
  say: "Цикл у циклі!"
});

BitGame.level("3-08", {
  title: "Сходи по колу",
  map: ["1t 1 1 1 1 2t",
        "4 . . . . 2",
        "4 . . . . 2",
        "4 . . . . 2",
        "4 . . . . 2",
        "4t 3 3 3 3 3t"],
  start: { x: 0, y: 0, dir: "E" },
  commands: ["forward", "right", "jump", "light", "repeat"],
  nest: 2,
  solution: [{ repeat: 4, body: [{ repeat: 4, body: ["forward"] }, "jump", "light", "right"] }],
  slots: 7, best: 6,
  say: "Кожна сторона вища за попередню."
});

BitGame.level("3-09", {
  title: "Вежі на кутах",
  map: ["2t 1 1 1 1 1 2t",
        "1 . . . . . 1",
        "1 . . . . . 1",
        "1 . . . . . 1",
        "1 . . . . . 1",
        "1 . . . . . 1",
        "2t 1 1 1 1 1 2t"],
  start: { x: 0, y: 0, dir: "E" },
  commands: ["forward", "right", "jump", "light", "repeat"],
  nest: 2,
  solution: [{ repeat: 4, body: ["jump", { repeat: 4, body: ["forward"] }, "jump", "light", "right"] }],
  slots: 8, best: 7,
  say: "Найважчий іспит циклів!"
});

/* ----- Бонус: пам'яті рівно стільки, скільки треба ----- */
BitGame.level("3-b1", {
  title: "Бонус: зигзаг із вогниками",
  map: ["1 1 . . . . .",
        ". 1 1 . . . .",
        ". . 1t 1 . . .",
        ". . . 1 1 . .",
        ". . . . 1t 1 .",
        ". . . . . 1 1",
        ". . . . . . 1t"],
  start: { x: 0, y: 0, dir: "E" },
  commands: ["forward", "left", "right", "light", "repeat"],
  nest: 2,
  /* Задумано: «повтори(3) { повтори(2) { вперед, праворуч, вперед, ліворуч } увімкнути }» = 7 комірок (⭐⭐).
     Найкоротша (⭐⭐⭐): 6 комірок — вмикати в кожному колі. */
  solution: [{ repeat: 6, body: ["forward", "right", "forward", "left", "light"] }],
  slots: 7, best: 6,
  say: "Бонус! Три зірки — за найкоротшу програму."
});

BitGame.level("3-b2", {
  title: "Бонус: вогники на серединах",
  map: ["1 1 1 1t 1 1 1",
        "1 . . . . . 1",
        "1 . . . . . 1",
        "1t . . . . . 1t",
        "1 . . . . . 1",
        "1 . . . . . 1",
        "1 1 1 1t 1 1 1"],
  start: { x: 0, y: 0, dir: "E" },
  commands: ["forward", "left", "right", "light", "repeat"],
  nest: 2,
  /* Задумано: 4 сторони по «3 кроки, увімкнути, 3 кроки, праворуч» = 7 комірок (⭐⭐). Найкоротша (⭐⭐⭐): 5 комірок —
     обходити кільце й вмикати на кожному кроці, зайві «увімкнути» нічого не псують. */
  solution: [{ repeat: 4, body: [{ repeat: 6, body: ["forward", "light"] }, "right"] }],
  slots: 7, best: 5,
  say: "Бонус! Три зірки — за найкоротшу програму."
});
