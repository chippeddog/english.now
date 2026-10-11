import { env } from "@english.now/env/server";
import { LangfuseSpanProcessor } from "@langfuse/otel";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { isAiTelemetryEnabled } from "./telemetry";

let sdk: NodeSDK | null = null;

export function startLangfuseTelemetry() {
	if (!isAiTelemetryEnabled() || sdk) {
		return sdk;
	}

	sdk = new NodeSDK({
		spanProcessors: [
			new LangfuseSpanProcessor({
				secretKey: env.LANGFUSE_SECRET_KEY,
				publicKey: env.LANGFUSE_PUBLIC_KEY,
				baseUrl: env.LANGFUSE_BASE_URL ?? "https://cloud.langfuse.com",
			}),
		],
	});
	sdk.start();

	return sdk;
}

export async function shutdownLangfuseTelemetry() {
	if (!sdk) {
		return;
	}

	await sdk.shutdown();
	sdk = null;
}
