# Win to Win — сайт w2w.uz (Website 2.0)

Сайт компании **Win to Win (W2W)**: AI-агенты и IT-аутсорсинг полного цикла. Статический сайт на [Eleventy](https://www.11ty.dev/), 34 страницы, дизайн в стиле iOS по брендбуку W2W (см. `DESIGN.md`). Анимации — [GSAP](https://gsap.com) + ScrollTrigger (npm-пакет `gsap`, при сборке копируется в `assets/vendor/`).

Опубликовано через GitHub Pages: https://abdumalikovn.github.io/w2w-website/

## Структура

```
src/
  _data/        контент в JSON: site (контакты, реквизиты), nav, agents, calc, projects, team,
                services, faq, process, extra (вакансии, статьи, документы), partners (лого),
                ui (иконки, этапы, уведомления на телефоне в первом экране)
  _includes/    layouts/base.njk + partials (шапка, футер, модалки, калькулятор, лента лого, FAQ…)
  assets/       css/main.css (дизайн-система), js/main.js (интерактив и анимации), img/ (лого, фавикон), fonts/
  *.njk         страницы; projects/detail.njk, team/detail.njk, services/detail.njk — шаблоны с пагинацией
  search-index.njk  → /search-index.json для поиска ⌘K
  static/       robots.txt (копируется в корень)
scripts/fetch-fonts.mjs   скачивает Onest для самохостинга (шрифты не хранятся в git)
prototype/                ч/б прототип v2 (исходная точка дизайна)
.github/workflows/pages.yml  сборка и деплой на GitHub Pages при каждом push в main
```

## Локальный запуск

```bash
npm ci
node scripts/fetch-fonts.mjs   # один раз
npm run dev                    # http://localhost:8080
npm run build                  # сборка в _site/
```

Для сборки под подпапку GitHub Pages: `PATH_PREFIX=/w2w-website/ npx eleventy`. На домене w2w.uz префикс не нужен.

## Как править

- **Тексты и данные** — в `src/_data/*.json` (услуги, агенты, проекты, команда, FAQ, вакансии). Страницы подтягивают их автоматически.
- **Контакты, реквизиты, соцсети, endpoint форм** — `src/_data/site.json`.
- **Новый проект** — добавить объект в `projects.json`; с `"detail": true` появится отдельная страница `/projects/<slug>/`.
- **Логотипы партнёров** — `src/assets/img/partners/*.webp` + запись в `partners.json` (name, file, w, h).
- **Внешний вид** — токены и компоненты в `src/assets/css/main.css`, правила в `DESIGN.md`.

## Формы → Telegram

Формы (созвон, заявка, CTA, отклик) отправляют JSON `POST` на адрес из `site.formEndpoint`; пока он пустой — после отправки открывается страница «Спасибо» без реальной отправки. Для боевого режима нужен endpoint (serverless-функция или бот), который принимает `{ form, name, company, contact, topic, when, task, cv, page }` и пересылает в Telegram. Поле `website` — honeypot, заполненное значение означает спам.

## Калькулятор

`src/assets/js/main.js`, функция `calcRun` — демо-модель из прототипа (коэффициенты в `src/_data/calc.json`). Панель результата показывает «Структуру оценки» — доли слагаемых и коэффициенты. Тип агента, выбранный в оценке на главной, передаётся в полный калькулятор; страница `/calculator/?type=hr` открывается с нужным типом (id типов — в `calc.json`). Правила: всегда диапазон, минимум $5 000, дисклеймер «не оферта». Для продакшена расчёт переносится на бэкенд (`POST /api/estimate`, коэффициенты в БД) — контракт описан в брифе проекта.

## Что ещё не заполнено (помечено на сайте пунктиром «На уточнении»)

ФИО, фото и биографии руководителей; цифры результатов кейсов и скриншоты продуктов; отзывы клиентов; реальные вакансии; год и стек проектов; написание адреса; ссылки соцсетей; файлы документов; языковые версии UZ/EN; фоновая музыка и мини-игра.
