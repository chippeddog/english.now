import type { SpeakingLessonContent } from "@/types/lesson";
import { ArrowRight, MessageCircle, Mic, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SpeakingTheoryProps {
	content: SpeakingLessonContent;
	onContinue: () => void;
}

export default function SpeakingTheory({
	content,
	onContinue,
}: SpeakingTheoryProps) {
	return (
		<div className="container mx-auto max-w-2xl px-4 py-8">
			<div className="mb-2">
				<span className="inline-block rounded-full bg-rose-100 px-3 py-1 font-medium text-rose-700 text-xs">
					Speaking
				</span>
			</div>

			<p className="mb-6 text-muted-foreground">{content.description}</p>

			{/* Dialogue examples */}
			{content.dialogueExamples.length > 0 && (
				<div className="mb-6">
					<div className="mb-3 flex items-center gap-2">
						<MessageCircle className="size-4 text-rose-600" />
						<h3 className="font-semibold text-sm">Example Dialogue</h3>
					</div>
					<div className="overflow-hidden rounded-2xl border border-border/50 bg-white">
						<div className="flex flex-col gap-0 divide-y divide-border/50">
							{content.dialogueExamples.map((line, i) => (
								<div
									key={`${line.speaker}-${i}`}
									className={cn(
										"flex items-start gap-3 px-5 py-3",
										i % 2 === 0 ? "bg-white" : "bg-neutral-50",
									)}
								>
									<span className="mt-0.5 shrink-0 rounded-full bg-rose-100 px-2 py-0.5 font-semibold text-rose-700 text-xs">
										{line.speaker}
									</span>
									<p className="text-sm leading-relaxed">{line.text}</p>
								</div>
							))}
						</div>
					</div>
				</div>
			)}

			{/* Useful phrases */}
			{content.usefulPhrases.length > 0 && (
				<div className="mb-6">
					<h3 className="mb-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
						Useful Phrases
					</h3>
					<div className="flex flex-col gap-2">
						{content.usefulPhrases.map((p) => (
							<div
								key={p.phrase}
								className="flex items-start gap-3 rounded-xl border border-neutral-100 bg-white p-3"
							>
								<button
									type="button"
									className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600 transition-colors hover:bg-rose-200"
									aria-label={`Listen to: ${p.phrase}`}
								>
									<Volume2 className="size-3.5" />
								</button>
								<div>
									<p className="font-semibold text-sm">{p.phrase}</p>
									<p className="text-muted-foreground text-xs">{p.usage}</p>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Pronunciation focus */}
			{content.pronunciationFocus && content.pronunciationFocus.length > 0 && (
				<div className="mb-6">
					<div className="mb-3 flex items-center gap-2">
						<Mic className="size-4 text-rose-600" />
						<h3 className="font-semibold text-sm">Pronunciation Focus</h3>
					</div>
					<div className="flex flex-col gap-2">
						{content.pronunciationFocus.map((pf) => (
							<div
								key={pf.sound}
								className="rounded-xl border border-rose-100 bg-rose-50/50 p-3"
							>
								<p className="mb-1 font-bold text-rose-800 text-sm">
									/{pf.sound}/
								</p>
								<div className="flex flex-wrap gap-1.5">
									{pf.examples.map((ex) => (
										<span
											key={ex}
											className="rounded-full bg-white px-2.5 py-0.5 text-xs shadow-sm"
										>
											{ex}
										</span>
									))}
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			<div className="mt-8 flex justify-end">
				<button
					type="button"
					onClick={onContinue}
					className="flex h-12 items-center gap-2 rounded-2xl bg-blue-600 px-8 font-semibold text-base text-white transition-colors hover:bg-blue-700"
				>
					Start Practice
					<ArrowRight className="size-4" />
				</button>
			</div>
		</div>
	);
}
