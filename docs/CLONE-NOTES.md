# Clone notes - original portfolio page

Owner request (2026-10-22): copy her live portfolio page in full detail -
layout, design, animations, pointer-reactive background, responsive behaviour -
and publish it on GitHub + Vercel. The page and its content belong to Elif
Beraa Çığrıkçı. No branding, link or file from the original hosting service is
kept in this repository.

## Method

1. Passive capture of the live page with Playwright/Chromium:
   - desktop 1440x960 and 1920x960, mobile 390x844, full-page PNGs;
   - post-hydration DOM (`main` element), both layout trees;
   - computed styles, element rects, font stacks, animation properties;
   - network responses, including the Supabase `widgets` payload that carries
     every fact used on the page.
2. Asset capture: the two compiled Tailwind CSS files, 54 woff2 font files,
   10 icon masks, the avatar and the CV PDF. URLs were rewritten to local
   paths; no runtime request leaves the origin.
3. Independent structural check with REA 6.7.0 (`rea-agents`, morluto/rea) over
   CDP: `list-browser-targets` and `inspect-web-page` (273 DOM nodes, 153
   accessibility nodes, 60 resources, one frame). `analyze-web-bundle` aborted
   with exit 134 on the large Next.js bundles; that failure is recorded and no
   claim rests on it.
4. Rebuild: the captured desktop and mobile `main` trees are served verbatim
   and switched with a media query at 1000 px (the live app switches at the
   same point: 980 px renders the list, 1000 px renders the bento grid). The
   ask overlay is rebuilt from the captured markup and the original `ig-*`
   animation classes.
5. Verification: full-page screenshot comparison, original vs clone, with
   ffmpeg PSNR (2026-10-22):
   - 1440x960: 88.89 dB
   - 1920x960: 88.41 dB
   - 390x844: 85.30 dB

   Element rects matched exactly at 1440 (avatar tile 85x85 at 275,39; cards
   198x198; composer 340x24 at 538,1047; pill 161x36 at 1263,908).

## What is reproduced

- Desktop bento grid (8 columns x 115 px, 30 px gutter, 28 px tile radius).
- Mobile list layout (avatar hero 4:4, one row per tile, pink View pills).
- Typography: DM Sans for UI, Lora for the intro, Geist available from the
  original font set.
- Palette: page `#fdeff4`, accent `#e64a8d`, tile `#ffffff`, tile text
  `#2a1620`, tile border `#f6d9e4`.
- Ask view: pink conic-gradient glow frame (`ig-spin`, `ig-breathe`), 112 px
  avatar, question bubble, three-dot loader, 350 px composer, back button.
- Pointer-reactive fluid background (WebGL): pastel palette, splats on mouse
  and touch, same simulation resolution and dissipation constants as the
  original. Disabled under `prefers-reduced-motion`.
- `prefers-reduced-motion` disables the glow spin, breathing and typing.

## What is not reproduced

- The original service's hosted chat backend. The live page currently answers
  "This portfolio has used all its free messages." The clone instead answers
  from the profile's own facts in `assets/data.js`; it never invents facts and
  points to the contact address when a detail is missing.
- Third-party analytics (GTM/GA/DataFast), auth and dashboard code.
- The marketing pill that offered the design as a template, and its modal. The
  pill is removed completely; the page carries no link back to the original
  service.
- The original hosting service's logo, favicon and icon files. The back button
  uses a neutral arrow and the favicon is a personal monogram.

## Files

- `src/desktop.html`, `src/mobile.html` - captured layout trees.
- `src/overlay.html` - ask view markup, same classes as the original.
- `assets/*.css` - original compiled styles (font URLs rewritten).
- `assets/app.js`, `assets/data.js` - interaction controller and local facts.
- `scripts/build.mjs` - assembles `index.html`.

Evidence (screenshots, raw JSON, network dumps) is kept outside the repo under
`/home/basem/.cache/opencode-tmp/elif-recon/`.

## Publication

