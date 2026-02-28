import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
// import Explore from "@/components/vocabulary/explore";
import Phrases from "@/components/vocabulary/phrases";
import Practice from "@/components/vocabulary/practice";
import Progress from "@/components/vocabulary/progress";
import Words from "@/components/vocabulary/words";
import { Tabs, TabsContent } from "../components/ui/tabs";
import { cn } from "../lib/utils";

export const Route = createFileRoute("/_dashboard/vocabulary")({
	component: VocabularyPage,
});

function VocabularyPage() {
	const [activeView, setActiveView] = useState<
		"words" | "phrases" | "progress"
	>("words");

	return (
		<div>
			<div className="container relative z-10 mx-auto max-w-5xl px-4 py-6 pt-8">
				<div className="mb-6 flex flex-col items-center md:flex-row md:items-center md:justify-between">
					<div className="flex items-center">
						<div>
							<h1 className="font-bold font-lyon text-2.5xl text-neutral-950 tracking-tight md:text-3xl">
								Vocabulary
							</h1>
						</div>
					</div>
				</div>
				<Tabs
					value={activeView}
					onValueChange={(v) => setActiveView(v as typeof activeView)}
					className="space-y-5"
				>
					<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
						<div className="flex items-center gap-0.5 rounded-2xl border border-border/50 bg-muted/50 p-0.5">
							<button
								type="button"
								disabled={activeView === "words"}
								className={cn(
									"flex h-[34px] cursor-pointer items-center justify-center rounded-xl px-2.5 font-medium text-muted-foreground text-sm italic transition-all",
									activeView === "words" &&
										"bg-background text-foreground shadow-sm",
								)}
								onClick={() => setActiveView("words")}
							>
								Words
							</button>
							<button
								type="button"
								disabled={activeView === "phrases"}
								className={cn(
									"flex h-[34px] cursor-pointer items-center justify-center rounded-xl px-2.5 font-medium text-muted-foreground text-sm italic transition-all",
									activeView === "phrases" &&
										"bg-background text-foreground shadow-sm",
								)}
								onClick={() => setActiveView("phrases")}
							>
								Phrases
							</button>
							<button
								type="button"
								disabled={activeView === "progress"}
								className={cn(
									"flex h-[34px] cursor-pointer items-center justify-center rounded-xl px-2.5 font-medium text-muted-foreground text-sm italic transition-all",
									activeView === "progress" &&
										"bg-background text-foreground shadow-sm",
								)}
								onClick={() => setActiveView("progress")}
							>
								Progress
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
