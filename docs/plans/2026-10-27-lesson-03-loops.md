# Урок 3 «Біт у циклі» — план реалізації

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Заняття 3: цикли в грі «Біт-програміст» (блок «🔁 ×N», вкладені цикли, смужка «ПАМ'ЯТЬ») і сайт-презентація «Біт у циклі» з «вау»-теорією про пам'ять, лічильник команд і стрибок назад.

**Architecture:** Програма стає деревом (`"forward"` або `{ repeat: N, body: [...] }`). Чисті функції в `engine.js` розгортають її в плаский список кроків, тож анімація й «Крок» працюють як в уроці 2. Компонент `<bit-game>` отримує другий режим панелі («пам'ять»), він вмикається лише для рівнів з `repeat`. Найкоротшу програму з циклами шукає `tools/program-search.js` (лише Node), і `check-levels.js` перевіряє за ним поле `solution` у рівнях. Урок 3 — нова сторінка на каркасі `shared/deck/`.

**Tech Stack:** Vanilla HTML/CSS/JS (звичайні `<script>`, не модулі), inline SVG, Web Audio; Node `node:test`; Python `tools/build-site.py` + сервер `site` з `.claude/launch.json`; GitHub Pages.

**Spec:** [`docs/specs/2026-10-27-lesson-03-loops.md`](../specs/2026-10-27-lesson-03-loops.md). Правила проєкту: [`CLAUDE.md`](../../CLAUDE.md). Попередній план (як влаштовано рушій і урок 2): [`2026-10-20-lesson-02-bit-processor.md`](2026-10-20-lesson-02-bit-processor.md).

**Гілка:** `lesson-03-loops`, відгалужена від `lesson-02-bit-processor` (урок 2 ще не злитий у `main`).

## Global Constraints

- Увесь текст для учня — українською; англійська лише в режимі коду EN.
- Без фреймворків, збірки й залежностей; без ES-модулів.
- `lesson-03-loops/index.html` — **тіло сторінки без `<!doctype>`/`<head>`**, на початку `<meta charset="utf-8">`; є `<a class="home-link" href="../">← Усі уроки</a>`.
- `localStorage` — лише в `try/catch`. Ключ гри `bitgame:v1` (спільний); префікс уроку 3 — `bit-loop:`.
- Жодних акаунтів, аналітики, даних учня.
- Цільовий пристрій: iPad Safari горизонтально (перевірка у вікні 1180×820); Mac: стрілки, `F`, `M`.
- Стиль «комікс-наліпки», кольори/шрифти — CSS-змінні як в уроці 2.
- Код циклу: укр. `повтори(3) {` … `}`, EN `repeat(3) {` … `}`; тіло з відступом 4 пробіли.
- Число повторів N: 2–9 (новий цикл — `×2`). Вкладеність ≤ 2 (`nest: 1 | 2`, за замовчуванням 1).
- Комірки пам'яті: блок циклу — 1, кожна команда — 1. `slots` ≤ 12 для всіх рівнів; для рівнів з `repeat` — ≤ 8.
- Зірки — як в уроці 2, але від кількості комірок: 3 — ≤ `best`; 2 — ≤ `best + 2`; 1 — інакше.
- Рівні уроку 2 і їхня розкладка (сітка клітинок) не змінюються.
- Перед кожним комітом рушія/рівнів: `node --test tools/engine.test.js tools/check-levels.test.js tools/program-search.test.js` і `node tools/check-levels.js`.

## Review Focus

1. **✕ на циклі, всередині якого стоїть курсор** (у тому числі на зовнішньому циклі, коли курсор у вкладеному) → цикл зникає, курсор переходить у найближчий наявний контейнер, без помилки. Тест: Task 1 `fixCursor after removing the loop that holds the cursor`.
2. **Дуже довга розгорнута програма** (`повтори(9){повтори(9){вперед()}}` біля стіни) → Біт стукається, інтерфейс не зависає, ⟲ і зміна рівня зупиняють виконання миттєво. Тест: Task 6 і Task 7, кроки «довга програма».
3. **Перемикання EN/УКР або ⟲ посеред покрокового виконання циклу** → підсвітка лишається на правильному рядку й «колі», після ⟲ ці мітки зникають. Тест: Task 6, крок «покроково».
4. **Пам'ять заповнена** → і 🔁, і команда дають buzz та «Пам'ять заповнена!». 🔁 неактивна, коли курсор на глибині `nest`. Тест: Task 5.
5. **Регресія уроку 2** → рівні 2-xx мають ту саму сітку й поведінку, підказка з BFS, `bitgame:win` як раніше (плюс поле `program`). Тест: Task 2 (тести уроку 2 без змін), Task 6 і Task 12 (перевірка в браузері).

---

## Карта файлів

| Файл | Що змінюється |
|---|---|
| `shared/bit-game/engine.js` | Програма-дерево: `size`, `depth`, `expand`, `codeLines`, `validateProgram`, `addItem`/`removeItem`/`setRepeat`/`fixCursor`, `hasEmptyLoop`, `findRepeat`; `parseLevel` з `repeat`/`nest`/`solution`; `run` через `expand`; `solve` лише по примітивах; `CODE.*.repeat` |
| `tools/program-search.js` | `shortestProgram(level, opts)` — пошук найкоротшої програми з циклами (Node) |
| `tools/program-search.test.js` | Тести пошуку |
| `tools/check-levels.js` | Правила 1–5 для рівнів з `repeat`, нові відступи `marginFor` |
| `tools/engine.test.js`, `tools/check-levels.test.js` | Нові тести |
| `shared/bit-game/bit-game.js` | Режим «пам'ять»: блоки, курсор, ×N, ✕, 🔁; виконання за кроками; «коло», «⤴ стрибок назад», підказка з `solution`, `program` у `bitgame:win` |
| `shared/bit-game/levels-03.js` | `3-00`, `3-i1`, `3-01`…`3-09`, `3-b1`, `3-b2` |
| `lesson-03-loops/index.html` | Презентація уроку 3 |
| `lesson-03-loops/teacher-notes.md` | Конспект |
| `game/index.html`, `site/index.html`, `README.md`, spec | Набори й картка уроку 3, посилання |

---

### Task 0: Документи на гілці

- [ ] **Step 1:** Перевірити, що гілка — `lesson-03-loops`: `git branch --show-current`.
- [ ] **Step 2:** Закомітити spec, план і рядок у `course-plan.md` (не додавати `lesson-02-processor/theory.pdf`).

```bash
git add docs/specs/2026-10-27-lesson-03-loops.md docs/plans/2026-10-27-lesson-03-loops.md course-plan.md
git commit -m "docs(lesson-03): spec and implementation plan for loops"
```

---

### Task 1: Рушій — програма-дерево (чисті функції)

**Files:**
- Modify: `shared/bit-game/engine.js`
- Test: `tools/engine.test.js`

**Interfaces — Produces** (усе на `BitGame`, нічого не мутує вхідні дані):
- `Program = Item[]`; `Item = string /* команда з COMMANDS */ | { repeat: number, body: Program }`.
- `Path = number[]` — індекси від верхнього рівня, напр. `[0, 1]` = другий елемент тіла циклу, що стоїть першим. `Cursor = Path` контейнера: `[]` — верхній рівень, `[i]` — тіло циклу `program[i]`, `[i, j]` — тіло вкладеного циклу.
- `size(program): number` — комірки (цикл = 1 + size(body)).
- `depth(program): number` — 0 без циклів, 1, 2 ….
- `expand(program): Step[]`, де `Step = { cmd: string, path: Path, laps: { path: Path, lap: number, of: number }[] /* від зовнішнього циклу до внутрішнього, lap з 1 */, jumps: Path[] /* цикли, що після цього кроку стрибають назад, від внутрішнього до зовнішнього */ }`.
- `codeLines(program, lang: "uk" | "en"): { text: string, depth: number, path: Path, kind: "cmd" | "open" | "close" }[]` — `open`: `"повтори(3) {"` / `"repeat(3) {"`; `close`: `"}"` з тим самим `path`, що й `open`; `cmd`: `CODE[lang][cmd]`.
- `validateProgram(program, nest: number, commands: string[]): void` — кидає `Error`, якщо: невідома команда або не з `commands`; `repeat` не ціле 2–9; `body` не масив; глибина > `nest`.
- `addItem(program, cursor, item): Program` — додає в кінець контейнера.
- `removeItem(program, path): Program` — прибирає елемент (цикл — разом із вмістом).
- `setRepeat(program, path, n): Program`.
- `fixCursor(program, cursor): Cursor` — найдовший префікс `cursor`, що досі веде до циклу.
- `hasEmptyLoop(program): boolean`.
- `findRepeat(cmds: string[]): { start: number, len: number, times: number } | null` — шматок довжиною ≥ 2, що йде ≥ 2 рази поспіль. Перемагає найбільше покриття `len × times`, при рівності — довший `len`, потім менший `start`.
- Константи: `BitGame.MIN_REPEAT = 2`, `BitGame.MAX_REPEAT = 9`.

- [ ] **Step 1: Write the failing tests** у `tools/engine.test.js`:

```js
const loop = (n, ...body) => ({ repeat: n, body });

test("size counts a loop as one cell plus its body", () => {
  assert.equal(BitGame.size([]), 0);
  assert.equal(BitGame.size(["forward", "light"]), 2);
  assert.equal(BitGame.size([loop(4, loop(3, "forward"), "right", "light")]), 5);
});

test("depth of flat, single and nested programs", () => {
  assert.equal(BitGame.depth(["forward"]), 0);
  assert.equal(BitGame.depth([loop(2, "forward")]), 1);
  assert.equal(BitGame.depth(["light", loop(2, loop(2, "forward"))]), 2);
});

test("expand unrolls loops with paths, laps and jump-backs", () => {
  const s = BitGame.expand(["light", loop(2, "forward", "right")]);
  assert.deepEqual(s.map((x) => x.cmd), ["light", "forward", "right", "forward", "right"]);
  assert.deepEqual(s[3].path, [1, 0]);
  assert.deepEqual(s[3].laps, [{ path: [1], lap: 2, of: 2 }]);
  assert.deepEqual(s[2].jumps, [[1]]);
  assert.deepEqual(s[4].jumps, []);
});

test("expand nested: inner laps restart on every outer lap", () => {
  const s = BitGame.expand([loop(2, loop(3, "forward"), "right")]);
  assert.equal(s.length, 8);
  assert.deepEqual(s[4].laps, [{ path: [0], lap: 2, of: 2 }, { path: [0, 0], lap: 1, of: 3 }]);
  assert.deepEqual(s[2].jumps, []);            // inner loop ends its 3rd lap: no jump
  assert.deepEqual(s[3].jumps, [[0]]);         // "right" ends outer lap 1
  assert.deepEqual(s[1].jumps, [[0, 0]]);
});

test("expand of an empty loop yields no steps", () => {
  assert.deepEqual(BitGame.expand([loop(3)]), []);
  assert.equal(BitGame.hasEmptyLoop([loop(3)]), true);
  assert.equal(BitGame.hasEmptyLoop([loop(3, "forward")]), false);
});

test("codeLines writes braces and indentation in both languages", () => {
  const p = [loop(3, "forward"), "light"];
  assert.deepEqual(BitGame.codeLines(p, "uk").map((l) => [l.depth, l.text, l.kind]), [
    [0, "повтори(3) {", "open"], [1, "вперед()", "cmd"], [0, "}", "close"], [0, "увімкнути()", "cmd"]
  ]);
  assert.equal(BitGame.codeLines(p, "en")[0].text, "repeat(3) {");
  assert.deepEqual(BitGame.codeLines(p, "uk")[2].path, [0]);
});

test("validateProgram rejects bad counts, depth and commands", () => {
  const all = ["forward", "light", "repeat"];
  assert.doesNotThrow(() => BitGame.validateProgram([loop(9, "forward")], 1, all));
  assert.throws(() => BitGame.validateProgram([loop(1, "forward")], 1, all));
  assert.throws(() => BitGame.validateProgram([loop(10, "forward")], 1, all));
  assert.throws(() => BitGame.validateProgram([loop(2, loop(2, "forward"))], 1, all));
  assert.throws(() => BitGame.validateProgram(["jump"], 1, all));
  assert.throws(() => BitGame.validateProgram([{ repeat: 2 }], 1, all));
});

test("addItem appends into the cursor's container without mutating", () => {
  const p0 = [loop(2)];
  const p1 = BitGame.addItem(p0, [0], "forward");
  assert.deepEqual(p1, [loop(2, "forward")]);
  assert.deepEqual(p0, [loop(2)]);
  assert.deepEqual(BitGame.addItem(p1, [], "light"), [loop(2, "forward"), "light"]);
});

test("removeItem and setRepeat work by path", () => {
  const p = [loop(2, "forward", loop(3, "right")), "light"];
  assert.deepEqual(BitGame.removeItem(p, [0, 0]), [loop(2, loop(3, "right")), "light"]);
  assert.deepEqual(BitGame.removeItem(p, [0]), ["light"]);
  assert.equal(BitGame.setRepeat(p, [0, 1], 7)[0].body[1].repeat, 7);
});

test("fixCursor after removing the loop that holds the cursor", () => {
  const p = BitGame.removeItem([loop(2, loop(3, "right"))], [0]);
  assert.deepEqual(BitGame.fixCursor(p, [0, 0]), []);
  const q = BitGame.removeItem([loop(2, "forward", loop(3, "right"))], [0, 1]);
  assert.deepEqual(BitGame.fixCursor(q, [0, 1]), [0]);
});

test("findRepeat finds the warm-up zigzag repetition", () => {
  const f = "forward", r = "right", l = "left";
  assert.deepEqual(BitGame.findRepeat([f, r, f, l, f, r, f, l, f, r, f, "light"]), { start: 0, len: 4, times: 2 });
  assert.deepEqual(BitGame.findRepeat([f, f, f, "light"]), null);   // len 1 does not count
  assert.deepEqual(BitGame.findRepeat([f, "jump", f, "jump", f, "jump"]), { start: 0, len: 2, times: 3 });
  assert.equal(BitGame.findRepeat([f, r, l]), null);
});
```

- [ ] **Step 2: Run** `node --test tools/engine.test.js` — Expected: нові тести FAIL (`BitGame.size is not a function` тощо), старі PASS.
- [ ] **Step 3: Implement** у `engine.js` усі функції з Interfaces. `findRepeat` — перебір `start`, `len` (2…⌊n/2⌋) і рахунок повторів поспіль; n ≤ 12, тож квадратичний перебір підходить. Додати експорти на `BitGame`.
- [ ] **Step 4: Run** `node --test tools/engine.test.js` — Expected: усе PASS.
- [ ] **Step 5: Commit** `feat(bit-game): program trees — expand, size, code lines, editing helpers, findRepeat`

---

### Task 2: Рушій — рівні з циклами

**Files:**
- Modify: `shared/bit-game/engine.js`
- Test: `tools/engine.test.js`

**Interfaces:**
- Consumes: Task 1 (`expand`, `size`, `validateProgram`).
- Produces:
  - `parseLevel` приймає `"repeat"` у `commands`; повертає ще `nest: 1 | 2` і `solution: Program | null`. Якщо є `repeat`, то `solution` обов'язкове й проходить `validateProgram(solution, nest, commands)`, а `slots` ≤ 8. Без `repeat` поля `nest`/`solution` у визначенні — помилка.
  - `run(level, program: Program)` → `{ won, trace }`, де елемент `trace` = `{ cmd, event, state, path, laps }`. Плаский масив рядків працює як раніше.
  - `stars(level, cells, won)` — без змін сигнатури; викликачі передають `size(program)`.
  - `solve(level)` — BFS лише по примітивних командах рівня (без `"repeat"`).
  - `CODE.uk.repeat = "повтори"`, `CODE.en.repeat = "repeat"`.
  - `BitGame.LOOP_MAX_SLOTS = 8`.

- [ ] **Step 1: Write the failing tests:**

```js
const LOOPS = ALL.concat("repeat");
const loopDef = (over) => def(Object.assign({
  map: ["1 1 1 1t"], commands: LOOPS, slots: 5, best: 3,
  solution: [{ repeat: 3, body: ["forward"] }, "light"]
}, over));

test("parseLevel accepts repeat with nest and solution", () => {
  const lv = BitGame.parseLevel("l", loopDef({ nest: 2 }));
  assert.equal(lv.nest, 2);
  assert.deepEqual(lv.solution, [{ repeat: 3, body: ["forward"] }, "light"]);
  assert.equal(BitGame.parseLevel("l", loopDef()).nest, 1);
  assert.equal(L.solution, null);
});

test("parseLevel rejects broken loop levels", () => {
  const bad = (over) => assert.throws(() => BitGame.parseLevel("b", loopDef(over)));
  bad({ solution: undefined });
  bad({ solution: [{ repeat: 2, body: [{ repeat: 2, body: ["forward"] }] }] });   // depth 2 > nest 1
  bad({ nest: 3 });
  bad({ slots: 9, best: 3 });                                                    // > LOOP_MAX_SLOTS
  assert.throws(() => BitGame.parseLevel("b", def({ solution: ["forward"] }))); // no repeat in commands
});

test("run executes a loop program and reports paths and laps", () => {
  const lv = BitGame.parseLevel("l", loopDef());
  const r = BitGame.run(lv, lv.solution);
  assert.equal(r.won, true);
  assert.equal(r.trace.length, 4);
  assert.deepEqual(r.trace[2].laps, [{ path: [0], lap: 3, of: 3 }]);
  assert.deepEqual(r.trace[3].path, [1]);
});

test("solve ignores repeat and finds the flat optimum", () => {
  const lv = BitGame.parseLevel("l", loopDef());
  assert.deepEqual(BitGame.solve(lv), ["forward", "forward", "forward", "light"]);
});

test("CODE has a loop keyword in both languages", () => {
  assert.equal(BitGame.CODE.uk.repeat, "повтори");
  assert.equal(BitGame.CODE.en.repeat, "repeat");
});
```

- [ ] **Step 2: Run** `node --test tools/engine.test.js` — Expected: нові FAIL; тести уроку 2 PASS.
- [ ] **Step 3: Implement** зміни з Interfaces (`run` — цикл по `expand(program)`, зупинка після кроку перемоги, як раніше).
- [ ] **Step 4: Run** `node --test tools/engine.test.js tools/check-levels.test.js` і `node tools/check-levels.js` — Expected: усе PASS, рівні уроку 2 ✓.
- [ ] **Step 5: Commit** `feat(bit-game): levels with repeat — nest, solution, run through expand`

---

### Task 3: Пошук найкоротшої програми з циклами

**Files:**
- Create: `tools/program-search.js`, `tools/program-search.test.js`

**Interfaces:**
- Consumes: `BitGame.step`, `initialState`, `isWon`, `size`, `MIN_REPEAT`, `MAX_REPEAT` з Task 1–2.
- Produces: `module.exports = { shortestProgram }`;
  `shortestProgram(level, { maxSize: number, nest: number }): Program | null` — найкоротша (за `size`) програма, що перемагає, серед програм розміру ≤ `maxSize` і глибини ≤ `nest` з примітивами `level.commands` без `"repeat"`; `null`, якщо такої немає. Цикли лише якщо `level.commands` містить `"repeat"`.

**Алгоритм** (не визначається сигнатурою): програма — послідовність елементів верхнього рівня, і кожен елемент детерміновано переводить стан у стан. Тому пошук іде **ітеративним поглибленням за розміром** `S = 1…maxSize`, DFS по елементах верхнього рівня з відсіканням `seen[stateKey] >= remaining` (той самий стан з не меншим залишком уже перевірено на цьому `S`). Елементи на кожному кроці:
- примітиви (вартість 1);
- цикли `repeat N` для N = 2…9 з тілом, яке перебирається рекурсивно як послідовність елементів глибини ≤ `nest − 1` (вартість 1 + size(тіла) ≤ `remaining`); тіло виконується N разів від поточного стану.

Додаткові відсікання: тіло циклу не порожнє; у тілі немає підряд `left,right` / `right,left`; кроків виконання ≤ 2000 на програму; перемога посеред виконання елемента — це перемога (`run` зупиняється так само). Ключ стану — `stateKey` з рушія (експортувати як `BitGame.stateKey`, якщо ще не експортований).

- [ ] **Step 1: Write the failing tests:**

```js
const BitGame = require("../shared/bit-game/engine.js");
const { shortestProgram } = require("./program-search.js");
const LOOPS = ["forward", "left", "right", "jump", "light", "repeat"];
const lv = (id, map, over) => BitGame.parseLevel(id, Object.assign({
  title: "T", map, start: { x: 0, y: 0, dir: "E" }, commands: LOOPS, slots: 8, best: 1,
  solution: [{ repeat: 2, body: ["forward"] }]
}, over));

test("finds a loop for a long corridor", () => {
  const p = shortestProgram(lv("c", ["1 1 1 1 1 1 1 1t"]), { maxSize: 6, nest: 1 });
  assert.equal(BitGame.size(p), 3);
  assert.equal(BitGame.run(lv("c", ["1 1 1 1 1 1 1 1t"]), p).won, true);
});

test("nesting beats a flat loop on a 5×5 ring with lit corners", () => {
  const ring = ["1t 1 1 1 1t", "1 . . . 1", "1 . . . 1", "1 . . . 1", "1t 1 1 1 1t"];
  assert.equal(BitGame.size(shortestProgram(lv("r", ring, { nest: 2 }), { maxSize: 7, nest: 2 })), 5);
  assert.equal(BitGame.size(shortestProgram(lv("r", ring, { nest: 2 }), { maxSize: 7, nest: 1 })), 7);
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
```

- [ ] **Step 2: Run** `node --test tools/program-search.test.js` — Expected: FAIL (`Cannot find module './program-search.js'`).
- [ ] **Step 3: Implement** `tools/program-search.js` за алгоритмом вище.
- [ ] **Step 4: Run** `node --test tools/program-search.test.js` — Expected: PASS. Якщо тест швидкості падає, додати відсікання (повторні стани всередині тіла, однакові тіла з різним N, що дають той самий стан), а не послаблювати тест.
- [ ] **Step 5: Commit** `feat(tools): shortest program search with loops`

---

### Task 4: check-levels — правила для рівнів з циклами

**Files:**
- Modify: `tools/check-levels.js`, `tools/check-levels.test.js`

**Interfaces:**
- Consumes: `shortestProgram` (Task 3), `BitGame.run`/`size`/`solve`.
- Produces: `checkLevel(lv, seen)` і `marginFor(id)` (ті самі експорти). Для рівня з `"repeat"`:
  1. `run(lv, lv.solution).won` і `size(solution) === best`, інакше `"solution …"`.
  2. `shortestProgram(lv, { maxSize: best - 1, nest: lv.nest })` повертає `null`, інакше `"best N but a shorter program exists: <codeLines uk через пробіл>"`.
  3. `solve(lv).length > slots`, інакше `"solvable without a loop in N cells"`.
  4. Якщо `nest === 2` і id не бонус (`-b\d+`): `shortestProgram(lv, { maxSize: slots, nest: 1 })` — `null`, інакше `"solvable without nesting: …"`.
  5. `slots >= best + marginFor(id)`.
  - Правило «нова команда має бути в оптимумі» для `"repeat"` перевіряє, чи є цикл у `solution`.
  - `marginFor`: 2 для `^2-0[1-6]$`, `^3-0[1-3]$`, `^3-i\d$`; 0 для `-b\d+$` і `^3-00$`; 1 інакше.

- [ ] **Step 1: Write the failing tests** (у `check-levels.test.js`):

```js
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
  assert.match(checkLevel(mkLoop("3-01", { best: 4, slots: 6, solution: ["forward", { repeat: 6, body: ["forward"] }, "light"] }), ALL).join("\n"), /shorter/);
});

test("a level solvable without a loop is reported", () => {
  const lv = mkLoop("3-01", { map: ["1 1 1t"], slots: 5, best: 3, solution: [{ repeat: 2, body: ["forward"] }, "light"] });
  assert.match(checkLevel(lv, ALL).join("\n"), /without a loop/);
});

test("a nested-set level solvable with one loop level is reported", () => {
  const p = checkLevel(mkLoop("3-07", { nest: 2 }), ALL);
  assert.equal(p.length, 1);
  assert.match(p[0], /without nesting/);
  assert.deepEqual(checkLevel(mkLoop("3-b1", { nest: 2, slots: 3 }), ALL), []);   // bonus: rule 4 skipped
});

test("margins for lesson 3 ids", () => {
  assert.equal(marginFor("3-01"), 2);
  assert.equal(marginFor("3-i1"), 2);
  assert.equal(marginFor("3-00"), 0);
  assert.equal(marginFor("3-05"), 1);
  assert.equal(marginFor("3-b2"), 0);
});
```

- [ ] **Step 2: Run** `node --test tools/check-levels.test.js` — Expected: нові FAIL.
- [ ] **Step 3: Implement** правила й `marginFor`; у `main()` для рівнів з циклами друкувати `— best N, slots M, solution <код>`.
- [ ] **Step 4: Run** `node --test tools/engine.test.js tools/check-levels.test.js tools/program-search.test.js` і `node tools/check-levels.js` — Expected: PASS; рівні уроку 2 ✓.
- [ ] **Step 5:** Додати `tools/program-search.test.js` до команди тестів у `CLAUDE.md` («Перед пушем»). CI (`pages.yml`) запускає лише `node tools/check-levels.js` — його не змінювати.
- [ ] **Step 6: Commit** `feat(tools): check loop levels — solution, optimum, loop and nesting required`

---

### Task 5: Компонент — режим «пам'ять» (вигляд і редагування)

**Files:**
- Modify: `shared/bit-game/bit-game.js`
- Create: `shared/bit-game/levels-03.js` (поки два рівні — для перевірки; повний набір у Task 7)

**Interfaces:**
- Consumes: `size`, `codeLines`, `addItem`, `removeItem`, `setRepeat`, `fixCursor`, `LOOP_MAX_SLOTS`, `MAX_REPEAT` (Task 1–2).
- Produces (усередині компонента; наступні таски спираються на ці назви):
  - `this.tree: boolean` = рівень пропонує `"repeat"`; `this.program: Program`; `this.cursor: Cursor`.
  - DOM у Shadow root: `.mem` (смужка: `.cell` × `slots`, `.cell.full` — зайняті; текст `ПАМ'ЯТЬ` і `5/8` у `.count`); `.prog` (контейнер верхнього рівня); `.chip[data-path]` (команда, тап — прибрати); `.loop[data-path]` з `.loop-head` (іконка 🔁, `button.times` `×N`, `button.del` `✕`), `.loop-body`, `.lap` (порожній поза виконанням); `.caret` — курсор `▏+` у кінці контейнера, на який вказує `this.cursor`.
  - Пульт: кнопка `.cmd[data-cmd="repeat"]`, підпис «цикл», колір `#0E9C8D`, власна іконка-петля 24×24 у `ICONS.repeat`.
  - Без `repeat` — стара сітка `.slots` без жодних змін (урок 2).

**Поведінка** (зі spec, розділ «Цикл у грі»):
- 🔁 → `addItem(program, cursor, { repeat: 2, body: [] })`, курсор переходить у новий цикл.
- Команда → `addItem` у контейнер курсора.
- Тап по `.loop-body` (не по `.chip`) → курсор = шлях цього циклу; тап по порожньому місцю `.prog` → курсор `[]`.
- Тап `.times` → N + 1, після 9 → 2 (`setRepeat`).
- Тап `.chip` → `removeItem`; `.del` → `removeItem` циклу; після кожного прибирання `cursor = fixCursor(...)`.
- `Backspace`: прибрати останній елемент контейнера курсора; якщо контейнер — порожній цикл, прибрати цей цикл і вийти до батька.
- `size(program) >= slots` → нічого не додається: buzz, `.count` трусить, Біт: «Пам'ять заповнена!».
- 🔁 `disabled`, коли `cursor.length >= level.nest`.
- Будь-яка правка = `edited()` (⟲), як в уроці 2. Під час виконання все редагування заблоковане (`syncUI` охоплює `.chip,.times,.del,.loop-body,.cmd`).
- Код: `codeLines(program, codeLang)`, відступ — `depth` × 4 пробіли (`white-space:pre`), нумерація рядків; порожня програма — той самий підпис-підказка, що в уроці 2.

**levels-03.js на цьому етапі:** `3-i1` і `3-01` з Task 7 (мапи й значення звідти).

- [ ] **Step 1:** Тимчасова тестова сторінка `scratch` не потрібна: підключити `levels-03.js` у `game/index.html` (набір «Урок 3 (чернетка)» з `3-i1,3-01` наприкінці `SETS`). Зібрати: `python tools/build-site.py`, `preview_start` з `name: "site"`, відкрити `/game/`, вікно 1180×820.
- [ ] **Step 2: Implement** вигляд і редагування з Interfaces.
- [ ] **Step 3: Перевірити в браузері** (дотиками/кліками, `read_page` і скриншот):
  - 🔁, вперед ×1, тап під блоком, увімкнути → код `повтори(2) {` / `    вперед()` / `}` / `увімкнути()`, пам'ять `4/8`… (`3/8` для `3-i1`: цикл + вперед + увімкнути);
  - `×2` → тапами до `×9` → `×2`;
  - ✕ на циклі з курсором усередині → цикл зник, курсор на верхньому рівні, помилок у консолі немає;
  - пам'ять повна → buzz, «Пам'ять заповнена!», нічого не додалось;
  - EN → `repeat(2) {`;
  - рівень 2-01 на тій самій сторінці — стара сітка, усе як раніше.
- [ ] **Step 4:** `node --test tools/engine.test.js tools/check-levels.test.js tools/program-search.test.js` і `node tools/check-levels.js` — PASS.
- [ ] **Step 5: Commit** `feat(bit-game): memory panel with loop blocks, cursor, ×N and ✕`

---

### Task 6: Компонент — виконання циклів, підказка, перемога

**Files:**
- Modify: `shared/bit-game/bit-game.js`

**Interfaces:**
- Consumes: `expand`, `hasEmptyLoop`, `size`, `codeLines`, `stars` + DOM з Task 5.
- Produces:
  - `bitgame:win` → `detail: { id, stars, best, program }` (`program` — глибока копія; для рівнів уроку 2 — плаский масив, як і раніше).
  - CSS-клас `.loop.jump` (≈ 500 мс): «⤴» над рамкою + короткий звук `Sound.pop`.

**Поведінка:**
- `run`/`stepOnce` працюють по `this.steps = B.expand(this.program)` (у режимі сітки `expand` плаского масиву дає ті самі кроки, тож можна використати один шлях для обох режимів). `stepIdx` — індекс у `steps`.
- Підсвітка поточного кроку: `.chip` за `step.path` + рядок коду з тим самим `path` (`.ln.now`); кожен `.loop` з `step.laps` показує в `.lap` «коло 2/3»; після кроку з непорожнім `jumps` кожен такий `.loop` отримує `.jump`.
- `resetRun` очищає `.lap`, `.now`, `.jump`.
- Перед запуском, якщо `hasEmptyLoop(program)`, Біт каже «У циклі нічого повторювати» (виконання йде далі; програма лише з порожніх циклів → одразу `lose()`).
- Зірки: `B.stars(lv, B.size(this.program), true)`; у картці перемоги для `tree`: «Комірок: n» / «Можна коротше: best.» / «Найкоротша програма!».
- Підказка: якщо `level.solution`, перші 2 рядки `codeLines(solution, codeLang)` як `.hint-chip` (без іконки для `open`, з «🔁» на початку); інакше — як в уроці 2 з `solve`.
- Перемикач EN посеред покрокового виконання перемальовує код з тією самою підсвіткою (крок `stepIdx − 1`).

- [ ] **Step 1: Implement** поведінку.
- [ ] **Step 2: Перевірити в браузері** на `3-01` (`/game/`, 1180×820):
  - еталонний розв'язок → Біт іде, «коло 1/7 … 7/7», рамка блимає «⤴» між колами, транзистор, «Чип ожив!», 3 зірки, «Комірок: 3»;
  - **покроково:** «⏭ Крок» ×3 → підсвічено `вперед()` у циклі, «коло 3/7»; EN → підсвітка та сама; ⟲ → мітки зникли;
  - **довга програма:** `повтори(9){ вперед() праворуч() вперед() }` на `3-01` → Біт кружляє й стукається, сторінка відповідає, ⟲ і перемикач рівня зупиняють одразу (вкладений варіант — у Task 7);
  - порожній цикл → «У циклі нічого повторювати»;
  - 2 невдачі → «💡 Підказка» показує `🔁 повтори(7) {`, `вперед()`;
  - `document.addEventListener("bitgame:win", e => console.log(JSON.stringify(e.detail)))` у `javascript_tool` → є `program`;
  - рівні 2-01…2-03: виконання, підказка, зірки як раніше.
- [ ] **Step 3:** Тести й `check-levels` — PASS.
- [ ] **Step 4: Commit** `feat(bit-game): run loops step by step — laps, jump-back flash, hint from solution`

---

### Task 7: Рівні уроку 3

**Files:**
- Modify: `shared/bit-game/levels-03.js` (повний набір)

**Interfaces:**
- Consumes: формат рівня з Task 2; `check-levels` (Task 4) — остаточний суддя `best`/`slots`.
- Produces: id у порядку реєстрації: `3-00`, `3-i1`, `3-01`…`3-09`, `3-b1`, `3-b2` (на них посилаються слайди й `game/index.html`).

Шапка файлу — як у `levels-02.js` (формат мапи) + рядок про `solution`, `nest`, `best = size(solution)`. Усі рівні з циклами мають `commands: ["forward","left","right","jump","light","repeat"]`, `3-00` — без `repeat`. Кандидати (позначені *очікувані* значення; якщо `check-levels` знаходить коротший розв'язок — або прийняти новий `best` і `solution`, або змінити мапу так, щоб рівень і далі навчав свого: «Цикл у циклі» мусить проходити правило 4):

| id | title | map | start | solution (очік.) | best | slots | say |
|---|---|---|---|---|---|---|---|
| 3-00 | Довгі сходи | `1 1 . .` / `. 1 1 .` / `. . 1 1` / `. . . 1t` | 0,0 E | 12 команд без циклу | 12 | 12 | «Згадай урок 2: дійди до транзистора!» |
| 3-i1 | Довгий коридор | `1 1 1 1 1 1 1 1 1 1t` | 0,0 E | `повтори(9){вперед()} увімкнути()` | 3 | 8 | «Пам'яті мало! Спробуй 🔁 цикл.» |
| 3-01 | Коридор | `1 1 1 1 1 1 1 1t` | 0,0 E | `повтори(7){вперед()} увімкнути()` | 3 | 5 | «Повтори крок кілька разів!» |
| 3-02 | Гірка | `1 2 3 4 3 2 1t` | 0,0 E | `повтори(6){стрибнути()} увімкнути()` | 3 | 5 | «Вгору й униз — тими самими стрибками.» |
| 3-03 | Сходинки | `1 1 2 2 3 3 4t` | 0,0 E | `повтори(3){вперед() стрибнути()} увімкнути()` | 4 | 6 | «У циклі може бути кілька команд.» |
| 3-04 | Довгий зигзаг | діагональ 5×5: рядок y має `1` на x=y і x=y+1, останній — лише `1t` на x=4 | 0,0 E | `повтори(4){вперед() праворуч() вперед() ліворуч()} увімкнути()` | 6 | 7 | «Пам'ятаєш сходи з розминки?» |
| 3-05 | Квадрат навколо вежі | `1t 1 1t` / `1 3 1` / `1t 1 1t` | 0,0 E | `повтори(4){вперед() вперед() праворуч() увімкнути()}` | 5 | 6 | «Обійди вежу й увімкни кожен кут.» |
| 3-06 | До й після циклу | `1 1 1 1 1 1 2t` | 0,0 N | `праворуч() повтори(5){вперед()} стрибнути() увімкнути()` | 5 | 6 | «Деякі команди — до циклу, деякі — після.» |
| 3-07 | Великий квадрат | кільце 5×5, кути `1t`, всередині `.` | 0,0 E | `повтори(4){повтори(4){вперед()} праворуч() увімкнути()}` | 5 | 6 | «Цикл у циклі!» |
| 3-08 | Вежа-равлик | `1 1 1 1 1 2` / `. . . . . 2` ×3 / `. . . . . 2` / `4t 3 3 3 3 3` | 0,0 E | `повтори(3){повтори(4){вперед()} стрибнути() праворуч()} увімкнути()` (пошук може знайти 5 з `повтори(5){вперед() стрибнути()}`) | 6 | 7 | «Сходи закручуються, як равлик.» |
| 3-09 | Вежі на кутах | кільце 7×7, кути `2t`, сторони `1` | 0,0 E | `повтори(4){стрибнути() повтори(4){вперед()} стрибнути() праворуч() увімкнути()}` | 7 | 8 | «Найважчий іспит циклів!» |
| 3-b1 | Бонус: зигзаг із вогниками | діагональ 7×7 як 3-04, `t` на (2,2), (4,4), (6,6) | 0,0 E | `повтори(3){повтори(2){вперед() праворуч() вперед() ліворуч()} увімкнути()}` | 7 | 7 | «Бонус! Пам'яті рівно стільки, скільки треба.» |
| 3-b2 | Бонус: подвійне кільце | на розсуд за правилами (`nest: 2`, `slots = best ≤ 8`) | | | | | |

Рівні `3-07`, `3-08`, `3-09`, `3-b1`, `3-b2` — `nest: 2`; решта — `nest: 1`. Для `3-b1` відомий підступ «увімкнути на кожній плитці» (`повтори(6){вперед() праворуч() вперед() ліворуч() увімкнути()}` — 6 комірок): якщо пошук його знайде, змінити мапу (наприклад, транзистор на плитці, через яку шлях проходить двічі) або взяти іншу ідею.

- [ ] **Step 1:** Записати рівні.
- [ ] **Step 2: Run** `node tools/check-levels.js` — Expected: усі ✓; загальний час < 60 с (`Measure-Command { node tools/check-levels.js }`). Виправити рівні, доки не буде так.
- [ ] **Step 3: Перевірити очима** кожен рівень у `/game/` (набір-чернетка → тимчасово всі id): високі блоки не ховають транзистори (кнопка ⟳ і `bestRotation`), мапа вміщується, `solution` проходить у грі. На `3-07` — **довга програма** `повтори(9){ повтори(9){ вперед() } }`: Біт стукається об край, сторінка відповідає, ⟲ зупиняє одразу.
- [ ] **Step 4:** Тести — PASS.
- [ ] **Step 5: Commit** `feat(levels): lesson 3 — corridors, patterns, nested loops, bonus`

---

### Task 8: Урок 3 — каркас, повторення, розминка, гра, фінал

**Files:**
- Create: `lesson-03-loops/index.html`

**Interfaces:**
- Consumes: `shared/deck/deck.css` + `deck.js` (`Deck.create({ prefix, stamps, passport, onSoundChange })`, `D.H.<key> = { init, enter, leave }`, `stamp`, `happy`, `store`), `engine.js`, `levels-03.js`, `bit-game.js`; `bitgame:win` з `detail.program`; `BitGame.findRepeat`.
- Produces: слайди з `data-key` (наступні таски додають свої між `warmup` і `game1`): `back`, `warmup`, `game1`, `game2`, `game3`, `bonus`, `recap`, `badge`. Префікс `bit-loop:`. Штампи: `back` ПОВТОР, `warmup` РОЗМИНКА, `memory` ПАМ'ЯТЬ, `loop` ЦИКЛ, `billion` МІЛЬЯРД, `counter` ЛІЧИЛЬНИК, `forever` НАЗАВЖДИ, `quiz` ПЕРЕВІРКА, `game1` КОРИДОРИ, `game2` ВІЗЕРУНКИ, `game3` ЦИКЛ У ЦИКЛІ. Бейдж посвідчення — «Майстер циклів».

Будова сторінки — як `lesson-02-processor/index.html` (topbar з `home-link`, `#viewport/#deck`, bottombar, `#thDrawer`, `#stampFx`, кнопка «Скинути прогрес» на першому слайді); стилі, специфічні для уроку 2, не копіювати. Підключається лише `levels-03.js`.

Слайди цього таску:
- `back` — 3 картки-питання: «Що таке алгоритм?» → «Точні кроки по черзі»; «Хто виконує команди?» → «Процесор, по одній»; «Команда для процесора — це…» → «Число (наприклад, 001)». Кнопка «Далі всередину».
- `warmup` — `<bit-game levels="3-00">`. Після `bitgame:win` з `id === "3-00"` з'являється кнопка «Що повторюється?». Тап → під грою стрічка іконок програми учня; `findRepeat(detail.program)` фарбує кожен повтор однаковим кольором (рамка `--sun`), Біт: «Я двічі робив те саме!» (`times` прописом: двічі / тричі / N разів). `null` → «У твоєму шляху повтору немає. Подивись на мій:» і стрічка еталона `BitGame.solve(BitGame.getLevel("3-00"))` (12 команд) з тим самим розфарбуванням. Штамп `warmup`.
- `game1` `3-01,3-02,3-03`; `game2` `3-04,3-05,3-06`; `game3` `3-07,3-08,3-09`; `bonus` `3-b1,3-b2` — як в уроці 2 (штамп за `bitgame:solved-set`).
- `recap` — «Запам'ятай» (4 тези: цикл повторює команди N разів; цикл економить пам'ять; процесор повторює стрибком назад; цикл може бути в циклі) + «Цікаві сайти» (3–4 посилання, кожне відкрити й перевірити: [Blockly Games: Лабіринт](https://blockly.games/maze?lang=uk) (рівні з циклами), [Code.org Hour of Code](https://code.org/hourofcode/overview), [Lightbot](https://lightbot.com/) — лише як «схожа гра»; перевірені додати в spec).
- `badge` — посвідчення з ім'ям, зірками рівнів уроку 3 і штампами, бейдж «Майстер циклів».

- [ ] **Step 1: Implement** сторінку й слайди.
- [ ] **Step 2:** `python tools/build-site.py`; `preview_start` `site`; відкрити `/lesson-03-loops/` у 1180×820; пройти розминку (з повтором і з іншим шляхом), гру 3-01, «Скинути прогрес» (два тапи), свайп по полю гри не гортає слайд, стрілки гортають; консоль без помилок; скриншот.
- [ ] **Step 3: Commit** `feat(lesson-03): deck, recap of lesson 2, warm-up with repeat finder, game slides`

---

### Task 9: Теорія — «Пам'ять тісна», «Цикл», «Мільярд кроків»

**Files:**
- Modify: `lesson-03-loops/index.html`

**Interfaces:**
- Consumes: каркас Task 8; `<bit-game levels="3-i1">`.
- Produces: слайди `memory`, `loop`, `billion` (після `warmup`), у кожному «Запам'ятай» і «Детальніше» → `<template class="theory">`.

- `memory` — праворуч 8 комірок пам'яті й плаский коридор із 10 плиток (Біт зліва, транзистор справа, той самий, що в `3-i1`). Кнопки «вперед» і «увімкнути»: кожен тап кладе команду (іконка + код `001`/`101`) у наступну комірку й рухає Біта. На 9-му тапі — комірки скінчились: «Пам'ять переповнена!», трусить, buzz; Біт за крок від транзистора: «Мені б іще одну команду…». ⟲. Штамп після переповнення. Запам'ятай: «Кожна команда займає місце в пам'яті. Довга програма може не влізти».
- `loop` — `<bit-game levels="3-i1">` + короткий текст «Цикл = повтори N разів. Він займає 1 комірку + те, що всередині». Штамп за перемогу.
- `billion` — кнопки N: `12`, `100`, `1 000 000`, `1 000 000 000`; Біт біжить коридором (CSS-анімація, швидша з більшим N, на мільйоні й мільярді — «розмитий»). Два стовпчики: «без циклу» = (N + 1) команд × 3 біти, підпис у зручних одиницях (біт → байт → КБ → МБ; 1 млрд → «≈ 375 МБ — як 100 пісень»), висота — логарифмічна; «з циклом» = 3 комірки = 9 біт завжди. Нижче: «Процесор: ≈ N / 1 000 000 000 с» (для мільярда «≈ 1 секунда»), «Ти (≈ 6 тапів/с): …» (для мільярда «≈ 5 років без сну»). Числа рахуються формулами в коді сторінки (пісня = 4 МБ, тапи 6/с, процесор 10⁹ команд/с), слово «приблизно»/«≈» на слайді. «Для допитливих»: звідки ці числа. Штамп після мільярда.

- [ ] **Step 1: Implement** слайди.
- [ ] **Step 2:** У браузері: переповнення пам'яті рівно на 9-му тапі; `3-i1` проходиться з 3 комірками; у `billion` для мільярда — «≈ 375 МБ», «≈ 1 секунда», «≈ 5 років» (`get_page_text`); 1180×820 без прокрутки; скриншоти.
- [ ] **Step 3: Commit** `feat(lesson-03): theory — tight memory, first loop, a billion steps`

---

### Task 10: Теорія — «Як процесор повторює», «iPad крутиться в циклі», «Перевір себе»

**Files:**
- Modify: `lesson-03-loops/index.html`

**Interfaces:**
- Consumes: каркас; вигляд стрічки команд — як слайд `pipe` уроку 2 (розмітку й стилі `.bl-*` скопіювати в урок 3 і змінити).
- Produces: слайди `counter`, `forever`, `quiz` (після `billion`, перед `game1`).

- `counter` — стрічка з трьох карток машинного коду: `вперед 001`, `⤴ стрибок 110`, `увімкнути 101`; над стрічкою **стрілка-лічильник команд** (підпис «Лічильник команд»), біля «стрибка» табличка «залишилось: 3». Міні-карта: 4 плитки, транзистор на останній. «Крок»: стрілка на `вперед` → Біт крок; стрілка на `стрибок` → табличка −1; якщо > 0, стрілка помітно летить назад до `вперед` (звук whoosh), якщо 0 — далі до `увімкнути`. «Пуск» — усе підряд; ⟲. Поруч та сама програма «людською мовою»: `повтори(3) { вперед() }` `увімкнути()` з підсвіткою рядка. Висновок: «У процесора немає слова "повтори" — є лише стрибок назад». «Для допитливих»: справжні процесори мають команди умовного стрибка; процедура — «стрибок із закладкою, куди повернутися»; умова — «стрибок, *тільки якщо…*» (тизер наступних уроків). Штамп після проходу.
- `forever` — «А якщо стрибати назад без лічильника? Цикл ніколи не скінчиться!» Код `повторювати_завжди { чи_є_дотик() }` (EN-підпис не потрібен). Великий лічильник «iPad спитав "Чи є дотик?"» стартує при вході на слайд і росте як `(Date.now() − t0) × 1 000 000` (≈ 10⁹/с) з групуванням розрядів пробілами; великий напис «Торкнись будь-де, коли захочеш». Перший тап у сцені зупиняє: «Поки ти думав, iPad спитав ≈ 2 300 000 000 разів!». Кнопка «Ще раз». Підпис «приблизно». Виходячи зі слайда (`leave`), лічильник зупинити. Штамп після тапу.
- `quiz` — 3 питання по черзі, по 3 варіанти-кнопки: `повтори(3) { вперед() вперед() }` → «Скільки кроків?» [5, **6**, 3]; `вперед() повтори(4) { праворуч() }` → «Скільки разів Біт повернеться?» [**4**, 5, 1]; `повтори(2) { повтори(3) { вперед() } }` → «Скільки кроків?» [5, **6**, 9]. Правильно — ding + зелена, неправильно — buzz і можна ще раз. Після 3-го — «Готовий до циклу в циклі!» і штамп.

- [ ] **Step 1: Implement** слайди.
- [ ] **Step 2:** У браузері: на `counter` після 3 «кроків» на `вперед` табличка 0 і стрілка йде до `увімкнути`, транзистор світиться; `forever` зупиняється від тапу й більше не росте після виходу зі слайда (`javascript_tool`: значення не змінюється); у квізі правильні відповіді — 6, 4, 6; скриншоти.
- [ ] **Step 3: Commit** `feat(lesson-03): theory — program counter and jump back, endless loop, quiz`

---

### Task 11: Сторінки, конспект, документи

**Files:**
- Modify: `game/index.html`, `site/index.html`, `README.md`, `docs/specs/2026-10-27-lesson-03-loops.md`
- Create: `lesson-03-loops/teacher-notes.md`

- [ ] **Step 1:** `game/index.html`: прибрати набір-чернетку; додати набори «Коридори» (`3-01,3-02,3-03`, «Один цикл»), «Візерунки» (`3-04,3-05,3-06`, «Цикл з поворотами»), «Цикл у циклі» (`3-07,3-08,3-09`), «Бонус 3» (`3-b1,3-b2`); `3-00`/`3-i1` не додавати. Верхня панель має вміститися на 1180×820 (якщо 8 наборів не вміщуються в один рядок — групувати за уроками «Урок 2 / Урок 3»).
- [ ] **Step 2:** `site/index.html` — картка уроку 3 (як картка уроку 2); `README.md` — рядок у таблиці уроків і посилання на spec + план.
- [ ] **Step 3:** `teacher-notes.md` за зразком уроку 2: мета, таймінг по слайдах (як у spec), що каже вчитель на кожному слайді, розв'язки всіх рівнів (`codeLines` з `check-levels`), типові помилки (забули вийти з циклу — команда потрапила всередину; N на 1 більше/менше), що пропустити, якщо бракує часу, посилання.
- [ ] **Step 4:** У spec: статус «реалізовано», остаточні карти/`best` рівнів, перевірені «Цікаві сайти», нові рішення в журнал (якщо були).
- [ ] **Step 5: Commit** `docs(lesson-03): teacher notes, home card, all-levels sets, README`

---

### Task 12: Фінальна перевірка

- [ ] **Step 1:** `node --test tools/engine.test.js tools/check-levels.test.js tools/program-search.test.js` і `node tools/check-levels.js` — PASS.
- [ ] **Step 2:** `python tools/build-site.py`, сервер `site`, 1180×820: пройти урок 3 від початку до посвідчення (усі штампи), урок 2 — слайди гри 2-01…2-09 (регресія), `/game/` — усі набори, головна — картки. Консоль без помилок.
- [ ] **Step 3:** Перевірити з `localStorage`, що кидає виняток (`javascript_tool`: перевизначити `Storage.prototype.getItem/setItem` на `throw`, перезавантажити) — урок працює, зірки в пам'яті.
- [ ] **Step 4:** Скриншоти ключових слайдів для вчителя; список того, що треба перевірити на справжньому iPad (дотики по ×N/✕, звук після першого дотику, `forever`).
- [ ] **Step 5:** Теорія для вчителя (`Урок-3-теорія-для-вчителя.docx`) — **не в цьому плані**: робиться після того, як вчитель погодить готовий урок (CLAUDE.md).
