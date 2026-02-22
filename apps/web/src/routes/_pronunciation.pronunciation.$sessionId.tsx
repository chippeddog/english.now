import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import ReadAloudMode from "@/components/pronunciation/read-aloud";
import SessionReview from "@/components/pronunciation/session-review";
import TongueTwistersMode from "@/components/pronunciation/tongue-twisters";
import SessionLoader from "@/components/session/loader";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute(
	"/_pronunciation/pronunciation/$sessionId",
)({
	component: PronunciationSessionPage,
});

type PracticeMode = "read-aloud" | "tongue-twisters";

type ReadAloudItem = {
	text: string;
	topic: string;
	phonemeFocus: string;
	tips: string;
};

type TongueTwisterItem = {
	text: string;
	speed: "slow" | "medium" | "fast";
	targetPhonemes: string[];
	tip: string;
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
	itemScores: { itemIndex: number; bestScore: number; attempts: number }[];
};

const MODE_INFO: Record<string, { name: string; icon: string }> = {
	"read-aloud": { name: "Read Aloud", icon: "📖" },
	"tongue-twisters": { name: "Tongue Twisters", icon: "👅" },
};

function PronunciationSessionPage() {
	const { sessionId } = Route.useParams();
	const navigate = useNavigate();
	const trpc = useTRPC();

	const [view, setView] = useState<"practice" | "review">("practice");
	const [summary, setSummary] = useState<SessionSummary | null>(null);

	const {
		data: sessionData,
		isLoading,
		error,
	} = useQuery(trpc.pronunciation.getSession.queryOptions({ sessionId }));

	// Redirect to pronunciation page if session not found
	useEffect(() => {
		if (error) {
			navigate({ to: "/practice" });
		}
	}, [error, navigate]);

	// If session is already completed, show review
	useEffect(() => {
		if (sessionData?.status === "completed" && sessionData.summary) {
			setSummary(sessionData.summary as SessionSummary);
			setView("review");
		}
	}, [sessionData]);

	const handleComplete = (sessionSummary: SessionSummary) => {
		setSummary(sessionSummary);
		setView("review");
	};

	if (isLoading) {
		return <SessionLoader />;
	}

	if (!sessionData) {
		return null;
	}

	const mode = sessionData.mode as PracticeMode;
	const items = sessionData.items as ReadAloudItem[] | TongueTwisterItem[];
	const modeInfo = MODE_INFO[mode];

	// Figure out initial index from existing attempts
	const completedIndices = new Set(
		sessionData.attempts.map((a) => a.itemIndex),
	);
	let initialIndex = 0;
	for (let i = 0; i < items.length; i++) {
		if (!completedIndices.has(i)) {
			initialIndex = i;
			break;
		}
		if (i === items.length - 1) {
			initialIndex = i;
		}
	}

	return (
		<div className="min-h-screen pb-12">
			<div className="container relative z-10 mx-auto max-w-3xl px-4 py-6 pt-8">
				{view === "practice" && (
					<div className="fade-in slide-in-from-bottom-4 animate-in duration-300">
						{mode === "read-aloud" && (
							<ReadAloudMode
								sessionId={sessionId}
								items={items as ReadAloudItem[]}
								initialIndex={initialIndex}
								onComplete={handleComplete}
							/>
						)}
						{mode === "tongue-twisters" && (
							<TongueTwistersMode
								sessionId={sessionId}
								items={items as TongueTwisterItem[]}
								initialIndex={initialIndex}
								onComplete={handleComplete}
							/>
						)}
					</div>
				)}

				{view === "review" && summary && (
					<div className="fade-in slide-in-from-bottom-4 animate-in duration-300">
						<SessionReview
							summary={summary}
							mode={mode}
							difficulty={sessionData.difficulty}
							items={items}
						/>
					</div>
				)}
			</div>
		</div>
	);
}
