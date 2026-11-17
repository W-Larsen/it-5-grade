# Урок 4 «Біт на роздоріжжі» — план реалізації

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Заняття 4: умови в грі «Біт-програміст» (блок «❓ якщо» з «інакше», умови «тут транзистор?» і «попереду сходинка?», суворий режим) і сайт-презентація «Біт на роздоріжжі» з чотирма інтерактивами теорії.

**Architecture:** Елемент програми `{ if, then, else? }` додається до дерева з уроку 3. Новий чистий виконавець `walk(lv, program, from?)` проганяє програму по полю й видає кроки двох видів: перевірка умови і команда. Програма детермінована, тож компонент, як і раніше, отримує готовий список кроків одразу після редагування (замість `expand`) і анімує його. Суворий режим (помилка зупиняє Біта) вмикається лише для рівнів з `"if"`. `program-search.js` вчиться перебирати «якщо» в тілах циклів, `check-levels.js` перевіряє, що без «якщо» рівень не пройти.

**Tech Stack:** Vanilla HTML/CSS/JS (звичайні `<script>`, не модулі), inline SVG, Web Audio; Node `node:test`; Python `tools/build-site.py` + сервер `site` з `.claude/launch.json`; GitHub Pages.

**Spec:** [`docs/specs/2026-11-17-lesson-04-conditions.md`](../specs/2026-11-17-lesson-04-conditions.md). Правила проєкту: [`CLAUDE.md`](../../CLAUDE.md). Як влаштовані цикли: [план уроку 3](2026-10-27-lesson-03-loops.md).

**Гілка:** `lesson-04-conditions`, відгалужена від `lesson-03-loops` (урок 3 ще не злитий у `main`).

## Global Constraints

- Увесь текст для учня — українською; англійська лише в режимі коду EN.
- Без фреймворків, збірки й залежностей; без ES-модулів.
- `lesson-04-conditions/index.html` — **тіло сторінки без `<!doctype>`/`<head>`**, на початку `<meta charset="utf-8">`; є `<a class="home-link" href="../">← Усі уроки</a>`.
- `localStorage` — лише в `try/catch`. Ключ гри `bitgame:v1` (спільний); префікс уроку 4 — `bit-if:`.
- Жодних акаунтів, аналітики, даних учня.
- Цільовий пристрій: iPad Safari горизонтально (перевірка у вікні 1180×820); Mac: стрілки, `F`, `M`.
- Стиль «комікс-наліпки», кольори/шрифти — CSS-змінні як в уроках 2–3.
- Код умови: укр. `якщо (тут_транзистор()) {` / `якщо (попереду_сходинка()) {` / `} інакше {` / `}`; EN `if (on_transistor()) {` / `if (step_ahead()) {` / `} else {` / `}`; тіло з відступом 4 пробіли.
- Блок «якщо» = 1 комірка разом з «інакше»; кожна команда = 1. Для рівнів з `if` `slots` ≤ 8.
- Вкладеність блоків (цикл і «якщо» разом) ≤ `nest` ≤ 2; цикл усередині «якщо» заборонений.
- Суворий режим лише на рівнях з `"if"`: події `bump-edge`, `bump-step`, `bump-flat`, `bump-high`, `no-target` зупиняють програму. Рівні уроків 2–3 поводяться як раніше.
- Машинний код «стрибни, якщо…» на слайді — `111`.
- Перед кожним комітом рушія/рівнів: `node --test tools/engine.test.js tools/check-levels.test.js tools/program-search.test.js` і `node tools/check-levels.js`.

## Review Focus

1. **✕ на блоці «якщо» або на «інакше», коли курсор усередині** → блок/гілка зникає, курсор переходить у найближчий наявний контейнер. Тест: Task 1 `fixCursor after removing the if or its else`.
2. **Шлях з гілкою «інакше» в `data-path`** (`"2.e.0"`) → тап по команді в «інакше» прибирає саме її. Тест: Task 1 `parsePath round-trips else segments`; Task 5 крок у браузері.
3. **Умова перевіряється на кожному колі в поточному стані поля, а не один раз** → `повтори(5){вперед() якщо(тр){увімкнути()}}` вмикає лише транзисторні плитки. Тест: Task 2 `condition is evaluated at the current state on every lap`.
4. **Помилка в суворому режимі посеред покрокового виконання (⏭)** → Біт пояснює помилку, програма стоп, наступний ⏭ починає спочатку, ⟲ працює. Тест: Task 6 крок у браузері.
5. **Регресія уроків 2–3** → для програм без «якщо» `walk` дає ті самі команди, `path`, `laps`, `jumps`, що й `expand`; `no-target` у рівнях з циклом не зупиняє. Тест: Task 2 `walk equals expand on every lesson 2–3 solution`.

---

## Карта файлів

