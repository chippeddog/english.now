import type { PgBoss } from "pg-boss";
import { generateConversationFeedback } from "../services/generate-conversation-feedback";

const QUEUE_NAME = "generate-conversation-feedback";

export interface GenerateConversationFeedbackJobData {
	sessionId: string;
	userId: string;
}

export async function registerGenerateConversationFeedbackWorker(boss: PgBoss) {
	await boss.createQueue(QUEUE_NAME, {
		retryLimit: 2,
		retryDelay: 10,
		retryBackoff: true,
		expireInSeconds: 5 * 60,
	});

	boss.work<GenerateConversationFeedbackJobData>(
		QUEUE_NAME,
		{ localConcurrency: 2 },
		async (jobs) => {
			for (const job of jobs) {
				console.log(
					`[${QUEUE_NAME}] processing job ${job.id} for session ${job.data.sessionId}`,
				);

				const result = await generateConversationFeedback(
					job.data.sessionId,
					job.data.userId,
				);

				console.log(`[${QUEUE_NAME}] done — sessionId=${result.sessionId}`);
			}
		},
	);
}

export async function enqueueGenerateConversationFeedback(
	boss: PgBoss,
	data: GenerateConversationFeedbackJobData,
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
