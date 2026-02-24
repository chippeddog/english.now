import { Check, X } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FillInTheBlankProps {
	prompt: string;
	onSubmit: (answer: string) => void;
	disabled?: boolean;
	result?: {
		isCorrect: boolean;
		correctAnswer: string;
		explanation: string;
	};
}

export default function FillInTheBlank({
	prompt,
	onSubmit,
	disabled,
	result,
}: FillInTheBlankProps) {
	const [value, setValue] = useState("");
	const answered = !!result;

	const parts = prompt.split("___");
	const hasBlanks = parts.length > 1;

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault();
		if (!value.trim() || answered || disabled) return;
		onSubmit(value.trim());
	};

	return (
		<div className="flex flex-col gap-6">
			<div className="rounded-2xl border border-border/50 bg-white p-6">
				{hasBlanks ? (
					<p className="font-medium text-lg leading-relaxed">
						{parts.map((part, i) => (
							<span key={`part-${i}-${part.slice(0, 10)}`}>
								{part}
								{i < parts.length - 1 && (
									<span
										className={cn(
											"mx-1 inline-block min-w-[120px] border-b-2 px-2 pb-0.5 text-center",
											!answered && "border-blue-400",
											answered &&
												result.isCorrect &&
												"border-lime-500 text-lime-700",
											answered &&
												!result.isCorrect &&
												"border-red-400 text-red-700",
										)}
									>
										{answered
											? result.isCorrect
												? value
												: result.correctAnswer
											: value || "\u00A0"}
									</span>
								)}
							</span>
						))}
					</p>
				) : (
					<p className="font-medium text-lg leading-relaxed">{prompt}</p>
				)}
			</div>

			{!answered && (
				<form onSubmit={handleSubmit} className="flex gap-3">
					<input
						type="text"
						value={value}
						onChange={(e) => setValue(e.target.value)}
						placeholder="Type your answer..."
						disabled={disabled}
						// biome-ignore lint/a11y/noAutofocus: auto-focus on exercise input for better UX
						autoFocus
						className="flex-1 rounded-2xl border-2 border-border/50 bg-white px-5 py-4 font-medium text-base outline-none transition-all placeholder:text-muted-foreground focus:border-blue-400"
					/>
					<Button
						type="submit"
						disabled={!value.trim() || disabled}
						className="h-auto rounded-2xl bg-blue-600 px-6 font-semibold hover:bg-blue-700"
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
							The correct answer is:{" "}
							<span className="font-semibold">{result.correctAnswer}</span>
						</p>
					)}
					{result.explanation && (
						<p
							className={cn(
								"text-sm",
								result.isCorrect ? "text-lime-700" : "text-red-700",
							)}
						>
							{result.explanation}
						</p>
					)}
				</div>
			)}
		</div>
	);
}
