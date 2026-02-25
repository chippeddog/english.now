import {
	fallbackLng,
	isLanguageSupported,
	type SupportedLanguage,
} from "@english.now/i18n";
import { createMiddleware, createServerFn } from "@tanstack/react-start";

const requestMiddleware = createMiddleware().server(
	async ({ next, request }) => {
		return next({ context: { cookieHeader: request.headers.get("cookie") } });
	},
);

export const getLanguageCookie = createServerFn({ method: "GET" })
	.middleware([requestMiddleware])
	.handler(({ context }): SupportedLanguage => {
		const match = context.cookieHeader?.match(/interface-language=([^;]+)/);
		const lng = match?.[1];
		if (lng && isLanguageSupported(lng)) return lng;
		return fallbackLng;
	});
