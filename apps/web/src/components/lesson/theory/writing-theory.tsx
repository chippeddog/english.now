import type { WritingLessonContent } from "@/types/lesson";
import { ArrowRight, FileText, Layers, PenTool } from "lucide-react";

interface WritingTheoryProps {
	content: WritingLessonContent;
	onContinue: () => void;
}

export default function WritingTheory({
	content,
	onContinue,
}: WritingTheoryProps) {
	return (
		<div className="container mx-auto max-w-2xl px-4 py-8">
			<div className="mb-2 flex items-center gap-2">
				<span className="inline-block rounded-full bg-indigo-100 px-3 py-1 font-medium text-indigo-700 text-xs">
					Writing
				</span>
				<span className="text-muted-foreground text-sm">
					{content.writingType}
				</span>
			</div>

			<p className="mb-6 text-muted-foreground">{content.description}</p>

			{/* Structure guide */}
			<div className="mb-6">
				<div className="mb-3 flex items-center gap-2">
					<Layers className="size-4 text-indigo-600" />
					<h3 className="font-semibold text-sm">Structure</h3>
				</div>
				<div className="overflow-hidden rounded-2xl border border-border/50 bg-white">
					<div className="flex flex-col gap-0 divide-y divide-border/50">
						{content.structureGuide.map((section, i) => (
							<div
								key={section.section}
								className="flex items-start gap-3 px-5 py-4"
							>
								<div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-600 text-xs">
									{i + 1}
								</div>
								<div>
									<p className="font-semibold text-sm">{section.section}</p>
									<p className="text-muted-foreground text-xs">
										{section.description}
									</p>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>

			{/* Model text */}
			<div className="mb-6">
				<div className="mb-3 flex items-center gap-2">
					<FileText className="size-4 text-indigo-600" />
					<h3 className="font-semibold text-sm">Model Example</h3>
				</div>
				<div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-5">
					<div className="space-y-3 text-neutral-700 text-sm leading-relaxed">
						{content.modelText.split("\n\n").map((p) => (
							<p key={p.slice(0, 30)}>{p}</p>
						))}
					</div>
				</div>
			</div>

			{/* Useful expressions */}
			{content.usefulExpressions.length > 0 && (
				<div className="mb-6">
					<div className="mb-3 flex items-center gap-2">
						<PenTool className="size-4 text-indigo-600" />
						<h3 className="font-semibold text-sm">Useful Expressions</h3>
					</div>
					<div className="flex flex-wrap gap-2">
						{content.usefulExpressions.map((expr) => (
							<span
								key={expr}
								className="rounded-full border border-indigo-200 bg-white px-3 py-1.5 text-sm"
							>
								{expr}
							</span>
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
