import { env } from "@english.now/env/client";
import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/middleware/auth";

export const getProfile = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.handler(async ({ context }) => {
		const response = await fetch(`${env.VITE_SERVER_URL}/trpc/profile.get`, {
			headers: {
				cookie: context.requestHeaders.get("cookie") ?? "",
			},
		});

		if (!response.ok) return null;

		const json = await response.json();
		return json.result?.data ?? null;
	});
