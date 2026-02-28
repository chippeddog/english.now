"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Progress as ProgressComponent } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/utils/trpc";

type MasteryLevel = "new" | "learning" | "reviewing" | "mastered";

const MASTERY_COLORS: Record<
	MasteryLevel,
	{ bg: string; text: string; label: string }
> = {
	new: {
		bg: "bg-slate-100 dark:bg-slate-800",
		text: "text-slate-600 dark:text-slate-400",
		label: "New",
	},
	learning: {
		bg: "bg-amber-100 dark:bg-amber-900/30",
		text: "text-amber-700 dark:text-amber-400",
		label: "Learning",
	},
	reviewing: {
		bg: "bg-blue-100 dark:bg-blue-900/30",
		text: "text-blue-700 dark:text-blue-400",
		label: "Reviewing",
	},
	mastered: {
		bg: "bg-green-100 dark:bg-green-900/30",
		text: "text-green-700 dark:text-green-400",
		label: "Mastered",
	},
};

function VocabularyProgressContent() {
	const trpc = useTRPC();
	const { data: words, isLoading } = useQuery(
		trpc.vocabulary.getWords.queryOptions({ limit: 200 }),
	);

	const stats = useMemo(() => {
		if (!words?.length) {
			return {
				total: 0,
				mastered: 0,
				learning: 0,
				newWords: 0,
				progress: 0,
			};
		}
		const total = words.length;
		const mastered = words.filter((w) => w.mastery === "mastered").length;
		const learning = words.filter((w) => w.mastery === "learning").length;
		const newWords = words.filter((w) => w.mastery === "new").length;
		return {
			total,
			mastered,
			learning,
			newWords,
			progress: total > 0 ? Math.round((mastered / total) * 100) : 0,
		};
	}, [words]);

	if (isLoading) {
		return (
			<div className="flex min-h-[200px] items-center justify-center">
				<Loader2 className="size-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			<h2 className="font-semibold text-lg">Learning Progress</h2>

			{stats.total === 0 ? (
				<div className="rounded-xl border border-border border-dashed bg-muted/30 p-8 text-center text-muted-foreground">
					<p>
						No vocabulary yet. Add words from the Words tab to track your
						progress.
					</p>
				</div>
			) : (
				<>
					<div className="mb-6 space-y-4">
						<div className="flex items-center justify-between text-sm">
							<span>Overall Progress</span>
							<span className="font-semibold">{stats.progress}%</span>
						</div>
						<ProgressComponent value={stats.progress} className="h-3" />
					</div>
					<div className="grid gap-4 sm:grid-cols-4">
						{(
							Object.entries(MASTERY_COLORS) as [
								MasteryLevel,
								(typeof MASTERY_COLORS)[MasteryLevel],
							][]
						).map(([key, value]) => {
							const count =
								words?.filter((w) => w.mastery === key).length ?? 0;
							return (
								<div key={key} className={cn("rounded-xl p-4", value.bg)}>
									<div className={cn("font-bold text-2xl", value.text)}>
										{count}
									</div>
									<div className={cn("text-sm", value.text)}>{value.label}</div>
								</div>
							);
						})}
					</div>
				</>
			)}
		</div>
	);
}

export default function Progress() {
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		return (
			<div className="flex min-h-[200px] items-center justify-center">
				<Loader2 className="size-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return <VocabularyProgressContent />;
}
