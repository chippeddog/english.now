import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
	Check,
	ChevronLeft,
	CircleDashed,
	Loader2,
	Settings,
} from "lucide-react";
import { type MouseEvent, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Logo from "@/components/logo";
import ReadAloudMode from "@/components/pronunciation/read-aloud";
import SessionReview from "@/components/pronunciation/session-review";
import LeavePracticeDialog from "@/components/session/leave-practice-dialog";
import SessionLoader from "@/components/session/loader";
import ReportIssueDialog from "@/components/session/report-issue-dialog";
import { Button } from "@/components/ui/button";
import { usePracticeTimer } from "@/hooks/use-practice-timer";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute(
	"/_pronunciation/pronunciation/$sessionId",
)({
	component: PronunciationSessionPage,
});

type ParagraphItem = {
	text: string;
	topic: string;
	cefrLevel: string;
	wordCount: number;
	focusAreas: string[];
	tips: string;
};

type WeakPhoneme = {
	phoneme: string;
	score: number;
	occurrences: number;
	exampleWords: string[];
};

type SessionSummary = {
	averageScore: number;
	averageAccuracy: number;
	averageFluency: number;
	averageProsody: number;
	averageCompleteness: number;
	totalAttempts: number;
	bestScore: number;
	worstScore: number;
	weakWords: string[];
	weakPhonemes: WeakPhoneme[];
};

type ProcessingStepStatus = "pending" | "active" | "completed" | "failed";
type ProcessingStepKey = "analyzing" | "computing" | "generatingFeedback";

function ProcessingStep({
	label,
	status,
}: {
	label: string;
	status: ProcessingStepStatus;
}) {
	return (
		<div className="flex items-center gap-4">
			<div
				className={cn(
					"flex size-8 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300",
					status === "completed" && "border-green-500 bg-green-500 text-white",
					status === "active" && "border-primary bg-primary/10 text-primary",
					status === "pending" &&
						"border-muted-foreground/30 text-muted-foreground/30",
					status === "failed" && "border-red-500 bg-red-500 text-white",
				)}
			>
				{status === "completed" && <Check className="size-4" />}
				{status === "active" && <Loader2 className="size-4 animate-spin" />}
				{status === "pending" && <CircleDashed className="size-4" />}
				{status === "failed" && <Check className="size-4" />}
			</div>
			<span
				className={cn(
					"font-medium transition-colors duration-300",
					status === "completed" && "text-green-700 dark:text-green-400",
					status === "active" && "text-foreground",
					status === "pending" && "text-muted-foreground/50",
					status === "failed" && "text-red-600 dark:text-red-400",
				)}
			>
				{label}
			</span>
		</div>
	);
}

function getSteps(
	sessionStatus: string | undefined,
	feedbackStatus: string | null | undefined,
): { key: ProcessingStepKey; status: ProcessingStepStatus }[] {
	const isCompleted = sessionStatus === "completed";
	const isFeedbackDone = feedbackStatus === "completed";
	const isFeedbackFailed = feedbackStatus === "failed";
	const isFeedbackProcessing = feedbackStatus === "processing";

	return [
		{
			key: "analyzing",
			status: isCompleted ? "completed" : "active",
		},
		{
			key: "computing",
			status: isCompleted ? "completed" : "pending",
		},
		{
			key: "generatingFeedback",
			status: isFeedbackDone
				? "completed"
				: isFeedbackFailed
					? "failed"
					: isCompleted &&
							(isFeedbackProcessing || feedbackStatus === "pending")
						? "active"
						: "pending",
		},
	];
}

function ProcessingView({
	sessionStatus,
	feedbackStatus,
}: {
	sessionStatus: string | undefined;
	feedbackStatus: string | null | undefined;
}) {
	const { t } = useTranslation("app");
	const steps = getSteps(sessionStatus, feedbackStatus);
	const stepLabels = {
		analyzing: t("pronunciation.session.processing.analyzing"),
		computing: t("pronunciation.session.processing.computing"),
		generatingFeedback: t(
			"pronunciation.session.processing.generatingFeedback",
		),
	};

	return (
		<div className="flex min-h-[60vh] items-center justify-center">
			<div className="w-full max-w-md space-y-8">
				<div className="text-center">
					{/* <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10">
						<Loader2 className="size-8 animate-spin text-primary" />
					</div> */}
					<h2 className="font-bold text-xl tracking-tight">
						{t("pronunciation.session.processing.title")}
					</h2>
					<p className="mt-2 text-muted-foreground text-sm">
						{t("pronunciation.session.processing.subtitle")}
					</p>
				</div>

				<div className="rounded-2xl border bg-card p-6">
					<div className="space-y-5">
						{steps.map((step) => (
							<ProcessingStep
								key={step.key}
								label={stepLabels[step.key]}
								status={step.status}
							/>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}

function PronunciationSessionPage() {
	const trpc = useTRPC();
	const { t } = useTranslation("app");
	const navigate = useNavigate();
	const { sessionId } = Route.useParams();
	const { getElapsedSeconds } = usePracticeTimer();
	const [view, setView] = useState<"practice" | "processing" | "review">(
		"practice",
	);
	const [summary, setSummary] = useState<SessionSummary | null>(null);
	const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
	const [settingsOpen, setSettingsOpen] = useState(false);

	const {
		data: sessionData,
		isLoading,
		error,
	} = useQuery({
		...trpc.pronunciation.getSession.queryOptions({ sessionId }),
		refetchInterval:
			view === "processing"
				? (query) => {
						const data = query.state.data;
						if (
							data?.status === "completed" &&
							(data?.feedbackStatus === "completed" ||
								data?.feedbackStatus === "failed")
						) {
							return false;
						}
						return 3000;
					}
				: false,
	});

	useEffect(() => {
		if (error) {
			navigate({ to: "/practice" });
		}
	}, [error, navigate]);

	useEffect(() => {
		if (!sessionData) return;

		const { status, feedbackStatus } = sessionData;

		if (status === "assessing") {
			if (view === "practice") setView("processing");
		}

		if (status === "completed" && sessionData.summary) {
			setSummary(sessionData.summary as SessionSummary);
			if (feedbackStatus === "completed" || feedbackStatus === "failed") {
				setView("review");
			} else if (view !== "processing" && view !== "review") {
				setView("processing");
			}
		}
	}, [sessionData, view]);

	const handleFinish = () => {
		setSettingsOpen(false);
		setView("processing");
	};

	const handleLogoClick = (event: MouseEvent<HTMLAnchorElement>) => {
		event.preventDefault();
		setLeaveDialogOpen(true);
	};

	useEffect(() => {
		if (view !== "practice" && settingsOpen) {
			setSettingsOpen(false);
		}
	}, [settingsOpen, view]);

	if (isLoading) {
		return <SessionLoader />;
	}

	if (!sessionData) {
		return null;
	}

	const paragraph = sessionData.paragraph as ParagraphItem | null;

	if (!paragraph) return null;

	return (
		<div className="min-h-screen">
			{view === "practice" && (
				<>
					<div className="sticky top-0 z-10 border-black/5 border-b bg-white dark:bg-neutral-900">
						<div className="container relative z-10 mx-auto max-w-3xl px-4">
							<nav className="flex grid-cols-2 items-center justify-between py-5 md:grid-cols-5">
								<div className="items-center gap-2 md:flex">
									<Logo link="/practice" onClick={handleLogoClick} />
								</div>
								<div className="flex items-center gap-2">
									<ReportIssueDialog
										sessionId={sessionId}
										sessionType="pronunciation"
									/>
									<Button
										variant="outline"
										size="icon"
										className={cn(
											"size-9 cursor-pointer rounded-xl shadow-none",
											settingsOpen && "bg-neutral-100",
										)}
										onClick={() => setSettingsOpen(true)}
										aria-label={t("settings.title")}
									>
										<Settings className="size-4" strokeWidth={2} />
									</Button>
								</div>
							</nav>
						</div>
					</div>
					<div className="container relative z-10 mx-auto max-w-3xl px-4 py-6">
						<div className="fade-in slide-in-from-bottom-4 animate-in duration-300">
							<ReadAloudMode
								sessionId={sessionId}
								paragraph={paragraph}
								attemptAccess={
									sessionData.attemptAccess as
										| {
												isPro: boolean;
												used: number;
												limit: number | null;
												remaining: number | null;
												reachedLimit: boolean;
										  }
										| undefined
								}
								initialAttempts={(sessionData.attempts ?? [])
									.filter((a) => a.audioUrl)
									.map((a) => ({
										id: a.id,
										audioUrl: a.audioUrl ?? "",
										transcript: a.transcript,
										createdAt: a.createdAt,
									}))}
								onFinish={handleFinish}
								getElapsedSeconds={getElapsedSeconds}
								settingsOpen={settingsOpen}
								onSettingsOpenChange={setSettingsOpen}
							/>
						</div>
					</div>
				</>
			)}
			<LeavePracticeDialog
				leaveDialogOpen={leaveDialogOpen}
				setLeaveDialogOpen={setLeaveDialogOpen}
			/>
			{view === "processing" && (
				<div className="container relative z-10 mx-auto max-w-3xl px-4 py-6">
					<div className="fade-in slide-in-from-bottom-4 animate-in duration-300">
						<ProcessingView
							sessionStatus={sessionData.status}
							feedbackStatus={sessionData.feedbackStatus}
						/>
					</div>
				</div>
			)}

			{view === "review" && summary && (
				<>
					<div className="sticky top-0 z-10 border-black/5 border-b bg-white dark:bg-neutral-900">
						<div className="container relative z-10 mx-auto max-w-5xl px-4">
							<nav className="flex grid-cols-2 items-center justify-between py-5 md:grid-cols-5">
								<div className="items-center gap-2 md:flex">
									<Logo link="/practice" />
								</div>
								<Link
									to="/pronunciation"
									className="flex items-center gap-1 text-muted-foreground text-sm transition-colors hover:text-foreground"
								>
									<ChevronLeft className="size-4" />
									{t("pronunciation.session.backToPractice")}
								</Link>
							</nav>
						</div>
					</div>
					<div className="container relative z-10 mx-auto max-w-5xl px-4 py-6 pt-8">
						<div className="fade-in slide-in-from-bottom-4 animate-in duration-300">
							<SessionReview
								summary={summary}
								sessionId={sessionId}
								paragraphText={paragraph.text}
								attempts={(sessionData.attempts ?? []).map((a) => ({
									id: a.id,
									score: a.score,
									wordResults: (a.wordResults ?? []) as {
										word: string;
										accuracyScore: number;
										errorType: string;
										phonemes: { phoneme: string; accuracyScore: number }[];
									}[],
								}))}
							/>
						</div>
					</div>
				</>
			)}
		</div>
	);
}
