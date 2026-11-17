import { bodyLimit } from "hono/body-limit";

function tooLarge(maxBytes: number) {
	return bodyLimit({
		maxSize: maxBytes,
		onError: (c) => c.json({ error: "Payload too large" }, 413),
	});
}

// Base64-encoded audio is ~4/3 the size of the raw recording.
export const audioBodyLimit = tooLarge(15 * 1024 * 1024);

export const avatarBodyLimit = tooLarge(6 * 1024 * 1024);

export const jsonBodyLimit = tooLarge(256 * 1024);
