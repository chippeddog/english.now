import { cn } from "@/lib/utils";

export function ScoreGauge({
	score,
	label,
	size = "lg",
}: {
	score: number;
	label: string;
	size?: "sm" | "lg";
}) {
	const getColor = () => {
		if (score >= 80) return "text-green-500";
		if (score >= 60) return "text-yellow-500";
		return "text-red-500";
	};

	const getTrackColor = () => {
		if (score >= 80) return "stroke-green-500";
		if (score >= 60) return "stroke-yellow-500";
		return "stroke-red-500";
	};

	const radius = size === "lg" ? 40 : 28;
	const strokeWidth = size === "lg" ? 6 : 4;
	const circumference = 2 * Math.PI * radius;
	const dashOffset = circumference - (score / 100) * circumference;
	const viewBox = size === "lg" ? 100 : 70;

	return (
		<div className="flex flex-col items-center gap-1">
			<div className="relative">
				<svg
					width={viewBox}
					height={viewBox}
					viewBox={`0 0 ${viewBox} ${viewBox}`}
					className="-rotate-90"
					aria-hidden="true"
				>
					<title>{label} score</title>
					<circle
						cx={viewBox / 2}
						cy={viewBox / 2}
						r={radius}
						fill="none"
						strokeWidth={strokeWidth}
						className="stroke-muted"
					/>
					<circle
						cx={viewBox / 2}
						cy={viewBox / 2}
						r={radius}
						fill="none"
						strokeWidth={strokeWidth}
						strokeDasharray={circumference}
						strokeDashoffset={dashOffset}
						strokeLinecap="round"
						className={cn("transition-all duration-700", getTrackColor())}
					/>
				</svg>
				<div className="absolute inset-0 flex items-center justify-center">
					<span
						className={cn(
							"font-bold",
							getColor(),
							size === "lg" ? "text-xl" : "text-sm",
						)}
					>
						{Math.round(score)}
					</span>
				</div>
			</div>
			<span
				className={cn(
					"text-muted-foreground",
					size === "lg" ? "text-sm" : "text-xs",
				)}
			>
				{label}
			</span>
		</div>
	);
}

export function ScoreBreakdown({
	accuracy,
	fluency,
	completeness,
	prosody,
}: {
	accuracy: number;
	fluency: number;
	completeness: number;
	prosody: number;
}) {
	return (
		<div className="flex items-center justify-center gap-6">
			<ScoreGauge score={accuracy} label="Accuracy" />
			<ScoreGauge score={fluency} label="Fluency" />
			<ScoreGauge score={completeness} label="Completeness" />
			<ScoreGauge score={prosody} label="Prosody" />
		</div>
	);
}

export function OverallScore({ score }: { score: number }) {
	const getMessage = () => {
		if (score >= 90) return "Excellent!";
		if (score >= 80) return "Great job!";
		if (score >= 60) return "Good effort!";
		return "Keep practicing!";
	};

	const getColor = () => {
		if (score >= 80) return "text-green-500";
		if (score >= 60) return "text-yellow-500";
		return "text-red-500";
	};

	return (
		<div className="text-center">
			<div className={cn("font-bold text-5xl", getColor())}>
				{Math.round(score)}
			</div>
			<p className="mt-1 text-muted-foreground">{getMessage()}</p>
		</div>
	);
}
