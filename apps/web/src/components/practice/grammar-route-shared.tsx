import { BookOpen } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type GrammarTopicStatus =
	| "completed"
	| "in_progress"
	| "not_started"
	| "locked";

export type TopicListItem = {
	id: string;
	slug: string;
	title: string;
	description: string;
	summary: string;
	level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
	category: string;
	estimatedMinutes: number | null;
	status: GrammarTopicStatus;
	mastery: string;
	progress: number;
	bookmark: boolean;
	activeSessionId: string | null;
	drillItemCount: number;
	ruleTitles: string[];
	vocabulary: string[];
	objectives: string[];
};

export type TopicRef = {
	id: string;
	slug: string | null;
	title: string;
	level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
	category: string;
};

export function OverviewCard({
	title,
	value,
	description,
	icon,
}: {
	title: string;
	value: string;
	description: string;
	icon: ReactNode;
}) {
	return (
		<div className="rounded-[1.25rem] border border-border/50 bg-white p-4 shadow-sm">
			<div className="mb-4 flex items-center justify-between">
				<p className="font-medium text-muted-foreground text-sm">{title}</p>
				<div className="rounded-lg bg-muted p-2">{icon}</div>
			</div>
			<p className="line-clamp-2 font-semibold text-2xl text-slate-900">
				{value}
			</p>
			<p className="mt-1 text-muted-foreground text-sm">{description}</p>
		</div>
	);
}

export function StatusBadge({ status }: { status: GrammarTopicStatus }) {
	if (status === "completed") {
		return <Badge variant="mastered">Completed</Badge>;
	}

	if (status === "in_progress") {
		return <Badge variant="learning">In progress</Badge>;
	}

	if (status === "locked") {
		return <Badge variant="outline">Locked</Badge>;
	}

	return <Badge variant="notStarted">Not started</Badge>;
}

export function RelationList({
	title,
	topics,
	onSelect,
}: {
	title: string;
	topics: TopicRef[];
	onSelect: (topicSlug: string) => void;
}) {
	return (
		<div>
			<h3 className="mb-3 font-semibold text-sm">{title}</h3>
			<div className="flex flex-col gap-2">
				{topics.length === 0 ? (
					<p className="text-muted-foreground text-sm">No topics linked yet.</p>
				) : (
					topics.map((topic) => (
						<button
							key={topic.id}
							type="button"
							onClick={() => {
								if (topic.slug) {
									onSelect(topic.slug);
								}
							}}
							disabled={!topic.slug}
							className={cn(
								"rounded-xl border border-border/50 bg-white px-3 py-2 text-left transition-colors",
								topic.slug
									? "hover:bg-muted/40"
									: "cursor-not-allowed opacity-60",
							)}
						>
							<div className="flex items-center gap-2">
								<Badge variant={topic.level}>{topic.level}</Badge>
								<span className="font-medium text-sm">{topic.title}</span>
							</div>
							<p className="mt-1 text-muted-foreground text-xs">
								{topic.category}
							</p>
						</button>
					))
				)}
			</div>
		</div>
	);
}

export function GrammarPageSkeleton() {
	return (
		<div className="min-h-screen">
			<div className="container relative z-10 mx-auto max-w-5xl px-4 py-6 pt-8">
				Loading...
			</div>
		</div>
	);
}

export function GrammarEmptyState() {
	return (
		<div className="min-h-screen">
			<div className="container relative z-10 mx-auto max-w-5xl px-4 py-6 pt-8">
				<div className="rounded-3xl border border-border/50 bg-white p-8 text-center shadow-sm">
					<div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-muted">
						<BookOpen className="size-5 text-muted-foreground" />
					</div>
					<h1 className="font-bold font-lyon text-3xl tracking-tight">
						Grammar
					</h1>
					<p className="mx-auto mt-3 max-w-md text-muted-foreground">
						Your canonical grammar library is ready in code. Populate the
						`grammar_topic` table to make topics available here.
					</p>
				</div>
			</div>
		</div>
	);
}
