import { env } from "@english.now/env/server";

export type AiTelemetryMetadata = Record<string, string | number | boolean>;

export function isAiTelemetryEnabled() {
	return Boolean(env.LANGFUSE_SECRET_KEY && env.LANGFUSE_PUBLIC_KEY);
}

export function buildAiTelemetry(input: {
	functionId: string;
	metadata?: AiTelemetryMetadata;
}) {
	if (!input.metadata) {
		return {
			isEnabled: isAiTelemetryEnabled(),
			functionId: input.functionId,
		};
	}

	return {
		isEnabled: isAiTelemetryEnabled(),
		functionId: input.functionId,
		metadata: input.metadata,
	};
}
