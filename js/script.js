const defaultLocale = "ru";
const supportedLocales = ["ru", "en"];

let locale;
let translations = {};

document.addEventListener("DOMContentLoaded", () => {
    setLocale(defaultLocale);
    bindLocaleSwitcher(defaultLocale);
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