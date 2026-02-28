import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader } from "lucide-react";
import { useEffect } from "react";
import PracticeView from "@/components/conversation/practice-view";
import ReviewView, {
	LoadingState,
} from "@/components/conversation/review-view";
import Logo from "@/components/logo";
import SessionLoader from "@/components/session/loader";
import ReportIssueDialog from "@/components/session/report-issue-dialog";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_conversation/conversation/$sessionId")({
	component: ConversationPage,
});

function ConversationPage() {
	const { sessionId } = Route.useParams();
	const navigate = useNavigate();
	const trpc = useTRPC();

	const {
		data: sessionData,
		isLoading: isSessionLoading,
		error: sessionError,
	} = useQuery({
		...trpc.conversation.getSession.queryOptions({ sessionId }),
		retry: (failureCount, err) => {
			if (err.message.includes("NOT_FOUND")) return false;
			return failureCount < 2;
		},
	});

	const isCompleted = sessionData?.session.status === "completed";

	const { data: feedbackData, isLoading: isFeedbackLoading } = useQuery({
		...trpc.feedback.getFeedback.queryOptions({ sessionId }),
		enabled: isCompleted,
		refetchInterval: (query) => {
			const d = query.state.data;
			if (!d) return 2000;
			if (d.feedback.status === "completed") return false;
			return 2000;
		},
		retry: (failureCount, err) => {
			if (err.message.includes("NOT_FOUND")) return false;
			return failureCount < 2;
		},
	});

	useEffect(() => {
		if (sessionError) {
			navigate({ to: "/practice" });
		}
	}, [sessionError, navigate]);

	if (isSessionLoading) {
		return <SessionLoader />;
	}

	if (isCompleted) {
		if (isFeedbackLoading) {
			return (
				<div className="container mx-auto flex min-h-dvh max-w-3xl flex-col items-center justify-center px-4 py-8">
					<div className="flex flex-col items-center gap-4">
						<Loader className="size-7 animate-spin text-lime-600" />
						<p className="font-medium text-foreground-muted">
							Loading feedback...
						</p>
					</div>
				</div>
			);
		}

		if (!feedbackData || feedbackData.feedback.status !== "completed") {
			return <LoadingState />;
		}

		return (
			<>
				<div className="sticky border-black/5 border-b bg-white">
					<div className="container relative z-10 mx-auto max-w-5xl px-4">
						<nav className="flex grid-cols-2 items-center justify-between py-5 md:grid-cols-5">
							<div className="items-center gap-2 md:flex">
								<Logo link="/practice" />
							</div>
						</nav>
					</div>
				</div>
				<ReviewView
					feedback={feedbackData.feedback}
					messages={feedbackData.messages}
					session={feedbackData.session}
				/>
			</>
		);
	}

	return (
		<>
			<div className="sticky border-black/5 border-b bg-white">
				<div className="container relative z-10 mx-auto max-w-3xl px-4">
					<nav className="flex grid-cols-2 items-center justify-between py-5 md:grid-cols-5">
						<div className="items-center gap-2 md:flex">
							<Logo link="/practice" />
						</div>
						<ReportIssueDialog
							sessionId={sessionId}
							sessionType="conversation"
						/>
					</nav>
				</div>
			</div>
			<div className="container relative mx-auto flex h-full max-w-3xl flex-col px-4 pt-8">
				<PracticeView sessionId={sessionId} />
			</div>
		</>
	);
}
