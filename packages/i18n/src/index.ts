import i18n from "i18next";
import resourcesToBackend from "i18next-resources-to-backend";
import { initReactI18next, Trans, useTranslation } from "react-i18next";

// Only English is eagerly loaded (for instant fallback and TypeScript type inference).
// All other languages are lazy-loaded on demand via i18next-resources-to-backend.
import en from "./locales/en";

export const defaultNS = "common";
export const fallbackLng = "en";

export const namespaces = ["app", "common", "onboarding", "home"] as const;
export type Namespace = (typeof namespaces)[number];

export const supportedLanguages = [
	"en",
	"uk",
	"fr",
	"es",
	"de",
	"pt",
	"it",
	"pl",
	"ja",
	"ko",
	"zh",
	"ar",
	"hi",
	"tr",
] as const;

export type SupportedLanguage = (typeof supportedLanguages)[number];

// Resources type is derived from the English locale for TypeScript augmentation.
// At runtime, only English is bundled; other languages are loaded lazily.
export const resources = { en } as const;

export const languageNames: Record<SupportedLanguage, string> = {
	en: "English",
	uk: "Українська",
	fr: "Français",
	es: "Español",
	de: "Deutsch",
	pt: "Português",
	it: "Italiano",
	pl: "Polski",
	ja: "日本語",
	ko: "한국어",
	zh: "中文",
	ar: "العربية",
	hi: "हिंदी",
	tr: "Türkçe",
};

const rtlLanguages: ReadonlySet<SupportedLanguage> = new Set(["ar"]);

/**
 * Check if a language uses right-to-left text direction.
 *
 * @param lng - Language code to check (defaults to the current language)
 */
export function isRTL(lng?: SupportedLanguage): boolean {
	return rtlLanguages.has(lng ?? getCurrentLanguage());
}

/**
 * Initialize i18next with the provided configuration.
 * Call this once at the root of your application.
 *
 * @param lng - Initial language to use (defaults to "en")
 */
export async function initI18n(lng: SupportedLanguage = "en") {
	setLanguageCookie(lng);

	if (i18n.isInitialized) {
		if (i18n.language !== lng) {
			await i18n.changeLanguage(lng);
		}
		return i18n;
	}

	await i18n
		.use(initReactI18next)
		.use(
			resourcesToBackend(
				(language: string, namespace: string) =>
					import(`./locales/${language}/${namespace}.json`),
			),
		)
		.init({
			lng,
			fallbackLng,
			defaultNS,
			ns: [...namespaces],
			// English is bundled for instant availability; other languages are lazy-loaded.
			partialBundledLanguages: true,
			resources: { en },
			// By default i18next resolves init on the next tick (initImmediate: true),
			// which causes a flash of raw keys on first render. Setting this to false
			// makes init resolve synchronously when resources are already bundled.
			// initImmediate: false,
			interpolation: {
				escapeValue: false, // React already escapes values
			},
			react: {
				useSuspense: false,
			},
		});

	return i18n;
}

/**
 * Persist the language choice to a cookie so the server can read it during SSR.
 * Max-age is 1 year.
 */
function setLanguageCookie(lng: string) {
	if (typeof document !== "undefined") {
		document.cookie = `interface-language=${lng};path=/;max-age=31536000;SameSite=Lax`;
	}
}

/**
 * Change the current language and persist the choice to localStorage + cookie.
 *
 * @param lng - The language code to switch to
 */
export function changeLanguage(lng: SupportedLanguage) {
	if (typeof localStorage !== "undefined") {
		localStorage.setItem("interface-language", lng);
	}
	setLanguageCookie(lng);
	return i18n.changeLanguage(lng);
}

/**
 * Get the current language.
 */
export function getCurrentLanguage(): SupportedLanguage {
	return (i18n.language as SupportedLanguage) || fallbackLng;
}

/**
 * Check if a language is supported.
 */
export function isLanguageSupported(lng: string): lng is SupportedLanguage {
	return supportedLanguages.includes(lng as SupportedLanguage);
}

/**
 * Get browser's preferred language if supported, otherwise return fallback.
 * Iterates through all browser-preferred languages and handles regional
 * variants (e.g. "pt-BR" -> "pt", "zh-TW" -> "zh").
 */
export function getPreferredLanguage(): SupportedLanguage {
	if (typeof navigator === "undefined") {
		return fallbackLng;
	}

	for (const lang of navigator.languages) {
		// Try exact match first (e.g., "en")
		if (isLanguageSupported(lang)) return lang;
		// Try base language (e.g., "pt-BR" -> "pt")
		const base = lang.split("-")[0] ?? "";
		if (isLanguageSupported(base)) return base;
	}

	return fallbackLng;
}

// Re-export hooks and components from react-i18next
export { useTranslation, Trans };

// Export i18n instance for advanced usage
export { i18n };
