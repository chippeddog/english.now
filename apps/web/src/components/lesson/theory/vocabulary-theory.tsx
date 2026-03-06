import type { VocabularyLessonContent } from "@/types/lesson";
import { ArrowLeft, ArrowRight, Volume2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface VocabularyTheoryProps {
	content: VocabularyLessonContent;
	onContinue: () => void;
}

export default function VocabularyTheory({
	content,
	onContinue,
}: VocabularyTheoryProps) {
	const [currentIndex, setCurrentIndex] = useState(0);
	const words = content.words;
	const word = words[currentIndex];
	const isLast = currentIndex === words.length - 1;

	if (!word) return null;

	return (
		<div className="container mx-auto max-w-2xl px-4 py-8">
			<div className="mb-2 flex items-center gap-2">
				<span className="inline-block rounded-full bg-sky-100 px-3 py-1 font-medium text-sky-700 text-xs">
					Vocabulary
				</span>
				{content.thematicGroup && (
					<span className="text-muted-foreground text-sm">
						{content.thematicGroup}
					</span>
				)}
			</div>

			<p className="mb-6 text-muted-foreground">{content.description}</p>

			{/* Progress dots */}
			<div className="mb-6 flex items-center justify-center gap-1.5">
				{words.map((w, i) => (
					<button
						key={w.word}
						type="button"
						onClick={() => setCurrentIndex(i)}
						className={cn(
							"size-2 rounded-full transition-all",
							i === currentIndex
								? "scale-125 bg-sky-500"
								: i < currentIndex
									? "bg-sky-300"
									: "bg-neutral-200",
						)}
					/>
				))}
			</div>

			{/* Word Card */}
			<div className="overflow-hidden rounded-2xl border border-border/50 bg-white">
				<div className="border-sky-200 border-b bg-sky-50/50 px-6 py-5">
					<div className="flex items-center justify-between">
						<div>
							<h3 className="font-bold text-2xl">{word.word}</h3>
							<div className="mt-1 flex items-center gap-2">
								{word.pos && (
									<span className="rounded bg-sky-100 px-2 py-0.5 font-medium text-sky-600 text-xs">
										{word.pos}
									</span>
								)}
								{word.pronunciation && (
									<span className="text-muted-foreground text-sm">
										/{word.pronunciation}/
									</span>
								)}
							</div>
						</div>
						<button
							type="button"
							className="flex size-10 items-center justify-center rounded-full bg-sky-100 text-sky-600 transition-colors hover:bg-sky-200"
							aria-label="Listen to pronunciation"
						>
							<Volume2 className="size-5" />
						</button>
					</div>
				</div>

				<div className="px-6 py-5">
					{word.definition && (
						<p className="mb-4 text-lg text-neutral-700 leading-relaxed">
							{word.definition}
						</p>
					)}

					{word.examples && word.examples.length > 0 && (
						<div className="mb-4">
							<p className="mb-2 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
								Examples
							</p>
							<div className="flex flex-col gap-2">
								{word.examples.map((ex) => (
									<p
										key={ex}
										className="rounded-xl bg-neutral-50 px-4 py-3 text-sm italic"
									>
										"{ex}"
									</p>
								))}
							</div>
						</div>
					)}

					<div className="flex flex-wrap gap-4">
						{word.collocations && word.collocations.length > 0 && (
							<div className="min-w-0 flex-1">
								<p className="mb-1.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
									Collocations
								</p>
								<div className="flex flex-wrap gap-1.5">
									{word.collocations.map((c) => (
										<span
											key={c}
											className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-0.5 text-xs"
										>
											{c}
										</span>
									))}
								</div>
							</div>
						)}

						{word.synonyms && word.synonyms.length > 0 && (
							<div className="min-w-0">
								<p className="mb-1.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
									Synonyms
								</p>
								<div className="flex flex-wrap gap-1.5">
									{word.synonyms.map((s) => (
										<span
											key={s}
											className="rounded-full border border-lime-200 bg-lime-50 px-2.5 py-0.5 text-lime-700 text-xs"
										>
											{s}
										</span>
									))}
								</div>
							</div>
						)}

						{word.antonyms && word.antonyms.length > 0 && (
							<div className="min-w-0">
								<p className="mb-1.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
									Antonyms
								</p>
								<div className="flex flex-wrap gap-1.5">
									{word.antonyms.map((a) => (
										<span
											key={a}
											className="rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-red-700 text-xs"
										>
											{a}
										</span>
									))}
								</div>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Navigation */}
			<div className="mt-6 flex items-center justify-between">
				<button
					type="button"
					onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
					disabled={currentIndex === 0}
					className={cn(
						"flex h-10 items-center gap-1 rounded-xl px-4 font-medium text-sm transition-colors",
						currentIndex === 0
							? "cursor-not-allowed text-muted-foreground opacity-40"
							: "text-neutral-700 hover:bg-neutral-100",
					)}
				>
					<ArrowLeft className="size-4" />
					Previous
				</button>

				<span className="font-medium text-muted-foreground text-sm">
					{currentIndex + 1} / {words.length}
				</span>

				{isLast ? (
					<button
						type="button"
						onClick={onContinue}
						className="flex h-10 items-center gap-1 rounded-xl bg-blue-600 px-6 font-semibold text-sm text-white transition-colors hover:bg-blue-700"
					>
						Start Practice
						<ArrowRight className="size-4" />
					</button>
				) : (
					<button
						type="button"
						onClick={() =>
							setCurrentIndex((i) => Math.min(words.length - 1, i + 1))
						}
						className="flex h-10 items-center gap-1 rounded-xl bg-neutral-900 px-4 font-medium text-sm text-white transition-colors hover:bg-neutral-800"
					>
						Next
						<ArrowRight className="size-4" />
					</button>
				)}
			</div>
		</div>
	);
}