- GitHub: `https://github.com/prenseselifberaa-art/elifberaa` (`main`)
- Vercel production: `https://elifberaa.vercel.app`
- First deployment: 2026-10-22, Vercel CLI 65.1.0, static build (no framework).
- Headers: CSP (`script-src 'self'`, `connect-src 'none'`), nosniff, frame
  options, referrer policy; immutable caching for `/assets/*`.

## Background animation

The original page renders a WebGL fluid simulation on a fixed canvas behind the
content: pointer movement and touch inject dye, the dye drifts and dissipates.
It is not a video or CSS gradient, so it was reproduced with the same
simulation: vendored MIT build in `assets/fluid.js`, exact constants
(SIM 128, DYE 1440, dissipation .5 / 3, curl 3, splat .2 / 6000, transparency),
and the seven-colour pastel palette normalised to at least 0.75 saturation.
`assets/background.js` starts it only when `prefers-reduced-motion` is not set.
The renderer is deterministic in its physics but picks splat colours at random,
so frame-by-frame equality with the original is not expected; the palette,
opacity and trail shape match.

## Animation switcher and the kitty (2026-10-23)

The owner asked for an optional second animation and an easy way to switch.
A three-segment glass control switches with one tap: Fluid (default), Kitty,
Off. The choice is stored in `localStorage` under `elifberaa.animation`;
nothing is sent over the network. The control sits bottom-right on desktop and
top-right on mobile (over the hero photo, clear of card actions), hides while
scrolling down, and suspends both engines while the ask view is open.

All three layers (fluid canvas, kitty, princess dust) sit at `z-index: 0`,
behind the cards and buttons, like wallpaper; none of them tint or cover the
content. When no pointer movement has happened for five seconds the fluid emits
a soft eight-step ambient trail every six seconds. All layers are
`pointer-events: none`.

Desktop shortcuts: 1 = Fluid, 2 = Prenses, 3 = Off. The segmented control is
44 px high and never auto-hides on desktop. In kitty mode the native cursor is
hidden on fine pointers and the cat follows the pointer closely enough to act
as the cursor; opening the ask view restores the normal cursor.

The kitty is an original pastel princess-cat illustration drawn for this page,
with a gold tiara, lashes, a pink bow, a tail, blinking, a gentle bob,
heart and star particles, a touch lift so a finger does not cover it, happy
eyes and a burst when it is clicked nearby, and a small speech bubble ("mrrp",
"hi", "meow", "prr"). The mode is labelled "Prenses" with a crown icon.
The kitty is 88 px on desktop and 96 px on phones; when the pointer is over a
card or control it fades out (the native cursor returns) instead of peeking
from behind the surface. On a fine pointer the kitty replaces the native
cursor on empty background:
`body.kitty-cursor` sets `cursor: none`, but the `kitty-over-ui` class restores
the normal pointer/text cursor whenever the pointer is over a button, link or
field (the kitty is behind those surfaces anyway). It contains no third-party
character art.

The profile photo has its own frame animation: a rotating pastel conic ring,
a periodic light sweep every 7.5 s, a 1.045 hover zoom with a small saturation
lift, and a 9 s breathing scale on phones. Reduced motion disables all of it.

Buttons have their own micro-interactions, independent of the background:
a pink sheen sweep and 1 px lift on hover, a press scale, a soft pulse on the
pink CTA pills, a pink focus ring, and five small gold/pink/lavender stars that
pop from the click point (skipped under reduced motion). Under `prefers-reduced-motion` the page starts with
the animation off; selecting a mode manually is treated as an explicit opt-in.

## Branding removal (2026-10-23)

At the owner's request the page carries no trace of the original hosting
service: the marketing pill, its logo asset, the service favicon and
the service logo used on the back button were removed. The back button is a
neutral arrow and the favicon is a personal monogram. The repository was
re-published as a single clean commit so no earlier revision contains those
references.

## Live comparison (2026-10-22, before the branding removal)

Full-page screenshots, original vs deployed clone, ffmpeg PSNR:

- 1440x960: 88.11 dB
- 390x844: 89.78 dB

Only differences are sub-pixel anti-aliasing and the rotating glow phase in the
ask view.

