import { GetObjectCommand } from "@aws-sdk/client-s3";
import {
	conversationMessage,
	conversationSession,
	db,
	eq,
	type ConversationReview,
	type ConversationReviewProblem,
	type ConversationReviewTask,
} from "@english.now/db";
import { generateText, Output } from "ai";
import { z } from "zod";
import { openai } from "../utils/ai";
import s3Client from "../utils/r2";
import {
	assessPronunciation,
	type PronunciationAssessmentResult,
	type WordResult,
} from "./pronunciation-assessment";

const MIN_USER_MESSAGES = 3;
const MAX_PROBLEMS_PER_TYPE = 2;

const reviewAnalysisSchema = z.object({
	grammarScore: z
		.number()
		.min(0)
		.max(100)
		.describe("Grammar correctness score from 0 to 100."),
	vocabularyScore: z
		.number()
		.min(0)
		.max(100)
		.describe("Vocabulary range and appropriateness score from 0 to 100."),
	grammarProblems: z
		.array(
			z.object({
				sourceText: z.string(),
				suggestedText: z.string(),
				explanation: z.string(),
				severity: z.enum(["low", "medium", "high"]),
			}),
		)
		.max(MAX_PROBLEMS_PER_TYPE),
	vocabularyProblems: z
		.array(
			z.object({
				sourceText: z.string(),
				suggestedText: z.string(),
				explanation: z.string(),
				severity: z.enum(["low", "medium", "high"]),
				taskType: z.enum(["swap-word", "rephrase"]),
				vocabularyItems: z.array(z.string()).max(3),
			}),
		)
		.max(MAX_PROBLEMS_PER_TYPE),
});

function emptyReview(
	availability: "ready" | "not_enough_messages",
): ConversationReview {
	return {
		availability,
		overallScore: null,
		scores: {
			grammar: null,
			vocabulary: null,
			pronunciation: null,
		},
		problems: [],
		tasks: [],
		stats: {
			totalProblems: 0,
			totalTasks: 0,
		},
	};
}

