document.documentElement.classList.add('js');

const defaultLocale = 'ru';
const supportedLocales = ['ru', 'en'];

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
    renderServices();
    renderPackages();
    updateLangButton();
    resetModal();

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

function renderSkills() {
    renderList('skillsList', translations.skills, (skill) => {
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
        const card = externalLink(pkg.url, 'package-card');

        const top = el('div', 'package-top');
        top.appendChild(el('code', 'package-slug', pkg.slug));
        const arrow = el('span', 'circle-icon');
        arrow.appendChild(icon('arrow-up-right'));
        top.appendChild(arrow);
        card.appendChild(top);

        card.appendChild(el('h3', 'package-title', pkg.name));
        card.appendChild(el('p', 'package-text', pkg.description));
        card.appendChild(el('p', 'package-stack', translations.packages_stack || ''));
        return card;
    });
}

// ── Locale switcher ─────────────────────

function nextLocale() {
    const currentIndex = supportedLocales.indexOf(locale);
    return supportedLocales[(currentIndex + 1) % supportedLocales.length];
}

function updateLangButton() {
    const btn = document.querySelector('[data-i18n-switcher]');
    if (btn) btn.textContent = nextLocale().toUpperCase();
}

function bindLocaleSwitcher() {
    const switcher = document.querySelector('[data-i18n-switcher]');
    if (switcher) switcher.addEventListener('click', () => setLocale(nextLocale()));
}

// ── About modal (content is stored locally in /content) ─────────────────────

let modalLoadedFor = null;

function resetModal() {
    modalLoadedFor = null;
}

function initModal() {
    const modal = document.getElementById('aboutModal');
    const aboutLink = document.getElementById('aboutLink');
    const closeModalBtn = document.getElementById('closeModal');
    const modalContent = document.getElementById('modalContent');

    aboutLink.addEventListener('click', async () => {
        modal.classList.add('active');
        closeModalBtn.focus();

        if (modalLoadedFor === locale) return;

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
            modalLoadedFor = requestedLocale;
        } catch (error) {
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
    const slidesEl = document.querySelector('.slides');
    const slides = Array.from(document.querySelectorAll('.slide'));
    const dockItems = document.querySelectorAll('.dock-item[href]');
    const header = document.querySelector('.site-header');
    if (!slidesEl || !slides.length) return;

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

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            const visible = entries
                .filter((entry) => entry.isIntersecting)
                .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
            if (visible) setActive(slides.indexOf(visible.target));
        }, { root: slidesEl, threshold: 0.6 });

        slides.forEach((slide) => observer.observe(slide));
    }

    const goToIndex = (index) => {
        const clamped = Math.max(0, Math.min(slides.length - 1, index));
        slides[clamped].scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
    };

    document.querySelectorAll('a[href^="#"]').forEach((link) => {
        link.addEventListener('click', (e) => {
            const index = slides.findIndex((slide) => `#${slide.id}` === link.getAttribute('href'));
            if (index === -1) return;
            e.preventDefault();
            goToIndex(index);
        });
    });

    // A vertical wheel / trackpad gesture flips one slide at a time,
    // unless the current slide itself has content left to scroll.
    // The lock is held until the gesture (including trackpad inertia) goes quiet.
    let wheelLocked = false;
    let wheelUnlockTimer;
    slidesEl.addEventListener('wheel', (e) => {
        if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;

        const slide = slides[activeIndex];
        const canScrollDown = slide.scrollTop + slide.clientHeight < slide.scrollHeight - 1;
        const canScrollUp = slide.scrollTop > 0;
        if ((e.deltaY > 0 && canScrollDown) || (e.deltaY < 0 && canScrollUp)) return;

        e.preventDefault();
        clearTimeout(wheelUnlockTimer);
        wheelUnlockTimer = setTimeout(() => { wheelLocked = false; }, 250);
        if (wheelLocked || Math.abs(e.deltaY) < 4) return;
        wheelLocked = true;
        goToIndex(activeIndex + Math.sign(e.deltaY));
    }, { passive: false });

    document.addEventListener('keydown', (e) => {
        if (document.getElementById('aboutModal').classList.contains('active')) return;
        if (e.key === 'ArrowRight' || e.key === 'PageDown') {
            e.preventDefault();
            goToIndex(activeIndex + 1);
        } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
            e.preventDefault();
            goToIndex(activeIndex - 1);
        } else if (e.key === 'Home') {
            goToIndex(0);
        } else if (e.key === 'End') {
            goToIndex(slides.length - 1);
        }
    });
}
