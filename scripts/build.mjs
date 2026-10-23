#!/usr/bin/env node
/**
 * Assembles index.html from the captured source fragments in src/.
 *
 * The fragments are the live page structure captured from
 * live page (see docs/CLONE-NOTES.md). Keeping them in
 * src/ means the published index.html can always be regenerated:
 *
 *   node scripts/build.mjs
 */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (p) => readFile(join(root, p), "utf8");

const [desktop, mobile, overlay, bodyAttrs] = await Promise.all([
  read("src/desktop.html"),
  read("src/mobile.html"),
  read("src/overlay.html"),
  read("src/body-attrs.txt"),
]);

const head = `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Elif Çığrıkçı - Software Engineer</title>
<meta name="description" content="Software engineer focused on data science, machine learning and artificial intelligence. Projects in federated learning, computer vision and data analytics.">
<meta name="author" content="Elif Çığrıkçı">
<meta name="theme-color" content="#fdeff4">
<link rel="canonical" href="https://elifberaa.vercel.app/">
<meta property="og:type" content="profile">
<meta property="og:url" content="https://elifberaa.vercel.app/">
<meta property="og:title" content="Elif Çığrıkçı - Software Engineer">
<meta property="og:description" content="Software engineer focused on data science, machine learning and artificial intelligence. Projects in federated learning, computer vision and data analytics.">
<meta property="og:image" content="https://elifberaa.vercel.app/images/avatar.jpg">
<meta property="og:image:alt" content="Elif Beraa Çığrıkçı">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Elif Çığrıkçı - Software Engineer">
<meta name="twitter:description" content="Software engineer focused on data science, machine learning and artificial intelligence.">
<meta name="twitter:image" content="https://elifberaa.vercel.app/images/avatar.jpg">
<link rel="icon" href="/favicon.svg" sizes="any">
<link rel="preload" as="image" href="/images/avatar.jpg" fetchpriority="high">
<link rel="stylesheet" href="/assets/d0160f35aa72e51d.css">
<link rel="stylesheet" href="/assets/4f56b06333c74db1.css">
<link rel="stylesheet" href="/assets/site.css">
<script src="/assets/data.js" defer></script>
<script src="/assets/app.js" defer></script>
<script src="/assets/fluid.js" defer></script>
<script src="/assets/background.js" defer></script>
<script src="/assets/animations.js" defer></script>`;

const html = `<!DOCTYPE html>
<html lang="en" class="light" style="color-scheme: light;">
<head>
${head}
</head>
<body${bodyAttrs}>
<main id="page-view">
<h1 class="sr-only">Elif Beraa Çığrıkçı - Software Engineer</h1>
<div id="fluid-host" aria-hidden="true" class="pointer-events-none fixed inset-0 z-0 overflow-hidden">
<canvas id="fluid" class="h-full w-full"></canvas>
</div>
<div id="kitty-layer" aria-hidden="true" class="pointer-events-none fixed inset-0 z-0 overflow-hidden" hidden>
<div id="kitty" class="kitty">
<div class="kitty-bob">
<svg viewBox="0 0 200 190" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M48 62 36 20l44 22Z" fill="#fff" stroke="#2a1620" stroke-width="5" stroke-linejoin="round"/>
<path d="M152 62l12-42-44 22Z" fill="#fff" stroke="#2a1620" stroke-width="5" stroke-linejoin="round"/>
<path class="kitty-tail" d="M164 128c32 6 42 30 24 46" fill="#fff" stroke="#2a1620" stroke-width="5" stroke-linecap="round"/>
<ellipse cx="100" cy="100" rx="72" ry="60" fill="#fff" stroke="#2a1620" stroke-width="5"/>
<g class="kitty-crown"><path d="M74 34 80 12l12 10L100 6l8 16 12-10 6 22Z" fill="#f7c948" stroke="#2a1620" stroke-width="3.5" stroke-linejoin="round"/><circle cx="100" cy="8" r="3.5" fill="#ff6fae" stroke="#2a1620" stroke-width="2"/><circle cx="80" cy="13" r="2.4" fill="#ff6fae"/><circle cx="120" cy="13" r="2.4" fill="#ff6fae"/></g>
<g class="kitty-lashes"><path d="M64 89l-7-4M67 96l-8-1M136 89l7-4M133 96l8-1" stroke="#2a1620" stroke-width="2.6" stroke-linecap="round"/></g>
<g class="kitty-eye kitty-eye-l"><ellipse cx="72" cy="96" rx="6.5" ry="10" fill="#2a1620"/></g>
<g class="kitty-eye kitty-eye-r"><ellipse cx="128" cy="96" rx="6.5" ry="10" fill="#2a1620"/></g>
<g class="kitty-happy"><path d="M64 98c5-8 11-8 16 0M120 98c5-8 11-8 16 0" stroke="#2a1620" stroke-width="4" stroke-linecap="round" fill="none"/></g>
<ellipse cx="100" cy="114" rx="7" ry="5" fill="#f7c948"/>
<path d="M38 106H16M38 118H18M162 106h22M162 118h20" stroke="#2a1620" stroke-width="3.5" stroke-linecap="round"/>
<ellipse cx="56" cy="114" rx="10" ry="6" fill="#ffd1e0"/>
<ellipse cx="144" cy="114" rx="10" ry="6" fill="#ffd1e0"/>
<g transform="translate(156 52) rotate(8)">
<path d="M0 0c-16-15-32-6-27 5 4 8 17 6 27 0Z" fill="#ff8fb8" stroke="#2a1620" stroke-width="3.5"/>
<path d="M0 0c16-15 32-6 27 5-4 8-17 6-27 0Z" fill="#ff8fb8" stroke="#2a1620" stroke-width="3.5"/>
<circle cx="0" cy="2" r="5" fill="#e64a8d" stroke="#2a1620" stroke-width="2.5"/>
</g>
</svg>
</div>
</div>
<div id="kitty-sparks" class="kitty-sparks"></div>
<div id="kitty-say" class="kitty-say" aria-hidden="true">mrrp</div>
</div>
<div id="princess-dust" class="princess-dust" aria-hidden="true"></div>
<div class="layout-desktop">
${desktop}
</div>
<div class="layout-mobile">
${mobile}
</div>
<div id="anim-dock" class="anim-dock" role="group" aria-label="Background animation">
<button type="button" data-anim="fluid" aria-pressed="true" aria-label="Fluid background" title="Fluid (1)" class="anim-item is-active">
<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3c3.5 4.3 6 7.3 6 10a6 6 0 0 1-12 0c0-2.7 2.5-5.7 6-10Z"/></svg><span class="anim-label">Fluid</span>
</button>
<button type="button" data-anim="kitty" aria-pressed="false" aria-label="Prenses animasyonu" title="Prenses (2)" class="anim-item">
<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8l4.5 3L12 4l4.5 7L21 8l-2 11H5L3 8Z"/><circle cx="12" cy="15" r="1.6" fill="currentColor" stroke="none"/></svg><span class="anim-label">Prenses</span>
</button>
<button type="button" data-anim="off" aria-pressed="false" aria-label="Turn animation off" title="Off (3)" class="anim-item">
<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m5.6 5.6 12.8 12.8"/></svg><span class="anim-label">Off</span>
</button>
<span id="anim-status" class="sr-only" role="status" aria-live="polite"></span>
</div>
</main>
${overlay}
</body>
</html>
`;

await writeFile(join(root, "index.html"), html);
console.log(`index.html written (${html.length} bytes)`);
