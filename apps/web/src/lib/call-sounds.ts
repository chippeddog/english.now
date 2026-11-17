const RINGBACK_FREQUENCIES = [440, 480];
const RING_ON_SECONDS = 2;
const RING_CYCLE_SECONDS = 4;
const RING_CYCLES = 15;
const RING_VOLUME = 0.05;

/** Plays a classic ringback tone (two tones, 2s on / 2s off) until stopped. */
export function playRingback(ctx: AudioContext): () => void {
	const gain = ctx.createGain();
	gain.gain.value = 0;
	gain.connect(ctx.destination);

	const oscillators = RINGBACK_FREQUENCIES.map((frequency) => {
		const oscillator = ctx.createOscillator();
		oscillator.frequency.value = frequency;
		oscillator.connect(gain);
		oscillator.start();
		return oscillator;
	});

	const start = ctx.currentTime + 0.05;
	for (let cycle = 0; cycle < RING_CYCLES; cycle++) {
		const ringStart = start + cycle * RING_CYCLE_SECONDS;
		gain.gain.setValueAtTime(0, ringStart);
		gain.gain.linearRampToValueAtTime(RING_VOLUME, ringStart + 0.03);
		gain.gain.setValueAtTime(RING_VOLUME, ringStart + RING_ON_SECONDS - 0.03);
		gain.gain.linearRampToValueAtTime(0, ringStart + RING_ON_SECONDS);
	}

	let stopped = false;
	return () => {
		if (stopped) return;
		stopped = true;
		const now = ctx.currentTime;
		gain.gain.cancelScheduledValues(now);
		gain.gain.setValueAtTime(gain.gain.value, now);
		gain.gain.linearRampToValueAtTime(0, now + 0.05);
		for (const oscillator of oscillators) {
			oscillator.stop(now + 0.06);
		}
		setTimeout(() => gain.disconnect(), 100);
	};
}

/** Two short beeps, like the other side hanging up. */
export function playHangupTone(ctx: AudioContext) {
	const gain = ctx.createGain();
	gain.gain.value = 0;
	gain.connect(ctx.destination);

	const oscillator = ctx.createOscillator();
	oscillator.frequency.value = 425;
	oscillator.connect(gain);

	const start = ctx.currentTime + 0.02;
	for (const offset of [0, 0.3]) {
		gain.gain.setValueAtTime(0, start + offset);
		gain.gain.linearRampToValueAtTime(0.06, start + offset + 0.02);
		gain.gain.setValueAtTime(0.06, start + offset + 0.16);
		gain.gain.linearRampToValueAtTime(0, start + offset + 0.18);
	}

	oscillator.start(start);
	oscillator.stop(start + 0.5);
	oscillator.onended = () => gain.disconnect();
}

/** Root-mean-square level of an analyser's current waveform, scaled to 0..1. */
export function readAudioLevel(
	analyser: AnalyserNode | null,
	buffer: Uint8Array<ArrayBuffer> | null,
) {
	if (!analyser || !buffer) return 0;
	analyser.getByteTimeDomainData(buffer);
	let sum = 0;
	for (const value of buffer) {
		const sample = (value - 128) / 128;
		sum += sample * sample;
	}
	return Math.min(1, Math.sqrt(sum / buffer.length) * 4);
}
