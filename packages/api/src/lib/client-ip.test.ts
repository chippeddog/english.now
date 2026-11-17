import { describe, expect, it } from "vitest";
import { getClientIp } from "./client-ip";

function headers(values: Record<string, string>) {
	return (name: string) => values[name];
}

describe("getClientIp", () => {
	it("prefers the Cloudflare header", () => {
		expect(
			getClientIp(
				headers({
					"cf-connecting-ip": "203.0.113.7",
					"x-forwarded-for": "1.1.1.1, 10.0.0.1",
				}),
			),
		).toBe("203.0.113.7");
	});

	it("uses the last X-Forwarded-For hop, which the client cannot forge", () => {
		expect(
			getClientIp(headers({ "x-forwarded-for": "6.6.6.6, 198.51.100.4" })),
		).toBe("198.51.100.4");
	});

	it("falls back to x-real-ip and then unknown", () => {
		expect(getClientIp(headers({ "x-real-ip": "192.0.2.9" }))).toBe(
			"192.0.2.9",
		);
		expect(getClientIp(headers({}))).toBe("unknown");
	});
});
