import type { PgBoss } from "pg-boss";
import { registerCleanupRateLimitsJob } from "./cleanup-rate-limits";
import { registerGenerateConversationFeedbackWorker } from "./generate-conversation-feedback";
import { registerGenerateLearningPathWorker } from "./generate-learning-path";
import { registerGeneratePronunciationFeedbackWorker } from "./generate-pronunciation-feedback";
import { registerProcessPronunciationSessionWorker } from "./process-pronunciation-session";

export { enqueueGenerateConversationFeedback } from "./generate-conversation-feedback";
export { enqueueGenerateLearningPath } from "./generate-learning-path";
export { enqueueGeneratePronunciationFeedback } from "./generate-pronunciation-feedback";
export { enqueueProcessPronunciationSession } from "./process-pronunciation-session";

export async function registerAllWorkers(boss: PgBoss) {
	await registerGenerateLearningPathWorker(boss);
	await registerGenerateConversationFeedbackWorker(boss);
	await registerGeneratePronunciationFeedbackWorker(boss);
	await registerProcessPronunciationSessionWorker(boss);
	await registerCleanupRateLimitsJob(boss);
}
