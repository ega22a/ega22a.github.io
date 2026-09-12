const defaultLocale = 'ru';
const supportedLocales = ['ru', 'en'];

let locale;
let translations = {};

document.addEventListener('DOMContentLoaded', () => {
    setLocale(defaultLocale);
    bindLocaleSwitcher();
    initModal();
    initSlides();
});

async function setLocale(newLocale) {
    if (locale === newLocale) return;

    const newTranslations = await fetchTranslationsFor(newLocale);
    locale = newLocale;
    translations = newTranslations;

    translatePage();
    renderProjects();
    updateLangButton();

    document.documentElement.setAttribute('lang', newLocale);
}

async function fetchTranslationsFor(newLocale) {
    const response = await fetch(`/lang/${newLocale}.json`);
    return await response.json();
}

function translatePage() {
    document.querySelectorAll('[data-i18n-key]').forEach(translateElement);
}

function translateElement(element) {
    const key = element.getAttribute('data-i18n-key');
    const translation = translations[key];
    if (translation) {
        element.textContent = translation;
    }
}

const PROJECT_ICONS = {
    visit: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>',
    code: '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>',
};

function renderProjects() {
    const container = document.getElementById('projectsList');
    if (!container || !Array.isArray(translations.projects)) return;

    container.innerHTML = '';

    translations.projects.forEach((project) => {
        const card = document.createElement('div');
        card.className = 'project-card';

        const title = document.createElement('h3');
        title.textContent = project.name;
        card.appendChild(title);

        const description = document.createElement('p');
        description.textContent = project.description;
        card.appendChild(description);

        const links = document.createElement('div');
        links.className = 'project-links';

        if (project.url) {
            links.appendChild(createProjectLink(project.url, translations.project_visit || 'Visit', 'visit'));
        }
        if (project.repo) {
            links.appendChild(createProjectLink(project.repo, translations.project_code || 'Code', 'code'));
        }

        card.appendChild(links);
        container.appendChild(card);
    });
}

function createProjectLink(href, label, icon) {
    const link = document.createElement('a');
    link.href = href;
    link.target = '_blank';
    link.rel = 'noopener';
    link.className = 'project-link';
    link.innerHTML = PROJECT_ICONS[icon] || '';

    const span = document.createElement('span');
    span.textContent = label;
    link.appendChild(span);

    return link;
}

function updateLangButton() {
    const btn = document.querySelector('[data-i18n-switcher]');
    if (!btn) return;
    
    const currentIndex = supportedLocales.indexOf(locale);
    const nextLocale = supportedLocales[(currentIndex + 1) % supportedLocales.length];
    btn.textContent = nextLocale.toUpperCase();
}

function bindLocaleSwitcher() {
    const switcher = document.querySelector('[data-i18n-switcher]');
    if (!switcher) return;

    switcher.addEventListener('click', () => {
        const currentIndex = supportedLocales.indexOf(locale);
        const nextLocale = supportedLocales[(currentIndex + 1) % supportedLocales.length];
        setLocale(nextLocale);
    });
}

function initModal() {
    const modal = document.getElementById('aboutModal');
    const aboutLink = document.getElementById('aboutLink');
    const closeModalBtn = document.getElementById('closeModal');
    const modalContent = document.getElementById('modalContent');
    let loaded = false;

    aboutLink.addEventListener('click', async (e) => {
        e.preventDefault();
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        if (loaded) return;

        try {
            const response = await fetch('https://raw.githubusercontent.com/ega22a/ega22a/refs/heads/main/README.md');
            if (!response.ok) throw new Error('Network response was not ok');
            const markdown = await response.text();
            modalContent.innerHTML = marked.parse(markdown);
            loaded = true;
        } catch (error) {
            modalContent.innerHTML = `
                <p style="color:var(--text-muted);text-align:center;padding:2rem 0;">
                    Не удалось загрузить данные. Попробуйте позже.
                </p>`;
        }
    });

    function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
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

function initSlides() {
    const slidesEl = document.querySelector('.slides');
    const slides = Array.from(document.querySelectorAll('.slide'));
    const navLinks = document.querySelectorAll('.nav-link');
    const dots = document.querySelectorAll('.slide-dot');
    const prevBtn = document.querySelector('.slide-arrow-prev');
    const nextBtn = document.querySelector('.slide-arrow-next');
    if (!slidesEl || !slides.length) return;

    let activeIndex = 0;

    const setActive = (id) => {
        const index = slides.findIndex((slide) => slide.id === id);
        if (index === -1 || index === activeIndex) return;
        activeIndex = index;

        navLinks.forEach((link) => {
            link.classList.toggle('is-active', link.getAttribute('href') === `#${id}`);
        });
        dots.forEach((dot) => {
            dot.classList.toggle('is-active', dot.getAttribute('href') === `#${id}`);
        });
        if (prevBtn) prevBtn.disabled = activeIndex === 0;
        if (nextBtn) nextBtn.disabled = activeIndex === slides.length - 1;

        const inner = slides[activeIndex].querySelector('.slide-inner');
        if (inner) {
            inner.classList.remove('is-entering');
            // eslint-disable-next-line no-void
            void inner.offsetWidth; // restart animation
            inner.classList.add('is-entering');
        }
    };

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            const visible = entries
                .filter((entry) => entry.isIntersecting)
                .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
            if (visible) setActive(visible.target.id);
        }, { root: slidesEl, threshold: 0.6 });

        slides.forEach((slide) => observer.observe(slide));
    }

    const goToIndex = (index) => {
        const clamped = Math.max(0, Math.min(slides.length - 1, index));
        slides[clamped].scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
    };

    if (prevBtn) prevBtn.addEventListener('click', () => goToIndex(activeIndex - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => goToIndex(activeIndex + 1));

    // Let a normal vertical wheel/trackpad gesture drive the horizontal slider.
    slidesEl.addEventListener('wheel', (e) => {
        if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
        e.preventDefault();
        slidesEl.scrollLeft += e.deltaY;
    }, { passive: false });

    document.addEventListener('keydown', (e) => {
        if (document.getElementById('aboutModal').classList.contains('active')) return;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            e.preventDefault();
            goToIndex(activeIndex + 1);
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault();
            goToIndex(activeIndex - 1);
        }
    });
}