| Файл | Що змінюється |
|---|---|
| `shared/bit-game/engine.js` | Елемент `{if,then,else}`: `isIf`, шляхи з `"e"`, `parsePath`, `containerAt` (експорт), `size`/`depth`/`hasEmptyBlock`/`codeLines`/`validateProgram`/`addItem`/`hasItem`/`removeItem`/`fixCursor`/`shiftCursor`; `setCond`/`addElse`/`removeElse`; `condition`, `walk`, `run` через `walk`; `parseLevel` з `if`/`conditions`/`else`; `CODE.*.if/else/cond` |
| `tools/program-search.js` | «Якщо» в тілах циклів, суворий режим, опції `noIf`/`noElse` |
| `tools/check-levels.js` | `checkIfLevel` (правила 1–6), `marginFor` для 4-xx |
| `tools/*.test.js` | Нові тести |
| `shared/bit-game/bit-game.js` | Блок «якщо» (вигляд, редагування), крок перевірки, підсвітка гілки, суворий стоп, підказка |
| `shared/bit-game/levels-04.js` | `4-00`, `4-i1`, `4-01`…`4-09`, `4-b1`, `4-b2` |
| `lesson-04-conditions/index.html`, `teacher-notes.md` | Презентація й конспект |
| `game/index.html`, `site/index.html`, `README.md`, `course-plan.md`, spec | Набори, картка, рядки, підсумок |

---

### Task 0: Гілка й документи

- [ ] **Step 1:** `git switch -c lesson-04-conditions` від `lesson-03-loops`; перевірити `git branch --show-current`.
- [ ] **Step 2:** Додати в `course-plan.md` рядок уроку 4 (`| 4 | 💡 **«Біт на роздоріжжі»**: умови, датчики, умовний стрибок; «Біт вгадує число» | Наш сайт + гра «Біт-програміст» | Умови «якщо… інакше» |`) і прибрати «умови» з кандидатів тем.
- [ ] **Step 3:** Закомітити (не додавати `lesson-02-processor/theory.pdf`):

```bash
git add docs/specs/2026-11-17-lesson-04-conditions.md docs/plans/2026-11-17-lesson-04-conditions.md course-plan.md
git commit -m "docs(lesson-04): spec and implementation plan for conditions"
```

---

### Task 1: Рушій — «якщо» в програмі-дереві (чисті функції)

**Files:** Modify `shared/bit-game/engine.js`; Test `tools/engine.test.js`

**Interfaces:**
- Consumes: дерево уроку 3 (`{ repeat, body }`), `CODE`.
- Produces:
  - `Item = string | { repeat: N, body: Item[] } | { if: "transistor"|"step", then: Item[], else?: Item[] }`.
  - **Шлях** — масив чисел і рядка `"e"`. Контейнер (курсор): `[]` — верх; `[...p, i]` — тіло циклу або гілка `then` блока `i`; `[...p, i, "e"]` — гілка `else`. Шлях елемента = контейнер + індекс.
  - `isLoop(it)` (тепер `"repeat" in it`), `isIf(it)`, `containerAt(program, cursor) → Item[]` (експортується), `parsePath(key: string) → Path` (`""` → `[]`, `"2.e.0"` → `[2,"e",0]`), `pathKey(path) → string`.
  - `size` (if = 1 + then + else), `depth` (if = 1 + max гілок), `hasEmptyBlock(program)` (порожній цикл, порожній `then` або наявне порожнє `else`; `hasEmptyLoop` лишається аліасом).
  - `codeLines(program, lang)`: нові `kind` — `"if"` (текст `якщо (тут_транзистор()) {`), `"else"` (текст `} інакше {`, `path` = шлях блока), `"close"`.
  - `validateProgram(program, nest, commands, opts?)`, `opts = { conditions: string[], allowElse: boolean }`; помилки: умова не з `conditions`; `else` при `allowElse: false`; цикл усередині «якщо»; глибина > `nest`.
  - `setCond(program, path, cond)`, `addElse(program, path)` (додає `else: []`), `removeElse(program, path)` — повертають нову програму.
  - `fixCursor`, `shiftCursor`, `addItem`, `hasItem`, `removeItem` розуміють сегмент `"e"`.
  - `CODE.uk.if = "якщо"`, `CODE.uk.else = "інакше"`, `CODE.uk.cond = { transistor: "тут_транзистор()", step: "попереду_сходинка()" }`; `CODE.en.if = "if"`, `CODE.en.else = "else"`, `CODE.en.cond = { transistor: "on_transistor()", step: "step_ahead()" }`.

- [ ] **Step 1: Failing tests** у `tools/engine.test.js`:

