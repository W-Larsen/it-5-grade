# IT-курс для 5 класу

Додатковий курс IT для одного учня (10 років, 5 клас): інтерактивні уроки українською про те, як влаштовані інтернет, комп'ютери й програми, плюс перші кроки в програмуванні. Раз на тиждень, 35–45 хв, iPad.

**Сайт курсу:** https://w-larsen.github.io/it-5-grade/

## Уроки

| # | Урок | Сторінка | Для вчителя |
|---|---|---|---|
| 1 | Подорож Біта: як працює інтернет | [`lesson-01-internet/`](lesson-01-internet/index.html) · [онлайн](https://w-larsen.github.io/it-5-grade/lesson-01-internet/) | [конспект](lesson-01-internet/teacher-notes.md) · теорія `.docx` |
| 2 | Біт у процесорі *(чекає перевірки на iPad)* | [`lesson-02-processor/`](lesson-02-processor/index.html) | [конспект](lesson-02-processor/teacher-notes.md) |
| — | Біт-програміст · Всі рівні | [`game/`](game/index.html) · [онлайн](https://w-larsen.github.io/it-5-grade/game/) | — |

## Структура

```
site/index.html          головна сторінка курсу
shared/deck/             каркас презентацій для уроків 2+ (deck.css, deck.js)
shared/bit-game/         гра «Біт-програміст»: engine.js (логіка), bit-game.js (компонент), levels-*.js (рівні)
game/index.html          сторінка «Всі рівні»
tools/                   тести рушія, перевірка рівнів, збірка сайту (build-site.py)
serve.cmd                локальний перегляд сайту: збірка + сервер на http://localhost:8080/
lesson-NN-<тема>/        урок: index.html (тіло сторінки), teacher-notes.md, теорія .docx
docs/specs/              дизайн-специфікації та журнали рішень
docs/plans/              плани реалізації
course-plan.md           план курсу
CLAUDE.md                правила проєкту
```

## Деплой

Автоматичний на GitHub Pages: кожен пуш у `main` запускає [`.github/workflows/pages.yml`](.github/workflows/pages.yml). Головна — `site/index.html`; кожна тека `lesson-*/index.html` стає окремою сторінкою (workflow додає `<!doctype>` і `<head>`).

Запасний варіант на уроці — відкрити `lesson-*/index.html` локально.

## Документи

- [План курсу](course-plan.md)
- [Spec: курс + урок 1](docs/specs/2026-10-13-course-and-lesson-01-internet.md)
- [Spec: урок 2 + гра «Біт-програміст»](docs/specs/2026-10-20-lesson-02-bit-processor.md) · [план реалізації](docs/plans/2026-10-20-lesson-02-bit-processor.md)
