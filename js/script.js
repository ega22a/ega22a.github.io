document.documentElement.classList.add('js');

const defaultLocale = 'ru';
const supportedLocales = ['ru', 'en', 'zh'];

let locale;
let translations = {};

document.addEventListener('DOMContentLoaded', () => {
    setLocale(defaultLocale);
    bindLocaleSwitcher();
    initModal();
    initHeroGallery();
    initSlides();
});

async function setLocale(newLocale) {
    if (locale === newLocale) return;

    const newTranslations = await fetchTranslationsFor(newLocale);
    locale = newLocale;
    translations = newTranslations;

    translatePage();
    renderSkills();
    renderAi();
    renderServices();
    renderPackages();
    updateLangButton();

    document.documentElement.setAttribute('lang', newLocale);
}

async function fetchTranslationsFor(newLocale) {
    const response = await fetch(`/lang/${newLocale}.json`);
    return await response.json();
}

function translatePage() {
    document.querySelectorAll('[data-i18n-key]').forEach((element) => {
        const translation = translations[element.getAttribute('data-i18n-key')];
        if (typeof translation === 'string') element.textContent = translation;
    });
    document.querySelectorAll('[data-i18n-label]').forEach((element) => {
        const translation = translations[element.getAttribute('data-i18n-label')];
        if (translation) element.setAttribute('aria-label', translation);
    });
    document.querySelectorAll('[data-i18n-alt]').forEach((element) => {
        const translation = translations[element.getAttribute('data-i18n-alt')];
        if (translation) element.setAttribute('alt', translation);
    });
}

// ── Rendering helpers ─────────────────────

function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

function icon(name) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('aria-hidden', 'true');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', `#i-${name}`);
    svg.appendChild(use);
    return svg;
}

function externalLink(href, className) {
    const link = el('a', className);
    link.href = href;
    link.target = '_blank';
    link.rel = 'noopener';
    return link;
}

function renderList(containerId, items, renderItem) {
    const container = document.getElementById(containerId);
    if (!container || !Array.isArray(items)) return;
    container.replaceChildren(...items.map(renderItem));
}

function renderSkillCards(containerId, items) {
    renderList(containerId, items, (skill) => {
        const card = el('article', 'skill-card');

        if (skill.icons?.length) {
            const icons = el('div', 'skill-icons');
            skill.icons.forEach((name) => {
                const wrap = el('span', 'skill-icon');
                const img = el('img');
                img.src = `/assets/icons/${name}.svg`;
                img.alt = name;
                img.title = name;
                img.width = 22;
                img.height = 22;
                wrap.appendChild(img);
                icons.appendChild(wrap);
            });
            card.appendChild(icons);
        }

        if (skill.chips?.length) {
            const chips = el('div', 'skill-chips');
            skill.chips.forEach((chip) => chips.appendChild(el('span', 'chip', chip)));
            card.appendChild(chips);
        }

        card.appendChild(el('h3', 'skill-title', skill.title));
        card.appendChild(el('p', 'skill-text', skill.text));
        return card;
    });
}

function renderSkills() {
    renderSkillCards('skillsList', translations.skills);
}

function renderAi() {
    renderSkillCards('aiList', translations.ai);
}

function renderServices() {
    renderList('servicesList', translations.services, (service) => {
        const card = externalLink(service.url, 'service-card');

        const media = el('div', 'service-media');
        const img = el('img');
        img.src = service.image;
        img.alt = service.name;
        img.loading = 'lazy';
        media.appendChild(img);
        media.appendChild(el('span', 'service-badge', service.badge));
        card.appendChild(media);

        const title = el('h3', 'service-title');
        const arrow = el('span', 'circle-icon');
        arrow.appendChild(icon('arrow-right'));
        title.append(arrow, el('span', '', service.name));
        card.appendChild(title);

        card.appendChild(el('p', 'service-text', service.description));

        const tags = el('div', 'service-tags');
        (service.tags || []).forEach((tag) => tags.appendChild(el('span', 'chip', tag)));
        card.appendChild(tags);

        return card;
    });
}

function renderPackages() {
    renderList('packagesList', translations.packages, (pkg) => {
        // A package without a public repository is shown as a plain card with a badge
        const card = pkg.url ? externalLink(pkg.url, 'package-card') : el('article', 'package-card is-private');

        const top = el('div', 'package-top');
        top.appendChild(el('code', 'package-slug', pkg.slug));
        if (pkg.url) {
            const arrow = el('span', 'circle-icon');
            arrow.appendChild(icon('arrow-up-right'));
            top.appendChild(arrow);
        } else {
            top.appendChild(el('span', 'package-badge', translations.package_private));
        }
        card.appendChild(top);

        card.appendChild(el('h3', 'package-title', pkg.name));
        card.appendChild(el('p', 'package-text', pkg.description));
        card.appendChild(el('p', 'package-stack', pkg.stack || translations.packages_stack || ''));
        return card;
    });
}

// ── Locale switcher ─────────────────────

// Native names so users can always find their own language regardless of the UI language.
const localeNames = { ru: 'Русский', en: 'English', zh: '中文' };

function updateLangButton() {
    const btn = document.querySelector('[data-i18n-switcher]');
    if (btn) btn.textContent = locale.toUpperCase();
    document.querySelectorAll('.lang-menu-item').forEach((item) => {
        item.classList.toggle('is-active', item.dataset.setLocale === locale);
    });
}

