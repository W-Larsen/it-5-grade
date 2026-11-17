/* Рівні уроку 4 «Біт на роздоріжжі». Формат мапи — як у levels-02.js; цикли — як у levels-03.js.
   Рівні з "if" у commands мають ще:
     conditions — які умови пропонує блок «якщо»: "transistor" (під Бітом є транзистор), "step" (попереду сходинка),
                  "edge" (попереду немає плитки: край поля або діра);
     else — чи можна додати «інакше» (за замовчуванням ні);
     solution — еталонна програма: рядок-команда, { repeat: N, body }, { if: "transistor"|"step", then: [...], else?: [...] };
                блок «якщо» разом з «інакше» = 1 комірка, + команди всередині; best = розмір solution; slots ≤ 8.
   Такі рівні — «суворі»: будь-яка помилка (стук об сходинку/край, «увімкнути» без транзистора) зупиняє програму.
   Міняючи рівень, запускай node tools/check-levels.js: він перевіряє, що solution проходить рівень, що коротшої програми немає
   і що без «якщо» (а в «Нерівних сходах» — без «інакше») рівень у пам'ять не влазить. */

/* ----- Розминка: цикл у циклі (повторення уроку 3) ----- */
BitGame.level("4-00", {
  title: "Квадрат",
  map: ["1t 1 1 1t",
        "1 . . 1",
        "1 . . 1",
        "1t 1 1 1t"],
  start: { x: 0, y: 0, dir: "E" },
  commands: ["forward", "right", "light", "repeat"],
  nest: 2,
  solution: [{ repeat: 4, body: [{ repeat: 3, body: ["forward"] }, "right", "light"] }],
  slots: 5, best: 5,
  say: "Згадай цикл у циклі: сторона, поворот, і так чотири рази."
});

/* ----- Знайомство з «якщо» (слайд «Якщо» у грі) ----- */
BitGame.level("4-i1", {
  title: "Різні проміжки",
  map: ["1 1t 1 1t 1t 1 1 1t"],
  start: { x: 0, y: 0, dir: "E" },
  commands: ["forward", "light", "repeat", "if"],
  conditions: ["transistor"],
  solution: [{ repeat: 7, body: ["forward", { if: "transistor", then: ["light"] }] }],
  nest: 2, slots: 6, best: 4,
  say: "Транзистори стоять через різні проміжки. Вмикай лише там, де він є: спитай «тут транзистор?»"
});

/* ----- Ліхтарі: умова «тут транзистор?» ----- */
BitGame.level("4-01", {
  title: "Вулиця",
  map: ["1 1 1t 1 1t 1t 1t 1 1 1t"],
  start: { x: 0, y: 0, dir: "E" },
  commands: ["forward", "light", "repeat", "if"],
  conditions: ["transistor"],
  solution: [{ repeat: 9, body: ["forward", { if: "transistor", then: ["light"] }] }],
  nest: 2, slots: 6, best: 4,
  say: "Вмикай лише там, де є транзистор."
});

BitGame.level("4-02", {
  title: "Поворот",
  map: ["1 1 1 1",
        ". . . 1",
        ". . . 1t",
        ". . . 1",
        ". . . 1t",
        ". . . 1t",
        ". . . 1t"],
  start: { x: 0, y: 0, dir: "E" },
  commands: ["forward", "right", "light", "repeat", "if"],
  conditions: ["transistor"],
  solution: [{ repeat: 3, body: ["forward"] }, "right", { repeat: 6, body: ["forward", { if: "transistor", then: ["light"] }] }],
  nest: 2, slots: 8, best: 7,
  say: "До повороту транзисторів немає. Далі — дивись під ноги."
});

BitGame.level("4-03", {
  title: "Кільце",
  map: ["1 1 1t 1t",
        "1t . . 1t",
        "1 1 1 1"],
  start: { x: 0, y: 0, dir: "E" },
  commands: ["forward", "right", "light", "repeat", "if"],
  conditions: ["transistor", "edge"],
  solution: [{ repeat: 9, body: ["forward", { if: "transistor", then: ["light"] }, { if: "edge", then: ["right"] }] }],
  nest: 2, slots: 7, best: 6,
  say: "Кільце! Біт має сам повернути, коли попереду край."
});

/* ----- Нерівні сходи: умова «попереду сходинка?» і «інакше» ----- */
BitGame.level("4-04", {
  title: "Нерівні сходи",
  map: ["1 2 2 3 2 3 4 4 3t"],
  start: { x: 0, y: 0, dir: "E" },
  commands: ["forward", "jump", "light", "repeat", "if"],
  conditions: ["step", "transistor"], else: true,
  solution: [{ repeat: 8, body: [{ if: "step", then: ["jump"], else: ["forward"] }] }, "light"],
  nest: 2, slots: 6, best: 5,
  say: "Сходинка — стрибай, рівно — іди. Додай «+ інакше»! Скільки кроків? Порахуй плитки."
});

