// import Explore from "@/components/vocabulary/explore";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Phrases from "@/components/vocabulary/phrases";
import Practice from "@/components/vocabulary/practice";
import Progress from "@/components/vocabulary/progress";
import Words from "@/components/vocabulary/words";
import { Tabs, TabsContent } from "../components/ui/tabs";
import { cn } from "../lib/utils";

const tabs = ["words", "phrases", "progress"] as const;
type Tab = (typeof tabs)[number];

export const Route = createFileRoute("/_dashboard/vocabulary")({
	component: VocabularyPage,
	validateSearch: (search: Record<string, unknown>): { tab?: Tab } => {
		const tab = search.tab as string;
		if (tab && tabs.includes(tab as Tab) && tab !== "words") {
			return { tab: tab as Tab };
		}
		return {};
	},
});

function VocabularyPage() {
	const { t } = useTranslation("app");
	const navigate = useNavigate();
	const { tab } = Route.useSearch();

	const [activeView, setActiveView] = useState<Tab>(() => tab ?? "words");

	useEffect(() => {
		setActiveView(tab ?? "words");
	}, [tab]);

	const handleTabChange = (value: Tab) => {
		setActiveView(value);
		if (value === "words") {
			navigate({ to: "/vocabulary", replace: true });
		} else {
			navigate({ to: "/vocabulary", search: { tab: value }, replace: true });
		}
	};

	return (
		<div>
			<div className="container relative z-10 mx-auto max-w-5xl px-4 py-6 pt-8">
				<div className="mb-6 flex items-center gap-1">
					<h1 className="font-bold font-lyon text-3xl tracking-tight md:text-3xl">
						{t("vocabulary.title")}
					</h1>
				</div>

				<Tabs
					value={activeView}
					onValueChange={(v) => handleTabChange(v as Tab)}
					className="space-y-5"
				>
					<div className="flex flex-row items-center justify-between gap-4">
						<div className="flex items-center gap-0.5 rounded-2xl border border-border/50 bg-muted/50 p-0.5">
							<button
								type="button"
								disabled={activeView === "words"}
								className={cn(
									"flex h-[34px] cursor-pointer items-center justify-center rounded-xl px-2.5 font-medium text-muted-foreground text-sm italic transition-all",
									activeView === "words" &&
										"bg-background text-foreground shadow-sm",
								)}
								onClick={() => handleTabChange("words")}
							>
								{t("vocabulary.words")}
							</button>
							<button
								type="button"
								disabled={activeView === "phrases"}
								className={cn(
									"flex h-[34px] cursor-pointer items-center justify-center rounded-xl px-2.5 font-medium text-muted-foreground text-sm italic transition-all",
									activeView === "phrases" &&
										"bg-background text-foreground shadow-sm",
								)}
								onClick={() => handleTabChange("phrases")}
							>
								{t("vocabulary.phrases")}
							</button>
							<button
								type="button"
								disabled={activeView === "progress"}
								className={cn(
									"flex h-[34px] cursor-pointer items-center justify-center rounded-xl px-2.5 font-medium text-muted-foreground text-sm italic transition-all",
									activeView === "progress" &&
										"bg-background text-foreground shadow-sm",
								)}
								onClick={() => handleTabChange("progress")}
							>
								{t("vocabulary.progress")}
							</button>
						</div>

						<div className="flex gap-3">
							<Practice />
							{/* <Explore /> */}
						</div>
					</div>

					<TabsContent value="words">
						<Words />
					</TabsContent>

					<TabsContent value="phrases">
						<Phrases />
					</TabsContent>

					<TabsContent value="progress" className="space-y-8">
						<Progress />
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}
