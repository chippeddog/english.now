import { readFile } from "node:fs/promises";
import path from "node:path";
import {
	getStorageAreaForPrefix,
	resolveLocalStoragePath,
} from "@english.now/api/lib/storage";
import { Hono } from "hono";

const CONTENT_TYPES: Record<string, string> = {
	".mp3": "audio/mpeg",
	".mp4": "audio/mp4",
	".webm": "audio/webm",
	".ogg": "audio/ogg",
	".wav": "audio/wav",
	".aac": "audio/aac",
	".png": "image/png",
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".webp": "image/webp",
};

/** Serves files from local disk storage, used when R2 is not configured. */
const files = new Hono();

files.get("/:prefix/*", async (c) => {
	const prefix = c.req.param("prefix");
	if (!getStorageAreaForPrefix(prefix)) {
		return c.notFound();
	}

	const fullPath = decodeURIComponent(new URL(c.req.url).pathname);
	const key = fullPath.slice(
		fullPath.indexOf(`/${prefix}/`) + prefix.length + 2,
	);

	let filePath: string;
	try {
		filePath = resolveLocalStoragePath(prefix, key);
	} catch {
		return c.notFound();
	}

	const contentType = CONTENT_TYPES[path.extname(filePath).toLowerCase()];
	if (!contentType) {
		return c.notFound();
	}

	try {
		const data = await readFile(filePath);
		return c.body(new Uint8Array(data), 200, {
			"Content-Type": contentType,
			"Cache-Control": "private, max-age=3600",
			"X-Content-Type-Options": "nosniff",
		});
	} catch {
		return c.notFound();
	}
});

export default files;
