import type { AppRouter } from "@english.now/api/routers/index";
import {
	initI18n,
	isRTL,
	type SupportedLanguage,
	useTranslation,
} from "@english.now/i18n";
import { PostHogProvider, usePostHog } from "@posthog/react";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
	createRootRouteWithContext,
	HeadContent,
	Outlet,
	Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import type { TRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { useEffect } from "react";
import { UpgradeDialogProvider } from "@/components/dashboard/upgrade-dialog";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { getLanguageCookie } from "@/functions/get-language";
import { authClient } from "@/lib/auth-client";
import appCss from "../index.css?url";

const POSTHOG_IDENTIFIED_USER_ID_KEY = "posthog_identified_user_id";

export interface RouterAppContext {
	trpc: TRPCOptionsProxy<AppRouter>;
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
	beforeLoad: async () => {
		if (typeof window === "undefined") {
			const language = await getLanguageCookie();
			await initI18n(language);
		}
	},
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				name: "apple-mobile-web-app-title",
				content: "English Now",
			},
			{
				property: "og:type",
				content: "website",
			},
			{
				property: "og:image",
				content: "/og-image.png",
			},
			{
				property: "og:image:alt",
				content: "English Now — Learn English with AI",
			},
			{
				name: "twitter:card",
				content: "summary_large_image",
			},
			{
				name: "twitter:image",
				content: "/og-image.png",
			},
			{
				title: "English Now - Learn English with AI",
			},
		],
		links: [
			{
				rel: "icon",
				type: "image/png",
				href: "/favicon-96x96.png",
				sizes: "96x96",
			},
			{
				rel: "icon",
				type: "image/svg+xml",
				href: "/favicon.svg",
			},
			{
				rel: "shortcut icon",
				href: "/favicon.ico",
			},
			{
				rel: "apple-touch-icon",
				sizes: "180x180",
				href: "/apple-touch-icon.png",
			},
			{
				rel: "manifest",
				href: "/site.webmanifest",
			},
			{
				rel: "preload",
				href: "/fonts/inter/InterVariable.woff2",
				as: "font",
				type: "font/woff2",
				crossOrigin: "anonymous",
			},
			{
				rel: "preload",
				href: "/fonts/Lyon-Roman.woff2",
				as: "font",
				type: "font/woff2",
				crossOrigin: "anonymous",
			},
			{
				rel: "stylesheet",
				href: appCss,
			},
		],
		scripts: [],
	}),
	component: RootDocument,
});

function RootDocument() {
	const { i18n } = useTranslation();
	return (
		<html
			lang={i18n.language}
			suppressHydrationWarning
			dir={isRTL(i18n.language as SupportedLanguage) ? "rtl" : "ltr"}
		>
			<head>
				<HeadContent />
			</head>
			<body>
				<PostHogProvider
					apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN}
					options={{
						api_host: "/ingest",
						ui_host:
							import.meta.env.VITE_PUBLIC_POSTHOG_HOST ||
							"https://eu.posthog.com",
						defaults: "2026-01-30",
						capture_exceptions: true,
						debug: import.meta.env.DEV,
					}}
				>
					<ThemeProvider>
						<UpgradeDialogProvider>
							<PostHogSessionIdentify />
							<Outlet />
							<Toaster richColors />
						</UpgradeDialogProvider>
					</ThemeProvider>
				</PostHogProvider>
				<TanStackRouterDevtools position="top-right" />
				<ReactQueryDevtools position="bottom" buttonPosition="bottom-right" />
				<Scripts />
			</body>
		</html>
	);
}

function PostHogSessionIdentify() {
	const posthog = usePostHog();
	const { data: session, isPending } = authClient.useSession();
	const user = session?.user;

	useEffect(() => {
		if (isPending) return;

		if (!user) {
			if (localStorage.getItem(POSTHOG_IDENTIFIED_USER_ID_KEY)) {
				posthog.reset();
				localStorage.removeItem(POSTHOG_IDENTIFIED_USER_ID_KEY);
			}
			return;
		}

		const identifiedUserId = localStorage.getItem(POSTHOG_IDENTIFIED_USER_ID_KEY);
		if (identifiedUserId !== user.id) {
			posthog.reset();
			localStorage.setItem(POSTHOG_IDENTIFIED_USER_ID_KEY, user.id);
		}

		posthog.identify(user.id, {
			email: user.email,
			name: user.name,
		});
	}, [isPending, posthog, user?.email, user?.id, user?.name]);

	return null;
}