```js
const IF = { repeat: 3, body: ["forward", { if: "transistor", then: ["light"], else: ["jump"] }] };
test("size and depth count an if block with its else", () => {
  assert.equal(BitGame.size([IF]), 5);
  assert.equal(BitGame.depth([IF]), 2);
});
test("codeLines writes if / else / close with indentation", () => {
  assert.deepEqual(BitGame.codeLines([IF], "uk").map((l) => "  ".repeat(l.depth) + l.text), [
    "повтори(3) {", "  вперед()", "  якщо (тут_транзистор()) {", "    увімкнути()", "  } інакше {", "    стрибнути()", "  }", "}"]);
  assert.equal(BitGame.codeLines([IF], "en")[2].text, "if (on_transistor()) {");
});
test("parsePath round-trips else segments", () => {
  assert.deepEqual(BitGame.parsePath("2.e.0"), [2, "e", 0]);
  assert.deepEqual(BitGame.parsePath(""), []);
  assert.equal(BitGame.pathKey([2, "e", 0]), "2.e.0");
});
test("add, remove and edit inside then and else", () => {
  let p = BitGame.addItem([], [], { if: "step", then: [] });
  p = BitGame.addElse(p, [0]);
  p = BitGame.addItem(p, [0], "jump");
  p = BitGame.addItem(p, [0, "e"], "forward");
  assert.deepEqual(p, [{ if: "step", then: ["jump"], else: ["forward"] }]);
  assert.deepEqual(BitGame.removeItem(p, [0, "e", 0]), [{ if: "step", then: ["jump"], else: [] }]);
  assert.deepEqual(BitGame.setCond(p, [0], "transistor")[0].if, "transistor");
  assert.equal("else" in BitGame.removeElse(p, [0])[0], false);
});
test("fixCursor after removing the if or its else", () => {
  const p = [{ repeat: 2, body: [{ if: "step", then: ["jump"] }] }];   // no else any more
  assert.deepEqual(BitGame.fixCursor(p, [0, 0, "e"]), [0, 0]);
  assert.deepEqual(BitGame.fixCursor([{ repeat: 2, body: [] }], [0, 0, "e"]), [0]);
  assert.deepEqual(BitGame.shiftCursor([0, 1, "e"], [0, 0]), [0, 0, "e"]);
});
test("validateProgram enforces conditions, else and no loop inside if", () => {
  const cmds = ["forward", "light", "repeat", "if"];
  assert.throws(() => BitGame.validateProgram([{ if: "step", then: ["forward"] }], 2, cmds, { conditions: ["transistor"], allowElse: true }), /condition/);
  assert.throws(() => BitGame.validateProgram([{ if: "transistor", then: [], else: [] }], 2, cmds, { conditions: ["transistor"], allowElse: false }), /else/);
  assert.throws(() => BitGame.validateProgram([{ if: "transistor", then: [{ repeat: 2, body: ["forward"] }] }], 2, cmds, { conditions: ["transistor"], allowElse: false }), /loop/);
});
test("hasEmptyBlock sees an empty then or an empty else", () => {
  assert.equal(BitGame.hasEmptyBlock([{ if: "step", then: [] }]), true);
  assert.equal(BitGame.hasEmptyBlock([{ if: "step", then: ["jump"], else: [] }]), true);
  assert.equal(BitGame.hasEmptyBlock([IF]), false);
});
```

- [ ] **Step 2:** `node --test tools/engine.test.js` → нові тести FAIL (`setCond is not a function` тощо), старі PASS.
- [ ] **Step 3:** Реалізувати функції з Interfaces у `engine.js`. `expand` не змінюється (вона лише для програм без «якщо»).
- [ ] **Step 4:** `node --test tools/engine.test.js` → усі PASS.
- [ ] **Step 5:** Commit `feat(engine): if/else items in the program tree`.

---

### Task 2: Рушій — умови, `walk`, суворий режим, рівні з `if`

**Files:** Modify `shared/bit-game/engine.js`; Test `tools/engine.test.js`

**Interfaces:**
- Consumes: Task 1.
- Produces:
  - `CONDITIONS = ["transistor", "step"]`; `condition(lv, st, name) → boolean`: `transistor` — на плитці під Бітом є транзистор; `step` — плитка попереду є і її висота ≠ висоти поточної (край поля → `false`).
  - `parseLevel`: `"if"` у `commands` → обов'язкові `conditions` (непорожня підмножина `CONDITIONS`) і `solution`; `else` (boolean, за замовч. `false`); `nest` 1|2. Поля рівня: `conditions` (`[]` без `if`), `allowElse`, `strict` (= є `"if"`). `solution` перевіряється `validateProgram(..., { conditions, allowElse })`. `slots` ≤ `LOOP_MAX_SLOTS`.
  - `ERROR_EVENTS = ["bump-edge","bump-step","bump-flat","bump-high","no-target"]`.
  - `walk(lv, program, from?) → { steps, state, won, error }`. `from` — стан початку (за замовч. `initialState(lv)`). Кроки: `{ kind: "check", cond, result, path, laps, jumps }` і `{ kind: "cmd", cmd, event, state, path, laps, jumps }`; `path`, `laps`, `jumps` — як в `expand` (для «перевірки» `path` — шлях блока). Зупинка: перемога або (`lv.strict` і подія з `ERROR_EVENTS`) → `error` = ця подія. Запобіжник `MAX_WALK = 2000` кроків.
  - `run(lv, program) → { won, trace, error }`, `trace` = лише кроки `cmd` у старому форматі (`cmd, event, state, path, laps`).

