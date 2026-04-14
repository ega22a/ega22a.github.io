const defaultLocale = 'ru';
const supportedLocales = ['ru', 'en'];

let locale;
let translations = {};

document.addEventListener('DOMContentLoaded', () => {
    setLocale(defaultLocale);
    bindLocaleSwitcher();
    initModal();
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