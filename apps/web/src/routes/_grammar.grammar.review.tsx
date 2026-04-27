import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { type MouseEvent, useEffect, useState } from "react";
import DrillPlayer, {
	type DrillItem,
	type InitialAttempt,
} from "@/components/grammar/drill-player";
import SessionReview, {
	type ReviewAttempt,
	type ReviewSummary,
} from "@/components/grammar/session-review";
import Logo from "@/components/logo";
import LeavePracticeDialog from "@/components/session/leave-practice-dialog";
import SessionLoader from "@/components/session/loader";
import ReportIssueDialog from "@/components/session/report-issue-dialog";
import { Button } from "@/components/ui/button";
import { createTitle } from "@/utils/title";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_grammar/grammar/review")({
	component: GrammarMistakeReviewPage,
	head: () => ({
		meta: [
			{
				title: createTitle("Grammar review"),
			},
		],
	}),
});

function GrammarMistakeReviewPage() {
	const trpc = useTRPC();
	const navigate = useNavigate();
	const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
	const [sessionId, setSessionId] = useState<string | null>(null);
	const [translationEnabled, setTranslationEnabled] = useState(false);

	const startReview = useMutation(
		trpc.grammar.startMistakeReview.mutationOptions({
			onSuccess: (data) => {
				setSessionId(data.sessionId);
			},
		}),
	);
	const reviewMistakeAnswer = useMutation(
		trpc.grammar.reviewMistakeAnswer.mutationOptions({}),
	);

	useEffect(() => {
		if (!sessionId && !startReview.isPending && !startReview.data) {
			startReview.mutate({ size: 8 });
		}
	}, [sessionId, startReview]);

	useEffect(() => {
		if (typeof localStorage === "undefined") {
			return;
		}
		setTranslationEnabled(localStorage.getItem("grammar.l1Enabled") === "1");
	}, []);

	useEffect(() => {
		if (typeof localStorage === "undefined") {
			return;
		}
		localStorage.setItem("grammar.l1Enabled", translationEnabled ? "1" : "0");
	}, [translationEnabled]);

	const {
		data: sessionData,
		isLoading,
		refetch,
	} = useQuery({
		...trpc.grammar.getSession.queryOptions({ sessionId: sessionId ?? "" }),
		enabled: Boolean(sessionId),
	});

	const handleLogoClick = (event: MouseEvent<HTMLAnchorElement>) => {
		event.preventDefault();
		setLeaveDialogOpen(true);
	};

	if (startReview.error?.message === "NO_MISTAKES_DUE") {
		return (
			<div className="container mx-auto max-w-2xl px-4 py-10">
				<div className="rounded-3xl border border-border/50 bg-white p-8 text-center shadow-sm">
					<h1 className="font-bold font-lyon text-3xl">Grammar review</h1>
					<p className="mt-3 text-muted-foreground">
						You do not have any due grammar mistakes right now.
					</p>
					<Button
						type="button"
						onClick={() => navigate({ to: "/practice" })}
						className="mt-6 rounded-xl"
					>
						Back to practice
					</Button>
				</div>
			</div>
		);
	}

	if (startReview.isPending || isLoading || !sessionId || !sessionData) {
		return <SessionLoader />;
	}

	const items = ((sessionData.items ?? []) as Array<Partial<DrillItem>>).map(
		(item, index) => ({
			id: item.id ?? crypto.randomUUID(),
			sessionItemIndex: index,
			phase: item.phase ?? "controlled",
			type: item.type ?? "fill_in_the_blank",
			difficulty: item.difficulty ?? "easy",
			prompt: item.prompt ?? "",
			instruction: item.instruction,
			options: item.options,
			items: item.items,
			correctAnswer: item.correctAnswer ?? item.answer ?? "",
			answer: item.answer,
			hint: item.hint,
			ruleTitle: item.ruleTitle ?? "Grammar",
			explanation: item.explanation ?? "",
			l1: item.l1,
		}),
	);
	const attempts = sessionData.attempts ?? [];
	const initialAttempts: InitialAttempt[] = attempts.map((attempt) => ({
		itemIndex: attempt.itemIndex,
		userAnswer: attempt.userAnswer,
		isCorrect: attempt.isCorrect,
		hintUsed: attempt.hintUsed ?? false,
	}));

	return (
		<div className="min-h-screen">
			<div className="sticky top-0 z-10 border-black/5 border-b bg-white dark:bg-neutral-900">
				<div className="container relative z-10 mx-auto max-w-3xl px-4">
					<nav className="flex items-center justify-between py-5">
						<div className="items-center gap-2 md:flex">
							<Logo link="/practice" onClick={handleLogoClick} />
						</div>
						<div className="flex items-center gap-2">
							<ReportIssueDialog sessionId={sessionId} sessionType="grammar" />
						</div>
					</nav>
				</div>
			</div>

			<LeavePracticeDialog
				leaveDialogOpen={leaveDialogOpen}
				setLeaveDialogOpen={setLeaveDialogOpen}
			/>

			{sessionData.status !== "completed" ? (
				<DrillPlayer
					sessionId={sessionId}
					topicTitle="Grammar review"
					topicLevel={null}
					items={items}
					initialAttempts={initialAttempts}
					translationEnabled={translationEnabled}
					onToggleTranslation={() => setTranslationEnabled((prev) => !prev)}
					onAfterAnswer={async ({ item, feedback }) => {
						await reviewMistakeAnswer.mutateAsync({
							mistakeId: item.id,
							quality: feedback.quality,
						});
					}}
					onComplete={() => {
						refetch();
					}}
				/>
			) : null}

			{sessionData.status === "completed" && sessionData.summary ? (
				<div className="container relative z-10 mx-auto max-w-3xl px-4 py-6 pt-8">
					<SessionReview
						topicTitle="Grammar review"
						topicSlug={null}
						summary={sessionData.summary as ReviewSummary}
						attempts={attempts as ReviewAttempt[]}
					/>
				</div>
			) : null}
		</div>
	);
}
