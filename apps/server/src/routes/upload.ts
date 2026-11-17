import { detectImageType } from "@english.now/api/lib/image-type";
import { storage } from "@english.now/api/lib/storage";
import { auth } from "@english.now/auth";
import type { Context, Next } from "hono";
import { Hono } from "hono";
import { avatarBodyLimit } from "@/middleware/body-limit";
import { rateLimit } from "@/middleware/rate-limit";

type Variables = {
	session: Awaited<ReturnType<typeof auth.api.getSession>>;
};

const upload = new Hono<{ Variables: Variables }>();

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

const requireAuth = async (
	c: Context<{ Variables: Variables }>,
	next: Next,
) => {
	const session = await auth.api.getSession({
		headers: c.req.raw.headers,
	});

	if (!session) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	c.set("session", session);
	return next();
};

// Upload avatar directly through server (avoids CORS issues)
upload.post(
	"/avatar",
	avatarBodyLimit,
	requireAuth,
	rateLimit({ max: 10, windowMs: 60_000 }),
	async (c) => {
		const session = c.get("session");
		if (!session) {
			return c.json({ error: "Unauthorized" }, 401);
		}

		try {
			const formData = await c.req.formData();
			const file = formData.get("file");

			if (!file || typeof file === "string") {
				return c.json({ error: "No file provided" }, 400);
			}

			if (file.size > MAX_AVATAR_BYTES) {
				return c.json({ error: "File must be smaller than 5MB" }, 400);
			}

			const buffer = Buffer.from(await file.arrayBuffer());
			const imageType = detectImageType(buffer);

			if (!imageType) {
				return c.json({ error: "File must be a PNG, JPEG or WebP image" }, 400);
			}

			const key = `${session.user.id}/${Date.now()}.${imageType.extension}`;
			const publicUrl = await storage.put(
				"avatars",
				key,
				buffer,
				imageType.mimeType,
			);

			return c.json({
				publicUrl,
				key,
			});
		} catch (error) {
			console.error("Error uploading file:", error);
			return c.json({ error: "Failed to upload file" }, 500);
		}
	},
);

export default upload;
