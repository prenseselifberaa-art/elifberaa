# SPEC - ask view behaviour (`assets/app.js` + `assets/data.js`)

Status: implementation brief. Owner: coordinator. Implementer: builder worker.
Verifier: independent verifier worker (separate session, own evidence folder).

## Goal

The static clone must behave like the original page for everything a visitor can
do: open the ask view from any tile, ask a question, read an answer, ask a
follow-up, close the view, and deep-link with `?q=`.

The original answers come from a hosted LLM. That backend is NOT part of this
clone. Answers here are produced locally from the portfolio
facts in `src/data-clean.json`. Nothing may be invented: if a fact is not in
that file, the answer must say so and point to the contact address.

## Files

Create only:

- `assets/app.js` - interaction controller (vanilla JS, no dependencies).
- `assets/data.js` - `window.PORTFOLIO_DATA` (facts, transcribed from
  `src/data-clean.json`; the JSON file is read-only source material).

Do not modify `index.html`, `src/*`, `assets/site.css`, `assets/*.css`,
`assets/fonts/*`, `logo/*`, `images/*`, `files/*`, `scripts/*`.

## DOM contract (already in index.html)

Page:

- `#page-view` contains both layouts. Exactly one is visible at a time:
  `.layout-desktop` (>= 1000 px) and `.layout-mobile` (<= 999 px).
- Every tile is `#page-view main button[aria-label]`. The label is the question
  to ask, e.g. `Who are you?`, `Where have you worked?`,
  `How can I reach you?`.
- The page ask form is `#page-view form` with an `input` and a submit button.
  Its placeholder is `Ask me anything…`.
- This build has no design-copy pill. The dock (`#anim-dock`) is the only
  fixed control outside the ask view.
- Contact address (from data): `elifcigrikci@hotmail.com`.

Ask view:

- `#ask-view` (hidden attribute toggles the whole view).
- `#ask-back`, `#ask-avatar` - close buttons.
- `#ask-question-top` - the current question inside the pink bubble.
- `#ask-scroll` - scroll container; `#ask-thread` - messages.
- `#ask-form`, `#ask-input`, `#ask-submit` - composer. Submit is disabled while
  the input is empty. A question submitted while an answer is loading is queued
  and asked immediately after the current answer, never dropped.
- `#page-view` must be hidden while `#ask-view` is open; `body` gets
  `.ask-open`.

## Behaviour

1. `openAsk(question)`:
   - trim; ignore empty; cap at 500 characters.
   - show ask view, hide page, `document.body.classList.add('ask-open')`.
   - set `#ask-question-top` text, clear `#ask-thread`, reset composer.
   - render the original three-dot loading indicator (copy the SVG with
     `<animate>` from the brief below), then remove it after 850 ms
     (450 ms when `prefers-reduced-motion: reduce`).
   - append the answer bubble, typing it at ~14 ms/character (skip typing under
     reduced motion), then scroll to the bottom.
   - focus `#ask-input` (not on touch-only devices if that causes a keyboard
     jump; use `matchMedia('(pointer: fine)')`).
   - history: `history.pushState({q}, '', '?q=' + encoded)`.
2. Follow-up submit: append a right-aligned pink question bubble to
   `#ask-thread`, update `#ask-question-top`, then loading + answer as above.
3. `closeAsk()`: hide ask view, show page, remove `.ask-open`, remove the `q`
   parameter with `history.pushState`, return focus to the tile that opened it.
   Escape closes. `popstate` closes when `q` is gone and opens when present.
4. Deep link: on load, read `?q=`; if present open the ask view without pushing
   a new history entry.
5. The design-copy pill is removed in this build; no handler is required.
6. Page ask form: submit opens the ask view with the typed text.
7. No analytics, no cookies, no localStorage, no network requests, no eval, no
   inline event handlers.

## Loading indicator markup (verbatim from the original)

```html
<div class="flex gap-2 items-start group self-start w-full relative group">
  <div class="text-secondary-foreground rounded-lg py-2 break-words max-w-full whitespace-pre-wrap">
    <div class="flex items-center space-x-2">
      <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" class="text-foreground">
        <circle cx="4" cy="12" r="2" fill="currentColor">
          <animate id="spinner_qFRN" begin="0;spinner_OcgL.end+0.25s" attributeName="cy" calcMode="spline" dur="0.6s" values="12;6;12" keySplines=".33,.66,.66,1;.33,0,.66,.33"></animate>
        </circle>
        <circle cx="12" cy="12" r="2" fill="currentColor">
          <animate begin="spinner_qFRN.begin+0.1s" attributeName="cy" calcMode="spline" dur="0.6s" values="12;6;12" keySplines=".33,.66,.66,1;.33,0,.66,.33"></animate>
        </circle>
        <circle cx="20" cy="12" r="2" fill="currentColor">
          <animate id="spinner_OcgL" begin="spinner_qFRN.begin+0.2s" attributeName="cy" calcMode="spline" dur="0.6s" values="12;6;12" keySplines=".33,.66,.66,1;.33,0,.66,.33"></animate>
        </circle>
      </svg>
    </div>
  </div>
</div>
```

