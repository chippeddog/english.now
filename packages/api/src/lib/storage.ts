import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import {
	DeleteObjectCommand,
	GetObjectCommand,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";
import { capabilities, env } from "@english.now/env/server";

export type StorageArea = "audio" | "avatars" | "vocabulary";

// These prefixes are part of every stored public URL; changing them breaks existing files.
const AREA_PREFIX: Record<StorageArea, string> = {
	audio: "_audio",
	avatars: "_avatars",
	vocabulary: "_vocabulary",
};

export interface StorageAdapter {
	readonly kind: "r2" | "local";
	put(
		area: StorageArea,
		key: string,
		body: Uint8Array,
		contentType: string,
	): Promise<string>;
	get(area: StorageArea, key: string): Promise<Buffer | null>;
	delete(area: StorageArea, key: string): Promise<void>;
	publicUrl(area: StorageArea, key: string): string;
}

function trimTrailingSlash(value: string) {
	return value.replace(/\/+$/, "");
}

export function getStoragePublicBaseUrl() {
	return capabilities.objectStorage && env.R2_PUBLIC_URL
		? trimTrailingSlash(env.R2_PUBLIC_URL)
		: `${trimTrailingSlash(env.BETTER_AUTH_URL)}/files`;
}

function buildPublicUrl(area: StorageArea, key: string) {
	return `${getStoragePublicBaseUrl()}/${AREA_PREFIX[area]}/${key}`;
}

function isSafeKey(key: string) {
	return (
		key.length > 0 &&
		!key.includes("\0") &&
		!key.split("/").some((segment) => segment === ".." || segment === ".")
	);
}

function assertSafeKey(key: string) {
	if (!isSafeKey(key)) {
		throw new Error("INVALID_STORAGE_KEY");
	}
}

function createR2Adapter(): StorageAdapter {
	const client = new S3Client({
		region: "auto",
		endpoint: env.R2_ENDPOINT,
		credentials: {
			accessKeyId: env.R2_ACCESS_KEY_ID ?? "",
			secretAccessKey: env.R2_SECRET_ACCESS_KEY ?? "",
		},
	});

	return {
		kind: "r2",
		async put(area, key, body, contentType) {
			assertSafeKey(key);
			await client.send(
				new PutObjectCommand({
					Bucket: AREA_PREFIX[area],
					Key: key,
					Body: body,
					ContentType: contentType,
				}),
			);
			return buildPublicUrl(area, key);
		},
		async get(area, key) {
			assertSafeKey(key);
			try {
				const response = await client.send(
					new GetObjectCommand({ Bucket: AREA_PREFIX[area], Key: key }),
				);
				if (!response.Body) return null;
				return Buffer.from(await response.Body.transformToByteArray());
			} catch (error) {
				if (
					error instanceof Error &&
					(error.name === "NoSuchKey" || error.name === "NotFound")
				) {
					return null;
				}
				throw error;
			}
		},
		async delete(area, key) {
			assertSafeKey(key);
			await client.send(
				new DeleteObjectCommand({ Bucket: AREA_PREFIX[area], Key: key }),
			);
		},
		publicUrl: buildPublicUrl,
	};
}

export function getLocalStorageRoot() {
	return path.resolve(env.LOCAL_STORAGE_DIR);
}

export function resolveLocalStoragePath(prefix: string, key: string) {
	const root = getLocalStorageRoot();
	const filePath = path.resolve(root, prefix, key.replace(/^\/+/, ""));
	if (!filePath.startsWith(`${root}${path.sep}`)) {
		throw new Error("INVALID_STORAGE_KEY");
	}
	return filePath;
}

function createLocalAdapter(): StorageAdapter {
	return {
		kind: "local",
		async put(area, key, body) {
			assertSafeKey(key);
			const filePath = resolveLocalStoragePath(AREA_PREFIX[area], key);
			await mkdir(path.dirname(filePath), { recursive: true });
			await writeFile(filePath, body);
			return buildPublicUrl(area, key);
		},
		async get(area, key) {
			assertSafeKey(key);
			try {
				return await readFile(resolveLocalStoragePath(AREA_PREFIX[area], key));
			} catch (error) {
				if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
				throw error;
			}
		},
		async delete(area, key) {
			assertSafeKey(key);
			await rm(resolveLocalStoragePath(AREA_PREFIX[area], key), {
				force: true,
			});
		},
		publicUrl: buildPublicUrl,
	};
}

export const storage: StorageAdapter = capabilities.objectStorage
	? createR2Adapter()
	: createLocalAdapter();

export function getStorageAreaForPrefix(prefix: string): StorageArea | null {
	const entry = Object.entries(AREA_PREFIX).find(
		([, value]) => value === prefix,
	);
	return entry ? (entry[0] as StorageArea) : null;
}

/**
 * Extracts the storage key from a public URL produced by `storage.publicUrl`.
 * Returns null for URLs on other hosts or outside the given area.
 */
export function getStorageKeyFromPublicUrl(
	area: StorageArea,
	url: string,
): string | null {
	let parsedUrl: URL;
	let baseUrl: URL;
	try {
		parsedUrl = new URL(url);
		baseUrl = new URL(getStoragePublicBaseUrl());
	} catch {
		return null;
	}

	if (
		parsedUrl.origin !== baseUrl.origin ||
		parsedUrl.search ||
		parsedUrl.hash
	) {
		return null;
	}

	const prefix = `${trimTrailingSlash(baseUrl.pathname)}/${AREA_PREFIX[area]}/`;
	if (!parsedUrl.pathname.startsWith(prefix)) {
		return null;
	}

	let key: string;
	try {
		key = decodeURIComponent(parsedUrl.pathname.slice(prefix.length));
	} catch {
		return null;
	}

	return isSafeKey(key) ? key : null;
}

export function isStorageKeyOwnedBy(userId: string, key: string) {
	return key.replace(/^\/+/, "").startsWith(`${userId}/`);
}

/**
 * Returns the storage key for a public URL only when it points at the given
 * user's own folder in our storage. Use this for every client-supplied URL.
 */
export function getOwnedStorageKey(
	userId: string,
	area: StorageArea,
	url: string,
): string | null {
	const key = getStorageKeyFromPublicUrl(area, url);
	if (!key || !isStorageKeyOwnedBy(userId, key)) {
		return null;
	}
	return key;
}
