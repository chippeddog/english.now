import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { env } from "@english.now/env/server";
import ffmpegPath from "ffmpeg-static";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PhonemeResult = {
	phoneme: string;
	accuracyScore: number;
};

export type WordResult = {
	word: string;
	accuracyScore: number;
	errorType:
		| "None"
		| "Omission"
		| "Insertion"
		| "Mispronunciation"
		| "UnexpectedBreak"
		| "MissingBreak"
		| "Monotone";
	phonemes: PhonemeResult[];
};

export type PronunciationAssessmentResult = {
	accuracyScore: number;
	fluencyScore: number;
	completenessScore: number;
	prosodyScore: number;
	pronunciationScore: number;
	transcript: string;
	words: WordResult[];
};

type AzurePhoneme = {
	Phoneme: string;
	PronunciationAssessment: { AccuracyScore: number };
};

type AzureWord = {
	Word: string;
	Offset?: number;
	Duration?: number;
	PronunciationAssessment: {
		AccuracyScore: number;
		ErrorType: string;
	};
	Phonemes?: AzurePhoneme[];
};

// ─── Audio Conversion ─────────────────────────────────────────────────────────

function getFFmpegPath(): string {
	const p =
		typeof ffmpegPath === "string"
			? ffmpegPath
			: (ffmpegPath as unknown as { default: string }).default;
	if (!p || typeof p !== "string") {
		throw new Error("ffmpeg-static path not resolved");
	}
	return p;
}

function convertWebmToWav(webmBuffer: Buffer): Buffer {
	const tmpDir = os.tmpdir();
	const id = crypto.randomUUID();
	const inputPath = path.join(tmpDir, `${id}.webm`);
	const outputPath = path.join(tmpDir, `${id}.wav`);

	try {
		fs.writeFileSync(inputPath, webmBuffer);

		const ffmpeg = getFFmpegPath();
		execSync(
			`"${ffmpeg}" -i "${inputPath}" -ar 16000 -ac 1 -sample_fmt s16 "${outputPath}" -y`,
			{ stdio: "pipe" },
		);

		const wavBuffer = fs.readFileSync(outputPath);
		return wavBuffer;
	} finally {
		try {
			fs.unlinkSync(inputPath);
		} catch (_) {}
		try {
			fs.unlinkSync(outputPath);
		} catch (_) {}
	}
}

// ─── LCS-based word alignment ─────────────────────────────────────────────────

