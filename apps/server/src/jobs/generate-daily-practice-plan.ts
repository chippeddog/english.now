import { generateDailyPracticePlanForUser } from "@english.now/api/services/daily-practice-plan";
import type { PgBoss } from "pg-boss";

const QUEUE_NAME = "generate-daily-practice-plan";

export interface GenerateDailyPracticePlanJobData {
	userId: string;
	dayKey: string;
}

export async function registerGenerateDailyPracticePlanWorker(boss: PgBoss) {
	await boss.createQueue(QUEUE_NAME, {
		retryLimit: 2,
		retryDelay: 10,
		retryBackoff: true,
		expireInSeconds: 10 * 60,
	});

	boss.work<GenerateDailyPracticePlanJobData>(
		QUEUE_NAME,
		{ localConcurrency: 1 },
		async (jobs) => {
			for (const job of jobs) {
				console.log(
					`[${QUEUE_NAME}] processing job ${job.id} for user ${job.data.userId} on ${job.data.dayKey}`,
				);

				await generateDailyPracticePlanForUser(
					job.data.userId,
					job.data.dayKey,
				);

				console.log(
					`[${QUEUE_NAME}] done for user ${job.data.userId} on ${job.data.dayKey}`,
				);
			}
		},
	);
}

export async function enqueueGenerateDailyPracticePlan(
	boss: PgBoss,
	data: GenerateDailyPracticePlanJobData,
) {
	const jobId = await boss.send(QUEUE_NAME, data, {
		singletonKey: `${data.userId}:${data.dayKey}`,
		retryLimit: 2,
		retryDelay: 10,
		expireInSeconds: 10 * 60,
	});

	console.log(
		`[${QUEUE_NAME}] enqueued job ${jobId} for user ${data.userId} on ${data.dayKey}`,
	);

	return jobId;
}