- [ ] **Step 1: Failing tests:**

```js
const lvIf = (over) => BitGame.parseLevel("t-if", Object.assign({
  map: ["1 1t 1 1t 1t"], start: { x: 0, y: 0, dir: "E" },
  commands: ["forward", "light", "repeat", "if"], conditions: ["transistor"], nest: 2,
  solution: [{ repeat: 4, body: ["forward", { if: "transistor", then: ["light"] }] }], slots: 6, best: 4
}, over));
test("condition: transistor under Bit, step ahead", () => {
  const lv = BitGame.parseLevel("c", { map: ["1t 2 2"], start: { x: 0, y: 0, dir: "E" }, commands: ["forward"], slots: 3, best: 1 });
  assert.equal(BitGame.condition(lv, { x: 0, y: 0, dir: "E", lit: [] }, "transistor"), true);
  assert.equal(BitGame.condition(lv, { x: 0, y: 0, dir: "E", lit: [] }, "step"), true);
  assert.equal(BitGame.condition(lv, { x: 1, y: 0, dir: "E", lit: [] }, "step"), false);
  assert.equal(BitGame.condition(lv, { x: 2, y: 0, dir: "E", lit: [] }, "step"), false);   // edge
});
test("condition is evaluated at the current state on every lap", () => {
  const lv = lvIf(), r = BitGame.walk(lv, lv.solution);
  assert.equal(r.won, true);
  assert.deepEqual(r.steps.filter((s) => s.kind === "check").map((s) => s.result), [true, false, true, true]);
  assert.equal(r.steps[1].kind, "check");
  assert.equal(r.steps[1].cond, "transistor");
  assert.deepEqual(r.steps[1].path, [0, 1]);
});
test("strict mode stops at the first error; old levels do not", () => {
  const lv = lvIf(), blind = [{ repeat: 4, body: ["forward", "light"] }];
  const r = BitGame.walk(lv, blind);
  assert.equal(r.error, "no-target");
  assert.equal(r.won, false);
  assert.equal(r.steps[r.steps.length - 1].event, "no-target");
  const loop3 = BitGame.parseLevel("t3", { map: ["1 1t 1 1t"], start: { x: 0, y: 0, dir: "E" }, commands: ["forward", "light", "repeat"], solution: [{ repeat: 3, body: ["forward", "light"] }], slots: 5, best: 3 });
  assert.equal(BitGame.walk(loop3, loop3.solution).won, true);   // no-target harmless in lesson 3
});
const STAIRS = { map: ["1 2 2 3 4 4 4 5t"], start: { x: 0, y: 0, dir: "E" }, commands: ["forward", "jump", "light", "repeat", "if"], conditions: ["step"], else: true, nest: 2,
  solution: [{ repeat: 7, body: [{ if: "step", then: ["jump"], else: ["forward"] }] }, "light"], slots: 6, best: 5 };   // moves J F J J F F J
test("else branch runs when the condition is false", () => {
  const lv = BitGame.parseLevel("st", STAIRS), r = BitGame.walk(lv, lv.solution);
  assert.equal(r.won, true);
  assert.deepEqual(r.steps.filter((s) => s.kind === "cmd").map((s) => s.cmd).join(" "), "jump forward jump jump forward forward jump light");
});
test("walk equals expand on every lesson 2–3 solution", () => {
  // levels-02.js / levels-03.js are loaded as in the existing visibility test
  for (const id of BitGame.levelIds().filter((x) => /^[23]-/.test(x))) {
    const lv = BitGame.getLevel(id), prog = lv.solution || BitGame.solve(lv);
    const a = BitGame.expand(prog), b = BitGame.walk(lv, prog).steps;
    assert.ok(b.length && b.length <= a.length, id);
    b.forEach((s, i) => assert.deepEqual([s.kind, s.cmd, s.path, s.laps, s.jumps], ["cmd", a[i].cmd, a[i].path, a[i].laps, a[i].jumps], id + " step " + i));
  }
});
test("parseLevel requires conditions and solution with if", () => {
  assert.throws(() => lvIf({ conditions: undefined }), /conditions/);
  assert.throws(() => lvIf({ conditions: ["smell"] }), /condition/);
  assert.equal(lvIf().strict, true);
  assert.equal(lvIf().allowElse, false);
});
```

