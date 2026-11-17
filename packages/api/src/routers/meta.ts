import { capabilities } from "@english.now/env/server";
import { publicProcedure, router } from "../index";

export type PublicCapabilities = {
	googleAuth: boolean;
	appleAuth: boolean;
	billing: boolean;
	emailVerification: boolean;
	pronunciation: boolean;
	liveTranscription: boolean;
};

export function getPublicCapabilities(): PublicCapabilities {
	return {
		googleAuth: capabilities.googleAuth,
		appleAuth: capabilities.appleAuth,
		billing: capabilities.billing,
		emailVerification: capabilities.email,
		pronunciation:
			capabilities.pronunciationAssessment && capabilities.deepgram,
		liveTranscription: capabilities.deepgram,
	};
}

export const metaRouter = router({
	capabilities: publicProcedure.query(() => getPublicCapabilities()),
});
