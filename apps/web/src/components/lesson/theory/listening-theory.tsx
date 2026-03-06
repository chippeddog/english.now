import type { ListeningLessonContent } from "@/types/lesson";
import { ArrowRight, Headphones, Lightbulb } from "lucide-react";

interface ListeningTheoryProps {
	content: ListeningLessonContent;
	onContinue: () => void;
}

export default function ListeningTheory({
	content,
	onContinue,
}: ListeningTheoryProps) {
	return (
		<div className="container mx-auto max-w-2xl px-4 py-8">
			<div className="mb-2 flex items-center gap-2">
				<span className="inline-block rounded-full bg-amber-100 px-3 py-1 font-medium text-amber-700 text-xs">
					Listening
				</span>
				<span className="text-muted-foreground text-sm">
					{content.listeningFocus}
				</span>
			</div>

			<p className="mb-6 text-muted-foreground">{content.description}</p>

			{/* Pre-listening tasks */}
			{content.preTasks && content.preTasks.length > 0 && (
				<div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
					<div className="mb-3 flex items-center gap-2">
						<Lightbulb className="size-4 text-amber-600" />
						<h4 className="font-semibold text-amber-800 text-sm">
							Before You Listen
						</h4>
					</div>
					<ul className="flex flex-col gap-2">
						{content.preTasks.map((task) => (
							<li
								key={task}
								className="flex items-start gap-2 text-amber-700 text-sm"
							>
								<span className="mt-1 size-1.5 shrink-0 rounded-full bg-amber-400" />
								{task}
							</li>
						))}
					</ul>
				</div>
			)}

			{/* Audio player placeholder */}
			<div className="overflow-hidden rounded-2xl border border-border/50 bg-white">
				<div className="border-amber-200 border-b bg-amber-50/50 px-6 py-4">
					<div className="flex items-center gap-2">
						<Headphones className="size-4 text-amber-600" />
						<h3 className="font-bold text-lg">Listen to the Audio</h3>
					</div>
				</div>

				<div className="flex flex-col items-center gap-4 px-6 py-8">
					<div className="flex size-16 items-center justify-center rounded-full bg-amber-100">
						<Headphones className="size-8 text-amber-600" />
					</div>
					<p className="text-center text-muted-foreground text-sm">
						Audio will be generated from the script below.
						<br />
						Listen carefully and try to understand the main ideas.
					</p>
				</div>
			</div>

			{/* Audio script (collapsed by default in real usage, shown for now) */}
			<details className="mt-4 rounded-2xl border border-border/50 bg-white">
				<summary className="cursor-pointer px-5 py-3 font-medium text-muted-foreground text-sm hover:text-foreground">
					Show transcript
				</summary>
				<div className="border-t px-5 py-4">
					<p className="text-neutral-700 text-sm leading-relaxed">
						{content.audioScript}
					</p>
				</div>
			</details>

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
