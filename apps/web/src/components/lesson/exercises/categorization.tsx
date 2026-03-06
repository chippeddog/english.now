import { Check, RotateCcw, X } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CategorizationProps {
	prompt: string;
	categories: { name: string; items: string[] }[];
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

export default function Categorization({
	prompt,
	categories,
	items,
	onSubmit,
	disabled,
	hint,
	result,
}: CategorizationProps) {
	const categoryNames = categories.map((c) => c.name);
	const [placements, setPlacements] = useState<Map<string, string>>(new Map());
	const [activeCategory, setActiveCategory] = useState<string | null>(null);
	const answered = !!result;

	const unplaced = items.filter((item) => !placements.has(item));

	const handleItemClick = useCallback(
		(item: string) => {
			if (answered || disabled || !activeCategory) return;
			setPlacements((prev) => {
				const next = new Map(prev);
				next.set(item, activeCategory);
				return next;
			});
		},
		[answered, disabled, activeCategory],
	);

	const handleRemoveItem = useCallback(
		(item: string) => {
			if (answered || disabled) return;
			setPlacements((prev) => {
				const next = new Map(prev);
				next.delete(item);
				return next;
			});
		},
		[answered, disabled],
	);

	const handleReset = useCallback(() => {
		setPlacements(new Map());
		setActiveCategory(null);
	}, []);

	const handleSubmit = () => {
		if (unplaced.length > 0 || answered || disabled) return;
		const answer = categoryNames
			.map((cat) => {
				const catItems = Array.from(placements.entries())
					.filter(([, c]) => c === cat)
					.map(([item]) => item);
				return `${cat}:${catItems.join(",")}`;
			})
			.join("|");
		onSubmit(answer);
	};

	return (
		<div className="flex flex-col gap-6">
			<div className="rounded-2xl border border-border/50 bg-white p-6">
				<p className="font-medium text-lg leading-relaxed">{prompt}</p>
			</div>

			{hint && !answered && (
				<p className="text-muted-foreground text-sm italic">{hint}</p>
			)}

			{/* Category targets */}
			<div className="grid grid-cols-2 gap-3">
				{categoryNames.map((cat) => {
					const catItems = Array.from(placements.entries())
						.filter(([, c]) => c === cat)
						.map(([item]) => item);
					const isActive = activeCategory === cat;

					return (
						<button
							key={cat}
							type="button"
							onClick={() =>
								!answered && !disabled && setActiveCategory(isActive ? null : cat)
							}
							disabled={answered || disabled}
							className={cn(
								"flex min-h-[100px] flex-col rounded-2xl border-2 p-3 text-left transition-all",
								!isActive && "border-border/50 bg-neutral-50",
								isActive && "border-blue-400 bg-blue-50/50",
								answered &&
									result.isCorrect &&
									"border-lime-300 bg-lime-50/50",
								answered &&
									!result.isCorrect &&
									"border-neutral-200 bg-neutral-50",
							)}
						>
							<span className="mb-2 font-semibold text-sm">{cat}</span>
							<div className="flex flex-wrap gap-1">
								{catItems.map((item) => (
									<span
										key={item}
										onClick={(e) => {
											e.stopPropagation();
											handleRemoveItem(item);
										}}
										onKeyDown={(e) => {
											if (e.key === "Enter") handleRemoveItem(item);
										}}
										className={cn(
											"cursor-pointer rounded-lg px-2 py-1 text-xs",
											!answered && "bg-blue-100 text-blue-800 hover:bg-red-100 hover:text-red-800",
											answered && "bg-neutral-200",
										)}
									>
										{item}
									</span>
								))}
							</div>
						</button>
					);
				})}
			</div>

			{/* Unplaced items */}
			{!answered && unplaced.length > 0 && (
				<div>
					<p className="mb-2 text-center text-muted-foreground text-xs">
						{activeCategory
							? `Tap items to add to "${activeCategory}"`
							: "Select a category first, then tap items"}
					</p>
					<div className="flex flex-wrap justify-center gap-2">
						{unplaced.map((item) => (
							<button
								key={item}
								type="button"
								onClick={() => handleItemClick(item)}
								disabled={disabled || !activeCategory}
								className={cn(
									"rounded-xl border-2 border-border/50 bg-white px-3 py-1.5 font-medium text-sm transition-all",
									activeCategory && "hover:border-blue-300 hover:bg-blue-50",
									!activeCategory && "cursor-default opacity-60",
								)}
							>
								{item}
							</button>
						))}
					</div>
				</div>
			)}

			{!answered && (
				<div className="flex gap-3">
					<Button
						type="button"
						variant="outline"
						onClick={handleReset}
						disabled={placements.size === 0 || disabled}
						className="rounded-xl"
					>
						<RotateCcw className="mr-1 size-4" />
						Reset
					</Button>
					<Button
						type="button"
						onClick={handleSubmit}
						disabled={unplaced.length > 0 || disabled}
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
							{result.isCorrect ? "All correct!" : "Some items are misplaced"}
						</p>
					</div>
					{!result.isCorrect && (
						<div className="mb-1">
							{categories.map((cat) => (
								<p key={cat.name} className="text-red-600 text-xs">
									<span className="font-semibold">{cat.name}:</span>{" "}
									{cat.items.join(", ")}
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
