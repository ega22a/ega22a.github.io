const defaultLocale = "ru";
const supportedLocales = ["ru", "en"];

let locale;
let translations = {};

document.addEventListener("DOMContentLoaded", () => {
    setLocale(defaultLocale);
    bindLocaleSwitcher(defaultLocale);
    initModal();
});

async function setLocale(newLocale) {
    if (locale === newLocale) return;

    const newTranslations = await fetchTranslationsFor(newLocale);
    locale = newLocale;
    translations = newTranslations;
    
    translatePage();
}

async function fetchTranslationsFor(newLocale) {
    const response = await fetch(`/lang/${newLocale}.json`);

    return await response.json();
}

function translatePage() {
    document
        .querySelectorAll("[data-i18n-key]")
        .forEach(translateElement);
}

function translateElement(element) {
    const key = element.getAttribute("data-i18n-key");
    const translation = translations[key];

    if (translation) {
        element.textContent = translation;
    }
}

function bindLocaleSwitcher(initLocale) {
    const switcher = document.querySelector("[data-i18n-switcher]");

    document.querySelector('[lang]').setAttribute('lang', initLocale);
    switcher.addEventListener("click", (event) => {
        event.preventDefault();
        const currentLocale = document.querySelector('[lang]').getAttribute('lang');
        const nextLocale = supportedLocales[(supportedLocales.indexOf(currentLocale) + 1) % supportedLocales.length];

        setLocale(nextLocale);
        document.querySelector('[lang]').setAttribute('lang', nextLocale);
    });
}

// Модальное окно
function initModal() {
    const modal = document.getElementById('aboutModal');
    const aboutLink = document.getElementById('aboutLink');
    const closeModal = document.getElementById('closeModal');
    const modalContent = document.getElementById('modalContent');

    aboutLink.addEventListener('click', async (e) => {
        e.preventDefault();
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        
        // Загружаем README.md
        try {
            const response = await fetch('https://raw.githubusercontent.com/ega22a/ega22a/refs/heads/main/README.md');
            const markdown = await response.text();
            
            // Парсим Markdown в HTML
            modalContent.innerHTML = marked.parse(markdown);
        } catch (error) {
            modalContent.innerHTML = '<p class="text-red-600">Ошибка загрузки данных. Попробуйте позже.</p>';
        }
    });

    closeModal.addEventListener('click', () => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    });

    // Закрытие по клику вне модального окна
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    });

    // Закрытие по ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    });
}