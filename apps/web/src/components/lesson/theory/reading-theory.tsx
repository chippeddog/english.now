import type { ReadingLessonContent } from "@/types/lesson";
import { ArrowRight, BookOpen } from "lucide-react";
import { useState } from "react";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";

interface ReadingTheoryProps {
	content: ReadingLessonContent;
	onContinue: () => void;
}

export default function ReadingTheory({
	content,
	onContinue,
}: ReadingTheoryProps) {
	const [readComplete, setReadComplete] = useState(false);

	const glossaryMap = new Map(
		content.glossary.map((g) => [g.word.toLowerCase(), g.definition]),
	);

	return (
		<div className="container mx-auto max-w-2xl px-4 py-8">
			<div className="mb-2 flex items-center gap-2">
				<span className="inline-block rounded-full bg-emerald-100 px-3 py-1 font-medium text-emerald-700 text-xs">
					Reading
				</span>
				<span className="text-muted-foreground text-sm">
					{content.comprehensionFocus}
				</span>
			</div>

			<p className="mb-6 text-muted-foreground">{content.description}</p>

			{/* Reading Passage */}
			<div className="overflow-hidden rounded-2xl border border-border/50 bg-white">
				<div className="border-emerald-200 border-b bg-emerald-50/50 px-6 py-4">
					<div className="flex items-center gap-2">
						<BookOpen className="size-4 text-emerald-600" />
						<h3 className="font-bold text-lg">{content.passage.title}</h3>
					</div>
					{content.passage.source && (
						<p className="mt-1 text-muted-foreground text-xs">
							Source: {content.passage.source}
						</p>
					)}
				</div>

				<div className="px-6 py-5">
					<TooltipProvider>
						<div className="space-y-4 text-base text-neutral-800 leading-relaxed">
							{content.passage.text.split("\n\n").map((paragraph) => (
								<p key={paragraph.slice(0, 30)}>
									<GlossaryHighlightedText
										text={paragraph}
										glossaryMap={glossaryMap}
									/>
								</p>
							))}
						</div>
					</TooltipProvider>
				</div>
			</div>

			{/* Glossary */}
			{content.glossary.length > 0 && (
				<div className="mt-6">
					<h4 className="mb-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
						Glossary
					</h4>
					<div className="grid grid-cols-2 gap-2">
						{content.glossary.map((g) => (
							<div
								key={g.word}
								className="rounded-xl border border-neutral-100 bg-neutral-50 p-3"
							>
								<p className="font-semibold text-sm">{g.word}</p>
								<p className="text-muted-foreground text-xs">{g.definition}</p>
							</div>
						))}
					</div>
				</div>
			)}

			<div className="mt-8 flex items-center justify-between">
				{!readComplete && (
					<button
						type="button"
						onClick={() => setReadComplete(true)}
						className="font-medium text-muted-foreground text-sm underline underline-offset-2 hover:text-foreground"
					>
						I've finished reading
					</button>
				)}

				<button
					type="button"
					onClick={onContinue}
					className="ml-auto flex h-12 items-center gap-2 rounded-2xl bg-blue-600 px-8 font-semibold text-base text-white transition-colors hover:bg-blue-700"
				>
					Start Practice
					<ArrowRight className="size-4" />
				</button>
			</div>
		</div>
	);
}

function GlossaryHighlightedText({
	text,
	glossaryMap,
}: {
	text: string;
	glossaryMap: Map<string, string>;
}) {
	if (glossaryMap.size === 0) return <>{text}</>;

	const escapedWords = Array.from(glossaryMap.keys()).map((w) =>
		w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
	);
	const pattern = new RegExp(`\\b(${escapedWords.join("|")})\\b`, "gi");
	const parts = text.split(pattern);

	return (
		<>
			{parts.map((part) => {
				const definition = glossaryMap.get(part.toLowerCase());
				if (definition) {
					return (
						<Tooltip key={`${part}-${Math.random()}`}>
							<TooltipTrigger asChild>
								<span className="cursor-help border-emerald-400 border-b border-dotted font-medium text-emerald-700">
									{part}
								</span>
							</TooltipTrigger>
							<TooltipContent>
								<p className="max-w-xs text-sm">{definition}</p>
							</TooltipContent>
						</Tooltip>
					);
				}
				return <span key={`${part}-${Math.random()}`}>{part}</span>;
			})}
		</>
	);
}
