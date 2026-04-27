import {
	useInfiniteQuery,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import {
	createFileRoute,
	Outlet,
	useLocation,
	useNavigate,
} from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import Conversation from "@/components/practice/conversation";
import DeleteSessionDialog, {
	type DeleteSessionTarget,
} from "@/components/practice/delete-session-dialog";
import Grammar from "@/components/practice/grammar/grammar";
import Pronunciation from "@/components/practice/pronunciation";
import RecentSessionsSection, {
	type RecentSessionsFilter,
} from "@/components/practice/recent-sessions-section";
import type { PracticeSessionItem } from "@/components/practice/session-row";
import { Separator } from "@/components/ui/separator";
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
	const location = useLocation();

	if (location.pathname !== "/practice") {
		return <Outlet />;
	}

	return <PracticeHome />;
}

function PracticeHome() {
	const trpc = useTRPC();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { t } = useTranslation("app");

	const [filter, setFilter] = useState<RecentSessionsFilter>("all");

	const [deleteTarget, setDeleteTarget] = useState<DeleteSessionTarget | null>(
		null,
	);

	const sessionsQueryOptions =
		trpc.practice.getRecentSessions.infiniteQueryOptions(
			{ limit: 10, type: filter },
			{
				getNextPageParam: (lastPage) => lastPage.nextCursor,
			},
		);

	const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
		useInfiniteQuery(sessionsQueryOptions);

	const sessions = data?.pages.flatMap((page) => page.items) ?? [];

	const deleteSession = useMutation(
		trpc.practice.deleteSession.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: sessionsQueryOptions.queryKey,
				});
				toast.success(t("practice.deleteSuccess"));
				setDeleteTarget(null);
			},
			onError: () => {
				toast.error(t("practice.deleteError"));
			},
		}),
	);

	const openSession = (session: PracticeSessionItem) => {
		if (session.type === "conversation") {
			navigate({
				to: "/conversation/$sessionId",
				params: { sessionId: session.id },
			});
		}

		if (session.type === "pronunciation") {
			navigate({
				to: "/pronunciation/$sessionId",
				params: { sessionId: session.id },
			});
		}

		if (session.type === "grammar") {
			navigate({
				to: "/grammar/$sessionId",
				params: { sessionId: session.id },
			});
		}
	};

	return (
		<div className="min-h-screen">
			<div className="container relative z-10 mx-auto max-w-5xl px-4 py-6 pb-8">
				<div className="mb-6 flex flex-col gap-1">
					<div>
						<h1 className="font-bold font-lyon text-3xl tracking-tight md:text-3xl">
							{t("practice.title")}
						</h1>
					</div>
				</div>
				<div>
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:gap-5">
						<Conversation />
						<Grammar />
						<Pronunciation />
					</div>
				</div>
				<Separator className="my-6 bg-border/50" />
				<RecentSessionsSection
					filter={filter}
					onFilterChange={setFilter}
					sessions={sessions}
					isLoading={isLoading}
					hasNextPage={hasNextPage}
					isFetchingNextPage={isFetchingNextPage}
					onLoadMore={() => fetchNextPage()}
					onOpenSession={openSession}
					onDeleteSession={(session) => {
						setDeleteTarget({
							id: session.id,
							type: session.type,
							title: session.title,
						});
					}}
				/>
			</div>
			<DeleteSessionDialog
				target={deleteTarget}
				isPending={deleteSession.isPending}
				onOpenChange={(open) => {
					if (!open) {
						setDeleteTarget(null);
					}
				}}
				onConfirm={(target) => {
					deleteSession.mutate({
						sessionId: target.id,
						type: target.type,
					});
				}}
			/>
		</div>
	);
}
