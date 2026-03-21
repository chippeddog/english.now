import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader } from "lucide-react";
import { useEffect } from "react";
import { ConversationReviewScreen } from "@/components/conversation/review/conversation-review-screen";
import { LoadingState } from "@/components/conversation/review-view";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_session/feedback/$sessionId")({
	component: FeedbackPage,
});

function FeedbackPage() {
	const { sessionId } = Route.useParams();
	const navigate = useNavigate();
	const trpc = useTRPC();

	const { data, error, isLoading } = useQuery({
		...trpc.feedback.getFeedback.queryOptions({ sessionId }),
		refetchInterval: (query) => {
			const d = query.state.data;
			if (!d) return 2000;
			if (d.reviewStatus === "completed" || d.reviewStatus === "failed") {
				return false;
			}
			return 2000;
		},
		retry: (failureCount, err) => {
			if (err.message.includes("NOT_FOUND")) return false;
			return failureCount < 2;
		},
	});

	useEffect(() => {
		if (error) {
			navigate({ to: "/practice" });
		}
	}, [error, navigate]);

	if (isLoading) {
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

	if (!data) {
		return <LoadingState />;
	}

	if (data.reviewStatus === "failed") {
		return (
			<div className="container mx-auto max-w-3xl px-4 py-8">
				<div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
					We couldn&apos;t load this review. Try again from your practice
					history.
				</div>
			</div>
		);
	}

	if (data.reviewStatus !== "completed" || !data.review) {
		return <LoadingState />;
	}

	return (
		<ConversationReviewScreen
			attempts={data.attempts}
			messages={data.messages}
			practiceProgress={data.practiceProgress}
			reportAccess={data.reportAccess}
			review={data.review}
			reviewStatus={data.reviewStatus}
			session={data.session}
		/>
	);
}
