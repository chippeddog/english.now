import type { AppRouter } from "@english.now/api/routers/index";
import { QueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { getAuthRequestInit } from "@/lib/auth-client";
import { SERVER_URL } from "@/lib/constants";

export const queryClient = new QueryClient();

const trpcClient = createTRPCClient<AppRouter>({
	links: [
		httpBatchLink({
			url: `${SERVER_URL}/trpc`,
			headers() {
				return getAuthRequestInit().headers;
			},
			fetch(url, options) {
				return fetch(url, {
					...options,
					credentials: getAuthRequestInit().credentials,
				});
			},
		}),
	],
});

export const trpc = createTRPCOptionsProxy<AppRouter>({
	client: trpcClient,
	queryClient,
});