- [ ] **Step 2:** Тести FAIL (`walk is not a function`).
- [ ] **Step 3:** Реалізувати. `run` будується на `walk`. Старі тести `run`/`expand` мають лишитися зеленими без змін.
- [ ] **Step 4:** `node --test tools/engine.test.js tools/check-levels.test.js tools/program-search.test.js` → PASS; `node tools/check-levels.js` → усі рівні 2-xx і 3-xx ✓.
- [ ] **Step 5:** Commit `feat(engine): conditions, step-by-step walk and strict mode`.

---

### Task 3: Пошук найкоротшої програми з умовами

**Files:** Modify `tools/program-search.js`; Test `tools/program-search.test.js`

**Interfaces:**
- Consumes: `walk`, `condition`, `level.conditions`, `level.allowElse`, `level.strict` (Task 2).
- Produces: `shortestProgram(level, { maxSize, nest, noIf?: boolean, noElse?: boolean }) → Program | null`. Без `"if"` у рівні — поведінка як зараз.

**Підхід (не визначається тестами):**
- Блоки «якщо» перебираються **лише в тілах циклів**. На верхньому рівні «якщо» виконується один раз і рівносильне одній зі своїх гілок, тож коротшої програми не дає.
- Гілки — послідовності простих команд (вкладеність ≤ 2: цикл → «якщо» → команди). `then` непорожня; `else` (якщо `allowElse && !noElse`) — 0+ команд.
- Перше коло тіла, як і зараз, симулюється під час генерації. Для «якщо» умова обчислюється в стані першого кола: команди «взятої» гілки симулюються й відсікаються, а «невзята» гілка перебирається без симуляції (лише правило `turnPair`).
- Подальші кола й повна перевірка тіла йдуть через `BitGame.walk(level, [body…], st)` замість `expand` + `simulate`. У суворому режимі будь-яка помилка (включно з `no-target`) відсікає гілку; у рівнях уроку 3 — як зараз (лише `bump`).

- [ ] **Step 1: Failing tests:**

```js
// transistors on 1, 2, 5, 6: no loop period fits; flat program is 10 cells
const LAMPS = { map: ["1 1t 1t 1 1 1t 1t"], start: { x: 0, y: 0, dir: "E" },
  commands: ["forward", "light", "repeat", "if"], conditions: ["transistor"], nest: 2,
  solution: [{ repeat: 6, body: ["forward", { if: "transistor", then: ["light"] }] }], slots: 6, best: 4 };
test("finds the loop-with-if solution and nothing shorter", () => {
  const lv = BitGame.parseLevel("s1", LAMPS), p = shortestProgram(lv, { maxSize: 6, nest: 2 });
  assert.equal(BitGame.size(p), 4);
  assert.equal(BitGame.walk(lv, p).won, true);
  assert.equal(shortestProgram(lv, { maxSize: 3, nest: 2 }), null);
});
test("noIf finds no program when only an if fits the memory", () => {
  assert.equal(shortestProgram(BitGame.parseLevel("s1", LAMPS), { maxSize: 6, nest: 2, noIf: true }), null);
});
test("noElse rules out the uneven stairs solution", () => {
  const lv = BitGame.parseLevel("s2", STAIRS);   // STAIRS from engine.test.js (copy it here)
  assert.equal(BitGame.size(shortestProgram(lv, { maxSize: 6, nest: 2 })), 5);
  assert.equal(shortestProgram(lv, { maxSize: 6, nest: 2, noElse: true }), null);
});
```

- [ ] **Step 2:** FAIL. Карти `LAMPS` і `STAIRS` перевірені вручну. Якщо після реалізації пошук знайде на них обхід без «якщо»/«інакше», подовжити нерегулярний візерунок, а твердження не міняти.
- [ ] **Step 3:** Реалізувати. **Step 4:** Усі тести PASS; `node tools/check-levels.js` для уроків 2–3 не повільніший помітно (≤ ~2× від поточного часу).
- [ ] **Step 5:** Commit `feat(tools): program search with if/else in loop bodies`.

---

### Task 4: check-levels — правила для рівнів з `if`

**Files:** Modify `tools/check-levels.js`; Test `tools/check-levels.test.js`

**Interfaces:**
- Consumes: Task 2–3.
- Produces: `checkLevel` для рівнів з `"if"` викликає `checkIfLevel(lv, seen)`; `marginFor`: `4-i1`, `4-01`…`4-03` → 2; бонуси → 0; решта 4-xx → 1. `ELSE_REQUIRED = /^4-0[4-6]$/`.

Правила (spec, розділ «Рівні»): 1) `solution` виграє через `walk` без `error` і має `size` = `best`; 2) `shortestProgram(lv, { maxSize: best − 1, nest })` = `null`; 3) `shortestProgram(lv, { maxSize: slots, nest, noIf: true })` = `null`, і найкоротша плоска (`solve`) довша за `slots`; 4) для `ELSE_REQUIRED` — `noElse: true` у межах `slots` = `null`; 5) `slots ≥ best + marginFor`; 6) у кроках `walk(solution)` немає події `off`; нова команда `"if"` має бути в `solution`.

