import { cn } from "@/lib/utils";

export default function ProgressCircle({ progress }: { progress: number }) {
	const circumference = 2 * Math.PI * 18;
	const dashOffset = circumference - (progress / 100) * circumference;

	const strokeColor =
		progress >= 80
			? "text-green-500"
			: progress >= 60
				? "text-amber-500"
				: progress >= 40
					? "text-orange-500"
					: "text-red-500";

	const textColor =
		progress >= 80
			? "text-green-600"
			: progress >= 60
				? "text-amber-600"
				: progress >= 40
					? "text-orange-600"
					: "text-red-600";

	return (
		<div className="relative flex size-11 items-center justify-center">
			<svg className="size-11" viewBox="0 0 44 44" aria-hidden="true">
				<title>Unit progress</title>
				<circle
					cx="22"
					cy="22"
					r="18"
					fill="none"
					stroke="currentColor"
					strokeWidth="3.5"
					className="text-neutral-100"
				/>
				<circle
					cx="22"
					cy="22"
					r="18"
					fill="none"
					stroke="currentColor"
					strokeWidth="3.5"
					strokeLinecap="round"
					strokeDasharray={`${circumference}`}
					strokeDashoffset={dashOffset}
					transform="rotate(-90 22 22)"
					className={strokeColor}
				/>
			</svg>
			<span
				className={cn(
					"absolute font-bold text-[10px]",
					progress === 0 ? "" : textColor,
				)}
			>
				{progress === 0 ? "-" : progress}
			</span>
		</div>
	);
}
