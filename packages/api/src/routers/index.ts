import { publicProcedure, router } from "../index";
import { contactRouter } from "./contact";
import { contentRouter } from "./content";
import { conversationRouter } from "./conversation";
import { feedbackRouter } from "./feedback";
import { grammarRouter } from "./grammar";
import { issueReportRouter } from "./issue-report";
import { practiceRouter } from "./practice";
import { profileRouter } from "./profile";
import { pronunciationRouter } from "./pronunciation";
import { vocabularyRouter } from "./vocabulary";

export const appRouter = router({
	healthCheck: publicProcedure.query(() => {
		return "OK";
	}),
	contact: contactRouter,
	content: contentRouter,
	grammar: grammarRouter,
	vocabulary: vocabularyRouter,
	pronunciation: pronunciationRouter,
	conversation: conversationRouter,
	feedback: feedbackRouter,
	issueReport: issueReportRouter,
	practice: practiceRouter,
	profile: profileRouter,
});
export type AppRouter = typeof appRouter;
