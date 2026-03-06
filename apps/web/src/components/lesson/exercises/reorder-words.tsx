import { Check, RotateCcw, X } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ReorderWordsProps {
	prompt: string;
	items: string[];
	onSubmit: (answer: string) => void;
	disabled?: boolean;
	hint?: string;
	result?: {
		isCorrect: boolean;
		correctAnswer: string | string[];
		explanation: string;
	};
}

export default function ReorderWords({
	prompt,
	items,
	onSubmit,
	disabled,
	hint,
	result,
}: ReorderWordsProps) {
	const [selected, setSelected] = useState<string[]>([]);
	const [available, setAvailable] = useState<string[]>([...items]);
	const answered = !!result;

	const handleSelectWord = useCallback(
		(word: string, index: number) => {
			if (answered || disabled) return;
			setAvailable((prev) => prev.filter((_, i) => i !== index));
			setSelected((prev) => [...prev, word]);
		},
		[answered, disabled],
	);

	const handleRemoveWord = useCallback(
		(word: string, index: number) => {
			if (answered || disabled) return;
			setSelected((prev) => prev.filter((_, i) => i !== index));
			setAvailable((prev) => [...prev, word]);
		},
		[answered, disabled],
	);

	const handleReset = useCallback(() => {
		if (answered || disabled) return;
		setSelected([]);
		setAvailable([...items]);
	}, [answered, disabled, items]);

	const handleSubmit = () => {
		if (selected.length === 0 || answered || disabled) return;
		onSubmit(selected.join(" "));
	};

	return (
		<div className="flex flex-col gap-6">
			<div className="rounded-2xl border border-border/50 bg-white p-6">
				<p className="font-medium text-lg leading-relaxed">{prompt}</p>
			</div>

			{hint && !answered && (
				<p className="text-muted-foreground text-sm italic">{hint}</p>
			)}

			{/* Selected words (sentence being built) */}
			<div className="min-h-[56px] rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/50 p-3">
				{selected.length === 0 ? (
					<p className="py-1 text-center text-muted-foreground text-sm">
						Tap words below to build the sentence
					</p>
				) : (
					<div className="flex flex-wrap gap-2">
						{selected.map((word, i) => (
							<button
								key={`selected-${i}-${word}`}
								type="button"
								onClick={() => handleRemoveWord(word, i)}
								disabled={answered || disabled}
								className={cn(
									"rounded-xl border-2 px-3 py-1.5 font-medium text-sm transition-all",
									!answered &&
										"border-blue-400 bg-blue-100 text-blue-800 hover:border-red-300 hover:bg-red-50 hover:text-red-700",
									answered &&
										result.isCorrect &&
										"border-lime-400 bg-lime-50 text-lime-800",
									answered &&
										!result.isCorrect &&
										"border-red-300 bg-red-50 text-red-800",
								)}
							>
								{word}
							</button>
						))}
					</div>
				)}
			</div>

			{/* Available words */}
			{!answered && (
				<div className="flex flex-wrap gap-2">
					{available.map((word, i) => (
						<button
							key={`available-${i}-${word}`}
							type="button"
							onClick={() => handleSelectWord(word, i)}
							disabled={disabled}
							className="rounded-xl border-2 border-border/50 bg-white px-3 py-1.5 font-medium text-sm transition-all hover:border-blue-300 hover:bg-blue-50"
						>
							{word}
						</button>
					))}
				</div>
			)}

			{/* Actions */}
			{!answered && (
				<div className="flex gap-3">
					<Button
						type="button"
						variant="outline"
						onClick={handleReset}
						disabled={selected.length === 0 || disabled}
						className="rounded-xl"
					>
						<RotateCcw className="mr-1 size-4" />
						Reset
					</Button>
					<Button
						type="button"
						onClick={handleSubmit}
						disabled={selected.length === 0 || disabled}
						className="rounded-xl bg-blue-600 hover:bg-blue-700"
					>
						Check
					</Button>
				</div>
			)}

			{/* Result */}
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
							{result.isCorrect ? "Correct!" : "Not quite"}
						</p>
					</div>
					{!result.isCorrect && (
						<p className="mb-1 text-red-700 text-sm">
							Correct order:{" "}
							<span className="font-semibold">
								{Array.isArray(result.correctAnswer)
									? result.correctAnswer.join(" ")
									: result.correctAnswer}
							</span>
						</p>
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
