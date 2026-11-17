import { describe, expect, it } from "vitest";
import { detectImageType } from "./image-type";

const bytes = (...values: number[]) => new Uint8Array(values);
const text = (value: string) => new TextEncoder().encode(value);

describe("detectImageType", () => {
	it("detects PNG, JPEG and WebP from magic bytes", () => {
		expect(
			detectImageType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)),
		).toEqual({ mimeType: "image/png", extension: "png" });
		expect(detectImageType(bytes(0xff, 0xd8, 0xff, 0xe0))).toEqual({
			mimeType: "image/jpeg",
			extension: "jpg",
		});
		expect(
			detectImageType(text("RIFF\u0000\u0000\u0000\u0000WEBPVP8 ")),
		).toEqual({ mimeType: "image/webp", extension: "webp" });
	});

	it("rejects SVG and other content regardless of the claimed type", () => {
		expect(
			detectImageType(text('<svg xmlns="http://www.w3.org/2000/svg">')),
		).toBeNull();
		expect(detectImageType(text("GIF89a"))).toBeNull();
		expect(detectImageType(bytes())).toBeNull();
	});
});