BitGame.level("4-05", {
  title: "Сходи по колу",
  map: ["1 2 2 1",
        "4t . . 1",
        "3 2 1 1"],
  start: { x: 0, y: 0, dir: "E" },
  commands: ["forward", "right", "jump", "light", "repeat", "if"],
  conditions: ["step", "edge"], else: true,
  solution: [{ repeat: 9, body: [{ if: "step", then: ["jump"], else: ["forward"] }, { if: "edge", then: ["right"] }] }, "light"],
  nest: 2, slots: 8, best: 7,
  say: "Сходи по колу: стрибай, а на краю повертай."
});

BitGame.level("4-06", {
  title: "Лампи на сходах",
  map: ["1 2 2 3 4t 4 3t 4 4t"],
  start: { x: 0, y: 0, dir: "E" },
  commands: ["forward", "jump", "light", "repeat", "if"],
  conditions: ["step", "transistor"], else: true,
  solution: [{ repeat: 8, body: [{ if: "transistor", then: ["light"] }, { if: "step", then: ["jump"], else: ["forward"] }] }, "light"],
  nest: 2, slots: 8, best: 7,
  say: "Спершу перевір лампу, потім крок. Умови можна міняти місцями!"
});

/* ----- Все разом: обидві умови ----- */
BitGame.level("4-07", {
  title: "Дорога з ліхтарями",
  map: ["1 1 1t 1 1 2t 3 2 1t"],
  start: { x: 0, y: 0, dir: "E" },
  commands: ["forward", "jump", "light", "repeat", "if"],
  conditions: ["transistor", "step"], else: true,
  solution: [{ repeat: 8, body: [{ if: "step", then: ["jump"], else: ["forward"] }, { if: "transistor", then: ["light"] }] }],
  nest: 2, slots: 7, best: 6,
  say: "Два питання за коло: сходинка? транзистор?"
});

BitGame.level("4-08", {
  title: "Кільце з сходами",
  map: ["1 2t 2t 2t",
        "3t . . 3",
        "3 2t 1 2t"],
  start: { x: 0, y: 0, dir: "E" },
  commands: ["forward", "right", "jump", "light", "repeat", "if"],
  conditions: ["step", "transistor", "edge"], else: true,
  solution: [{ repeat: 9, body: [{ if: "step", then: ["jump"], else: ["forward"] }, { if: "transistor", then: ["light"] }, { if: "edge", then: ["right"] }] }],
  nest: 2, slots: 8, best: 8,
  say: "Три питання за коло: сходинка? транзистор? край?"
});

BitGame.level("4-09", {
  title: "Вежі",
  map: ["1 2 3 4t 3t 3 4 4t 4t"],
  start: { x: 0, y: 0, dir: "E" },
  commands: ["forward", "jump", "light", "repeat", "if"],
  conditions: ["transistor", "step"], else: true,
  solution: [{ repeat: 8, body: [{ if: "step", then: ["jump"], else: ["forward"] }, { if: "transistor", then: ["light"] }] }],
  nest: 2, slots: 7, best: 6,
  say: "Остання дорога: усі правила разом!"
});

/* ----- Бонус: пам'яті рівно на оптимум, і будова інша ----- */
BitGame.level("4-b1", {
  title: "Кільце навпаки",
  map: ["1 1t 1 1",
        "1t . . 1",
        "1 1t 1t 1t"],
  start: { x: 0, y: 0, dir: "S" },
  commands: ["forward", "left", "light", "repeat", "if"],
  conditions: ["transistor", "edge"],
  solution: [{ repeat: 9, body: ["forward", { if: "transistor", then: ["light"] }, { if: "edge", then: ["left"] }] }],
  nest: 2, slots: 6, best: 6,
  say: "Тепер Біт іде проти годинникової стрілки: на краю треба повертати ліворуч!"
});

BitGame.level("4-b2", {
  title: "Зигзаг",
  map: ["1 1 . . . .",
        ". 1t 1 . . .",
        ". . 1t 1 . .",
        ". . . 1 1 .",
        ". . . . 1t 1",
        ". . . . . 1t"],
  start: { x: 0, y: 0, dir: "E" },
  commands: ["forward", "left", "right", "light", "repeat", "if"],
  conditions: ["transistor"],
  solution: [{ repeat: 5, body: ["forward", "right", "forward", "left", { if: "transistor", then: ["light"] }] }],
  nest: 2, slots: 7, best: 7,
  say: "Зигзаг по сходах. Лампи є не на кожній сходинці!"
});
