import { cn } from "@/lib/utils";

type WeakPhoneme = {
	phoneme: string;
	score: number;
	occurrences: number;
	exampleWords: string[];
};

export default function WeakPhonemesSection({
	phonemes,
}: {
	phonemes: WeakPhoneme[];
}) {
	if (phonemes.length === 0) return null;

	return (
		<div className="rounded-2xl border border-orange-200 bg-orange-50 p-6 dark:border-orange-800 dark:bg-orange-900/20">
			<h3 className="mb-3 font-semibold text-lg text-orange-700 dark:text-orange-300">
				Phonemes to Practice
			</h3>
			<div className="space-y-3">
				{phonemes.map((p) => (
					<div
						key={p.phoneme}
						className="flex items-center gap-3 rounded-xl bg-orange-100/50 p-3 dark:bg-orange-900/20"
					>
						<span className="flex size-10 items-center justify-center rounded-lg bg-orange-200 font-bold font-mono text-lg text-orange-800 dark:bg-orange-800 dark:text-orange-200">
							{p.phoneme}
						</span>
						<div className="flex-1">
							<div className="flex items-center gap-2">
								<div className="h-2 flex-1 overflow-hidden rounded-full bg-orange-200 dark:bg-orange-800">
									<div
										className={cn(
											"h-full rounded-full",
											p.score >= 60 ? "bg-yellow-500" : "bg-red-500",
										)}
										style={{ width: `${p.score}%` }}
									/>
								</div>
								<span className="font-bold text-sm tabular-nums">
									{p.score}
								</span>
							</div>
							{p.exampleWords.length > 0 && (
								<p className="mt-1 text-muted-foreground text-xs">
									in:{" "}
									{p.exampleWords.map((w, i) => (
										<span key={w}>
											<span className="font-medium">{w}</span>
											{i < p.exampleWords.length - 1 ? ", " : ""}
										</span>
									))}
								</p>
							)}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
