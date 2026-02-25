import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import Loader from "@/components/loader";
import "./index.css";
import type { AppRouter } from "@english.now/api/routers/index";
import { env } from "@english.now/env/client";
import {
	getPreferredLanguage,
	initI18n,
	isLanguageSupported,
	type SupportedLanguage,
} from "@english.now/i18n";

// Get saved language from localStorage, or fall back to browser preference
function getSavedLanguage(): SupportedLanguage {
	if (typeof localStorage !== "undefined") {
		const saved = localStorage.getItem("interface-language");
		if (saved && isLanguageSupported(saved)) {
			return saved;
		}
	}
	return getPreferredLanguage();
}

// Initialize i18n with saved or preferred language
await initI18n(getSavedLanguage());

import {
	QueryCache,
	QueryClient,
	QueryClientProvider,
} from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { toast } from "sonner";
import NotFound from "@/components/404";
import { routeTree } from "./routeTree.gen";
import { TRPCProvider } from "./utils/trpc";

export const queryClient = new QueryClient({
	queryCache: new QueryCache({
		onError: (error) => {
			toast.error(error.message, {
				action: {
					label: "retry",
					onClick: () => {
						queryClient.invalidateQueries();
					},
				},
			});
		},
	}),
	defaultOptions: { queries: { staleTime: 60 * 1000 } },
});

const trpcClient = createTRPCClient<AppRouter>({
	links: [
		httpBatchLink({
			url: `${env.VITE_SERVER_URL}/trpc`,
			fetch(url, options) {
				return fetch(url, {
					...options,
					credentials: "include",
				});
			},
		}),
	],
});

const trpc = createTRPCOptionsProxy({
	client: trpcClient,
	queryClient: queryClient,
});

export const getRouter = () => {
	const router = createTanStackRouter({
		routeTree,
		scrollRestoration: true,
		defaultPreloadStaleTime: 0,
		context: { trpc, queryClient },
		defaultPendingComponent: () => <Loader />,
		defaultNotFoundComponent: () => <NotFound />,
		Wrap: ({ children }) => (
			<QueryClientProvider client={queryClient}>
				<TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
					{children}
				</TRPCProvider>
			</QueryClientProvider>
		),
	});
	return router;
};

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof getRouter>;
	}
}
