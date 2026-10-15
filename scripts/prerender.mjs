// Writes the Russian skills, services, packages and "about" markup straight into index.html,
// so search engines get the full page without running JavaScript.
// The markup mirrors renderSkills / renderServices / renderPackages in js/script.js.
//
// Run after editing lang/ru.json:  node scripts/prerender.mjs

import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

const { marked } = createRequire(import.meta.url)('../js/marked.min.js');

const root = new URL('../', import.meta.url);
const t = JSON.parse(await readFile(new URL('lang/ru.json', root), 'utf8'));

const esc = (value) => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

const icon = (name) => `<svg aria-hidden="true"><use href="#i-${name}"></use></svg>`;
const chips = (items) => items.map((chip) => `<span class="chip">${esc(chip)}</span>`).join('');

const skill = (s) => [
    '<article class="skill-card">',
    s.icons?.length ? `<div class="skill-icons">${s.icons.map((name) =>
        `<span class="skill-icon"><img src="/assets/icons/${name}.svg" alt="${name}" title="${name}" width="22" height="22"></span>`).join('')}</div>` : '',
    s.chips?.length ? `<div class="skill-chips">${chips(s.chips)}</div>` : '',
    `<h3 class="skill-title">${esc(s.title)}</h3>`,
    `<p class="skill-text">${esc(s.text)}</p>`,
    '</article>',
].join('');

const service = (s) => [
    `<a class="service-card" href="${esc(s.url)}" target="_blank" rel="noopener">`,
    `<div class="service-media"><img src="${esc(s.image)}" alt="${esc(s.name)}" loading="lazy"><span class="service-badge">${esc(s.badge)}</span></div>`,
    `<h3 class="service-title"><span class="circle-icon">${icon('arrow-right')}</span><span>${esc(s.name)}</span></h3>`,
    `<p class="service-text">${esc(s.description)}</p>`,
    `<div class="service-tags">${chips(s.tags || [])}</div>`,
    '</a>',
].join('');

const pkg = (p) => [
    p.url
        ? `<a class="package-card" href="${esc(p.url)}" target="_blank" rel="noopener">`
        : '<article class="package-card is-private">',
    `<div class="package-top"><code class="package-slug">${esc(p.slug)}</code>`,
    p.url ? `<span class="circle-icon">${icon('arrow-up-right')}</span>` : `<span class="package-badge">${esc(t.package_private)}</span>`,
    '</div>',
    `<h3 class="package-title">${esc(p.name)}</h3>`,
    `<p class="package-text">${esc(p.description)}</p>`,
    `<p class="package-stack">${esc(p.stack || t.packages_stack || '')}</p>`,
    p.url ? '</a>' : '</article>',
].join('');

const blocks = {
    skills: t.skills.map(skill),
    services: t.services.map(service),
    packages: t.packages.map(pkg),
    about: [marked.parse(await readFile(new URL('content/about.ru.md', root), 'utf8'))
        .trim()
        .replace(/<a href="http/g, '<a target="_blank" rel="noopener" href="http')],
};

const file = new URL('index.html', root);
let html = await readFile(file, 'utf8');

for (const [name, items] of Object.entries(blocks)) {
    const pattern = new RegExp(`(<!-- prerender:${name} -->)[\\s\\S]*?(\\s*<!-- /prerender:${name} -->)`);
    if (!pattern.test(html)) throw new Error(`Markers for "${name}" not found in index.html`);
    const indent = html.match(new RegExp(`\\n(\\s*)<!-- prerender:${name} -->`))[1];
    html = html.replace(pattern, (_, open, close) => `${open}\n${items.map((item) => `${indent}${item}`).join('\n')}${close}`);
}

await writeFile(file, html);
console.log('index.html: prerendered', Object.entries(blocks).map(([k, v]) => `${v.length} ${k}`).join(', '));
