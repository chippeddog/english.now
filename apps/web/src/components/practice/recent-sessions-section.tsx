import { Loader } from "lucide-react";
import { useTranslation } from "react-i18next";
import SessionRow, {
	type PracticeSessionItem,
} from "@/components/practice/session-row";
import SessionSkeleton from "@/components/practice/session-skeleton";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

export type RecentSessionsFilter =
	| "all"
	| "conversation"
	| "pronunciation"
	| "grammar";

const SESSION_SKELETON_KEYS = [
	"recent-session-skeleton-1",
	"recent-session-skeleton-2",
	"recent-session-skeleton-3",
	"recent-session-skeleton-4",
	"recent-session-skeleton-5",
	"recent-session-skeleton-6",
] as const;

type RecentSessionsSectionProps = {
	filter: RecentSessionsFilter;
	onFilterChange: (filter: RecentSessionsFilter) => void;
	sessions: PracticeSessionItem[];
	isLoading: boolean;
	hasNextPage: boolean;
	isFetchingNextPage: boolean;
	onLoadMore: () => void;
	onOpenSession: (session: PracticeSessionItem) => void;
	onDeleteSession: (session: PracticeSessionItem) => void;
};

export default function RecentSessionsSection({
	filter,
	onFilterChange,
	sessions,
	isLoading,
	hasNextPage,
	isFetchingNextPage,
	onLoadMore,
	onOpenSession,
	onDeleteSession,
}: RecentSessionsSectionProps) {
	const { t } = useTranslation("app");
	const hasSessions = sessions.length > 0;

	return (
		<div>
			<div className="mb-4 flex items-center justify-between">
				<h2 className="font-semibold">{t("practice.recentSessions")}</h2>
				<Select
					value={filter}
					onValueChange={(value) =>
						onFilterChange(value as RecentSessionsFilter)
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
					<SelectContent className="rounded-xl" align="end" position="popper">
						<SelectItem value="all">{t("practice.filterAll")}</SelectItem>
						<SelectItem value="conversation">
							{t("practice.filterConversations")}
						</SelectItem>
						<SelectItem value="pronunciation">
							{t("practice.filterPronunciations")}
						</SelectItem>
						<SelectItem value="grammar">{t("practice.grammar")}</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{isLoading ? (
				<div className="flex flex-col gap-3">
					{SESSION_SKELETON_KEYS.map((key) => (
						<SessionSkeleton key={key} />
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
									: filter === "grammar"
										? t("practice.grammar")
										: t("practice.pronunciation"),
						})}
					</p>
				)
			) : (
				<div className="grid grid-cols-1 gap-3">
					{sessions.map((session) => (
						<SessionRow
							key={session.id}
							session={session}
							onOpen={onOpenSession}
							onDelete={onDeleteSession}
						/>
					))}
					{hasNextPage && (
						<button
							type="button"
							className="mx-auto mt-2 flex cursor-pointer items-center gap-2 font-medium text-lime-700 text-sm underline hover:text-lime-600 hover:underline disabled:opacity-50"
							disabled={isFetchingNextPage}
							onClick={onLoadMore}
						>
							{isFetchingNextPage && (
								<Loader className="size-4 animate-spin text-lime-700" />
							)}
							{t("practice.loadMore")}
						</button>
					)}
				</div>
			)}
		</div>
	);
}
