import { getAuthRequestInit } from "@/lib/auth-client";
import { SERVER_URL } from "@/lib/constants";

export async function apiFetch(path: string, init: RequestInit = {}) {
	const auth = getAuthRequestInit();
	const headers = new Headers(init.headers);
	if (!headers.has("Content-Type") && !(init.body instanceof FormData)) {
		headers.set("Content-Type", "application/json");
	}
	for (const [key, value] of Object.entries(auth.headers)) {
		headers.set(key, value);
	}

	return fetch(`${SERVER_URL}${path}`, {
		...init,
		headers,
		credentials: auth.credentials,
	});
}
