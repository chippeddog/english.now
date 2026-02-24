import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { EyeIcon, MoreHorizontalIcon, PlayIcon, TrashIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import Conversation from "@/components/practice/convesation";
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
import { cn } from "@/lib/utils";
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

function ProgressCircle({ progress }: { progress: number }) {
	const circumference = 2 * Math.PI * 18;
	const dashOffset = circumference - (progress / 100) * circumference;

	const strokeColor =
		progress >= 80
			? "text-green-500"
			: progress >= 60
				? "text-amber-500"
				: progress >= 40
					? "text-orange-500"
					: "text-red-500";

	const textColor =
		progress >= 80
			? "text-green-600"
			: progress >= 60
				? "text-amber-600"
				: progress >= 40
					? "text-orange-600"
					: "text-red-600";

	return (
		<div className="relative flex size-11 items-center justify-center">
			<svg className="size-11" viewBox="0 0 44 44" aria-hidden="true">
				<title>Unit progress</title>
				<circle
					cx="22"
					cy="22"
					r="18"
					fill="none"
					stroke="currentColor"
					strokeWidth="3.5"
					className="text-neutral-100"
				/>
				<circle
					cx="22"
					cy="22"
					r="18"
					fill="none"
					stroke="currentColor"
					strokeWidth="3.5"
					strokeLinecap="round"
					strokeDasharray={`${circumference}`}
					strokeDashoffset={dashOffset}
					transform="rotate(-90 22 22)"
					className={strokeColor}
				/>
			</svg>
			<span
				className={cn(
					"absolute font-bold text-[10px]",
					progress === 0 ? "" : textColor,
				)}
			>
				{progress === 0 ? "-" : progress}
			</span>
		</div>
	);
}

function RouteComponent() {
	const trpc = useTRPC();
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const [filter, setFilter] = useState<
		"all" | "conversation" | "pronunciation"
	>("all");

	const [deleteTarget, setDeleteTarget] = useState<{
		id: string;
		type: "conversation" | "pronunciation";
		title: string;
	} | null>(null);

	const { data: sessions, isLoading } = useQuery(
		trpc.practice.getRecentSessions.queryOptions({ limit: 10 }),
	);

	const deleteSession = useMutation(
		trpc.practice.deleteSession.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: trpc.practice.getRecentSessions.queryOptions({
						limit: 10,
					}).queryKey,
				});
				toast.success("Session deleted successfully");
				setDeleteTarget(null);
			},
			onError: () => {
				toast.error("Failed to delete session");
			},
		}),
	);

	const filteredSessions = sessions?.filter(
		(s) => filter === "all" || s.type === filter,
	);

	const hasSessions = filteredSessions && filteredSessions.length > 0;

	return (
		<div className="min-h-screen">
			<div className="container relative z-10 mx-auto max-w-5xl px-4 py-6 pt-8">
				<div className="mb-6 flex flex-col gap-1">
					<div>
						<h1 className="font-bold font-lyon text-3xl tracking-tight md:text-3xl">
							Practice
						</h1>
					</div>
				</div>

				<div className="border-border/50 border-b pb-8">
					<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
						<Conversation />
						<Pronunciation />
						<div className="group flex cursor-pointer items-center justify-center rounded-2xl border border-dashed bg-white p-3.5 opacity-50 transition-all duration-300 hover:opacity-100 dark:bg-slate-900/50">
							<div className="flex items-center gap-2">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="1rem"
									height="1rem"
									className="size-6 text-white"
									fill="none"
									viewBox="0 0 50 49"
									aria-label="Practice icon"
									role="img"
								>
									<path
										d="M49.3701 37.44C45.5301 27.97 -4.08989 27.42 0.270112 41.23C3.53011 51.58 54.8101 50.86 49.3701 37.44Z"
										fill="black"
									/>
									<path
										d="M19.1701 12.0402C16.6701 10.9202 16.3401 8.12017 17.6401 5.88017C19.3001 3.01017 23.5101 2.60017 26.4501 3.22017C28.0201 3.55017 29.6601 4.19017 30.6101 5.55017C31.6501 7.04017 31.4601 8.96017 30.6301 10.5002C28.5301 14.3802 23.8001 16.1102 21.1001 19.5202C19.8601 21.0902 18.9701 23.0302 19.4901 25.0602C20.0101 27.0902 21.6301 28.3202 23.5401 28.8202C25.4501 29.3202 26.2101 26.4102 24.3401 25.9302C22.4701 25.4502 21.9001 23.8202 22.9001 22.1402C24.1701 20.0202 26.4501 18.5502 28.3601 17.0702C31.8201 14.3802 35.6201 10.4202 33.9601 5.61017C32.5601 1.53017 28.0001 -0.0498294 24.0301 0.000170624C20.0601 0.0501706 16.3401 1.44017 14.7001 5.06017C13.0601 8.68017 13.9301 12.9502 17.6601 14.6202C19.4101 15.4002 20.9301 12.8202 19.1701 12.0302V12.0402Z"
										fill="black"
									/>
									<path
										d="M25.9596 35.6602C22.4496 36.0302 23.0796 41.4002 26.5596 40.9602C29.7196 40.4002 29.2096 35.5602 26.0196 35.6602H25.9596Z"
										fill="white"
									/>
								</svg>
								<div className="flex flex-col">
									<a
										href="mailto:support@english.now"
										className="flex items-center font-medium text-neutral-900 text-sm transition-all duration-300 group-hover:text-lime-700"
									>
										Can't find what you need?
									</a>
								</div>
							</div>
						</div>
					</div>
				</div>

				<div className="mt-6">
					<div className="mb-4 flex items-center justify-between">
						<h2 className="font-semibold text-lg">Recent Sessions</h2>
						<Select
							value={filter}
							onValueChange={(value) =>
								setFilter(value as "all" | "conversation" | "pronunciation")
							}
						>
							<SelectTrigger className="h-8 max-w-md rounded-lg bg-white px-3 py-1.5 hover:border-border/80">
								<SelectValue placeholder="Select filter" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All</SelectItem>
								<SelectItem value="conversation">Conversations</SelectItem>
								<SelectItem value="pronunciation">Pronunciations</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{isLoading ? (
						<div className="flex flex-col gap-3">
							{Array.from({ length: 5 }).map((_, index) => (
								<SessionSkeleton key={`skeleton-${index}-${Math.random()}`} />
							))}
						</div>
					) : !sessions || sessions.length === 0 ? (
						<div className="flex flex-col gap-2">
							<div className="flex items-center justify-center gap-2">
								<div className="flex flex-col items-center gap-2">
									<img src="/test.png" alt="Empty state" className="w-1/4" />
									<div className="flex flex-col items-center justify-center gap-2.5">
										<p className="font-semibold text-lg">
											You don't have records yet
										</p>
										<p className="max-w-sm text-center text-muted-foreground">
											Most people create multiple records daily to get better at
											speaking
										</p>
									</div>
								</div>
							</div>
						</div>
					) : !hasSessions ? (
						<p className="py-8 text-center text-muted-foreground text-sm">
							No {filter === "conversation" ? "conversation" : "pronunciation"}{" "}
							sessions yet.
						</p>
					) : (
						<div className="grid grid-cols-1 gap-3">
							{filteredSessions.map((session) => {
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
												<div className="flex min-w-0 flex-1 flex-col">
													<span className="truncate text-left font-medium text-sm">
														{session.title}
													</span>
													<span className="text-muted-foreground text-xs capitalize">
														{session.type}
														{session.status === "completed" && " · Completed"}
														{session.status === "active" && " · In progress"}
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
														View
													</DropdownMenuItem>
												)}
												{session.status === "active" && (
													<DropdownMenuItem>
														<PlayIcon />
														Continue
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
													Delete
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</div>
								);
							})}
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
						<AlertDialogTitle>Delete session</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete "{deleteTarget?.title}"? This
							action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
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
							{deleteSession.isPending ? "Deleting..." : "Delete"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
