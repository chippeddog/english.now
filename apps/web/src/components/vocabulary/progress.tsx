import { useQuery } from "@tanstack/react-query";
import {
	BookOpen,
	GraduationCap,
	Loader,
	MessageSquareText,
	Sparkles,
	Target,
	Type,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Label,
	Legend,
	Pie,
	PieChart,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	type ChartConfig,
	ChartContainer,
	ChartLegendContent,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/utils/trpc";

type MasteryLevel = "new" | "learning" | "reviewing" | "mastered";

const MASTERY_CONFIG: Record<
	MasteryLevel,
	{
		label: string;
		color: string;
		bg: string;
		text: string;
		icon: typeof BookOpen;
	}
> = {
	new: {
		label: "New",
		color: "hsl(215 14% 60%)",
		bg: "bg-slate-100 dark:bg-slate-800",
		text: "text-slate-600 dark:text-slate-400",
		icon: Sparkles,
	},
	learning: {
		label: "Learning",
		color: "hsl(38 92% 50%)",
		bg: "bg-amber-100 dark:bg-amber-900/30",
		text: "text-amber-700 dark:text-amber-400",
		icon: BookOpen,
	},
	reviewing: {
		label: "Reviewing",
		color: "hsl(217 91% 60%)",
		bg: "bg-blue-100 dark:bg-blue-900/30",
		text: "text-blue-700 dark:text-blue-400",
		icon: Target,
	},
	mastered: {
		label: "Mastered",
		color: "hsl(142 71% 45%)",
		bg: "bg-green-100 dark:bg-green-900/30",
		text: "text-green-700 dark:text-green-400",
		icon: GraduationCap,
	},
};

const MASTERY_ORDER: MasteryLevel[] = [
	"mastered",
	"reviewing",
	"learning",
	"new",
];

const LEVEL_COLORS: Record<string, string> = {
	A1: "hsl(142 71% 45%)",
	A2: "hsl(160 60% 45%)",
	B1: "hsl(217 91% 60%)",
	B2: "hsl(250 60% 60%)",
	C1: "hsl(280 60% 55%)",
	C2: "hsl(320 60% 50%)",
};

const donutChartConfig: ChartConfig = {
	new: { label: "New", color: MASTERY_CONFIG.new.color },
	learning: { label: "Learning", color: MASTERY_CONFIG.learning.color },
	reviewing: { label: "Reviewing", color: MASTERY_CONFIG.reviewing.color },
	mastered: { label: "Mastered", color: MASTERY_CONFIG.mastered.color },
};

const comparisonChartConfig: ChartConfig = {
	words: { label: "Words", color: "hsl(217 91% 60%)" },
	phrases: { label: "Phrases", color: "hsl(280 60% 55%)" },
};

type MasteryItem = { mastery: string; level?: string | null };

function countByMastery(items: MasteryItem[]) {
	const mastered = items.filter((i) => i.mastery === "mastered").length;
	const reviewing = items.filter((i) => i.mastery === "reviewing").length;
	const learning = items.filter((i) => i.mastery === "learning").length;
	const newItems = items.filter((i) => i.mastery === "new").length;
	const total = items.length;
	return {
		total,
		mastered,
		reviewing,
		learning,
		new: newItems,
		progress: total > 0 ? Math.round((mastered / total) * 100) : 0,
	};
}

function VocabularyProgressContent() {
	const trpc = useTRPC();
	const { data: words, isLoading: wordsLoading } = useQuery(
		trpc.vocabulary.getWords.queryOptions({ limit: 200 }),
	);
	const { data: phrases, isLoading: phrasesLoading } = useQuery(
		trpc.vocabulary.getPhrases.queryOptions({ limit: 100 }),
	);

	const isLoading = wordsLoading || phrasesLoading;

	const wordStats = useMemo(() => countByMastery(words ?? []), [words]);
	const phraseStats = useMemo(() => countByMastery(phrases ?? []), [phrases]);

	const combinedTotal = wordStats.total + phraseStats.total;
	const combinedMastered = wordStats.mastered + phraseStats.mastered;
	const combinedProgress =
		combinedTotal > 0
			? Math.round((combinedMastered / combinedTotal) * 100)
			: 0;

	const donutData = useMemo(() => {
		const allItems = [...(words ?? []), ...(phrases ?? [])];
		return MASTERY_ORDER.map((level) => ({
			name: level,
			value: allItems.filter((i) => i.mastery === level).length,
			fill: MASTERY_CONFIG[level].color,
		})).filter((d) => d.value > 0);
	}, [words, phrases]);

	const comparisonData = useMemo(() => {
		return MASTERY_ORDER.map((level) => ({
			mastery: MASTERY_CONFIG[level].label,
			words: words?.filter((w) => w.mastery === level).length ?? 0,
			phrases: phrases?.filter((p) => p.mastery === level).length ?? 0,
		}));
	}, [words, phrases]);

	const levelData = useMemo(() => {
		const allItems = [...(words ?? []), ...(phrases ?? [])];
		if (!allItems.length) return [];
		const wordCounts: Record<string, number> = {};
		const phraseCounts: Record<string, number> = {};
		for (const w of words ?? []) {
			const level = w.level || "Other";
			wordCounts[level] = (wordCounts[level] || 0) + 1;
		}
		for (const p of phrases ?? []) {
			const level = p.level || "Other";
			phraseCounts[level] = (phraseCounts[level] || 0) + 1;
		}
		const order = ["A1", "A2", "B1", "B2", "C1", "C2", "Other"];
		return order
			.filter((lvl) => (wordCounts[lvl] ?? 0) + (phraseCounts[lvl] ?? 0) > 0)
			.map((lvl) => ({
				level: lvl,
				words: wordCounts[lvl] ?? 0,
				phrases: phraseCounts[lvl] ?? 0,
				fill: LEVEL_COLORS[lvl] || "hsl(215 14% 60%)",
			}));
	}, [words, phrases]);

	const levelChartConfig: ChartConfig = useMemo(() => {
		const config: ChartConfig = {
			words: { label: "Words", color: "hsl(217 91% 60%)" },
			phrases: { label: "Phrases", color: "hsl(280 60% 55%)" },
		};
		return config;
	}, []);

	if (isLoading) {
		return (
			<div className="flex min-h-[200px] items-center justify-center">
				<Loader className="size-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (combinedTotal === 0) {
		return (
			<div className="flex flex-col gap-4">
				<h2 className="font-semibold text-lg">Learning Progress</h2>
				<div className="rounded-xl border border-border border-dashed bg-muted/30 p-8 text-center text-muted-foreground">
					<p>
						No vocabulary yet. Add words or phrases from the other tabs to track
						your progress.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-6">
			<div className="space-y-3">
				<div className="flex items-center justify-between">
					<h2 className="font-semibold text-lg">Learning Progress</h2>
					<span className="font-semibold text-muted-foreground text-sm">
						{combinedTotal} items total
					</span>
				</div>
			</div>

			<div
				className="grid gap-3 rounded-3xl bg-white p-3 sm:grid-cols-4"
				style={{
					boxShadow:
						"0 0 0 1px rgba(0,0,0,.05),0 10px 10px -5px rgba(0,0,0,.04),0 20px 25px -5px rgba(0,0,0,.04),0 20px 32px -12px rgba(0,0,0,.04)",
				}}
			>
				{MASTERY_ORDER.map((key) => {
					const config = MASTERY_CONFIG[key];
					const Icon = config.icon;
					const wCount = words?.filter((w) => w.mastery === key).length ?? 0;
					const pCount = phrases?.filter((p) => p.mastery === key).length ?? 0;
					const count = wCount + pCount;
					const pct =
						combinedTotal > 0 ? Math.round((count / combinedTotal) * 100) : 0;
					return (
						<div key={key} className={cn("flex items-center gap-3")}>
							<div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[#C6F64D] bg-radial from-[#EFFF9B] to-[#D8FF76]">
								<Icon className="size-5 text-lime-700" />
							</div>
							<div className="min-w-0">
								<div className={cn("font-bold text-xl")}>{count}</div>
								<div className={cn("text-sm")}>
									{config.label}
									<span className="ml-1 opacity-60">({pct}%)</span>
								</div>
							</div>
						</div>
					);
				})}
			</div>

			{/* Charts row */}
			<div className="grid gap-4 md:grid-cols-2">
				{/* Mastery donut chart */}
				<Card className="py-4">
					<CardHeader className="pb-0">
						<CardTitle className="text-base">Mastery Distribution</CardTitle>
						<CardDescription>
							Words and phrases by learning stage
						</CardDescription>
					</CardHeader>
					<CardContent className="pt-0">
						<ChartContainer
							config={donutChartConfig}
							className="mx-auto aspect-square max-h-[220px]"
						>
							<PieChart>
								<Tooltip
									content={
										<ChartTooltipContent
											hideLabel={false}
											nameKey="name"
											formatter={(value) => (
												<span className="font-medium font-mono tabular-nums">
													{value as number}{" "}
													{(value as number) === 1 ? "item" : "items"}
												</span>
											)}
										/>
									}
								/>
								<Pie
									data={donutData}
									dataKey="value"
									nameKey="name"
									innerRadius={55}
									outerRadius={85}
									strokeWidth={2}
									stroke="hsl(var(--card))"
									paddingAngle={2}
								>
									{donutData.map((entry) => (
										<Cell key={entry.name} fill={entry.fill} />
									))}
									<Label
										content={({ viewBox }) => {
											if (viewBox && "cx" in viewBox && "cy" in viewBox) {
												return (
													<text
														x={viewBox.cx}
														y={viewBox.cy}
														textAnchor="middle"
														dominantBaseline="middle"
													>
														<tspan
															x={viewBox.cx}
															y={(viewBox.cy || 0) - 8}
															className="fill-foreground font-bold text-2xl"
														>
															{combinedTotal}
														</tspan>
														<tspan
															x={viewBox.cx}
															y={(viewBox.cy || 0) + 12}
															className="fill-muted-foreground text-xs"
														>
															total
														</tspan>
													</text>
												);
											}
										}}
									/>
								</Pie>
							</PieChart>
						</ChartContainer>
						{/* Legend */}
						<div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
							{MASTERY_ORDER.filter((level) =>
								donutData.some((d) => d.name === level),
							).map((level) => (
								<div key={level} className="flex items-center gap-1.5 text-xs">
									<div
										className="size-2.5 rounded-full"
										style={{
											backgroundColor: MASTERY_CONFIG[level].color,
										}}
									/>
									<span className="text-muted-foreground">
										{MASTERY_CONFIG[level].label}
									</span>
								</div>
							))}
						</div>
					</CardContent>
				</Card>

				{/* Words vs Phrases comparison */}
				<Card className="py-4">
					<CardHeader className="pb-0">
						<CardTitle className="text-base">Words vs Phrases</CardTitle>
						<CardDescription>Comparison by mastery stage</CardDescription>
					</CardHeader>
					<CardContent className="pt-0">
						<ChartContainer
							config={comparisonChartConfig}
							className="mx-auto aspect-square max-h-[250px] w-full"
						>
							<BarChart
								data={comparisonData}
								margin={{
									top: 16,
									right: 8,
									left: -12,
									bottom: 0,
								}}
							>
								<CartesianGrid
									vertical={false}
									stroke="hsl(var(--border))"
									strokeDasharray="3 3"
								/>
								<XAxis
									dataKey="mastery"
									tickLine={false}
									axisLine={false}
									fontSize={11}
								/>
								<YAxis
									tickLine={false}
									axisLine={false}
									fontSize={12}
									allowDecimals={false}
								/>
								<Tooltip content={<ChartTooltipContent hideLabel={false} />} />
								<Legend content={<ChartLegendContent />} />
								<Bar
									dataKey="words"
									fill="var(--color-words)"
									radius={[4, 4, 0, 0]}
									maxBarSize={28}
								/>
								<Bar
									dataKey="phrases"
									fill="var(--color-phrases)"
									radius={[4, 4, 0, 0]}
									maxBarSize={28}
								/>
							</BarChart>
						</ChartContainer>
					</CardContent>
				</Card>
			</div>

			{/* CEFR level distribution */}
			{levelData.length > 0 && (
				<Card className="py-4">
					<CardHeader className="pb-0">
						<CardTitle className="text-base">CEFR Level Distribution</CardTitle>
						<CardDescription>
							Words and phrases grouped by proficiency level
						</CardDescription>
					</CardHeader>
					<CardContent className="pt-0">
						<ChartContainer
							config={levelChartConfig}
							className="mx-auto aspect-[2/1] max-h-[220px] w-full"
						>
							<BarChart
								data={levelData}
								margin={{
									top: 16,
									right: 8,
									left: -12,
									bottom: 0,
								}}
							>
								<CartesianGrid
									vertical={false}
									stroke="hsl(var(--border))"
									strokeDasharray="3 3"
								/>
								<XAxis
									dataKey="level"
									tickLine={false}
									axisLine={false}
									fontSize={12}
								/>
								<YAxis
									tickLine={false}
									axisLine={false}
									fontSize={12}
									allowDecimals={false}
								/>
								<Tooltip content={<ChartTooltipContent hideLabel={false} />} />
								<Legend content={<ChartLegendContent />} />
								<Bar
									dataKey="words"
									fill="var(--color-words)"
									radius={[4, 4, 0, 0]}
									maxBarSize={32}
								/>
								<Bar
									dataKey="phrases"
									fill="var(--color-phrases)"
									radius={[4, 4, 0, 0]}
									maxBarSize={32}
								/>
							</BarChart>
						</ChartContainer>
					</CardContent>
				</Card>
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
				<Loader className="size-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return <VocabularyProgressContent />;
}
