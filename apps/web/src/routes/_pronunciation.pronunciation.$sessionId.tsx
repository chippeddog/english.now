import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check, CircleDashed, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import ReadAloudMode from "@/components/pronunciation/read-aloud";
import SessionReview from "@/components/pronunciation/session-review";
import SessionLoader from "@/components/session/loader";
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
): { label: string; status: ProcessingStepStatus }[] {
	const isCompleted = sessionStatus === "completed";
	const isFeedbackDone = feedbackStatus === "completed";
	const isFeedbackFailed = feedbackStatus === "failed";
	const isFeedbackProcessing = feedbackStatus === "processing";

	return [
		{
			label: "Analyzing your recordings",
			status: isCompleted ? "completed" : "active",
		},
		{
			label: "Computing your results",
			status: isCompleted ? "completed" : "pending",
		},
		{
			label: "Generating personalized feedback",
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
	const steps = getSteps(sessionStatus, feedbackStatus);

	return (
		<div className="flex min-h-[60vh] items-center justify-center">
			<div className="w-full max-w-md space-y-8">
				<div className="text-center">
					<div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10">
						<Loader2 className="size-8 animate-spin text-primary" />
					</div>
					<h2 className="font-bold font-lyon text-2xl tracking-tight">
						Processing your session
					</h2>
					<p className="mt-2 text-muted-foreground text-sm">
						This usually takes about 30 seconds
					</p>
				</div>

				<div className="rounded-2xl border bg-card p-6">
					<div className="space-y-5">
						{steps.map((step) => (
							<ProcessingStep
								key={step.label}
								label={step.label}
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
	const navigate = useNavigate();
	const { sessionId } = Route.useParams();
	const [view, setView] = useState<"practice" | "processing" | "review">(
		"practice",
	);
	const [summary, setSummary] = useState<SessionSummary | null>(null);

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
		setView("processing");
	};

	if (isLoading) {
		return <SessionLoader />;
	}

	if (!sessionData) {
		return null;
	}

	const paragraph = (sessionData.paragraph ??
		(sessionData.items as ParagraphItem[])?.[0]) as ParagraphItem | null;
	const cefrLevel = sessionData.cefrLevel ?? sessionData.difficulty ?? "A2";

	if (!paragraph) return null;

	return (
		<div className="min-h-screen pb-12">
			<div className="container relative z-10 mx-auto max-w-3xl px-4 py-6 pt-8">
				{view === "practice" && (
					<div className="fade-in slide-in-from-bottom-4 animate-in duration-300">
						<ReadAloudMode
							sessionId={sessionId}
							paragraph={paragraph}
							initialAttempts={(sessionData.attempts ?? [])
								.filter((a) => a.audioUrl)
								.map((a) => ({
									id: a.id,
									audioUrl: a.audioUrl ?? "",
									transcript: a.transcript,
								}))}
							onFinish={handleFinish}
						/>
					</div>
				)}
				{view === "processing" && (
					<div className="fade-in slide-in-from-bottom-4 animate-in duration-300">
						<ProcessingView
							sessionStatus={sessionData.status}
							feedbackStatus={sessionData.feedbackStatus}
						/>
					</div>
				)}
			</div>

			{view === "review" && summary && (
				<div className="container relative z-10 mx-auto max-w-5xl px-4 py-6 pt-8">
					<div className="fade-in slide-in-from-bottom-4 animate-in duration-300">
						<SessionReview
							summary={summary}
							sessionId={sessionId}
							cefrLevel={cefrLevel}
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
			)}
		</div>
	);
}
