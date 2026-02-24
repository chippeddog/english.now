import type {
	ParagraphItem,
	PronunciationSessionSummary,
	WeakPhoneme,
	WordResult,
} from "@english.now/db";
import {
	db,
	eq,
	pronunciationAttempt,
	pronunciationSession,
} from "@english.now/db";
import type { PgBoss } from "pg-boss";
import { generatePronunciationFeedback } from "../services/generate-pronunciation-feedback";
import { assessPronunciation } from "../services/pronunciation-assessment";

const QUEUE_NAME = "process-pronunciation-session";

export interface ProcessPronunciationSessionJobData {
	sessionId: string;
	userId: string;
}

export async function registerProcessPronunciationSessionWorker(
	boss: PgBoss,
) {
	await boss.createQueue(QUEUE_NAME, {
		retryLimit: 2,
		retryDelay: 10,
		retryBackoff: true,
		expireInSeconds: 10 * 60,
	});

	boss.work<ProcessPronunciationSessionJobData>(
		QUEUE_NAME,
		{ localConcurrency: 1 },
		async (jobs) => {
			for (const job of jobs) {
				console.log(
					`[${QUEUE_NAME}] processing job ${job.id} for session ${job.data.sessionId}`,
				);
				await processPronunciationSession(
					job.data.sessionId,
					job.data.userId,
				);
				console.log(
					`[${QUEUE_NAME}] done for session ${job.data.sessionId}`,
				);
			}
		},
	);
}

export async function enqueueProcessPronunciationSession(
	boss: PgBoss,
	data: ProcessPronunciationSessionJobData,
) {
	const jobId = await boss.send(QUEUE_NAME, data, {
		singletonKey: data.sessionId,
		retryLimit: 2,
		retryDelay: 10,
		expireInSeconds: 10 * 60,
	});

	console.log(
		`[${QUEUE_NAME}] enqueued job ${jobId} for session ${data.sessionId}`,
	);
	return jobId;
}

async function processPronunciationSession(
	sessionId: string,
	userId: string,
) {
	const [session] = await db
		.select()
		.from(pronunciationSession)
		.where(eq(pronunciationSession.id, sessionId))
		.limit(1);

	if (!session || session.userId !== userId) {
		throw new Error("Session not found or unauthorized");
	}

	const attempts = await db
		.select()
		.from(pronunciationAttempt)
		.where(eq(pronunciationAttempt.sessionId, sessionId));

	if (attempts.length === 0) throw new Error("No attempts found");

	const paragraph = session.paragraph as ParagraphItem;
	const referenceText = paragraph.text;

	// --- Phase 1: Assess each attempt ---

	await Promise.allSettled(
		attempts.map(async (attempt) => {
			if (!attempt.audioUrl) return;

			try {
				const res = await fetch(attempt.audioUrl);
				const arrayBuffer = await res.arrayBuffer();
				const audioBuffer = Buffer.from(arrayBuffer);

				const result = await assessPronunciation(
					audioBuffer,
					referenceText,
				);

				const wordResults: WordResult[] = result.words.map((w) => ({
					word: w.word,
					correct: w.errorType === "None",
					accuracyScore: w.accuracyScore,
					errorType: w.errorType as WordResult["errorType"],
					phonemes: w.phonemes,
				}));

				await db
					.update(pronunciationAttempt)
					.set({
						score: Math.round(result.pronunciationScore),
						accuracyScore: Math.round(result.accuracyScore),
						fluencyScore: Math.round(result.fluencyScore),
						completenessScore: Math.round(
							result.completenessScore,
						),
						prosodyScore: Math.round(result.prosodyScore),
						wordResults,
					})
					.where(eq(pronunciationAttempt.id, attempt.id));
			} catch (err) {
				console.error(
					`[${QUEUE_NAME}] assessment failed for attempt ${attempt.id}:`,
					err,
				);
			}
		}),
	);

	// --- Phase 2: Compute summary ---

	const updatedAttempts = await db
		.select()
		.from(pronunciationAttempt)
		.where(eq(pronunciationAttempt.sessionId, sessionId));

	const scores = updatedAttempts.map((a) => a.score);
	const avg = (arr: number[]) =>
		arr.length > 0
			? Math.round(arr.reduce((s, v) => s + v, 0) / arr.length)
			: 0;

	const accuracyScores = updatedAttempts
		.map((a) => a.accuracyScore)
		.filter((s): s is number => s != null);
	const fluencyScores = updatedAttempts
		.map((a) => a.fluencyScore)
		.filter((s): s is number => s != null);
	const prosodyScores = updatedAttempts
		.map((a) => a.prosodyScore)
		.filter((s): s is number => s != null);
	const completenessScores = updatedAttempts
		.map((a) => a.completenessScore)
		.filter((s): s is number => s != null);

	const wordCounts = new Map<string, { correct: number; total: number }>();
	const phonemeMap = new Map<
		string,
		{ totalScore: number; count: number; exampleWords: Set<string> }
	>();

	for (const attempt of updatedAttempts) {
		const results = attempt.wordResults as WordResult[];
		for (const r of results) {
			const existing = wordCounts.get(r.word) || {
				correct: 0,
				total: 0,
			};
			existing.total++;
			if (r.correct) existing.correct++;
			wordCounts.set(r.word, existing);

			if (r.phonemes) {
				for (const p of r.phonemes) {
					const entry = phonemeMap.get(p.phoneme) || {
						totalScore: 0,
						count: 0,
						exampleWords: new Set<string>(),
					};
					entry.totalScore += p.accuracyScore;
					entry.count++;
					if (p.accuracyScore < 80) entry.exampleWords.add(r.word);
					phonemeMap.set(p.phoneme, entry);
				}
			}
		}
	}

	const weakWords: string[] = [];
	for (const [word, counts] of wordCounts) {
		if (counts.total > 0 && counts.correct / counts.total < 0.5) {
			weakWords.push(word);
		}
	}

	const weakPhonemes: WeakPhoneme[] = [];
	for (const [phoneme, data] of phonemeMap) {
		const avgScore = Math.round(data.totalScore / data.count);
		if (avgScore < 80) {
			weakPhonemes.push({
				phoneme,
				score: avgScore,
				occurrences: data.count,
				exampleWords: Array.from(data.exampleWords).slice(0, 5),
			});
		}
	}
	weakPhonemes.sort((a, b) => a.score - b.score);

	const summary: PronunciationSessionSummary = {
		averageScore: avg(scores),
		averageAccuracy: avg(accuracyScores),
		averageFluency: avg(fluencyScores),
		averageProsody: avg(prosodyScores),
		averageCompleteness: avg(completenessScores),
		totalAttempts: updatedAttempts.length,
		bestScore: Math.max(...scores),
		worstScore: Math.min(...scores),
		weakWords,
		weakPhonemes,
	};

	await db
		.update(pronunciationSession)
		.set({
			status: "completed",
			summary,
			feedbackStatus: "pending",
			completedAt: new Date(),
		})
		.where(eq(pronunciationSession.id, sessionId));

	// --- Phase 3: Generate AI feedback ---

	await generatePronunciationFeedback(sessionId, userId);
}
