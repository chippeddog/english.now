import { env } from "@english.now/env/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, MessageCircleIcon, PlusIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/utils/trpc";

type TopicItem = {
	id: string;
	name: string;
	icon: string;
	description: string;
};
type RoleplayItem = {
	id: string;
	name: string;
	icon: string;
	description: string;
	aiRole: string;
};

function SkeletonCard() {
	return (
		<div className="flex h-12 animate-pulse items-center justify-center gap-2 rounded-xl border border-transparent bg-neutral-100" />
	);
}

function DialogTopics({
	open,
	setOpen,
}: {
	open: boolean;
	setOpen: (open: boolean) => void;
}) {
	const navigate = useNavigate();
	const trpc = useTRPC();
	const queryClient = useQueryClient();

	const [selectedScenario, setSelectedScenario] = useState<string>("");
	const [selectedMeta, setSelectedMeta] = useState<{
		name: string;
		description?: string;
		aiRole?: string;
		scenarioType?: "topic" | "roleplay";
	} | null>(null);

	// Fetch personalized suggestions
	const { data: suggestionsData, isLoading: isSuggestionsLoading } = useQuery({
		...trpc.conversation.getSuggestions.queryOptions(),
		enabled: open,
	});

	// Regenerate suggestions mutation
	const regenerateMutation = useMutation(
		trpc.conversation.regenerateSuggestions.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: trpc.conversation.getSuggestions.queryKey(),
				});
			},
		}),
	);

	// Auto-regenerate when suggestions are stale
	useEffect(() => {
		if (
			suggestionsData?.isStale &&
			!regenerateMutation.isPending &&
			!regenerateMutation.isSuccess
		) {
			regenerateMutation.mutate();
		}
	}, [
		suggestionsData?.isStale,
		regenerateMutation.isPending,
		regenerateMutation.isSuccess,
	]);

	const isGenerating = regenerateMutation.isPending || isSuggestionsLoading;

	const topics: TopicItem[] = regenerateMutation.isSuccess
		? (regenerateMutation.data?.topics ?? [])
		: (suggestionsData?.topics ?? []);

	const roleplays: RoleplayItem[] = regenerateMutation.isSuccess
		? (regenerateMutation.data?.roleplays ?? [])
		: (suggestionsData?.roleplays ?? []);

	const hasContent = topics.length > 0 && roleplays.length > 0;

	// Start conversation with selected scenario
	const startConversation = useMutation({
		mutationFn: async (input: {
			scenario: string;
			scenarioName?: string;
			scenarioDescription?: string;
			aiRole?: string;
			scenarioType?: "topic" | "roleplay";
		}) => {
			const response = await fetch(
				`${env.VITE_SERVER_URL}/api/conversation/start`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					credentials: "include",
					body: JSON.stringify(input),
				},
			);
			if (!response.ok) throw new Error("Failed to start conversation");
			return response.json() as Promise<{ sessionId: string }>;
		},
		onSuccess: (data) => {
			setOpen(false);
			navigate({
				to: "/conversation/$sessionId",
				params: { sessionId: data.sessionId },
			});
		},
	});

	const handleStartConversation = () => {
		if (selectedScenario) {
			startConversation.mutate({
				scenario: selectedScenario,
				scenarioName: selectedMeta?.name,
				scenarioDescription: selectedMeta?.description,
				aiRole: selectedMeta?.aiRole,
				scenarioType: selectedMeta?.scenarioType,
			});
		}
	};

	const handleSelectTopic = (topic: TopicItem) => {
		setSelectedScenario(topic.id);
		setSelectedMeta({
			name: topic.name,
			description: topic.description,
			scenarioType: "topic",
		});
	};

	const handleSelectRoleplay = (roleplay: RoleplayItem) => {
		setSelectedScenario(roleplay.id);
		setSelectedMeta({
			name: roleplay.name,
			description: roleplay.description,
			aiRole: roleplay.aiRole,
			scenarioType: "roleplay",
		});
	};

	// const handleRefresh = () => {
	// 	setSelectedScenario("");
	// 	setSelectedMeta(null);
	// 	regenerateMutation.mutate();
	// };

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent showCloseButton={false}>
				<div className="mb-3 flex flex-col gap-2 text-center">
					<h1 className="font-bold font-lyon text-3xl tracking-tight">
						What would you like to talk about?
					</h1>
					<p className="text-muted-foreground text-sm">
						Personalized topics refreshed daily just for you
					</p>
				</div>

				<div className="flex items-center justify-between">
					<h2 className="font-semibold text-sm italic">Topics</h2>
					<button
						type="button"
						className="relative flex size-6 shrink-0 cursor-pointer items-center justify-center gap-1.5 overflow-hidden whitespace-nowrap rounded-lg bg-linear-to-t from-[#202020] to-[#2F2F2F] font-base text-white shadow-[inset_0_1px_4px_0_rgba(255,255,255,0.4)] outline-none backdrop-blur transition-all hover:opacity-90 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-40 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:from-[rgb(192,192,192)] dark:to-[rgb(255,255,255)] dark:shadow-[inset_0_1px_4px_0_rgba(128,128,128,0.2)] dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none"
					>
						<PlusIcon className="size-4" />
					</button>
					{/* <button
						type="button"
						onClick={handleRefresh}
						disabled={isGenerating}
						className="relative flex size-6 shrink-0 cursor-pointer items-center justify-center gap-1.5 overflow-hidden whitespace-nowrap rounded-lg bg-linear-to-t from-[#202020] to-[#2F2F2F] font-base text-white shadow-[inset_0_1px_4px_0_rgba(255,255,255,0.4)] outline-none backdrop-blur transition-all hover:opacity-90 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-40 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:from-[rgb(192,192,192)] dark:to-[rgb(255,255,255)] dark:shadow-[inset_0_1px_4px_0_rgba(128,128,128,0.2)] dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none"
					>
						<RefreshCwIcon
							className={cn("size-3.5", isGenerating && "animate-spin")}
						/>
					</button> */}
				</div>
				<div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
					{isGenerating && !hasContent ? (
						<>
							<SkeletonCard />
							<SkeletonCard />
							<SkeletonCard />
							<SkeletonCard />
							<SkeletonCard />
							<SkeletonCard />
						</>
					) : (
						topics.map((topic) => (
							<button
								key={topic.id}
								type="button"
								onClick={() => handleSelectTopic(topic)}
								className={cn(
									"flex items-center justify-center gap-2 rounded-xl border p-2.5 px-2 text-center transition-all hover:border-border/50 hover:bg-neutral-100",
									selectedScenario === topic.id
										? "border-lime-500 bg-lime-100 hover:border-lime-500 hover:bg-lime-100"
										: "border-transparent bg-neutral-50",
								)}
							>
								<span className="sm:text-xl">{topic.icon}</span>
								<span className="font-medium text-xs sm:text-sm">
									{topic.name}
								</span>
							</button>
						))
					)}
				</div>
				<hr className="my-1.5 border-neutral-200 border-dashed" />
				<div className="flex items-center justify-between">
					<h2 className="font-semibold text-sm italic">Role-plays</h2>
					<button
						type="button"
						className="relative flex size-6 shrink-0 cursor-pointer items-center justify-center gap-1.5 overflow-hidden whitespace-nowrap rounded-lg bg-linear-to-t from-[#202020] to-[#2F2F2F] font-base text-white shadow-[inset_0_1px_4px_0_rgba(255,255,255,0.4)] outline-none backdrop-blur transition-all hover:opacity-90 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-40 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:from-[rgb(192,192,192)] dark:to-[rgb(255,255,255)] dark:shadow-[inset_0_1px_4px_0_rgba(128,128,128,0.2)] dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none"
					>
						<PlusIcon className="size-4" />
					</button>
				</div>
				<div className="grid grid-cols-2 gap-2 sm:grid-cols-2">
					{isGenerating && !hasContent ? (
						<>
							<SkeletonCard />
							<SkeletonCard />
							<SkeletonCard />
							<SkeletonCard />
						</>
					) : (
						roleplays.map((roleplay) => (
							<button
								key={roleplay.id}
								type="button"
								onClick={() => handleSelectRoleplay(roleplay)}
								className={cn(
									"flex items-center justify-center gap-2 rounded-xl border p-2.5 px-2 text-center transition-all hover:border-border/50 hover:bg-neutral-100",
									selectedScenario === roleplay.id
										? "border-lime-500 bg-lime-100 hover:border-lime-500 hover:bg-lime-100"
										: "border-transparent bg-neutral-50",
								)}
							>
								<span className="sm:text-xl">{roleplay.icon}</span>
								<span className="font-medium text-xs sm:text-sm">
									{roleplay.name}
								</span>
							</button>
						))
					)}
				</div>

				<DialogFooter className="mt-3">
					<DialogClose asChild>
						<Button
							variant="ghost"
							className="flex-1 rounded-xl italic sm:flex-none"
						>
							Cancel
						</Button>
					</DialogClose>
					<Button
						onClick={handleStartConversation}
						disabled={!selectedScenario || startConversation.isPending}
						className="relative flex shrink-0 cursor-pointer items-center justify-center gap-1.5 overflow-hidden whitespace-nowrap rounded-xl bg-linear-to-t from-[#202020] to-[#2F2F2F] font-base text-white italic shadow-[inset_0_1px_4px_0_rgba(255,255,255,0.4)] outline-none backdrop-blur transition-all hover:opacity-90 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-40 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:from-[rgb(192,192,192)] dark:to-[rgb(255,255,255)] dark:shadow-[inset_0_1px_4px_0_rgba(128,128,128,0.2)] dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none"
					>
						{startConversation.isPending && (
							<Loader2 className="size-5 animate-spin" />
						)}
						Start Conversation
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export default function Conversation() {
	const [dialogOpen, setDialogOpen] = useState(false);
	const { t } = useTranslation("app");
	return (
		<div
			className="overflow-hidden rounded-[1.2rem] bg-white"
			style={{
				boxShadow:
					"0 0 0 1px rgba(0,0,0,.05),0 10px 10px -5px rgba(0,0,0,.04),0 20px 25px -5px rgba(0,0,0,.04),0 20px 32px -12px rgba(0,0,0,.04)",
			}}
		>
			<DialogTopics open={dialogOpen} setOpen={setDialogOpen} />
			<div className="p-0">
				<button
					type="button"
					onClick={() => setDialogOpen(true)}
					className="group flex w-full cursor-pointer items-center justify-between p-3.5 transition-colors duration-300 hover:bg-neutral-100"
				>
					<div className="flex items-center gap-3">
						<div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[#C6F64D] bg-radial from-[#EFFF9B] to-[#D8FF76]">
							<MessageCircleIcon className="size-5 text-lime-700" />
						</div>
						<div className="text-left">
							<h2 className="font-medium text-slate-900">
								{t("practice.conversation")}
							</h2>
							<p className="text-muted-foreground text-sm">
								{t("practice.practiceYourEnglish")}
							</p>
						</div>
					</div>
					<svg
						className="relative size-5 text-gray-400 transition-all duration-300 group-hover:text-gray-500"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						aria-hidden="true"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M9 5l7 7-7 7"
						/>
					</svg>
				</button>
			</div>
		</div>
	);
}
