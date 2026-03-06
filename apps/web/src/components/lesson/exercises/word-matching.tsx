import { Check, RotateCcw, X } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WordMatchingProps {
	prompt: string;
	pairs: { left: string; right: string }[];
	onSubmit: (answer: string) => void;
	disabled?: boolean;
	hint?: string;
	result?: {
		isCorrect: boolean;
		correctAnswer: string | string[];
		explanation: string;
	};
}

export default function WordMatching({
	prompt,
	pairs,
	onSubmit,
	disabled,
	hint,
	result,
}: WordMatchingProps) {
	const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
	const [matches, setMatches] = useState<Map<string, string>>(new Map());
	const answered = !!result;

	const shuffledRight = useState(() =>
		pairs.map((p) => p.right).sort(() => Math.random() - 0.5),
	)[0];

	const handleLeftClick = useCallback(
		(word: string) => {
			if (answered || disabled) return;
			setSelectedLeft(word === selectedLeft ? null : word);
		},
		[answered, disabled, selectedLeft],
	);

	const handleRightClick = useCallback(
		(word: string) => {
			if (answered || disabled || !selectedLeft) return;
			setMatches((prev) => {
				const next = new Map(prev);
				next.set(selectedLeft, word);
				return next;
			});
			setSelectedLeft(null);
		},
		[answered, disabled, selectedLeft],
	);

	const handleReset = useCallback(() => {
		setMatches(new Map());
		setSelectedLeft(null);
	}, []);

	const handleSubmit = () => {
		if (matches.size !== pairs.length || answered || disabled) return;
		const answerStr = pairs
			.map((p) => `${p.left}:${matches.get(p.left) ?? ""}`)
			.join(",");
		onSubmit(answerStr);
	};

	const leftWords = pairs.map((p) => p.left);

	return (
		<div className="flex flex-col gap-6">
			<div className="rounded-2xl border border-border/50 bg-white p-6">
				<p className="font-medium text-lg leading-relaxed">{prompt}</p>
			</div>

			{hint && !answered && (
				<p className="text-muted-foreground text-sm italic">{hint}</p>
			)}

			<div className="grid grid-cols-2 gap-4">
				{/* Left column */}
				<div className="flex flex-col gap-2">
					{leftWords.map((word) => {
						const isSelected = selectedLeft === word;
						const isMatched = matches.has(word);

						return (
							<button
								key={word}
								type="button"
								onClick={() => handleLeftClick(word)}
								disabled={answered || disabled}
								className={cn(
									"rounded-xl border-2 px-4 py-3 text-left font-medium text-sm transition-all",
									!isSelected &&
										!isMatched &&
										"border-border/50 bg-white hover:border-blue-300",
									isSelected && "border-blue-500 bg-blue-50 text-blue-800",
									isMatched &&
										!answered &&
										"border-sky-300 bg-sky-50 text-sky-800",
									answered &&
										result.isCorrect &&
										"border-lime-300 bg-lime-50 text-lime-800",
									answered &&
										!result.isCorrect &&
										"border-neutral-200 bg-neutral-50",
								)}
							>
								{word}
								{isMatched && !answered && (
									<span className="ml-2 text-sky-500 text-xs">
										→ {matches.get(word)}
									</span>
								)}
							</button>
						);
					})}
				</div>

				{/* Right column */}
				<div className="flex flex-col gap-2">
					{shuffledRight.map((word) => {
						const isMatchedTo = Array.from(matches.values()).includes(word);

						return (
							<button
								key={word}
								type="button"
								onClick={() => handleRightClick(word)}
								disabled={answered || disabled || !selectedLeft}
								className={cn(
									"rounded-xl border-2 px-4 py-3 text-left font-medium text-sm transition-all",
									!isMatchedTo &&
										"border-border/50 bg-white hover:border-blue-300",
									isMatchedTo &&
										!answered &&
										"border-sky-300 bg-sky-50 text-sky-800",
									!selectedLeft &&
										!answered &&
										"cursor-default opacity-60",
									answered &&
										result.isCorrect &&
										"border-lime-300 bg-lime-50 text-lime-800",
									answered &&
										!result.isCorrect &&
										"border-neutral-200 bg-neutral-50",
								)}
							>
								{word}
							</button>
						);
					})}
				</div>
			</div>

			{!answered && (
				<div className="flex gap-3">
					<Button
						type="button"
						variant="outline"
						onClick={handleReset}
						disabled={matches.size === 0 || disabled}
						className="rounded-xl"
					>
						<RotateCcw className="mr-1 size-4" />
						Reset
					</Button>
					<Button
						type="button"
						onClick={handleSubmit}
						disabled={matches.size !== pairs.length || disabled}
						className="rounded-xl bg-blue-600 hover:bg-blue-700"
					>
						Check
					</Button>
				</div>
			)}

			{answered && (
				<div
					className={cn(
						"rounded-2xl border p-4",
						result.isCorrect
							? "border-lime-200 bg-lime-50"
							: "border-red-200 bg-red-50",
					)}
				>
					<div className="mb-1 flex items-center gap-2">
						{result.isCorrect ? (
							<div className="flex size-5 items-center justify-center rounded-full bg-lime-500 text-white">
								<Check className="size-3" strokeWidth={3} />
							</div>
						) : (
							<div className="flex size-5 items-center justify-center rounded-full bg-red-400 text-white">
								<X className="size-3" strokeWidth={3} />
							</div>
						)}
						<p
							className={cn(
								"font-semibold text-sm",
								result.isCorrect ? "text-lime-800" : "text-red-800",
							)}
						>
							{result.isCorrect ? "All matched!" : "Some matches are wrong"}
						</p>
					</div>
					{!result.isCorrect && (
						<div className="mb-1">
							<p className="mb-1 font-medium text-red-700 text-sm">
								Correct pairs:
							</p>
							{pairs.map((p) => (
								<p key={p.left} className="text-red-600 text-xs">
									{p.left} → {p.right}
								</p>
							))}
						</div>
					)}
					<p
						className={cn(
							"text-sm",
							result.isCorrect ? "text-lime-700" : "text-red-700",
						)}
					>
						{result.explanation}
					</p>
				</div>
			)}
		</div>
	);
}
