import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Brain, LogOutIcon, SettingsIcon, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Billing } from "@/components/settings/billing";
import { Personalization } from "@/components/settings/personalization";
import { Profile } from "@/components/settings/profile";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { createTitle, PAGE_TITLE } from "@/utils/title";

const VALID_TABS = ["profile", "learning", "billing"] as const;
type SettingsTab = (typeof VALID_TABS)[number];

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
	const { t } = useTranslation("app");
	const { tab } = Route.useSearch();

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
			label: "General",
			value: "profile",
			icon: SettingsIcon,
		},
		{
			label: "Personalization",
			value: "learning",
			icon: Brain,
		},
		{
			label: "Billing & Subscription",
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
		<div className="container relative z-10 mx-auto max-w-5xl px-4 pb-8">
			{/* Mobile / tablet: sticky tab strip (sidebar is lg+ only) */}
			<div className="-mx-4 sticky top-[4.75rem] z-10 mb-4 border-border/50 border-b bg-neutral-50/95 px-4 py-3 backdrop-blur-md lg:hidden dark:bg-neutral-900/95">
				<h1 className="mb-3 font-bold font-lyon text-2xl tracking-tight">
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
							{tabItem.icon && <tabItem.icon className="size-4 shrink-0" />}
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
						<span className="whitespace-nowrap">Sign Out</span>
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
								{tabItem.icon && <tabItem.icon className="size-4 shrink-0" />}
								<span className="whitespace-nowrap">{tabItem.label}</span>
							</button>
						))}
						<button
							type="button"
							className="mt-1 flex h-[34px] w-full cursor-pointer items-center gap-1.5 rounded-xl px-2.5 font-medium text-muted-foreground text-sm italic transition-all hover:text-foreground"
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
							<span className="whitespace-nowrap">Sign Out</span>
						</button>
					</nav>
				</aside>

				<div className="lg:-mr-8 block min-h-0 w-full flex-1 pt-6 pl-6 lg:min-h-full lg:min-w-0 lg:overflow-y-auto">
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
