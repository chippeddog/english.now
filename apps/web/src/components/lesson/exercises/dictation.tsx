import { Check, Headphones, X } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DictationProps {
	prompt: string;
	onSubmit: (answer: string) => void;
	disabled?: boolean;
	hint?: string;
	result?: {
		isCorrect: boolean;
		correctAnswer: string | string[];
		explanation: string;
	};
}

export default function Dictation({
	prompt,
	onSubmit,
	disabled,
	hint,
	result,
}: DictationProps) {
	const [value, setValue] = useState("");
	const answered = !!result;

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault();
		if (!value.trim() || answered || disabled) return;
		onSubmit(value.trim());
	};

	return (
		<div className="flex flex-col gap-6">
			{/* Audio prompt */}
			<div className="flex flex-col items-center gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-6">
				<button
					type="button"
					className="flex size-16 items-center justify-center rounded-full bg-amber-100 text-amber-600 transition-colors hover:bg-amber-200"
					aria-label="Play audio"
				>
					<Headphones className="size-8" />
				</button>
				<p className="text-center font-medium text-amber-800 text-sm">
					{prompt}
				</p>
			</div>

			{hint && !answered && (
				<p className="text-muted-foreground text-sm italic">{hint}</p>
			)}

			{!answered && (
				<form onSubmit={handleSubmit} className="flex flex-col gap-3">
					<label
						htmlFor="dictation-input"
						className="font-medium text-sm text-neutral-700"
					>
						Type what you hear:
					</label>
					<input
						id="dictation-input"
						type="text"
						value={value}
						onChange={(e) => setValue(e.target.value)}
						placeholder="Type the sentence you heard..."
						disabled={disabled}
						// biome-ignore lint/a11y/noAutofocus: auto-focus for exercise UX
						autoFocus
						className="rounded-2xl border-2 border-border/50 bg-white px-5 py-4 font-medium text-base outline-none transition-all placeholder:text-muted-foreground focus:border-blue-400"
					/>
					<Button
						type="submit"
						disabled={!value.trim() || disabled}
						className="w-fit rounded-xl bg-blue-600 hover:bg-blue-700"
					>
						Check
					</Button>
				</form>
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
							{result.isCorrect ? "Correct!" : "Not quite"}
						</p>
					</div>
					{!result.isCorrect && (
						<p className="mb-1 text-red-700 text-sm">
							Correct answer:{" "}
							<span className="font-semibold">
								{Array.isArray(result.correctAnswer)
									? result.correctAnswer[0]
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
