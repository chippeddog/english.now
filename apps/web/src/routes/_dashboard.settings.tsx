import { useTranslation } from "@english.now/i18n";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Brain, Loader2, LogOutIcon, SettingsIcon, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { Billing } from "@/components/settings/billing";
import { Personalization } from "@/components/settings/personalization";
import { Profile } from "@/components/settings/profile";
import { Progress } from "@/components/ui/progress";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { createTitle, PAGE_TITLE } from "@/utils/title";
import { useTRPC } from "@/utils/trpc";

const VALID_TABS = ["profile", "learning", "billing"] as const;
type SettingsTab = (typeof VALID_TABS)[number];

type DailyLimitSummary = {
	isPro: boolean;
	limit: number | null;
	used: number;
	remaining: number | null;
	hasAccess: boolean;
	reason: "pro" | "free_available" | "free_daily_limit_reached";
	latestResourceId: string | null;
};

type PracticeUsageLimits = {
	isPro: boolean;
	conversation: DailyLimitSummary;
	pronunciation: DailyLimitSummary;
	lessonStarts: DailyLimitSummary;
	vocabularyAdds: DailyLimitSummary;
	vocabularyReviews: DailyLimitSummary;
};

export const Route = createFileRoute("/_dashboard/settings")({
	validateSearch: (search: Record<string, unknown>): { tab?: SettingsTab } => {
		const tab = search.tab;
		return {
			tab:
				typeof tab === "string" && VALID_TABS.includes(tab as SettingsTab)
					? (tab as SettingsTab)
					: undefined,
		};
	},
	component: RouteComponent,
	head: () => ({
		meta: [
			{
				title: createTitle(PAGE_TITLE.settings),
			},
		],
	}),
});

function RouteComponent() {
	const navigate = useNavigate();
	const trpc = useTRPC();
	const { t } = useTranslation("app");
	const { tab } = Route.useSearch();
	const { data: usageLimits, isLoading: isLoadingUsageLimits } = useQuery(
		trpc.profile.getUsageLimits.queryOptions(),
	);

	const [activeTab, setActiveTab] = useState<SettingsTab>(
		() => tab ?? "profile",
	);

	useEffect(() => {
		setActiveTab(tab ?? "profile");
	}, [tab]);

	const handleTabChange = (value: SettingsTab) => {
		setActiveTab(value);
		if (value === "profile") {
			navigate({ to: "/settings", replace: true });
		} else {
			navigate({ to: "/settings", search: { tab: value }, replace: true });
		}
	};

	const TABS = [
		{
			label: t("settings.account"),
			value: "profile",
			icon: SettingsIcon,
		},
		{
			label: t("settings.personalization"),
			value: "learning",
			icon: Brain,
		},
		{
			label: t("settings.billing"),
			value: "billing",
			icon: Zap,
		},
	];

	const tabButtonClass = (isActive: boolean, fullWidth: boolean) =>
		cn(
			"flex h-[34px] shrink-0 cursor-pointer items-center gap-1.5 rounded-xl px-2.5 font-medium text-muted-foreground text-sm italic transition-all",
			fullWidth && "md:w-full",
			isActive && "bg-background text-foreground shadow-sm",
		);

	return (
		<div className="container relative z-10 mx-auto max-w-5xl px-4 pb-6 md:pb-0">
			{/* Mobile / tablet: sticky tab strip (sidebar is lg+ only) */}
			<div className="-mx-4 sticky top-[4.75rem] z-10 mb-4 border-border/50 border-b bg-neutral-50/95 px-4 py-3 backdrop-blur-md lg:hidden dark:bg-neutral-900/95">
				<h1 className="mb-5 font-bold font-lyon text-3xl tracking-tight md:mb-3 md:text-3xl">
					{t("settings.title")}
				</h1>
				<div className="-mx-1 flex gap-1 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
					{TABS.map((tabItem) => (
						<button
							key={tabItem.value}
							type="button"
							disabled={activeTab === tabItem.value}
							className={tabButtonClass(activeTab === tabItem.value, false)}
							onClick={() => handleTabChange(tabItem.value as SettingsTab)}
						>
							{/* {tabItem.icon && <tabItem.icon className="size-4 shrink-0" />} */}
							<span className="whitespace-nowrap">{tabItem.label}</span>
						</button>
					))}
					<button
						type="button"
						className="flex h-[34px] shrink-0 cursor-pointer items-center gap-1.5 rounded-xl px-2.5 font-medium text-muted-foreground text-sm italic transition-all hover:text-foreground"
						onClick={() => {
							authClient.signOut({
								fetchOptions: {
									onSuccess: () => {
										navigate({
											to: "/",
										});
									},
								},
							});
						}}
					>
						<LogOutIcon className="size-4 shrink-0" />
						<span className="whitespace-nowrap">{t("settings.signOut")}</span>
					</button>
				</div>
			</div>

			{/* min-h aligns with viewport below navbar so border-r spans full height on desktop */}
			<div className="flex w-full flex-col lg:min-h-[calc(100dvh-5.75rem)] lg:flex-row lg:items-stretch">
				<aside className="hidden flex-col border-border/50 border-r pt-6 pr-5 lg:flex lg:w-[25%] lg:shrink-0 lg:self-stretch">
					<div className="mb-6 flex flex-col gap-1">
						<h1 className="font-bold font-lyon text-3xl tracking-tight md:text-3xl">
							{t("settings.title")}
						</h1>
					</div>
					<nav className="flex w-full flex-col gap-0.5">
						{TABS.map((tabItem) => (
							<button
								key={tabItem.value}
								type="button"
								disabled={activeTab === tabItem.value}
								className={tabButtonClass(activeTab === tabItem.value, true)}
								onClick={() => handleTabChange(tabItem.value as SettingsTab)}
							>
								{/* {tabItem.icon && <tabItem.icon className="size-4 shrink-0" />} */}
								<span className="whitespace-nowrap">{tabItem.label}</span>
							</button>
						))}
						<button
							type="button"
							className="mt-4 flex h-[34px] w-full cursor-pointer items-center gap-1.5 rounded-xl px-2.5 font-medium text-muted-foreground text-sm italic transition-all hover:text-foreground"
							onClick={() => {
								authClient.signOut({
									fetchOptions: {
										onSuccess: () => {
											navigate({
												to: "/",
											});
										},
									},
								});
							}}
						>
							<LogOutIcon className="size-4 shrink-0" />
							<span className="whitespace-nowrap">{t("settings.signOut")}</span>
						</button>
					</nav>
				</aside>

				<div className="lg:-mr-8 block min-h-0 w-full flex-1 md:pt-6 md:pl-6 lg:min-h-full lg:min-w-0 lg:overflow-y-auto">
					<PracticeLimitsCard
						isLoading={isLoadingUsageLimits}
						limits={usageLimits}
					/>
					<section hidden={activeTab !== "profile"}>
						<Profile />
					</section>
					<section hidden={activeTab !== "learning"}>
						<Personalization />
					</section>
					<section hidden={activeTab !== "billing"}>
						<Billing />
					</section>
				</div>
			</div>
		</div>
	);
}

