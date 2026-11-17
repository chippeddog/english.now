const TARGET_SAMPLE_RATE = 16_000;
const BUFFER_SECONDS = 45;
const MAX_TURN_SECONDS = 30;
const MIN_TURN_SECONDS = 0.4;
/** Speech-start events arrive after the learner began talking; keep audio from before. */
const PREROLL_SECONDS = 0.8;
const PROCESSOR_NAME = "call-turn-capture";

const WORKLET_SOURCE = `
class CallTurnCaptureProcessor extends AudioWorkletProcessor {
	constructor() {
		super();
		this.chunk = new Float32Array(4096);
		this.offset = 0;
	}

	process(inputs) {
		const channel = inputs[0] && inputs[0][0];
		if (!channel) return true;

		let index = 0;
		while (index < channel.length) {
			const count = Math.min(channel.length - index, this.chunk.length - this.offset);
			this.chunk.set(channel.subarray(index, index + count), this.offset);
			this.offset += count;
			index += count;

			if (this.offset === this.chunk.length) {
				this.port.postMessage(this.chunk, [this.chunk.buffer]);
				this.chunk = new Float32Array(4096);
				this.offset = 0;
			}
		}
		return true;
	}
}

registerProcessor("${PROCESSOR_NAME}", CallTurnCaptureProcessor);
`;

const registeredContexts = new WeakSet<AudioContext>();

type CapturedChunk = { endTime: number; data: Float32Array };

export type TurnRecorder = {
	markStart: (itemId: string) => void;
	markStop: (itemId: string) => void;
	take: (itemId: string) => Blob | null;
	dispose: () => void;
};

function downsample(samples: Float32Array, fromRate: number) {
	if (fromRate === TARGET_SAMPLE_RATE) return samples;

	const ratio = fromRate / TARGET_SAMPLE_RATE;
	const length = Math.floor(samples.length / ratio);
	const output = new Float32Array(length);

	for (let index = 0; index < length; index++) {
		const start = Math.floor(index * ratio);
		const end = Math.min(samples.length, Math.floor((index + 1) * ratio));
		let sum = 0;
		for (let cursor = start; cursor < end; cursor++) {
			sum += samples[cursor] ?? 0;
		}
		output[index] = end > start ? sum / (end - start) : 0;
	}

	return output;
}

function encodeWav(samples: Float32Array, sampleRate: number) {
	const buffer = new ArrayBuffer(44 + samples.length * 2);
	const view = new DataView(buffer);
	const writeString = (offset: number, value: string) => {
		for (let index = 0; index < value.length; index++) {
			view.setUint8(offset + index, value.charCodeAt(index));
		}
	};

	writeString(0, "RIFF");
	view.setUint32(4, 36 + samples.length * 2, true);
	writeString(8, "WAVE");
	writeString(12, "fmt ");
	view.setUint32(16, 16, true);
	view.setUint16(20, 1, true);
	view.setUint16(22, 1, true);
	view.setUint32(24, sampleRate, true);
	view.setUint32(28, sampleRate * 2, true);
	view.setUint16(32, 2, true);
	view.setUint16(34, 16, true);
	writeString(36, "data");
	view.setUint32(40, samples.length * 2, true);

	for (let index = 0; index < samples.length; index++) {
		const sample = Math.max(-1, Math.min(1, samples[index] ?? 0));
		view.setInt16(
			44 + index * 2,
			sample < 0 ? sample * 0x8000 : sample * 0x7fff,
			true,
		);
	}

	return new Blob([buffer], { type: "audio/wav" });
}

/**
 * Keeps a rolling buffer of microphone audio and cuts one WAV clip per learner
 * turn, so the review can run pronunciation scoring on what was said.
 */
export async function createTurnRecorder(
	ctx: AudioContext,
	stream: MediaStream,
): Promise<TurnRecorder | null> {
	if (!ctx.audioWorklet) return null;

	try {
		if (!registeredContexts.has(ctx)) {
			const url = URL.createObjectURL(
				new Blob([WORKLET_SOURCE], { type: "application/javascript" }),
			);
			try {
				await ctx.audioWorklet.addModule(url);
			} finally {
				URL.revokeObjectURL(url);
			}
			registeredContexts.add(ctx);
		}
	} catch (error) {
		console.warn("[call] Turn recording unavailable", error);
		return null;
	}

	const sampleRate = ctx.sampleRate;
	const source = ctx.createMediaStreamSource(stream);
	const node = new AudioWorkletNode(ctx, PROCESSOR_NAME);
	const sink = ctx.createGain();
	sink.gain.value = 0;
	source.connect(node);
	node.connect(sink);
	sink.connect(ctx.destination);

	const chunks: CapturedChunk[] = [];
	const starts = new Map<string, number>();
	const clips = new Map<string, Blob>();

	node.port.onmessage = (event: MessageEvent<Float32Array>) => {
		const endTime = ctx.currentTime;
		chunks.push({ endTime, data: event.data });
		while (
			chunks.length > 0 &&
			(chunks[0]?.endTime ?? 0) < endTime - BUFFER_SECONDS
		) {
			chunks.shift();
		}
	};

	const collect = (start: number, end: number) => {
		const parts: Float32Array[] = [];
		let total = 0;

		for (const chunk of chunks) {
			const chunkStart = chunk.endTime - chunk.data.length / sampleRate;
			if (chunk.endTime <= start || chunkStart >= end) continue;

			const from = Math.max(0, Math.floor((start - chunkStart) * sampleRate));
			const to = Math.min(
				chunk.data.length,
				Math.ceil((end - chunkStart) * sampleRate),
			);
			const part = chunk.data.subarray(from, to);
			parts.push(part);
			total += part.length;
		}

		const samples = new Float32Array(total);
		let offset = 0;
		for (const part of parts) {
			samples.set(part, offset);
			offset += part.length;
		}
		return samples;
	};

	return {
		markStart(itemId) {
			starts.set(itemId, Math.max(0, ctx.currentTime - PREROLL_SECONDS));
		},
		markStop(itemId) {
			const start = starts.get(itemId);
			if (start === undefined) return;
			starts.delete(itemId);

			const end = Math.min(ctx.currentTime, start + MAX_TURN_SECONDS);
			if (end - start < MIN_TURN_SECONDS) return;

			const samples = collect(start, end);
			if (samples.length < sampleRate * MIN_TURN_SECONDS) return;
			clips.set(
				itemId,
				encodeWav(downsample(samples, sampleRate), TARGET_SAMPLE_RATE),
			);
		},
		take(itemId) {
			const clip = clips.get(itemId) ?? null;
			clips.delete(itemId);
			return clip;
		},
		dispose() {
			node.port.onmessage = null;
			source.disconnect();
			node.disconnect();
			sink.disconnect();
			chunks.length = 0;
			starts.clear();
			clips.clear();
		},
	};
}
