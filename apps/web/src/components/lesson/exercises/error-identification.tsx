import { Check, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ErrorIdentificationProps {
	prompt: string;
	options: string[];
	onSubmit: (answer: string) => void;
	disabled?: boolean;
	hint?: string;
	result?: {
		isCorrect: boolean;
		correctAnswer: string | string[];
		explanation: string;
	};
}

export default function ErrorIdentification({
	prompt,
	options,
	onSubmit,
	disabled,
	hint,
	result,
}: ErrorIdentificationProps) {
	const [selected, setSelected] = useState<string | null>(null);
	const answered = !!result;

	const handleSelect = (option: string) => {
		if (answered || disabled) return;
		setSelected(option);
		onSubmit(option);
	};

	const correctAnswer = Array.isArray(result?.correctAnswer)
		? result.correctAnswer[0]
		: result?.correctAnswer;

	return (
		<div className="flex flex-col gap-6">
			<div className="rounded-2xl border border-border/50 bg-white p-6">
				<p className="mb-1 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
					Which part contains the error?
				</p>
				<p className="font-medium text-lg leading-relaxed">{prompt}</p>
			</div>

			{hint && !answered && (
				<p className="text-muted-foreground text-sm italic">{hint}</p>
			)}

			<div className="flex flex-col gap-2">
				{options.map((option) => {
					const isSelected = selected === option;
					const isCorrectAnswer =
						answered &&
						option.toLowerCase() === correctAnswer?.toLowerCase();
					const isWrongSelection =
						answered && isSelected && !result.isCorrect;

					return (
						<button
							key={option}
							type="button"
							onClick={() => handleSelect(option)}
							disabled={answered || disabled}
							className={cn(
								"flex items-center gap-3 rounded-2xl border-2 px-5 py-3 text-left font-medium text-sm transition-all",
								!answered &&
									!isSelected &&
									"border-border/50 bg-white hover:border-amber-300 hover:bg-amber-50",
								!answered &&
									isSelected &&
									"border-amber-500 bg-amber-50",
								isCorrectAnswer &&
									"border-lime-500 bg-lime-50 text-lime-900",
								isWrongSelection &&
									"border-red-400 bg-red-50 text-red-900",
								answered &&
									!isCorrectAnswer &&
									!isWrongSelection &&
									"border-border/30 bg-neutral-50 text-muted-foreground opacity-60",
							)}
						>
							<span className="flex-1">{option}</span>
							{isCorrectAnswer && (
								<div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-lime-500 text-white">
									<Check className="size-3.5" strokeWidth={3} />
								</div>
							)}
							{isWrongSelection && (
								<div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-red-400 text-white">
									<X className="size-3.5" strokeWidth={3} />
								</div>
							)}
						</button>
					);
				})}
			</div>

			{answered && result.explanation && (
				<div
					className={cn(
						"rounded-2xl border p-4",
						result.isCorrect
							? "border-lime-200 bg-lime-50"
							: "border-red-200 bg-red-50",
					)}
				>
					<p
						className={cn(
							"mb-1 font-semibold text-sm",
							result.isCorrect ? "text-lime-800" : "text-red-800",
						)}
					>
						{result.isCorrect ? "Correct!" : "Not quite"}
					</p>
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
