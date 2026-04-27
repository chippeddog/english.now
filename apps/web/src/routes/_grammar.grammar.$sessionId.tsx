import { useQuery } from "@tanstack/react-query";
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
import { createTitle } from "@/utils/title";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_grammar/grammar/$sessionId")({
	component: GrammarSessionPage,
	head: () => ({
		meta: [
			{
				title: createTitle("Grammar drill"),
			},
		],
	}),
});

function GrammarSessionPage() {
	const trpc = useTRPC();
	const navigate = useNavigate();
	const { sessionId } = Route.useParams();
	const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
	const [translationEnabled, setTranslationEnabled] = useState(false);

	const {
		data: sessionData,
		isLoading,
		error,
		refetch,
	} = useQuery(trpc.grammar.getSession.queryOptions({ sessionId }));

	useEffect(() => {
		if (error) {
			navigate({ to: "/practice" });
		}
	}, [error, navigate]);

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

	const handleLogoClick = (event: MouseEvent<HTMLAnchorElement>) => {
		event.preventDefault();
		setLeaveDialogOpen(true);
	};

	if (isLoading) {
		return <SessionLoader />;
	}

	if (!sessionData) {
		return null;
	}

	type SessionDrillItem = Partial<DrillItem> & { answer?: string };
	const items = ((sessionData.items ?? []) as SessionDrillItem[]).map(
		(item, index): DrillItem => ({
			id: item.id ?? crypto.randomUUID(),
			sessionItemIndex: index,
			phase: item.phase ?? "controlled",
			type: item.type ?? "multiple_choice",
			difficulty: item.difficulty ?? "easy",
			prompt: item.prompt ?? "",
			instruction: item.instruction,
			options: item.options,
			correctAnswer: item.correctAnswer ?? item.answer ?? "",
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

	const topic = sessionData.topic;
	const topicTitle = sessionData.isMistakeReview
		? "Grammar review"
		: (topic?.title ?? "Grammar drill");
	const topicSlug = topic?.slug ?? null;

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
				<div className="fade-in slide-in-from-bottom-4 animate-in duration-300">
					<DrillPlayer
						sessionId={sessionId}
						items={items}
						initialAttempts={initialAttempts}
						translationEnabled={translationEnabled}
						onToggleTranslation={() => setTranslationEnabled((prev) => !prev)}
						onComplete={() => {
							refetch();
						}}
					/>
				</div>
			) : null}

			{sessionData.status === "completed" && sessionData.summary ? (
				<div className="container relative z-10 mx-auto max-w-3xl px-4 py-6 pt-8">
					<div className="fade-in slide-in-from-bottom-4 animate-in duration-300">
						<SessionReview
							topicTitle={topicTitle}
							topicSlug={topicSlug}
							summary={sessionData.summary as ReviewSummary}
							attempts={attempts as ReviewAttempt[]}
						/>
					</div>
				</div>
			) : null}
		</div>
	);
}
