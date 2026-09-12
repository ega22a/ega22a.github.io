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