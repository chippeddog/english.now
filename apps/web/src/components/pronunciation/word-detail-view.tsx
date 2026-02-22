import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type WordResult = {
	word: string;
	accuracyScore: number;
	errorType: string;
	phonemes: PhonemeResult[];
};

type PhonemeResult = {
	phoneme: string;
	accuracyScore: number;
};

export default function WordDetailView({ words }: { words: WordResult[] }) {
	const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

	const getWordColor = (accuracyScore: number) => {
		if (accuracyScore >= 80)
			return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
		if (accuracyScore >= 60)
			return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
		return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
	};

	const getErrorLabel = (errorType: string) => {
		switch (errorType) {
			case "Omission":
				return "Omitted";
			case "Insertion":
				return "Extra word";
			case "Mispronunciation":
				return "Mispronounced";
			default:
				return null;
		}
	};

	return (
		<div className="space-y-2">
			<p className="font-medium text-muted-foreground text-sm">Word by word:</p>
			<div className="flex flex-wrap gap-2">
				{words.map((item, idx) => {
					const isExpanded = expandedIndex === idx;
					const errorLabel = getErrorLabel(item.errorType);

					return (
						<div key={`${item.word}-${idx}`} className="relative">
							<button
								type="button"
								onClick={() => setExpandedIndex(isExpanded ? null : idx)}
								className={cn(
									"flex items-center gap-1 rounded-lg px-3 py-1.5 font-medium text-lg transition-all",
									getWordColor(item.accuracyScore),
									item.phonemes.length > 0 && "cursor-pointer hover:opacity-80",
								)}
							>
								{item.word}
								<span className="ml-0.5 text-xs opacity-70">
									{Math.round(item.accuracyScore)}
								</span>
								{item.phonemes.length > 0 &&
									(isExpanded ? (
										<ChevronUp className="size-3" />
									) : (
										<ChevronDown className="size-3" />
									))}
							</button>

							{errorLabel && (
								<span className="-right-2 -top-2 absolute rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] text-white">
									{errorLabel}
								</span>
							)}

							{isExpanded && item.phonemes.length > 0 && (
								<div className="absolute top-full left-0 z-10 mt-1 min-w-[140px] rounded-lg border bg-card p-2 shadow-lg">
									<p className="mb-1 font-medium text-muted-foreground text-xs">
										Phonemes:
									</p>
									<div className="space-y-1">
										{item.phonemes.map((p, pIdx) => (
											<div
												key={`${p.phoneme}-${pIdx}`}
												className="flex items-center justify-between gap-2"
											>
												<span className="font-mono text-sm">{p.phoneme}</span>
												<div className="flex items-center gap-1">
													<div className="h-1.5 w-12 overflow-hidden rounded-full bg-muted">
														<div
															className={cn(
																"h-full rounded-full transition-all",
																p.accuracyScore >= 80
																	? "bg-green-500"
																	: p.accuracyScore >= 60
																		? "bg-yellow-500"
																		: "bg-red-500",
															)}
															style={{
																width: `${p.accuracyScore}%`,
															}}
														/>
													</div>
													<span className="w-6 text-right text-xs tabular-nums">
														{Math.round(p.accuracyScore)}
													</span>
												</div>
											</div>
										))}
									</div>
								</div>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
}
