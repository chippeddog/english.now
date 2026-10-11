import * as Sentry from "@sentry/node";
import type { JobWithMetadata, PgBoss, SendOptions } from "pg-boss";

const SENTRY_QUEUE_CONTEXT_KEY = "__sentryQueue";

interface SentryQueueContext {
	sentryTrace?: string;
	baggage?: string;
	enqueuedAt: number;
	bodySize: number;
}

export type TracedQueuePayload<TData extends object> = TData & {
	[SENTRY_QUEUE_CONTEXT_KEY]?: SentryQueueContext;
};

type TracedQueueJob<TData extends object> = JobWithMetadata<
	TracedQueuePayload<TData>
>;

export async function sendTracedJob<TData extends object>(
	boss: PgBoss,
	queueName: string,
	data: TData,
	options?: SendOptions,
) {
	return Sentry.startSpan(
		{
			name: `pg-boss publish ${queueName}`,
		},
		() =>
			Sentry.startSpan(
				{
					name: queueName,
					op: "queue.publish",
					attributes: {
						"messaging.destination.name": queueName,
						"messaging.message.body.size": getJsonSize(data),
					},
				},
				async (span) => {
					const traceData = Sentry.getTraceData();
					const payload: TracedQueuePayload<TData> = {
						...data,
						[SENTRY_QUEUE_CONTEXT_KEY]: {
							sentryTrace: traceData["sentry-trace"],
							baggage: traceData.baggage,
							enqueuedAt: Date.now(),
							bodySize: getJsonSize(data),
						},
					};

					const jobId = await boss.send(queueName, payload, options);

					if (jobId) {
						span.setAttribute("messaging.message.id", jobId);
					}

					return jobId;
				},
			),
	);
}

export async function processTracedJob<TData extends object>(
	queueName: string,
	job: TracedQueueJob<TData>,
	handler: (job: TracedQueueJob<TData>) => Promise<void>,
) {
	const context = job.data[SENTRY_QUEUE_CONTEXT_KEY];
	const traceOptions = {
		sentryTrace: context?.sentryTrace,
		baggage: context?.baggage,
	};

	return Sentry.continueTrace(traceOptions, () =>
		Sentry.startSpan(
			{
				name: `pg-boss process ${queueName}`,
			},
			(parentSpan) =>
				Sentry.startSpan(
					{
						name: queueName,
						op: "queue.process",
						attributes: {
							"messaging.message.id": job.id,
							"messaging.destination.name": queueName,
							"messaging.message.body.size":
								context?.bodySize ?? getJsonSize(job.data),
							"messaging.message.retry.count": job.retryCount,
							"messaging.message.receive.latency": context
								? Date.now() - context.enqueuedAt
								: Date.now() - job.createdOn.getTime(),
						},
					},
					async (span) => {
						try {
							await handler(job);
							span.setStatus({ code: 1, message: "ok" });
							parentSpan.setStatus({ code: 1, message: "ok" });
						} catch (error) {
							span.setStatus({ code: 2, message: "internal_error" });
							parentSpan.setStatus({ code: 2, message: "internal_error" });
							throw error;
						}
					},
				),
		),
	);
}

function getJsonSize(value: unknown) {
	return Buffer.byteLength(JSON.stringify(value), "utf8");
}
