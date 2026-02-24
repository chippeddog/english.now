import { expo } from "@better-auth/expo";
import { db, userProfile } from "@english.now/db";
import * as schema from "@english.now/db/schema/auth";
import { sendEmail } from "@english.now/email";
import { env } from "@english.now/env/server";
import { type BetterAuthOptions, betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

export const auth = betterAuth<BetterAuthOptions>({
	database: drizzleAdapter(db, {
		provider: "pg",
		schema: schema,
	}),
	databaseHooks: {
		user: {
			create: {
				after: async (user) => {
					await db
						.insert(userProfile)
						.values({
							id: crypto.randomUUID(),
							userId: user.id as string,
						})
						.onConflictDoNothing();
				},
			},
		},
	},
	trustedOrigins: [
		env.CORS_ORIGIN,
		"mybettertapp://",
		"exp://",
		"https://appleid.apple.com",
	],
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: true,
		sendResetPassword: async ({ user, url }) => {
			void sendEmail({
				to: user.email,
				templateId: env.AUTOSEND_RESET_PASSWORD_TEMPLATE_ID,
				dynamicData: {
					url,
					name: user.name,
				},
			});
		},
	},
	emailVerification: {
		autoSignInAfterVerification: true,
		sendVerificationEmail: async ({ user, url }) => {
			void sendEmail({
				to: user.email,
				templateId: env.AUTOSEND_VERIFY_EMAIL_TEMPLATE_ID,
				dynamicData: {
					url,
					name: user.name,
				},
			});
		},
	},
	socialProviders: {
		google: {
			clientId: env.GOOGLE_CLIENT_ID,
			clientSecret: env.GOOGLE_CLIENT_SECRET,
		},
		apple: {
			clientId: env.APPLE_CLIENT_ID ?? "",
			clientSecret: env.APPLE_CLIENT_SECRET ?? "",
		},
	},
	rateLimit: {
		enabled: true,
		window: 60,
		max: 100,
		storage: "database",
		customRules: {
			"/sign-in/email": {
				window: 10,
				max: 3,
			},
			"/sign-up/email": {
				window: 10,
				max: 3,
			},
			"/forget-password": {
				window: 60,
				max: 3,
			},
		},
	},
	advanced: {
		defaultCookieAttributes: {
			sameSite: "none",
			secure: true,
			httpOnly: true,
		},
	},
	plugins: [expo()],
});