function normalizeWord(w: string): string {
	return w
		.toLowerCase()
		.replace(/[^a-z0-9']/g, "")
		.trim();
}

/**
 * Uses Longest Common Subsequence to align recognized words against
 * the reference text, producing Omission / Insertion tags that Azure's
 * continuous mode does not provide natively.
 */
function computeAlignedWords(
	referenceWords: string[],
	recognizedWords: string[],
	allWordResults: AzureWord[],
): AzureWord[] {
	const m = referenceWords.length;
	const n = recognizedWords.length;

	const cell = (r: number, c: number) => (dp[r] ?? [])[c] ?? 0;

	const dp: number[][] = Array.from({ length: m + 1 }, () =>
		new Array<number>(n + 1).fill(0),
	);
	for (let i = 1; i <= m; i++) {
		const row = dp[i];
		if (!row) continue;
		for (let j = 1; j <= n; j++) {
			if (referenceWords[i - 1] === recognizedWords[j - 1]) {
				row[j] = cell(i - 1, j - 1) + 1;
			} else {
				row[j] = Math.max(cell(i - 1, j), cell(i, j - 1));
			}
		}
	}

	type AlignOp =
		| { type: "match"; refIdx: number; recIdx: number }
		| { type: "delete"; refIdx: number }
		| { type: "insert"; recIdx: number };

	const aligned: AlignOp[] = [];
	let i = m;
	let j = n;
	while (i > 0 || j > 0) {
		if (i > 0 && j > 0 && referenceWords[i - 1] === recognizedWords[j - 1]) {
			aligned.unshift({ type: "match", refIdx: i - 1, recIdx: j - 1 });
			i--;
			j--;
		} else if (j > 0 && (i === 0 || cell(i, j - 1) >= cell(i - 1, j))) {
			aligned.unshift({ type: "insert", recIdx: j - 1 });
			j--;
		} else {
			aligned.unshift({ type: "delete", refIdx: i - 1 });
			i--;
		}
	}

	const result: AzureWord[] = [];
	for (const op of aligned) {
		if (op.type === "match") {
			const word = allWordResults[op.recIdx];
			if (word) result.push(word);
		} else if (op.type === "delete") {
			result.push({
				Word: referenceWords[op.refIdx] ?? "",
				PronunciationAssessment: {
					AccuracyScore: 0,
					ErrorType: "Omission",
				},
			});
		} else {
			const word = allWordResults[op.recIdx];
			if (!word) continue;
			result.push({
				...word,
				PronunciationAssessment: {
					...word.PronunciationAssessment,
					ErrorType: "Insertion",
				},
			});
		}
	}

	for (const word of result) {
		if (
			word.PronunciationAssessment.AccuracyScore < 60 &&
			word.PronunciationAssessment.ErrorType === "None"
		) {
			word.PronunciationAssessment.ErrorType = "Mispronunciation";
		}
	}

	return result;
}

function toWordResult(w: AzureWord): WordResult {
	return {
		word: w.Word,
		accuracyScore: w.PronunciationAssessment?.AccuracyScore ?? 0,
		errorType: (w.PronunciationAssessment?.ErrorType ??
			"None") as WordResult["errorType"],
		phonemes: (w.Phonemes ?? []).map((p) => ({
			phoneme: p.Phoneme,
			accuracyScore: p.PronunciationAssessment?.AccuracyScore ?? 0,
		})),
	};
}

// ─── Assessment (continuous mode) ─────────────────────────────────────────────

export async function assessPronunciation(
	audioBuffer: Buffer,
	referenceText: string,
): Promise<PronunciationAssessmentResult> {
	const wavBuffer = convertWebmToWav(audioBuffer);

	const speechConfig = sdk.SpeechConfig.fromSubscription(
		env.AZURE_SPEECH_KEY,
		env.AZURE_SPEECH_REGION,
	);
	speechConfig.speechRecognitionLanguage = "en-US";
	speechConfig.setProperty(
		sdk.PropertyId.Speech_SegmentationSilenceTimeoutMs,
		"1500",
	);

	// In continuous mode enableMiscue is NOT supported by the service.
	// We compute Omission / Insertion post-hoc via LCS alignment.
	const pronunciationConfig = new sdk.PronunciationAssessmentConfig(
		referenceText,
		sdk.PronunciationAssessmentGradingSystem.HundredMark,
		sdk.PronunciationAssessmentGranularity.Phoneme,
		false,
	);
	pronunciationConfig.enableProsodyAssessment = true;

	const audioConfig = sdk.AudioConfig.fromWavFileInput(wavBuffer);
	const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);
	pronunciationConfig.applyTo(recognizer);

	const refWords = referenceText
		.split(/\s+/)
		.map(normalizeWord)
		.filter((w) => w.length > 0);

	return new Promise<PronunciationAssessmentResult>((resolve, reject) => {
		const allAzureWords: AzureWord[] = [];
		const recognizedStrList: string[] = [];
		const prosodyScores: number[] = [];
		const durations: number[] = [];
		let startOffset = 0;
		let endOffset = 0;

		recognizer.recognized = (_s, e) => {
			if (e.result.reason !== sdk.ResultReason.RecognizedSpeech) return;

			try {
				const jsonStr = e.result.properties.getProperty(
					sdk.PropertyId.SpeechServiceResponse_JsonResult,
				);
				if (!jsonStr) return;

				const json = JSON.parse(jsonStr);
				const nBest = json?.NBest?.[0];
				if (!nBest?.Words) return;

				for (const w of nBest.Words as AzureWord[]) {
					recognizedStrList.push(normalizeWord(w.Word));
					allAzureWords.push(w);
				}

				if (nBest.PronunciationAssessment?.ProsodyScore != null) {
					prosodyScores.push(nBest.PronunciationAssessment.ProsodyScore);
				}

				if (startOffset === 0 && nBest.Words.length > 0) {
					startOffset = nBest.Words[0].Offset;
				}
				if (nBest.Words.length > 0) {
					const last = nBest.Words[nBest.Words.length - 1];
					endOffset = last.Offset + last.Duration + 100_000;
				}
			} catch (err) {
				console.error("[pronunciation-assessment] parse error:", err);
			}
		};

		recognizer.canceled = (_s, e) => {
			if (e.reason === sdk.CancellationReason.Error) {
				recognizer.close();
				reject(new Error(`Speech recognition cancelled: ${e.errorDetails}`));
			}
		};

		recognizer.sessionStopped = () => {
			recognizer.stopContinuousRecognitionAsync(
				() => {
					recognizer.close();

					try {
						const alignedWords = computeAlignedWords(
							refWords,
							recognizedStrList,
							allAzureWords,
						);

						const nonInsertion = alignedWords.filter(
							(w) => w.PronunciationAssessment.ErrorType !== "Insertion",
						);

						const accuracyScores = nonInsertion.map(
							(w) => w.PronunciationAssessment.AccuracyScore ?? 0,
						);
						const accuracyScore =
							accuracyScores.length > 0
								? accuracyScores.reduce((a, b) => a + b, 0) /
									accuracyScores.length
								: 0;

						const prosodyScore =
							prosodyScores.length > 0
								? prosodyScores.reduce((a, b) => a + b, 0) /
									prosodyScores.length
								: 0;

						let validWordCount = 0;
						for (const w of alignedWords) {
							if (
								w.PronunciationAssessment.ErrorType === "None" &&
								(w.PronunciationAssessment.AccuracyScore ?? 0) >= 0
							) {
								validWordCount++;
								durations.push((w.Duration ?? 0) + 100_000);
							}
						}

						const fluencyScore =
							startOffset > 0
								? (durations.reduce((a, b) => a + b, 0) /
										(endOffset - startOffset)) *
									100
								: 0;

						const completenessScore = Math.min(
							100,
							nonInsertion.length > 0
								? (validWordCount / nonInsertion.length) * 100
								: 0,
						);

						// Microsoft's scoring formula for scripted (read-aloud) scenario
						const sorted = [
							accuracyScore,
							prosodyScore,
							completenessScore,
							fluencyScore,
						]
							.filter((s) => !Number.isNaN(s) && s >= 0)
							.sort((a, b) => a - b);

						const s = (idx: number) => sorted[idx] ?? 0;
						let pronunciationScore = 0;
						if (sorted.length >= 4) {
							pronunciationScore =
								s(0) * 0.4 + s(1) * 0.2 + s(2) * 0.2 + s(3) * 0.2;
						} else if (sorted.length === 3) {
							pronunciationScore = s(0) * 0.6 + s(1) * 0.2 + s(2) * 0.2;
						} else if (sorted.length === 2) {
							pronunciationScore = s(0) * 0.6 + s(1) * 0.4;
						}

						resolve({
							accuracyScore: Math.round(accuracyScore),
							fluencyScore: Math.round(fluencyScore),
							completenessScore: Math.round(completenessScore),
							prosodyScore: Math.round(prosodyScore),
							pronunciationScore: Math.round(pronunciationScore),
							transcript: recognizedStrList.join(" "),
							words: alignedWords.map(toWordResult),
						});
					} catch (err) {
						reject(err);
					}
				},
				(err) => {
					recognizer.close();
					reject(new Error(`Failed to stop recognition: ${err}`));
				},
			);
		};

		recognizer.startContinuousRecognitionAsync(
			() => {},
			(err) => {
				recognizer.close();
				reject(new Error(`Failed to start continuous recognition: ${err}`));
			},
		);
	});
}
