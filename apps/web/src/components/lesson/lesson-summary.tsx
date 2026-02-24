import { ArrowLeft, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Exercise = {
	id: string;
	type: "multiple_choice" | "fill_in_the_blank";
	prompt: string;
	options?: string[];
	correctAnswer: string;
	explanation: string;
	userAnswer?: string;
	isCorrect?: boolean;
};

interface LessonSummaryProps {
	score: number;
	correctCount: number;
	totalCount: number;
	exercises: Exercise[];
	onBack: () => void;
}

export default function LessonSummary({
	score,
	correctCount,
	totalCount,
	exercises,
	onBack,
}: LessonSummaryProps) {
	const circumference = 2 * Math.PI * 54;
	const dashOffset = circumference - (score / 100) * circumference;
	const isGreat = score >= 80;
	const isOk = score >= 50 && score < 80;

	return (
		<div className="container mx-auto max-w-2xl px-4 py-8">
			{/* Score circle */}
			<div className="mb-8 flex flex-col items-center gap-4">
				<div className="relative flex size-36 items-center justify-center">
					<svg
						className="size-36"
						viewBox="0 0 144 144"
						aria-hidden="true"
					>
						<title>Score</title>
						<circle
							cx="72"
							cy="72"
							r="54"
							fill="none"
							stroke="currentColor"
							strokeWidth="8"
							className="text-neutral-100"
						/>
						<circle
							cx="72"
							cy="72"
							r="54"
							fill="none"
							stroke="currentColor"
							strokeWidth="8"
							strokeLinecap="round"
							strokeDasharray={circumference}
							strokeDashoffset={dashOffset}
							transform="rotate(-90 72 72)"
							className={cn(
								isGreat && "text-lime-500",
								isOk && "text-orange-400",
								!isGreat && !isOk && "text-red-400",
							)}
						/>
					</svg>
					<div className="absolute flex flex-col items-center">
						<span className="font-bold text-3xl">{score}%</span>
					</div>
				</div>

				<div className="text-center">
					<h2 className="font-bold font-lyon text-2xl">
						{isGreat
							? "Great job!"
							: isOk
								? "Good effort!"
								: "Keep practicing!"}
					</h2>
					<p className="mt-1 text-muted-foreground">
						You got{" "}
						<span className="font-semibold text-foreground">
							{correctCount}
						</span>{" "}
						out of{" "}
						<span className="font-semibold text-foreground">
							{totalCount}
						</span>{" "}
						correct
					</p>
				</div>
			</div>

			{/* Exercise review */}
			<div className="mb-8">
				<h3 className="mb-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
					Review
				</h3>
				<div className="flex flex-col gap-2">
					{exercises.map((ex, i) => (
						<div
							key={ex.id}
							className={cn(
								"flex items-start gap-3 rounded-2xl border p-4",
								ex.isCorrect
									? "border-lime-200 bg-lime-50/50"
									: "border-red-200 bg-red-50/50",
							)}
						>
							<div
								className={cn(
									"mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full",
									ex.isCorrect
										? "bg-lime-500 text-white"
										: "bg-red-400 text-white",
								)}
							>
								{ex.isCorrect ? (
									<Check className="size-3.5" strokeWidth={3} />
								) : (
									<X className="size-3.5" strokeWidth={3} />
								)}
							</div>
							<div className="min-w-0 flex-1">
								<p className="text-sm">
									<span className="font-medium text-muted-foreground">
										{i + 1}.
									</span>{" "}
									{ex.prompt.replace("___", "[...]")}
								</p>
								{ex.userAnswer && !ex.isCorrect && (
									<p className="mt-1 text-red-600 text-xs">
										Your answer:{" "}
										<span className="font-medium">
											{ex.userAnswer}
										</span>
									</p>
								)}
								{!ex.isCorrect && (
									<p className="mt-0.5 text-lime-700 text-xs">
										Correct:{" "}
										<span className="font-medium">
											{ex.correctAnswer}
										</span>
									</p>
								)}
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Back button */}
			<div className="flex justify-center">
				<Button
					onClick={onBack}
					className="h-12 rounded-2xl bg-blue-600 px-8 font-semibold text-base hover:bg-blue-700"
				>
					<ArrowLeft className="mr-1 size-4" />
					Back to Lessons
				</Button>
			</div>
		</div>
	);
}
