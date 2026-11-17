export type ImageType = { mimeType: string; extension: string };

/**
 * Detects allowed image formats from their magic bytes. Anything else,
 * including SVG (which can carry scripts), is rejected.
 */
export function detectImageType(buffer: Uint8Array): ImageType | null {
	const ascii = (start: number, end: number) =>
		String.fromCharCode(...buffer.subarray(start, end));

	if (
		buffer.length >= 8 &&
		buffer[0] === 0x89 &&
		ascii(1, 4) === "PNG" &&
		buffer[4] === 0x0d &&
		buffer[5] === 0x0a &&
		buffer[6] === 0x1a &&
		buffer[7] === 0x0a
	) {
		return { mimeType: "image/png", extension: "png" };
	}

	if (
		buffer.length >= 3 &&
		buffer[0] === 0xff &&
		buffer[1] === 0xd8 &&
		buffer[2] === 0xff
	) {
		return { mimeType: "image/jpeg", extension: "jpg" };
	}

	if (
		buffer.length >= 12 &&
		ascii(0, 4) === "RIFF" &&
		ascii(8, 12) === "WEBP"
	) {
		return { mimeType: "image/webp", extension: "webp" };
	}

	return null;
}
