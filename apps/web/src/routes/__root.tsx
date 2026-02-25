import type { AppRouter } from "@english.now/api/routers/index";
import { initI18n, useTranslation } from "@english.now/i18n";
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
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { getLanguageCookie } from "@/functions/get-language";
import appCss from "../index.css?url";
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
				title: "English Now - Learn English with AI",
			},
		],
		links: [
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
		<html lang={i18n.language} suppressHydrationWarning>
			<head>
				<HeadContent />
				<script
					dangerouslySetInnerHTML={{
						__html: `(function(){try{var t=localStorage.getItem("theme");var d=document.documentElement;d.classList.remove("light","dark");if(t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme:dark)").matches)){d.classList.add("dark")}else{d.classList.add("light")}}catch(e){document.documentElement.classList.add("light")}})()`,
					}}
				/>
				{/* <script
					dangerouslySetInnerHTML={{
						__html: `window.helploomSettings={clientId:'hl-_q4ptbUWr8VbQJTB9EcV_'};(function(){var w=window;var hl=w.Helploom;if(typeof hl==="function"){hl('update',w.helploomSettings);}else{var q=function(){q.c(arguments);};q.q=[];q.c=function(args){q.q.push(args);};w.Helploom=q;var l=function(){var s=document.createElement('script');s.type='text/javascript';s.async=true;s.src='https://helploom.com/widget.js';var x=document.getElementsByTagName('script')[0];x.parentNode.insertBefore(s,x);};if(document.readyState==='complete'){l();}else if(w.attachEvent){w.attachEvent('onload',l);}else{w.addEventListener('load',l,false);}}})();`,
					}}
				/> */}
			</head>
			<body>
				<ThemeProvider>
					<Outlet />
					<Toaster richColors />
				</ThemeProvider>
				<TanStackRouterDevtools position="top-right" />
				<ReactQueryDevtools position="bottom" buttonPosition="bottom-right" />
				<Scripts />
			</body>
		</html>
	);
}