Answer bubble (assistant):

```html
<div class="flex gap-2 items-start group self-start w-full relative group">
  <div class="text-secondary-foreground rounded-lg py-2 break-words max-w-full whitespace-pre-wrap">
    <div class="prose w-full max-w-none whitespace-normal break-words leading-[1.6] [--tw-prose-body:currentColor]">
      <!-- paragraphs / ul / a / strong -->
    </div>
  </div>
</div>
```

Question bubble (follow-ups, right aligned, same classes as the top bubble):

```html
<div class="flex gap-2 items-start group self-end flex-row-reverse relative group">
  <div class="p-2 px-5 bg-primary text-primary-foreground rounded-3xl break-words max-w-full whitespace-pre-wrap" style="background: rgb(230, 74, 141); color: rgb(0, 0, 0);">
    <div class="prose w-full max-w-none whitespace-normal break-words leading-[1.6]"><p class="my-3 first:mt-0 last:mb-0">QUESTION</p></div>
  </div>
</div>
```

## Answer engine

`answerFor(question)` returns HTML. Match on lower-cased, diacritic-folded
text. Turkish and English keywords both work. Order matters: check specific
intents before the generic `about` intent.

Intents and required facts (all from `src/data-clean.json`):

| Intent | Keywords (examples) | Answer must contain |
| --- | --- | --- |
| greeting | hello, hi, merhaba, selam | one-line intro + 2 suggested questions |
| about | who, about, yourself, kimsin, hakkında | intro, current role, languages |
| experience | work, job, experience, company, deneyim, iş | every role: title, company, dates, one-line description |
| education | study, university, school, degree, eğitim, okul | both entries with dates |
| skills | skill, stack, tech, yetenek, teknoloji | grouped by category with level |
| projects | project, proje, built, portfolio | 9 projects: title + one-line tagline; link GitHub when present |
| location | where, based, city, istanbul, nerede, konum | Istanbul, Türkiye + timezone |
| social | social, follow, linkedin, takip | LinkedIn + GitHub URLs |
| github | github, repos, code, kod | login, 14 public repos, 2 stars, 2 pinned repos |
| resume | resume, cv, özgeçmiş | `/files/Elif-Beraa-Cigrikci-CV.pdf` |
| contact | contact, email, reach, hire, iletişim, ulaş | mailto link + LinkedIn |
| languages | language, dil | Turkish native, English professional |
| thanks | thanks, thank, teşekkür | short closing |
| fallback | anything else | say the detail is not available, offer contact + 3 example questions |

Rules:

- English output. Short paragraphs, no marketing adjectives, no emoji except the
  ones already inside project titles.
- Escape all data before inserting into HTML (`&`, `<`, `>`, `"`).
- Only `http(s)` and `mailto` links. Open external links with
  `target="_blank" rel="noopener noreferrer"`.
- Maximum ~1,300 visible characters per answer.
- Dates: `2024-06` -> `Jun 2024`; ranges `Sep 2025 - Nov 2025`; current role
  `Jun 2024 - Present`. Use the data as-is, do not round or invent.
- Skills levels: `proficient` -> "Proficient", `comfortable` -> "Comfortable",
  `learning` -> "Learning".
- LinkedIn: `https://www.linkedin.com/in/elif-%C3%A7%C4%B1%C4%9Fr%C4%B1k%C3%A7%C4%B1`
  (handle `elif-çığrıkçı`). GitHub: `https://github.com/elifberaa`.
- Projects: include the GitHub link only when the project has a `github` link.
- Never claim to be an AI model, never claim real-time data, never invent
  employers, grades, dates, phone numbers or awards. `phone` is `"+"`, so do not
  show a phone number.

## Acceptance checks (run before reporting)

1. `node scripts/build.mjs` succeeds.
2. `python3 -m http.server 4174` from the repo root; open
   `http://127.0.0.1:4174/`.
3. With Playwright (absolute import):
   `/home/basem/code/aden-plus-turizm/node_modules/playwright/index.mjs`
   - click `Who are you?` -> ask view visible, page hidden, answer contains
     "software engineer" and no `undefined`/`NaN`.
   - submit `Where did you study?` -> second answer contains
     "Istanbul Sabahattin Zaim University".
   - reload with `?q=Can%20I%20see%20your%20resume%3F` -> ask view opens and the
     answer links to `/files/Elif-Beraa-Cigrikci-CV.pdf`.
   - Escape -> page visible again, URL has no `q`.
   - 390x844: mobile layout visible, desktop hidden; same interactions.
   - `prefers-reduced-motion: reduce` -> no typing animation, answer appears.
4. `node --check assets/app.js` and `node --check assets/data.js`.

Report: files changed, commands run, evidence paths, known limitations.