- [ ] **Step 1: Failing tests** — по одному на кожне правило, з маленькими рівнями на зразок тестів Task 3: коректний рівень → `[]`; `best` завищений → `/shorter/`; рівень, який проходить `повтори{вперед() увімкнути()}` без `strict`-помилки (транзистори на кожній плитці) → `/without an if/`; `4-05` без потреби в «інакше» → `/without else/`; розв'язок, що вимикає транзистор → `/twice/`.
- [ ] **Step 2:** FAIL. **Step 3:** Реалізувати. **Step 4:** PASS + `node tools/check-levels.js` (уроки 2–3 ✓).
- [ ] **Step 5:** Commit `feat(tools): level checks for if levels`.

---

### Task 5: Компонент — блок «якщо» (вигляд і редагування)

**Files:** Modify `shared/bit-game/bit-game.js`; Create `shared/bit-game/levels-04.js` (поки `4-i1` і один рівень з `else` — для перевірки)

**Interfaces:**
- Consumes: Task 1–2 (`containerAt`, `parsePath`, `pathKey`, `setCond`, `addElse`, `removeElse`, `isIf`, `hasEmptyBlock`).
- Produces (DOM у Shadow root; Task 6 спирається на ці назви):
  - Пульт: `.cmd[data-cmd="if"]`, підпис «якщо», колір `#E8590C`, `ICONS.if` — ромб-розвилка 24×24. `CMD_COLORS.if`, `LABELS.if`.
  - Блок: `.cond[data-path]` → `.cond-head` (іконка `if`, `button.which[data-path]` — чип умови: 💡-іконка + «транзистор» / ⬆ + «сходинка»; `button.add-else[data-path]` «+ інакше», якщо `lv.allowElse` і `else` немає; `.mark` — місце для ✓/✗; `button.del[data-path]`), `.cond-then`, за наявності — `.cond-else` з `.else-head` («інакше», `button.del-else[data-path]`).
  - `data-path` скрізь — `pathKey(path)`; розбір — лише `parsePath` (замінити всі `split(".").map(Number)`).
  - Тап у `.cond-then` → курсор `[...path]`; у `.cond-else` → `[...path, "e"]`; поза блоками — як раніше.
  - `.which`: якщо `lv.conditions.length > 1` — перемикає умову (`setCond`), інакше кнопка неактивна (просто підпис).
  - ❓ неактивна, коли глибина курсора ≥ `lv.nest`; 🔁 неактивна, коли курсор у гілці «якщо».
  - `Backspace` (`onKey`) використовує `containerAt`; на порожній гілці `else` прибирає `else`, на порожньому `then` — блок.

- [ ] **Step 1:** Реалізувати; додати два тестові рівні в `levels-04.js`.
- [ ] **Step 2:** `python tools/build-site.py`, сервер `site`, вікно 1180×820, сторінка гри з рівнем `4-i1`: додати 🔁 → ❓ → 💡 у гілку; на рівні з `else` — «+ інакше», команда в «інакше», тап по ній прибирає саме її, ✕ на «інакше» і на блоці (курсор лишається валідним), перемикач умови. Код праворуч збігається з блоками в обох мовах. Найглибший блок (цикл → якщо → інакше) вміщується на панелі.
- [ ] **Step 3:** Рівні уроків 2–3 на сторінці гри виглядають і редагуються як раніше.
- [ ] **Step 4:** Commit `feat(game): if block with else in the program panel`.

---

### Task 6: Компонент — виконання умов, суворий стоп, підказка

**Files:** Modify `shared/bit-game/bit-game.js`

**Interfaces:**
- Consumes: `walk` (Task 2), DOM з Task 5.
- Produces: `this.steps = B.walk(this.level, this.program).steps` (у `edited` замість `expand`); `execOne` обробляє `kind: "check"`; `lose(errorEvent?)`.

- [ ] **Step 1:** Крок «перевірка»: Біт «дивиться» (клас `look-down` для `transistor`, `look-ahead` для `step` — зсув зіниць), у `.mark` блока й над Бітом — «✓ так» / «✗ ні» (зелений/сірий), `Sound.pop()`, пауза `STEP_MS * 0.6`. Підсвічуються `.cond-head` і рядок коду `kind: "if"` з цим `path`. Блок отримує клас `took-then` / `took-else` до наступної перевірки цього ж блока; невзята гілка тьмяніє (`opacity .45`).
- [ ] **Step 2:** Суворий режим: якщо крок `cmd` має подію з `ERROR_EVENTS` і `lv.strict` — buzz, трясіння, текст (`no-target` → «Іскра! Тут немає транзистора.», решта — `BUMP_TEXT`), потім `lose(ev)`: `fails++`, бульбашка з помилкою + « Спробуй ще!», після 2 невдач — кнопка підказки. Звичайний `lose()` без аргументу — як раніше.
- [ ] **Step 3:** Порожній блок: `hasEmptyBlock` → «У «якщо» нічого немає» (для циклу — старий текст). Підказка з `solution`: перші 2 рядки `codeLines`, для рядка `kind: "if"` іконка `if`.
- [ ] **Step 4:** Перевірка в браузері (1180×820) на `4-i1`: ▶ з `повтори{вперед() увімкнути()}` → іскра, стоп; з «якщо» → перемога, ✓/✗ на кожному колі. ⏭ покроково: перевірка — окремий крок; помилка посеред ⏭ → наступний ⏭ починає спочатку; ⟲ і зміна рівня зупиняють миттєво; EN/УКР під час кроків тримає підсвітку. Рівні 3-xx: `no-target` як і раніше «Іду далі».
- [ ] **Step 5:** Commit `feat(game): run conditions step by step, strict stop and hints`.

