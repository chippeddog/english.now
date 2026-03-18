import type { PgBoss } from "pg-boss";
import {
	addConversationVocabularyItem,
	type ConversationVocabularyMode,
} from "../services/conversation-vocabulary";

const QUEUE_NAME = "add-conversation-vocabulary";

export interface AddConversationVocabularyJobData {
	sessionId: string;
	userId: string;
	mode: ConversationVocabularyMode;
	text: string;
}

function getSingletonKey(data: AddConversationVocabularyJobData) {
	const normalizedText = data.text.toLowerCase().trim().replace(/\s+/g, " ");
	return `${data.userId}:${data.mode}:${normalizedText}`;
}

export async function registerAddConversationVocabularyWorker(boss: PgBoss) {
	await boss.createQueue(QUEUE_NAME, {
		retryLimit: 2,
		retryDelay: 10,
		retryBackoff: true,
		expireInSeconds: 10 * 60,
	});

	boss.work<AddConversationVocabularyJobData>(
		QUEUE_NAME,
		{ localConcurrency: 4 },
		async (jobs) => {
			for (const job of jobs) {
				console.log(
					`[${QUEUE_NAME}] processing job ${job.id} for user ${job.data.userId}`,
				);

				const result = await addConversationVocabularyItem({
					userId: job.data.userId,
					mode: job.data.mode,
					text: job.data.text,
				});

				console.log(
					`[${QUEUE_NAME}] ${result.status} ${job.data.mode} "${job.data.text}" for user ${job.data.userId}`,
				);
			}
		},
	);
}

export async function enqueueAddConversationVocabulary(
	boss: PgBoss,
	data: AddConversationVocabularyJobData,
) {
	const jobId = await boss.send(QUEUE_NAME, data, {
		singletonKey: getSingletonKey(data),
		retryLimit: 2,
		retryDelay: 10,
		expireInSeconds: 10 * 60,
	});

	console.log(
		`[${QUEUE_NAME}] enqueued job ${jobId} for user ${data.userId} (${data.mode}: ${data.text})`,
	);

	return jobId;
}
