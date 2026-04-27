import { FileText, Volume2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { LessonTreeLesson } from "@/types/lesson";
import { lessonTypeConfig } from "./lesson-type-config";

interface LessonDetailDrawerProps {
	lesson: LessonTreeLesson | null;
	open: boolean;
	onClose: () => void;
	onStart: (lesson: LessonTreeLesson) => void;
}

export function LessonDetailDrawer({
	lesson,
	open,
	onClose,
	onStart,
}: LessonDetailDrawerProps) {
	if (!lesson) return null;

	const detail = lesson.detail;
	const grammarPoints = detail.grammarPoints ?? detail.rules ?? [];
	const vocabulary = detail.vocabulary ?? detail.words ?? [];
	const typeConfig = lessonTypeConfig[lesson.type];

	return (
		<Dialog open={open} onOpenChange={(o) => !o && onClose()}>
			<DialogContent
				className="max-h-[85vh] overflow-y-auto sm:max-w-md"
				showCloseButton={false}
			>
				<DialogTitle className="sr-only">{lesson.title}</DialogTitle>

				<button
					type="button"
					onClick={onClose}
					className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 transition-colors hover:bg-neutral-200"
				>
					<X className="size-4" />
				</button>

				<div className="text-center">
					<h2 className="font-bold font-lyon text-2xl">{lesson.title}</h2>
					<p className="mt-1 text-muted-foreground text-sm">
						{lesson.subtitle}
					</p>

					<div className="mt-3 flex items-center justify-center gap-2">
						{typeConfig && (
							<Badge
								variant="outline"
								className="border-neutral-200 bg-neutral-50 text-neutral-600"
							>
								{typeConfig.label}
							</Badge>
						)}
						{vocabulary.length > 0 && (
							<Badge
								variant="outline"
								className="border-sky-200 bg-sky-50 text-sky-700"
							>
								{vocabulary.length} Words
							</Badge>
						)}
						{grammarPoints.length > 0 && (
							<Badge
								variant="outline"
								className="border-violet-200 bg-violet-50 text-violet-700"
							>
								{grammarPoints.length} Grammar
							</Badge>
						)}
					</div>
				</div>

				{detail.objectives && detail.objectives.length > 0 && (
					<div className="mt-4">
						<h4 className="mb-2 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
							You'll Learn
						</h4>
						<ul className="flex flex-col gap-1.5">
							{detail.objectives.map((obj) => (
								<li key={obj} className="flex items-start gap-2 text-sm">
									<span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-blue-400" />
									{obj}
								</li>
							))}
						</ul>
					</div>
				)}

				{grammarPoints.length > 0 && (
					<div className="mt-4">
						<h4 className="mb-2 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
							Grammar to Practice
						</h4>
						<div className="flex flex-col gap-2">
							{grammarPoints.map((point) => (
								<div
									key={point.title}
									className="flex items-start gap-3 rounded-xl border border-neutral-100 bg-neutral-50 p-3"
								>
									<div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
										<FileText className="size-4" />
									</div>
									<div>
										<p className="font-medium text-sm">{point.title}</p>
										<p className="text-muted-foreground text-xs">
											{point.description}
										</p>
									</div>
								</div>
							))}
						</div>
					</div>
				)}

				{vocabulary.length > 0 && (
					<div className="mt-4">
						<h4 className="mb-2 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
							Words to Practice
						</h4>
						<div className="grid grid-cols-2 gap-2">
							{vocabulary.map((w) => (
								<button
									key={w.word}
									type="button"
									className="group flex items-start gap-2 rounded-xl border border-neutral-100 bg-white p-3 text-left transition-colors hover:border-sky-200 hover:bg-sky-50"
								>
									<Volume2 className="mt-0.5 size-4 shrink-0 text-sky-500" />
									<div>
										<p className="font-semibold text-sm">{w.word}</p>
										{w.definition && (
											<p className="text-muted-foreground text-xs">
												{w.definition}
											</p>
										)}
									</div>
								</button>
							))}
						</div>
					</div>
				)}

				<div className="mt-4">
					<Button
						className="h-12 w-full rounded-2xl bg-blue-600 font-semibold text-base hover:bg-blue-700"
						onClick={() => {
							if (lesson.status === "completed") {
								onStart(lesson);
							} else {
								onClose();
							}
						}}
					>
						{lesson.status === "completed" ? "Review" : "Got It!"}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
