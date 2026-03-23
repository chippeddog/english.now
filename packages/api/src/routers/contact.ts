import { sendTransactionalEmail } from "@english.now/email";
import { env } from "@english.now/env/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicRateLimitedProcedure, router } from "../index";

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
});
