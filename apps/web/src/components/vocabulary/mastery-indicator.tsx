import { Check } from "lucide-react";

const MASTERY_LABELS: Record<string, string> = {
	new: "New",
	learning: "Learning",
	reviewing: "Reviewing",
	mastered: "Mastered",
};

export default function MasteryIndicator({ mastery }: { mastery: string }) {
	const circumference = 2 * Math.PI * 8;
	const progress =
		mastery === "new"
			? 0
			: mastery === "learning"
				? 0.25
				: mastery === "reviewing"
					? 0.7
					: 1;
	const dashOffset = circumference - progress * circumference;

	if (mastery === "mastered") {
		return (
			<div className="flex size-6 items-center justify-center">
				<div
					className="flex size-[18px] shrink-0 items-center justify-center rounded-full bg-green-500 text-white"
					title={MASTERY_LABELS[mastery] ?? mastery}
				>
					<Check className="size-3" strokeWidth={2.5} />
				</div>
			</div>
		);
	}

	return (
		<div
			className="relative flex size-6 shrink-0 items-center justify-center"
			title={MASTERY_LABELS[mastery] ?? mastery}
		>
			<svg className="size-6" viewBox="0 0 24 24" aria-hidden="true">
				<circle
					cx="12"
					cy="12"
					r="8"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					className="text-neutral-200 dark:text-neutral-600"
				/>
				{progress > 0 && (
					<circle
						cx="12"
						cy="12"
						r="8"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeDasharray={`${circumference}`}
						strokeDashoffset={dashOffset}
						transform="rotate(-90 12 12)"
						className="text-green-500"
					/>
				)}
			</svg>
		</div>
	);
}