function PracticeLimitsCard({
	isLoading,
	limits,
}: {
	isLoading: boolean;
	limits: PracticeUsageLimits | undefined;
}) {
	const items: Array<{
		key: keyof Omit<PracticeUsageLimits, "isPro">;
		label: string;
		description: string;
	}> = [
		{
			key: "conversation",
			label: "Conversation",
			description: "Daily speaking sessions",
		},
		{
			key: "pronunciation",
			label: "Pronunciation",
			description: "Daily read-aloud sessions",
		},
		{
			key: "lessonStarts",
			label: "New lessons",
			description: "Fresh lesson starts today",
		},
		{
			key: "vocabularyAdds",
			label: "Vocabulary adds",
			description: "Words or phrases you can save",
		},
		{
			key: "vocabularyReviews",
			label: "Vocabulary reviews",
			description: "Review cards left for today",
		},
	];

	return (
		<div className="mb-6 rounded-3xl border border-border/50 bg-white/80 p-5 shadow-sm backdrop-blur dark:bg-neutral-900/80">
			<div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
				<div>
					<h2 className="font-semibold">Today's practice limits</h2>
					<p className="mt-1 text-muted-foreground text-sm">
						Track how much free practice you still have left today.
					</p>
				</div>
				<span className="text-muted-foreground text-sm">
					{limits?.isPro ? "Pro plan" : "Free plan"}
				</span>
			</div>

			{isLoading ? (
				<div className="flex items-center gap-2 py-6 text-muted-foreground text-sm">
					<Loader2 className="size-4 animate-spin" />
					Loading today's limits...
				</div>
			) : !limits ? (
				<p className="py-6 text-muted-foreground text-sm">
					Unable to load today's limits right now.
				</p>
			) : (
				<div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
					{items.map((item) => (
						<LimitProgressItem
							key={item.key}
							label={item.label}
							description={item.description}
							limit={limits[item.key]}
						/>
					))}
				</div>
			)}
		</div>
	);
}

function LimitProgressItem({
	label,
	description,
	limit,
}: {
	label: string;
	description: string;
	limit: DailyLimitSummary;
}) {
	const progressValue =
		limit.limit == null || limit.remaining == null
			? 100
			: Math.max(0, Math.min(100, (limit.remaining / limit.limit) * 100));

	const badgeLabel =
		limit.limit == null || limit.remaining == null
			? "Unlimited"
			: `${limit.remaining}/${limit.limit} left`;

	const detailText =
		limit.limit == null || limit.remaining == null
			? "Unlimited access on your current plan."
			: limit.remaining === 0
				? `You used all ${limit.limit} for today.`
				: `${limit.used} used, ${limit.remaining} left today.`;

	return (
		<div className="rounded-2xl border border-border/50 bg-background/80 p-4">
			<div className="mb-3 flex items-start justify-between gap-3">
				<div className="min-w-0">
					<p className="font-medium">{label}</p>
					<p className="mt-1 text-muted-foreground text-sm">{description}</p>
				</div>
				<span
					className={cn(
						"shrink-0 rounded-full px-2.5 py-1 font-medium text-xs",
						limit.limit == null || limit.remaining == null
							? "bg-lime-500/10 text-lime-700 dark:text-lime-400"
							: limit.remaining === 0
								? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
								: "bg-primary/10 text-primary",
					)}
				>
					{badgeLabel}
				</span>
			</div>
			<Progress
				value={progressValue}
				className={cn(
					"h-2.5 bg-muted",
					limit.limit == null || limit.remaining == null
						? "*:bg-lime-500"
						: limit.remaining === 0
							? "*:bg-amber-500"
							: "*:bg-primary",
				)}
			/>
			<p className="mt-2 text-muted-foreground text-sm">{detailText}</p>
		</div>
	);
}