async function downloadAudioFromR2(audioUrl: string): Promise<Buffer | null> {
	try {
		const url = new URL(audioUrl);
		const key = url.pathname.replace(/^\/_audio\//, "");

		const response = await s3Client.send(
			new GetObjectCommand({
				Bucket: "_audio",
				Key: key,
			}),
		);

		if (!response.Body) return null;
		const bytes = await response.Body.transformToByteArray();
		return Buffer.from(bytes);
	} catch (err) {
		console.error("[feedback] Failed to download audio:", audioUrl, err);
		return null;
	}
}

async function assessVoiceMessages(
	voiceMessages: Array<{
		id: string;
		content: string;
		audioUrl: string;
	}>,
): Promise<{
	pronunciationScore: number | null;
	results: Array<
		PronunciationAssessmentResult & {
			messageId: string;
			referenceText: string;
		}
	>;
}> {
	const results: Array<
		PronunciationAssessmentResult & {
			messageId: string;
			referenceText: string;
		}
	> = [];

	for (const msg of voiceMessages) {
		try {
			const audioBuffer = await downloadAudioFromR2(msg.audioUrl);
			if (!audioBuffer) continue;

			const result = await assessPronunciation(audioBuffer, msg.content);
			results.push({
				...result,
				messageId: msg.id,
				referenceText: msg.content,
			});
		} catch (err) {
			console.error(
				"[feedback] Pronunciation assessment failed for message",
				err,
			);
		}
	}

	if (results.length === 0) {
		return { pronunciationScore: null, results: [] };
	}

	const avgScore =
		results.reduce((sum, item) => sum + item.pronunciationScore, 0) /
		results.length;

	return { pronunciationScore: Math.round(avgScore), results };
}

async function analyzeWithAI(
	turns: Array<{
		userMessage: { id: string; content: string };
		assistantMessage?: string;
	}>,
	level: string,
): Promise<z.infer<typeof reviewAnalysisSchema>> {
	const conversationPairs = turns
		.map(
			({ userMessage, assistantMessage }) =>
				`Learner: ${userMessage.content}${assistantMessage ? `\nAssistant: ${assistantMessage}` : ""}`,
		)
		.join("\n\n");

	const { experimental_output } = await generateText({
		model: openai("gpt-4o-mini"),
		output: Output.object({ schema: reviewAnalysisSchema }),
		system: `You are an expert English coach reviewing one conversation practice session.
The learner is at a "${level}" level.

Return only the most useful review data for a fast coaching screen.
- Focus ONLY on grammar and vocabulary.
- Do NOT return summary prose, strengths, fluency notes, or generic encouragement.
- Quote exact learner wording in sourceText.
- suggestedText must be the improved wording the learner should practice next.
- explanations must be short and useful.
- Prefer 1-2 high-impact problems per category.
- vocabularyItems should contain 1-3 words or short phrases worth saving for review.`,
		prompt: `Analyze this conversation practice session:\n\n${conversationPairs}`,
		temperature: 0.3,
	});

	if (!experimental_output) {
		throw new Error("AI analysis returned no output");
	}

	return experimental_output;
}

function buildConversationTurns(
	messages: Array<{
		id: string;
		role: string;
		content: string;
	}>,
) {
	const turns: Array<{
		userMessage: { id: string; content: string };
		assistantMessage?: string;
	}> = [];

	for (const message of messages) {
		if (message.role === "user") {
			turns.push({
				userMessage: {
					id: message.id,
					content: message.content,
				},
			});
			continue;
		}

		if (message.role !== "assistant") {
			continue;
		}

		const lastTurn = turns.at(-1);
		if (lastTurn && !lastTurn.assistantMessage) {
			lastTurn.assistantMessage = message.content;
		}
	}

	return turns;
}

function findMessageIdForText(
	messages: Array<{ id: string; content: string }>,
	sourceText: string,
) {
	const normalizedSource = sourceText.trim().toLowerCase();
	return (
		messages.find((message) =>
			message.content.toLowerCase().includes(normalizedSource),
		)?.id ?? null
	);
}

function buildPronunciationExplanation(word: WordResult) {
	const weakestPhoneme = [...word.phonemes].sort(
		(a, b) => a.accuracyScore - b.accuracyScore,
	)[0];

	if (word.errorType === "Omission") {
		return "This word was missed in your recording. Slow down and pronounce every sound clearly.";
	}

	if (word.errorType === "Insertion") {
		return "Azure heard an extra sound here. Keep the word short and precise.";
	}

	if (weakestPhoneme) {
		return `This word was unclear. Focus on the ${weakestPhoneme.phoneme} sound and say it more cleanly.`;
	}

	return "This word needs a cleaner pronunciation. Repeat it slowly, then say it again at normal speed.";
}

function buildPronunciationReview(
	results: Array<
		PronunciationAssessmentResult & {
			messageId: string;
			referenceText: string;
		}
	>,
): {
	problems: ConversationReviewProblem[];
	tasks: ConversationReviewTask[];
} {
	const candidates = results
		.flatMap((result) =>
			result.words.map((word) => ({
				...word,
				messageId: result.messageId,
			})),
		)
		.filter(
			(word) => word.word && (word.errorType !== "None" || word.accuracyScore < 78),
		)
		.sort((a, b) => a.accuracyScore - b.accuracyScore);

	const seen = new Set<string>();
	const selected = candidates.filter((candidate) => {
		const key = candidate.word.trim().toLowerCase();
		if (!key || seen.has(key)) return false;
		seen.add(key);
		return true;
	});

	const problems: ConversationReviewProblem[] = [];
	const tasks: ConversationReviewTask[] = [];

	for (const word of selected.slice(0, MAX_PROBLEMS_PER_TYPE)) {
		const problemId = crypto.randomUUID();
		const targetScore = word.accuracyScore < 55 ? 75 : 85;
		const problem: ConversationReviewProblem = {
			id: problemId,
			type: "pronunciation",
			title: "Practice this pronunciation target",
			sourceText: word.word,
			suggestedText: word.word,
			explanation: buildPronunciationExplanation(word),
			severity:
				word.accuracyScore < 45
					? "high"
					: word.accuracyScore < 65
						? "medium"
						: "low",
			messageId: word.messageId,
			pronunciationTargets: [
				{
					text: word.word,
					score: word.accuracyScore,
					errorType: word.errorType,
				},
			],
		};

		problems.push(problem);
		tasks.push({
			id: crypto.randomUUID(),
			problemId,
			type: "pronunciation",
			taskType: "pronunciation-drill",
			prompt: `Repeat "${word.word}" and try to score ${targetScore}+.`,
			payload: {
				practiceText: word.word,
				pronunciationTarget: word.word,
				targetScore,
				hint: problem.explanation,
			},
		});
	}

	return { problems, tasks };
}

export async function generateConversationFeedback(
	sessionId: string,
	userId: string,
): Promise<{ sessionId: string }> {
	console.log(`[feedback] Starting feedback generation for session ${sessionId}`);

	const now = new Date();

	try {
		const session = await db
			.select()
			.from(conversationSession)
			.where(eq(conversationSession.id, sessionId))
			.limit(1);

		if (!session[0] || session[0].userId !== userId) {
			throw new Error("Session not found or unauthorized");
		}

		const messages = await db
			.select()
			.from(conversationMessage)
			.where(eq(conversationMessage.sessionId, sessionId))
			.orderBy(conversationMessage.createdAt);

		const userMessages = messages.filter(
			(message): message is typeof message & { role: "user" } =>
				message.role === "user",
		);
		const conversationTurns = buildConversationTurns(messages);

		if (userMessages.length < MIN_USER_MESSAGES) {
			await db
				.update(conversationSession)
				.set({
					reviewStatus: "completed",
					reviewGeneratedAt: now,
					review: emptyReview("not_enough_messages"),
					updatedAt: now,
				})
				.where(eq(conversationSession.id, sessionId));

			return { sessionId };
		}

		const voiceMessages = userMessages
			.filter((message): message is typeof message & { audioUrl: string } =>
				Boolean(message.audioUrl),
			)
			.map((message) => ({
				id: message.id,
				content: message.content,
				audioUrl: message.audioUrl,
			}));

		const level = session[0].level ?? "beginner";
		const [pronunciationResult, aiAnalysis] = await Promise.all([
			voiceMessages.length > 0
				? assessVoiceMessages(voiceMessages)
				: Promise.resolve({ pronunciationScore: null, results: [] }),
			analyzeWithAI(conversationTurns, level),
		]);

		const grammarProblems: ConversationReviewProblem[] = [];
		const vocabularyProblems: ConversationReviewProblem[] = [];
		const tasks: ConversationReviewTask[] = [];

		for (const item of aiAnalysis.grammarProblems.slice(0, MAX_PROBLEMS_PER_TYPE)) {
			const problemId = crypto.randomUUID();
			grammarProblems.push({
				id: problemId,
				type: "grammar",
				title: "Fix this sentence",
				sourceText: item.sourceText,
				suggestedText: item.suggestedText,
				explanation: item.explanation,
				severity: item.severity,
				messageId:
					findMessageIdForText(userMessages, item.sourceText) ?? undefined,
			});
			tasks.push({
				id: crypto.randomUUID(),
				problemId,
				type: "grammar",
				taskType: "repeat-correction",
				prompt: "Say the corrected sentence once.",
				payload: {
					sourceText: item.sourceText,
					suggestedText: item.suggestedText,
					practiceText: item.suggestedText,
					phraseToSave: item.suggestedText,
				},
			});
		}

		for (const item of aiAnalysis.vocabularyProblems.slice(0, MAX_PROBLEMS_PER_TYPE)) {
			const problemId = crypto.randomUUID();
			vocabularyProblems.push({
				id: problemId,
				type: "vocabulary",
				title:
					item.taskType === "swap-word"
						? "Choose a stronger word"
						: "Rephrase this idea",
				sourceText: item.sourceText,
				suggestedText: item.suggestedText,
				explanation: item.explanation,
				severity: item.severity,
				messageId:
					findMessageIdForText(userMessages, item.sourceText) ?? undefined,
				vocabularyItems: item.vocabularyItems,
			});
			tasks.push({
				id: crypto.randomUUID(),
				problemId,
				type: "vocabulary",
				taskType: item.taskType,
				prompt:
					item.taskType === "swap-word"
						? "Use the stronger wording once."
						: "Say the improved sentence once.",
				payload: {
					sourceText: item.sourceText,
					suggestedText: item.suggestedText,
					practiceText: item.suggestedText,
					vocabularyItems: item.vocabularyItems,
					phraseToSave: item.suggestedText,
				},
			});
		}

		const pronunciationReview = buildPronunciationReview(pronunciationResult.results);
		const problems = [
			...grammarProblems,
			...vocabularyProblems,
			...pronunciationReview.problems,
		];
		tasks.push(...pronunciationReview.tasks);

		const scores = [
			aiAnalysis.grammarScore,
			aiAnalysis.vocabularyScore,
			pronunciationResult.pronunciationScore,
		].filter((value): value is number => value != null);

		const review: ConversationReview = {
			availability: "ready",
			overallScore:
				scores.length > 0
					? Math.round(
							scores.reduce((total, score) => total + score, 0) / scores.length,
						)
					: null,
			scores: {
				grammar: aiAnalysis.grammarScore,
				vocabulary: aiAnalysis.vocabularyScore,
				pronunciation: pronunciationResult.pronunciationScore,
			},
			problems,
			tasks,
			stats: {
				totalProblems: problems.length,
				totalTasks: tasks.length,
			},
		};

		await db
			.update(conversationSession)
			.set({
				reviewStatus: "completed",
				reviewGeneratedAt: now,
				review,
				updatedAt: now,
			})
			.where(eq(conversationSession.id, sessionId));

		console.log(
			`[feedback] Review completed for session ${sessionId} — overall=${review.overallScore ?? "n/a"}`,
		);

		return { sessionId };
	} catch (error) {
		await db
			.update(conversationSession)
			.set({
				reviewStatus: "failed",
				updatedAt: now,
			})
			.where(eq(conversationSession.id, sessionId));

		throw error;
	}
}
