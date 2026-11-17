import { describe, expect, it } from "vitest";
import {
	getOwnedStorageKey,
	getStorageKeyFromPublicUrl,
	getStoragePublicBaseUrl,
	isStorageKeyOwnedBy,
	resolveLocalStoragePath,
	storage,
} from "./storage";

// The test env has no R2 credentials, so the local-disk adapter is active.
const base = "http://localhost:3000/files";

describe("storage public URLs", () => {
	it("uses the local files route when R2 is not configured", () => {
		expect(storage.kind).toBe("local");
		expect(getStoragePublicBaseUrl()).toBe(base);
		expect(storage.publicUrl("audio", "user-1/session/a.webm")).toBe(
			`${base}/_audio/user-1/session/a.webm`,
		);
	});

	it("round-trips keys through public URLs", () => {
		const url = storage.publicUrl("audio", "user-1/s1/clip one.webm");
		expect(getStorageKeyFromPublicUrl("audio", encodeURI(url))).toBe(
			"user-1/s1/clip one.webm",
		);
	});

	it("rejects other hosts, other areas, queries and traversal", () => {
		expect(
			getStorageKeyFromPublicUrl("audio", "https://evil.example/_audio/u/a"),
		).toBeNull();
		expect(
			getStorageKeyFromPublicUrl("audio", `${base}/_avatars/user-1/a.png`),
		).toBeNull();
		expect(
			getStorageKeyFromPublicUrl("audio", `${base}/_audio/user-1/a.webm?x=1`),
		).toBeNull();
		expect(
			getStorageKeyFromPublicUrl(
				"audio",
				`${base}/_audio/user-1/..%2Fuser-2/a.webm`,
			),
		).toBeNull();
		expect(getStorageKeyFromPublicUrl("audio", "not a url")).toBeNull();
	});

	it("resolves dot segments before ownership is checked", () => {
		const url = `${base}/_audio/user-1/%2E%2E/user-2/a.webm`;
		expect(getStorageKeyFromPublicUrl("audio", url)).toBe("user-2/a.webm");
		expect(getOwnedStorageKey("user-1", "audio", url)).toBeNull();
	});
});

describe("storage key ownership", () => {
	it("only accepts keys in the user's own folder", () => {
		expect(isStorageKeyOwnedBy("user-1", "user-1/s/a.webm")).toBe(true);
		expect(isStorageKeyOwnedBy("user-1", "/user-1/legacy.webm")).toBe(true);
		expect(isStorageKeyOwnedBy("user-1", "user-10/s/a.webm")).toBe(false);
		expect(isStorageKeyOwnedBy("user-1", "user-2/s/a.webm")).toBe(false);
	});

	it("returns the key for owned URLs and null for anyone else's", () => {
		const url = `${base}/_audio/user-1/s/a.webm`;
		expect(getOwnedStorageKey("user-1", "audio", url)).toBe("user-1/s/a.webm");
		expect(getOwnedStorageKey("user-2", "audio", url)).toBeNull();
		expect(
			getOwnedStorageKey("user-1", "audio", "http://169.254.169.254/latest"),
		).toBeNull();
	});
});

describe("resolveLocalStoragePath", () => {
	it("keeps files inside the storage root", () => {
		expect(resolveLocalStoragePath("_audio", "user-1/a.webm")).toMatch(
			/storage\/_audio\/user-1\/a\.webm$/,
		);
		expect(() => resolveLocalStoragePath("_audio", "../../etc/passwd")).toThrow(
			"INVALID_STORAGE_KEY",
		);
	});
});