---

### Task 7: Рівні уроку 4

**Files:** Modify `shared/bit-game/levels-04.js`

**Interfaces:** Consumes формат рівня зі spec (`commands` з `"if"`, `conditions`, `else`, `nest: 2`, `solution`, `slots`, `best`, `say`).

| id | Набір | Умови / `else` | Ідея (spec) |
|---|---|---|---|
| `4-00` | Розминка | без `if` | рівень з одним циклом у стилі уроку 3 |
| `4-i1` | Знайомство (слайд `ifgame`) | `transistor` | прямий коридор, транзистори нерегулярно |
| `4-01`…`4-03` | Ліхтарі | `transistor` | довший коридор; коридор з поворотом; дві «вулиці» |
| `4-04`…`4-06` | Нерівні сходи | `step`, `else: true` | драбина з нерегулярними сходинками; вгору-вниз; сходи + транзистор у кінці |
| `4-07`…`4-09` | Все разом | обидві, `else: true` | нерівна дорога з транзисторами; обидві умови в одному циклі; повороти |
| `4-b1`, `4-b2` | Бонус | обидві | пам'ять рівно на оптимум |

- [ ] **Step 1:** Скласти карти; `node tools/check-levels.js` → усі 4-xx ✓ (правила Task 4). Якщо пошук знаходить коротший обхід — міняти карту, не правила.
- [ ] **Step 2:** `node --test tools/engine.test.js` — тест видимості транзисторів проходить і для `levels-04.js`; переглянути кожен рівень у браузері в усіх ракурсах ⟳.
- [ ] **Step 3:** Commit `feat(levels): lesson 4 condition levels`.

---

### Task 8: Урок 4 — каркас, повторення, розминки, гра, фінал

**Files:** Create `lesson-04-conditions/index.html` (на `shared/deck/`, будова як `lesson-03-loops/index.html`)

Слайди (`data-key`): `back`, `warmup`, `tapgreen`, `sensors`, `rails`, `ifgame`, `guess`, `ifsgame`, `game1`, `game2`, `game3`, `bonus`, `recap`, `badge`. У цьому таску — усі, крім теоретичних `sensors`, `rails`, `guess`, `ifsgame` (поки заглушки з заголовком).

- [ ] **Step 1:** `back` — 3 картки-питання з уроку 3 (навіщо цикл; що робить лічильник; «Скільки кроків зробить `повтори(3){вперед() вперед()}`?» → 6). `warmup` — `<bit-game level="4-00">`.
- [ ] **Step 2:** `tapgreen` — «Тапай, якщо зелене!»: 15 спалахів (зелений/червоний/жовтий, інтервал від 1200 до 550 мс), тап по зеленому +1, по іншому — «Ой!»; підсумок «Ти щойно 15 разів виконав умову!» і рядок коду `якщо (колір == зелений) { тап() }`. Кнопка «Ще раз».
- [ ] **Step 3:** `ifgame` (`4-i1`), `game1` (`4-01…03`), `game2` (`4-04…06`), `game3` (`4-07…09`), `bonus` (`4-b1,b2`); `recap` — «Запам'ятай» (умова = питання так/ні; факти — датчики; процесор стрибає, *тільки якщо*; цикл + умова = суперсила) і «Цікаві сайти» (підібрати й відкрити кожен, підписи без неперевірених тверджень); `badge` — «Майстер умов», префікс `bit-if:`.
- [ ] **Step 4:** Перевірка 1180×820: навігація свайпом/стрілками, `F`, `M`, «← Усі уроки», гра на кожному ігровому слайді, бейдж після рівнів.
- [ ] **Step 5:** Commit `feat(lesson-04): deck skeleton, warm-ups, game slides and badge`.

---

### Task 9: Теорія — «iPad вирішує», «Стрілка на коліях»

**Files:** Modify `lesson-04-conditions/index.html`

