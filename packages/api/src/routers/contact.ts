import { sendTransactionalEmail } from "@english.now/email";
import { env } from "@english.now/env/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicRateLimitedProcedure, router } from "../index";

const BUSINESS_TEAM_SIZES = [
	"1-19",
	"20-99",
	"100-499",
	"500-1999",
	"2000+",
] as const;

function singleLine(value: string) {
	return value.replace(/\s+/g, " ");
}

export const contactRouter = router({
	submit: publicRateLimitedProcedure(1, 60_000)
		.input(
			z.object({
				name: z.string().min(1).max(200).trim(),
				email: z.email(),
				message: z.string().min(1).max(5000).trim(),
			}),
		)
		.mutation(async ({ input }) => {
			const subject = `Contact form: ${input.name}`;
			const text = [
				`Name: ${input.name}`,
				`Email: ${input.email}`,
				"",
				"Message:",
				input.message,
			].join("\n");

			try {
				await sendTransactionalEmail({
					to: env.CONTACT_INBOX_EMAIL,
					subject,
					text,
					replyTo: { email: input.email, name: input.name },
				});
			} catch {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to send your message. Please try again later.",
				});
			}

			return { success: true as const };
		}),

	submitBusinessInquiry: publicRateLimitedProcedure(3, 10 * 60_000)
		.input(
			z.object({
				name: z.string().trim().min(1).max(200),
				email: z.email().max(320),
				company: z.string().trim().min(1).max(200),
				jobTitle: z.string().trim().max(200).optional(),
				teamSize: z.enum(BUSINESS_TEAM_SIZES),
				message: z.string().trim().max(5000).optional(),
			}),
		)
		.mutation(async ({ input }) => {
			const subject = `Business inquiry: ${singleLine(input.company)} (${input.teamSize} people)`;
			const text = [
				`Name: ${input.name}`,
				`Work email: ${input.email}`,
				`Company: ${input.company}`,
				`Job title: ${input.jobTitle || "Not provided"}`,
				`Team size: ${input.teamSize}`,
				"",
				"Goals:",
				input.message || "Not provided",
			].join("\n");

			try {
				await sendTransactionalEmail({
					to: env.CONTACT_INBOX_EMAIL,
					subject,
					text,
					replyTo: { email: input.email, name: singleLine(input.name) },
				});
			} catch {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to send your request. Please try again later.",
				});
			}

			return { success: true as const };
		}),
});
