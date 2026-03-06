import { Check, X } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SentenceBuildingProps {
	prompt: string;
	items?: string[];
	onSubmit: (answer: string) => void;
	disabled?: boolean;
	hint?: string;
	result?: {
		isCorrect: boolean;
		correctAnswer: string | string[];
		explanation: string;
	};
}

export default function SentenceBuilding({
	prompt,
	items,
	onSubmit,
	disabled,
	hint,
	result,
}: SentenceBuildingProps) {
	const [value, setValue] = useState("");
	const answered = !!result;

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault();
		if (!value.trim() || answered || disabled) return;
		onSubmit(value.trim());
	};

	return (
		<div className="flex flex-col gap-6">
			<div className="rounded-2xl border border-border/50 bg-white p-6">
				<p className="font-medium text-lg leading-relaxed">{prompt}</p>
			</div>

			{hint && !answered && (
				<p className="text-muted-foreground text-sm italic">{hint}</p>
			)}

			{items && items.length > 0 && (
				<div>
					<p className="mb-2 font-medium text-muted-foreground text-xs uppercase tracking-wider">
						Use these words
					</p>
					<div className="flex flex-wrap gap-2">
						{items.map((item) => (
							<span
								key={item}
								className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 font-medium text-indigo-700 text-sm"
							>
								{item}
							</span>
						))}
					</div>
				</div>
			)}

			{!answered && (
				<form onSubmit={handleSubmit} className="flex flex-col gap-3">
					<textarea
						value={value}
						onChange={(e) => setValue(e.target.value)}
						placeholder="Write your sentence..."
						disabled={disabled}
						rows={3}
						// biome-ignore lint/a11y/noAutofocus: auto-focus for exercise UX
						autoFocus
						className="resize-none rounded-2xl border-2 border-border/50 bg-white px-5 py-4 font-medium text-base outline-none transition-all placeholder:text-muted-foreground focus:border-blue-400"
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
							Example answer:{" "}
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
