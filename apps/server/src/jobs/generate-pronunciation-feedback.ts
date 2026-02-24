import type { PgBoss } from "pg-boss";
import { generatePronunciationFeedback } from "../services/generate-pronunciation-feedback";

const QUEUE_NAME = "generate-pronunciation-feedback";

export interface GeneratePronunciationFeedbackJobData {
	sessionId: string;
	userId: string;
}

export async function registerGeneratePronunciationFeedbackWorker(
	boss: PgBoss,
) {
	await boss.createQueue(QUEUE_NAME, {
		retryLimit: 2,
		retryDelay: 10,
		retryBackoff: true,
		expireInSeconds: 5 * 60,
	});

	boss.work<GeneratePronunciationFeedbackJobData>(
		QUEUE_NAME,
		{ localConcurrency: 2 },
		async (jobs) => {
			for (const job of jobs) {
				console.log(
					`[${QUEUE_NAME}] processing job ${job.id} for session ${job.data.sessionId}`,
				);

				const result = await generatePronunciationFeedback(
					job.data.sessionId,
					job.data.userId,
				);

				console.log(`[${QUEUE_NAME}] done — feedbackId=${result.feedbackId}`);
			}
		},
	);
}

export async function enqueueGeneratePronunciationFeedback(
	boss: PgBoss,
	data: GeneratePronunciationFeedbackJobData,
) {
	const jobId = await boss.send(QUEUE_NAME, data, {
		singletonKey: data.sessionId,
		retryLimit: 2,
		retryDelay: 10,
		expireInSeconds: 5 * 60,
	});

	console.log(
		`[${QUEUE_NAME}] enqueued job ${jobId} for session ${data.sessionId}`,
	);
	return jobId;
}
