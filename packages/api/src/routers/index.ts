import { publicProcedure, router } from "../index";
import { contentRouter } from "./content";
import { conversationRouter } from "./conversation";
import { feedbackRouter } from "./feedback";
import { issueReportRouter } from "./issue-report";
import { practiceRouter } from "./practice";
import { profileRouter } from "./profile";
import { pronunciationRouter } from "./pronunciation";
import { vocabularyRouter } from "./vocabulary";

export const appRouter = router({
	healthCheck: publicProcedure.query(() => {
		return "OK";
	}),
	content: contentRouter,
	vocabulary: vocabularyRouter,
	pronunciation: pronunciationRouter,
	conversation: conversationRouter,
	feedback: feedbackRouter,
	issueReport: issueReportRouter,
	practice: practiceRouter,
	profile: profileRouter,
});
export type AppRouter = typeof appRouter;
