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

	return (
		<div className="container relative z-10 mx-auto max-w-5xl px-4 py-6 pt-8">
			<div className="mb-6 flex flex-col gap-1">
				<div>
					<h1 className="font-bold font-lyon text-3xl tracking-tight md:text-3xl">
						{t("settings.title")}
					</h1>
				</div>
			</div>
			<div className="grid grid-cols-1 items-start gap-6 md:grid-cols-4 md:gap-10">
				<div className="col-span-1 flex h-fit w-full flex-col gap-0.5 rounded-2xl border border-border/50 bg-muted/50 p-0.5 md:items-stretch">
					{/* One scrollable row on mobile (tabs + sign out), vertical on desktop */}
					<div className="flex flex-row gap-1 overflow-x-auto pb-1 md:flex-col md:overflow-visible md:pb-0">
						{TABS.map((tab) => (
							<button
								key={tab.value}
								type="button"
								disabled={activeTab === tab.value}
								className={cn(
									"flex h-[34px] shrink-0 cursor-pointer items-center gap-1.5 rounded-xl px-2.5 font-medium text-muted-foreground text-sm italic transition-all md:w-full",
									activeTab === tab.value &&
										"bg-background text-foreground shadow-sm",
								)}
								onClick={() => handleTabChange(tab.value as SettingsTab)}
							>
								{tab.icon && <tab.icon className="size-4 shrink-0" />}
								<span className="whitespace-nowrap">{tab.label}</span>
							</button>
						))}
						<hr className="mx-1 hidden border-border/50 border-dashed md:block" />
						<button
							type="button"
							className="flex h-[34px] shrink-0 cursor-pointer items-center gap-1.5 rounded-xl px-2.5 font-medium text-muted-foreground text-sm italic transition-all hover:text-foreground md:mb-1 md:w-full"
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

				<div className="col-span-3">
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