- [ ] **Step 1:** `sensors`: SVG-iPad + три повзунки. «Світло» 0–100 → яскравість екрана (`якщо (світло < 30) { тьмяніше() }`); «Заряд» 0–100 → банер «Низький заряд» при ≤ 20; «Нахил» 0–90° → екран повертається при > 45°. Рядок коду спалахує, коли умова стає «так». «Детальніше»: датчик освітленості, гіроскоп/акселерометр.
- [ ] **Step 2:** `rails`: стрічка команд + стрілка-лічильник (стиль слайда `counter` уроку 3): `1 виміряти заряд` · `2 порівняти з 20` · `3 стрибни, якщо більше (111)` → на 5 · `4 показати попередження` · `5 далі`. Блок «порівняти» запалює лампочку-прапорець; стрілка-рейка перемикається; Біт їде вагончиком. Учень ставить заряд повзунком, «Крок»/«Пуск». Підпис: «Цикл — стрибок завжди. Умова — стрибок, *тільки якщо*». Плашка: «Код 111 — останній вільний: усі 8 кодів зайняті!» «Детальніше»: транзистор — найменше «якщо»; два підряд = І, поруч = АБО.
- [ ] **Step 3:** Перевірка в браузері: межі (20 і 21, 45° і 46°), «Пуск» поверх «Крок», вихід зі слайда під час анімації не ламає повтор.
- [ ] **Step 4:** Commit `feat(lesson-04): sensors and conditional-jump theory slides`.

---

### Task 10: Теорія — «Біт вгадує число», «Гра, повна «якщо»»

**Files:** Modify `lesson-04-conditions/index.html`

- [ ] **Step 1:** `guess`: «Загадай число від 1 до 100» → «Готово». Біт питає «Твоє число більше за N?» (N — середина `[lo, hi]`), кнопки «Так»/«Ні», числова лінія 1–100 гасить відкинуту частину, лічильник питань. Коли `lo === hi` — «Це N! Я вгадав за K питань». Суперечливі відповіді (`lo > hi`) → «Ти щось наплутав!» і кнопка «Спочатку». Підсумок: «Кожна відповідь так/ні — це **1 біт**. 7 бітів вистачає на 128 чисел. Тому мене й звуть Біт!» «Детальніше»: 100 → 50 → 25 → 13 → 7 → 4 → 2 → 1.
- [ ] **Step 2:** `ifsgame` (необов'язковий): 30 с — байти падають, кошик рухається перетягуванням або тапом по лівій/правій половині (Mac — стрілки). Поруч 4 рядки коду (`якщо (торкнувся кошика) { рахунок + 1 }`, `якщо (впав) { життя − 1 }`, `якщо (палець ліворуч) { кошик ліворуч }`, `якщо (життя == 0) { кінець() }`), рядок спалахує на спрацюванні. Лічильник «перевірено умов» = 4 × кадри × байти на екрані (таймер `setInterval`).
- [ ] **Step 3:** Перевірка в браузері: 7 питань на будь-яке число (перевірити 1, 50, 51, 100), суперечність, гра на дотик і стрілках, вихід зі слайда зупиняє таймери.
- [ ] **Step 4:** Commit `feat(lesson-04): guess-the-number and game-full-of-ifs slides`.

---

### Task 11: Сторінки, конспект, документи

**Files:** Modify `game/index.html`, `site/index.html`, `README.md`, spec; Create `lesson-04-conditions/teacher-notes.md`

- [ ] **Step 1:** `game/index.html`: підключити `levels-04.js`; набори уроку 4 у `SETS` (Розминка `4-00`,`4-i1` · Ліхтарі · Нерівні сходи · Все разом · Бонус 4); `filter = 4`.
- [ ] **Step 2:** `site/index.html` — картка уроку 4; `README.md` — рядок уроку 4 в таблиці.
- [ ] **Step 3:** `teacher-notes.md`: сценарій по слайдах з хвилинами (spec), що питати й казати, розв'язки всіх рівнів (`codeLines` укр.), що пропустити, якщо бракує часу.
- [ ] **Step 4:** Spec: статус «реалізовано» і «Підсумок реалізації» (рівні з `best`/`slots`, слайди, «Цікаві сайти»), нові рішення — у журнал.
- [ ] **Step 5:** Commit `docs(lesson-04): game sets, home card, README and teacher notes`.

---

### Task 12: Фінальна перевірка

- [ ] **Step 1:** `node --test tools/engine.test.js tools/check-levels.test.js tools/program-search.test.js` і `node tools/check-levels.js` → усе ✓.
- [ ] **Step 2:** `python tools/build-site.py`; у браузері 1180×820 пройти урок 4 від початку до бейджа; уроки 2 і 3 та «Всі рівні» (фільтри) — без регресій; консоль без помилок.
- [ ] **Step 3:** Скріншоти ключових слайдів для вчителя. Нагадати: перевірити на iPad у Safari; `.docx` теорії — окремо, після уроку.
