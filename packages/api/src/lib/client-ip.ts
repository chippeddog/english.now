type HeaderReader = (name: string) => string | undefined | null;

/**
 * Best-effort client IP for rate limiting. Prefers headers set by the edge
 * (Cloudflare, then the reverse proxy) over X-Forwarded-For. From
 * X-Forwarded-For it takes the last hop, which our own proxy appended; earlier
 * entries are client-controlled and trivially spoofed.
 */
export function getClientIp(header: HeaderReader): string {
	const cloudflareIp = header("cf-connecting-ip")?.trim();
	if (cloudflareIp) return cloudflareIp;

	const realIp = header("x-real-ip")?.trim();
	if (realIp) return realIp;

	const forwardedHops = (header("x-forwarded-for") ?? "")
		.split(",")
		.map((hop) => hop.trim())
		.filter(Boolean);
	return forwardedHops.at(-1) ?? "unknown";
}
