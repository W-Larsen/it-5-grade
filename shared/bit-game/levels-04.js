/* Рівні уроку 4 «Біт на роздоріжжі». Формат мапи — як у levels-02.js; цикли — як у levels-03.js.
   Рівні з "if" у commands мають ще:
     conditions — які умови пропонує блок «якщо»: "transistor" (під Бітом є транзистор), "step" (попереду сходинка);
     else — чи можна додати «інакше» (за замовчуванням ні);
     solution — еталонна програма: рядок-команда, { repeat: N, body }, { if: "transistor"|"step", then: [...], else?: [...] };
                блок «якщо» разом з «інакше» = 1 комірка, + команди всередині; best = розмір solution; slots ≤ 8.
   Такі рівні — «суворі»: будь-яка помилка (стук об сходинку/край, «увімкнути» без транзистора) зупиняє програму.
   Міняючи рівень, запускай node tools/check-levels.js: він перевіряє, що solution проходить рівень, що коротшої програми немає
   і що без «якщо» (а в «Нерівних сходах» — без «інакше») рівень у пам'ять не влазить. */

/* ----- Розминка: цикл (повторення уроку 3) ----- */
BitGame.level("4-00", {
  title: "Кожен третій",
  map: ["1 1 1 1t 1 1 1t 1 1 1t"],
  start: { x: 0, y: 0, dir: "E" },
  commands: ["forward", "light", "repeat"],
  solution: [{ repeat: 9, body: ["forward", "light"] }],
  slots: 5, best: 3,
  say: "Згадай цикл: що тут повторюється?"
});

/* ----- Знайомство з «якщо» (слайд «Якщо» у грі) ----- */
BitGame.level("4-i1", {
  title: "Ліхтарі нерівно",
  map: ["1 1t 1 1t 1t 1 1 1t"],
  start: { x: 0, y: 0, dir: "E" },
  commands: ["forward", "light", "repeat", "if"],
  conditions: ["transistor"],
  solution: [{ repeat: 7, body: ["forward", { if: "transistor", then: ["light"] }] }],
  nest: 2, slots: 6, best: 4,
  say: "Транзистори стоять нерівно! Спитай: «тут транзистор?»"
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
  title: "Довга вулиця",
  map: ["1 1t 1 1 1t 1 1 1t 1t 1t"],
  start: { x: 0, y: 0, dir: "E" },
  commands: ["forward", "light", "repeat", "if"],
  conditions: ["transistor"],
  solution: [{ repeat: 9, body: ["forward", { if: "transistor", then: ["light"] }] }],
  nest: 2, slots: 6, best: 4,
  say: "Довга вулиця — та сама хитрість."
});

/* ----- Нерівні сходи: умова «попереду сходинка?» і «інакше» ----- */
BitGame.level("4-04", {
  title: "Нерівні сходи",
  map: ["1 2 2 3 2 3 4 4 3t"],
  start: { x: 0, y: 0, dir: "E" },
  commands: ["forward", "jump", "light", "repeat", "if"],
  conditions: ["step"], else: true,
  solution: [{ repeat: 8, body: [{ if: "step", then: ["jump"], else: ["forward"] }] }, "light"],
  nest: 2, slots: 6, best: 5,
  say: "Сходинка — стрибай, рівно — іди. Додай «інакше»!"
});

BitGame.level("4-05", {
  title: "Рівно чи сходинка?",
  map: ["1 1 2 3 3 4 3 2 2t"],
  start: { x: 0, y: 0, dir: "E" },
  commands: ["forward", "jump", "light", "repeat", "if"],
  conditions: ["step"], else: true,
  solution: [{ repeat: 8, body: [{ if: "step", then: ["jump"], else: ["forward"] }] }, "light"],
  nest: 2, slots: 6, best: 5,
  say: "Вгору й униз — стрибок. Рівно — вперед."
});

BitGame.level("4-06", {
  title: "Пагорб",
  map: ["1 1 2 2 3 4 4 3 2t"],
  start: { x: 0, y: 0, dir: "E" },
  commands: ["forward", "jump", "light", "repeat", "if"],
  conditions: ["step"], else: true,
  solution: [{ repeat: 8, body: [{ if: "step", then: ["jump"], else: ["forward"] }] }, "light"],
  nest: 2, slots: 6, best: 5,
  say: "Пагорб: нагору і з нього."
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
  title: "Гірка з ліхтарями",
  map: ["1 2 3t 2t 1t 1 2 2t 2t"],
  start: { x: 0, y: 0, dir: "E" },
  commands: ["forward", "jump", "light", "repeat", "if"],
  conditions: ["transistor", "step"], else: true,
  solution: [{ repeat: 8, body: [{ if: "step", then: ["jump"], else: ["forward"] }, { if: "transistor", then: ["light"] }] }],
  nest: 2, slots: 7, best: 6,
  say: "Вгору, вниз — і скрізь дивись під ноги."
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

/* ----- Бонус: пам'яті рівно на оптимум ----- */
BitGame.level("4-b1", {
  title: "Тісна пам'ять 1",
  map: ["1 2t 3 3 4t 4 3 2t 1t"],
  start: { x: 0, y: 0, dir: "E" },
  commands: ["forward", "jump", "light", "repeat", "if"],
  conditions: ["transistor", "step"], else: true,
  solution: [{ repeat: 8, body: [{ if: "step", then: ["jump"], else: ["forward"] }, { if: "transistor", then: ["light"] }] }],
  nest: 2, slots: 6, best: 6,
  say: "Пам'яті рівно стільки, скільки треба!"
});

BitGame.level("4-b2", {
  title: "Тісна пам'ять 2",
  map: ["1 1 2t 2 3 3t 4t 3 3t"],
  start: { x: 0, y: 0, dir: "E" },
  commands: ["forward", "jump", "light", "repeat", "if"],
  conditions: ["transistor", "step"], else: true,
  solution: [{ repeat: 8, body: [{ if: "step", then: ["jump"], else: ["forward"] }, { if: "transistor", then: ["light"] }] }],
  nest: 2, slots: 6, best: 6,
  say: "Ще тісніше. Ти зможеш!"
});