function bindLocaleSwitcher() {
    const wrap = document.querySelector('.dock-lang-wrap');
    const btn = document.querySelector('[data-i18n-switcher]');
    const menu = wrap?.querySelector('.lang-menu');
    if (!wrap || !btn || !menu) return;

    menu.replaceChildren(...supportedLocales.map((code) => {
        const item = el('button', 'lang-menu-item', localeNames[code] || code);
        item.type = 'button';
        item.dataset.setLocale = code;
        return item;
    }));

    const close = () => {
        menu.hidden = true;
        btn.setAttribute('aria-expanded', 'false');
    };

    btn.addEventListener('click', () => {
        const open = menu.hidden;
        menu.hidden = !open;
        btn.setAttribute('aria-expanded', String(open));
    });

    menu.addEventListener('click', (e) => {
        const item = e.target.closest('[data-set-locale]');
        if (!item) return;
        setLocale(item.dataset.setLocale);
        close();
        btn.focus();
    });

    document.addEventListener('click', (e) => {
        if (!wrap.contains(e.target)) close();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !menu.hidden) {
            close();
            btn.focus();
        }
    });
}

// ── About modal (content is stored locally in /content) ─────────────────────
// The Russian text is prerendered into index.html; data-locale marks what is loaded.

function initModal() {
    const modal = document.getElementById('aboutModal');
    const aboutLink = document.getElementById('aboutLink');
    const closeModalBtn = document.getElementById('closeModal');
    const modalContent = document.getElementById('modalContent');

    aboutLink.addEventListener('click', async () => {
        modal.classList.add('active');
        closeModalBtn.focus();

        if (modalContent.dataset.locale === locale) return;

        const requestedLocale = locale;
        modalContent.innerHTML = '<div class="spinner"></div>';

        try {
            const response = await fetch(`/content/about.${requestedLocale}.md`);
            if (!response.ok) throw new Error('Network response was not ok');
            const markdown = await response.text();
            if (requestedLocale !== locale) return;
            modalContent.innerHTML = marked.parse(markdown);
            modalContent.querySelectorAll('a[href^="http"]').forEach((link) => {
                link.target = '_blank';
                link.rel = 'noopener';
            });
            modalContent.dataset.locale = requestedLocale;
        } catch (error) {
            delete modalContent.dataset.locale;
            modalContent.replaceChildren(el('p', 'modal-error', translations.modal_error));
        }
    });

    function closeModal() {
        modal.classList.remove('active');
        aboutLink.focus();
    }

    closeModalBtn.addEventListener('click', closeModal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });
}

// ── Hero photo gallery ─────────────────────

// The progress bar animation is the clock: when it ends the next photo is shown,
// so pausing the animation (hero off-screen, tab hidden) pauses the gallery too.
function initHeroGallery() {
    const images = Array.from(document.querySelectorAll('.hero-gallery-img'));
    const progress = document.querySelector('.hero-progress');
    const hero = document.getElementById('hero');
    if (images.length < 2 || !progress) return;

    let current = 0;
    const bars = images.map((_, i) => {
        const bar = el('button');
        bar.type = 'button';
        bar.tabIndex = -1;
        bar.addEventListener('click', () => show(i));
        progress.appendChild(bar);
        return bar;
    });

    function show(index) {
        current = (index + images.length) % images.length;
        images.forEach((img, i) => img.classList.toggle('is-current', i === current));
        bars.forEach((bar, i) => {
            bar.classList.remove('is-current');
            bar.classList.toggle('is-done', i < current);
        });
        void progress.offsetWidth; // restart the progress animation
        bars[current].classList.add('is-current');
    }

    const updatePaused = () => {
        progress.classList.toggle('is-paused', document.hidden || !hero.classList.contains('is-active'));
    };

    progress.addEventListener('animationend', (e) => {
        if (e.target === bars[current]) show(current + 1);
    });
    document.addEventListener('slidechange', updatePaused);
    document.addEventListener('visibilitychange', updatePaused);

    show(0);
}

// ── Slides ─────────────────────

function initSlides() {
    const slides = Array.from(document.querySelectorAll('.slide'));
    const dockItems = document.querySelectorAll('.dock-item[href]');
    const header = document.querySelector('.site-header');
    if (!slides.length) return;

    let activeIndex = -1;

    const setActive = (index) => {
        if (index === -1 || index === activeIndex) return;
        activeIndex = index;
        const id = slides[index].id;

        dockItems.forEach((item) => {
            item.classList.toggle('is-active', item.getAttribute('href') === `#${id}`);
        });
        if (header) header.dataset.theme = ['light', 'grey'].find((t) => slides[index].classList.contains(`theme-${t}`)) || 'dark';

        slides.forEach((slide, i) => slide.classList.toggle('is-active', i === index));
        document.dispatchEvent(new CustomEvent('slidechange', { detail: { id } }));
    };

    setActive(0);

    // The active slide is the one crossing the middle of the screen,
    // which also works for slides taller than the viewport.
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            const visible = entries.find((entry) => entry.isIntersecting);
            if (visible) setActive(slides.indexOf(visible.target));
        }, { rootMargin: '-50% 0px -50% 0px' });

        slides.forEach((slide) => observer.observe(slide));
    }

    document.querySelectorAll('a[href^="#"]').forEach((link) => {
        link.addEventListener('click', (e) => {
            const slide = slides.find((s) => `#${s.id}` === link.getAttribute('href'));
            if (!slide) return;
            e.preventDefault();
            slide.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });
}
