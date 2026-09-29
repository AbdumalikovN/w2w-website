# Win to Win — сайт w2w.uz (Website 2.0)

Сайт компании **Win to Win (W2W)**: Company Brain — второй мозг компании — и IT-аутсорсинг полного цикла. Статический сайт на [Eleventy](https://www.11ty.dev/), три языка (RU — основной, UZ и EN), дизайн в стиле Apple iOS «Liquid Glass» (см. `DESIGN.md`). Анимации — [GSAP](https://gsap.com) + ScrollTrigger (npm-пакет `gsap`, при сборке копируется в `assets/vendor/`).

Опубликовано через GitHub Pages: https://abdumalikovn.github.io/w2w-website/ (UZ: `/uz/`, EN: `/en/`).

## Структура

```
src/
  _data/        контент в JSON: site (контакты, реквизиты, соцсети, рекорд игры), nav (меню), team и staff (команда),
                roles (демо «Спросите Company Brain»), industries, calc, projects, services, faq, partnerLogos…
  _i18n/        переводы: uz.json и en.json (ключ — русский текст), segments.json (все строки сайта)
  _css/         стили по частям (00-tokens … 19-motion); склеиваются в /assets/css/main.css (main-css.11ty.js)
  _includes/    layouts/base.njk, partials (шапка, футер, модалки, форма заявки, калькулятор…), home/ (блоки главной)
  assets/js/    loader (заставка), sound (звук и музыка), core (тема, меню, стекло, модалки, поиск), request (форма),
                game (мини-игра), calc, brain-hero, home, ask, partners — у каждого модуля словари ru/uz/en
  *.njk         страницы; projects/detail.njk и team/detail.njk — шаблоны с пагинацией
scripts/i18n.mjs          сборка /uz/ и /en/ из русской версии
scripts/fetch-fonts.mjs   скачивает шрифт Onest для самохостинга
.github/workflows/pages.yml  сборка и деплой на GitHub Pages при каждом push в main
```

## Локальный запуск

```bash
npm ci
node scripts/fetch-fonts.mjs   # один раз
npm run dev                    # только русская версия, http://localhost:8080
npm run build                  # полная сборка в _site/: RU + /uz/ + /en/
```

Для сборки под подпапку GitHub Pages: `PATH_PREFIX=/w2w-website/ npm run build`. На домене w2w.uz префикс не нужен.

## Языки (UZ и EN)

Сайт пишется и правится на русском. После сборки Eleventy скрипт `scripts/i18n.mjs` берёт готовые страницы из `_site`, режет видимый текст на строки (разметка внутри строки сохраняется как `<1>…</1>` и `<2/>`), подставляет переводы из `src/_i18n/uz.json` и `en.json` и пишет копии в `_site/uz/` и `_site/en/`: ссылки, переключатель языка, `lang`, `canonical`, `og:locale` и поиск по сайту — свои для каждого языка.

Если поменяли русский текст:

1. `npm run build && npm run i18n:extract` — покажет, сколько строк без перевода, и запишет их в `work/i18n/todo-uz.json` и `todo-en.json`.
2. Добавьте переводы в `src/_i18n/uz.json` и `en.json` (ключ — русская строка из todo, значение — перевод с теми же `<1>…</1>`/`<2/>`).
3. Строка без перевода не ломает сборку: на UZ/EN-странице она остаётся на русском, а сборка пишет предупреждение.

Узбекский — латиница, `o‘`/`g‘` через ‘ (U+2018), тутук-белги — ’ (U+2019). Тексты внутри JS (заставка, игра, калькулятор, форма) — в словарях `ru/uz/en` в начале каждого модуля.

## Как править

- **Тексты и данные** — `src/_data/*.json`; страницы подтягивают их автоматически.
- **Контакты, реквизиты, соцсети, endpoint форм** — `src/_data/site.json`. Соцсеть с пустым `href` показывается иконкой с подсказкой «Ссылка скоро появится».
- **Команда** — `team.json` (руководители, страницы `/team/<slug>/`), `staff.json` (специалисты по группам); фото — `src/assets/img/team/<slug>.webp`.
- **Новый проект** — объект в `projects.json`; `"detail": true` — отдельная страница, `"shot": true` — скриншоты в макетах Studio Display и iPhone (`img/projects/<slug>-desktop.webp`, `-mobile.webp`).
- **Внешний вид** — токены и компоненты в `src/_css/`, правила в `DESIGN.md`.

## Формы → Telegram

Форма заявки (2 шага) и отклик на вакансию отправляют JSON `POST` на `site.formEndpoint` и показывают «Заявка у нас». Пока endpoint пустой, заявка не теряется: на последнем шаге посетитель отправляет готовый текст заявки в WhatsApp компании или на почту info@w2w.uz одной кнопкой. Для полностью автоматического режима нужен endpoint (serverless-функция или Telegram-бот), который принимает `{ form, company, name, phone, task, directions, budget, page, lang }` и пересылает заявку в Telegram команды.

## Соцсети и выплаты партнёрам

- Соцсети — `site.socials`: сеть без ссылки не показывается; добавьте URL — иконка появится в футере и на странице «Контакты».
- «Партнёрам выплачено в прошлом месяце» — `site.payouts.lastMonth` (число в долларах). Пока `null`, строка на странице «Партнёрам» скрыта.
- Картинка для превью ссылок — `src/assets/img/og-ru.jpg`, `og-uz.jpg`, `og-en.jpg`; абсолютный адрес строится из `site.origin`.

## Калькулятор

`src/assets/js/calc.js`, коэффициенты — `src/_data/calc.json`: навыки, каналы, интеграции, объём знаний, языки, контур, срочность. Всегда диапазон, минимум $5 000, дисклеймер «не оферта».

## Что ещё нужно от компании

Фото и соцсети части сотрудников, ссылки на соцсети компании, реальные цифры выплат партнёрам, скриншоты продуктов (LogX ELD, Profitex, Long Haul, Uybaza и др.), цифры результатов кейсов, endpoint для заявок, утверждённые формулировки миссии и видения.
