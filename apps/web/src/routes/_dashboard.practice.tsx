import {
	useInfiniteQuery,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
	EyeIcon,
	Loader,
	MoreHorizontalIcon,
	PlayIcon,
	TrashIcon,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import CantFind from "@/components/practice/cant-find";
import Conversation from "@/components/practice/convesation";
import ProgressCircle from "@/components/practice/progress-circle";
import Pronunciation from "@/components/practice/pronunciation";
import SessionSkeleton from "@/components/practice/session-skeleton";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { formatRelativeDate } from "@/utils/date";
import { createTitle, PAGE_TITLE } from "@/utils/title";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_dashboard/practice")({
	component: RouteComponent,
	head: () => ({
		meta: [
			{
				title: createTitle(PAGE_TITLE.practice),
			},
		],
	}),
});

function RouteComponent() {
	const trpc = useTRPC();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { t } = useTranslation("app");

	const [filter, setFilter] = useState<
		"all" | "conversation" | "pronunciation"
	>("all");

	const [deleteTarget, setDeleteTarget] = useState<{
		id: string;
		type: "conversation" | "pronunciation";
		title: string;
	} | null>(null);

	const sessionsQueryOptions =
		trpc.practice.getRecentSessions.infiniteQueryOptions(
			{ limit: 10, type: filter },
			{
				getNextPageParam: (lastPage) => lastPage.nextCursor,
			},
		);

	const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
		useInfiniteQuery(sessionsQueryOptions);

	const sessions = data?.pages.flatMap((page) => page.items);

	const deleteSession = useMutation(
		trpc.practice.deleteSession.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: sessionsQueryOptions.queryKey,
				});
				toast.success("Session deleted successfully");
				setDeleteTarget(null);
			},
			onError: () => {
				toast.error("Failed to delete session");
			},
		}),
	);

	const hasSessions = sessions && sessions.length > 0;

	return (
		<div className="min-h-screen">
			<div className="container relative z-10 mx-auto max-w-5xl px-4 py-6 pt-8">
				<div className="mb-6 flex flex-col gap-1">
					<div>
						<h1 className="font-bold font-lyon text-3xl tracking-tight md:text-3xl">
							{t("practice.title")}
						</h1>
					</div>
				</div>
				<div className="border-border/50 border-b pb-8">
					<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
						<Conversation />
						<Pronunciation />
						<CantFind />
					</div>
				</div>
				<div className="mt-6">
					<div className="mb-4 flex items-center justify-between">
						<h2 className="font-semibold text-lg">
							{t("practice.recentSessions")}
						</h2>
						<Select
							value={filter}
							onValueChange={(value) =>
								setFilter(value as "all" | "conversation" | "pronunciation")
							}
						>
							<SelectTrigger
								disabled={isLoading}
								className="h-8 max-w-md rounded-xl bg-white px-3 py-1.5 italic hover:border-border/80"
							>
								<SelectValue
									defaultValue="all"
									placeholder={t("practice.filterAll")}
								/>
							</SelectTrigger>
							<SelectContent
								className="rounded-xl"
								align="end"
								position="popper"
							>
								<SelectItem value="all">{t("practice.filterAll")}</SelectItem>
								<SelectItem value="conversation">
									{t("practice.filterConversations")}
								</SelectItem>
								<SelectItem value="pronunciation">
									{t("practice.filterPronunciations")}
								</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{isLoading ? (
						<div className="flex flex-col gap-3">
							{Array.from({ length: 6 }).map((_, index) => (
								<SessionSkeleton key={`skeleton-${index}-${Math.random()}`} />
							))}
						</div>
					) : !hasSessions ? (
						filter === "all" ? (
							<div className="flex flex-col gap-2">
								<div className="flex items-center justify-center gap-2">
									<div className="flex flex-col items-center gap-2">
										<img src="/test.png" alt="Empty state" className="w-1/4" />
										<div className="flex flex-col items-center justify-center gap-2.5">
											<p className="font-semibold text-lg">
												{t("practice.emptyTitle")}
											</p>
											<p className="max-w-sm text-center text-muted-foreground">
												{t("practice.emptyDescription")}
											</p>
										</div>
									</div>
								</div>
							</div>
						) : (
							<p className="py-8 text-center text-muted-foreground">
								{t("practice.noSessionsYet", {
									type:
										filter === "conversation"
											? t("practice.conversation")
											: t("practice.pronunciation"),
								})}
							</p>
						)
					) : (
						<div className="grid grid-cols-1 gap-3">
							{sessions.map((session) => {
								const isConversation = session.type === "conversation";
								const isPronunciation = session.type === "pronunciation";

								return (
									<div
										key={session.id}
										className="group flex w-full items-center gap-3 rounded-2xl border border-border/50 bg-white p-2.5 pr-3 text-left transition-colors hover:border-border/80 hover:shadow-xs"
									>
										<button
											type="button"
											onClick={() => {
												if (isConversation) {
													navigate({
														to: "/conversation/$sessionId",
														params: { sessionId: session.id },
													});
												}
												if (isPronunciation) {
													navigate({
														to: "/pronunciation/$sessionId",
														params: { sessionId: session.id },
													});
												}
											}}
											className="flex min-w-0 flex-1 cursor-pointer items-center justify-between gap-3"
										>
											<div className="flex items-center gap-2">
												<ProgressCircle progress={session.score ?? 0} />
												<div className="flex min-w-0 flex-1 flex-col items-start">
													<span className="truncate text-left font-medium text-sm">
														{session.title}
													</span>
													<span className="text-muted-foreground text-xs capitalize">
														{session.type}
														{session.status === "completed" &&
															" · " + t("practice.completed")}
														{session.status === "active" &&
															" · " + t("practice.inProgress")}
													</span>
												</div>
											</div>

											<span className="shrink-0 text-muted-foreground text-xs">
												{formatRelativeDate(new Date(session.createdAt))}
											</span>
										</button>

										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button
													className="size-6 hover:bg-neutral-100"
													variant="ghost"
													size="icon"
												>
													<MoreHorizontalIcon className="size-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												{session.status === "completed" && (
													<DropdownMenuItem>
														<EyeIcon />
														{t("practice.view")}
													</DropdownMenuItem>
												)}
												{session.status === "active" && (
													<DropdownMenuItem>
														<PlayIcon />
														{t("practice.continue")}
													</DropdownMenuItem>
												)}
												<DropdownMenuItem
													variant="destructive"
													onClick={() => {
														setDeleteTarget({
															id: session.id,
															type: session.type,
															title: session.title,
														});
													}}
												>
													<TrashIcon />
													{t("practice.delete")}
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</div>
								);
							})}

							{hasNextPage && (
								<button
									type="button"
									className="mx-auto mt-2 flex cursor-pointer items-center gap-2 font-medium text-lime-700 text-sm underline hover:text-lime-600 hover:underline disabled:opacity-50"
									disabled={isFetchingNextPage}
									onClick={() => fetchNextPage()}
								>
									{isFetchingNextPage && (
										<Loader className="size-4 animate-spin text-lime-700" />
									)}
									Load more
								</button>
							)}
						</div>
					)}
				</div>
			</div>
			<AlertDialog
				open={deleteTarget !== null}
				onOpenChange={(open) => {
					if (!open) setDeleteTarget(null);
				}}
			>
				<AlertDialogContent className="w-sm">
					<AlertDialogHeader>
						<AlertDialogTitle>{t("practice.deleteSession")}</AlertDialogTitle>
						<AlertDialogDescription>
							{t("practice.deleteConfirmation", {
								title: deleteTarget?.title,
							})}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t("practice.cancel")}</AlertDialogCancel>
						<AlertDialogAction
							variant="destructive"
							disabled={deleteSession.isPending}
							onClick={() => {
								if (deleteTarget) {
									deleteSession.mutate({
										sessionId: deleteTarget.id,
										type: deleteTarget.type,
									});
								}
							}}
						>
							{deleteSession.isPending
								? t("practice.deleting")
								: t("practice.delete")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
