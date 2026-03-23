import { auth } from "@english.now/auth";
import type { Context as HonoContext } from "hono";
import type { DailyPracticePlanJobData } from "./services/daily-practice-plan";

export type CreateContextOptions = {
	context: HonoContext;
	enqueueDailyPracticePlan?: (
		data: DailyPracticePlanJobData,
	) => Promise<unknown>;
};

export async function createContext({
	context,
	enqueueDailyPracticePlan,
}: CreateContextOptions) {
	const session = await auth.api.getSession({
		headers: context.req.raw.headers,
	});
	const forwarded = context.req.header("x-forwarded-for");
	const clientIp =
		forwarded?.split(",")[0]?.trim() ??
		context.req.header("cf-connecting-ip") ??
		"unknown";
	return {
		session,
		enqueueDailyPracticePlan,
		clientIp,
	};
}

export type Context = Awaited<ReturnType<typeof createContext>>;
