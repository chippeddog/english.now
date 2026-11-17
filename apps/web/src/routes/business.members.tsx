import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChevronDown, Search, SearchX, UserPlus, X } from "lucide-react";
import { useState } from "react";
import { InviteDialog } from "@/components/business/invite-dialog";
import { InviteMemberCard } from "@/components/business/invite-member-card";
import { MemberCard } from "@/components/business/member-card";
import { MemberDrawer } from "@/components/business/member-drawer";
import { FilterPill, PageHeader } from "@/components/business/page-header";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	CURRENT_WORKSPACE,
	compareLevels,
	MEMBERS,
	type Member,
	type MemberStatus,
	TEAMS,
	type TeamId,
} from "@/lib/business/mock-data";
import { cn } from "@/lib/utils";
import { createTitle } from "@/utils/title";

const STATUS_FILTERS: ReadonlyArray<{
	value: MemberStatus | undefined;
	label: string;
}> = [
	{ value: undefined, label: "All" },
	{ value: "active", label: "Active" },
	{ value: "invited", label: "Invited" },
	{ value: "deactivated", label: "Deactivated" },
];

const SORT_OPTIONS = [
	{ value: "newest", label: "Newest" },
	{ value: "active", label: "Most active" },
	{ value: "level", label: "Level" },
	{ value: "name", label: "Name" },
] as const;

type MemberSort = (typeof SORT_OPTIONS)[number]["value"];

type MembersSearch = {
	status?: MemberStatus;
	team?: TeamId;
	q?: string;
	sort?: MemberSort;
	member?: string;
};

function pick<T extends string>(value: unknown, allowed: readonly T[]) {
	return allowed.find((item) => item === value);
}

export const Route = createFileRoute("/business/members")({
	validateSearch: (search: Record<string, unknown>): MembersSearch => ({
		status: pick(search.status, ["active", "invited", "deactivated"] as const),
		team: pick(
			search.team,
			TEAMS.map((team) => team.id),
		),
		q:
			typeof search.q === "string" && search.q.trim()
				? search.q.slice(0, 80)
				: undefined,
		sort: pick(
			search.sort,
			SORT_OPTIONS.map((option) => option.value),
		),
		member: typeof search.member === "string" ? search.member : undefined,
	}),
	component: MembersPage,
	head: () => ({
		meta: [{ title: createTitle("Members", "English Now Business") }],
	}),
});

function sortMembers(members: Member[], sort: MemberSort) {
	switch (sort) {
		case "active":
			return members.sort((a, b) => b.minutesThisWeek - a.minutesThisWeek);
		case "level":
			return members.sort((a, b) => compareLevels(b.level, a.level));
		case "name":
			return members.sort((a, b) => a.name.localeCompare(b.name));
		default:
			return members.sort((a, b) => a.joinedDaysAgo - b.joinedDaysAgo);
	}
}

function MembersPage() {
	const search = Route.useSearch();
	const navigate = useNavigate({ from: Route.fullPath });
	const [inviteOpen, setInviteOpen] = useState(false);
	const [searchOpen, setSearchOpen] = useState(Boolean(search.q));

	const sort = search.sort ?? "newest";
	const query = search.q?.toLowerCase() ?? "";

	function updateSearch(next: Partial<MembersSearch>) {
		navigate({
			search: (prev) => ({ ...prev, ...next }),
			replace: true,
		});
	}

	const inScope = MEMBERS.filter(
		(member) =>
			(!search.team || member.teamId === search.team) &&
			(!query ||
				member.name.toLowerCase().includes(query) ||
				member.email.includes(query) ||
				member.title.toLowerCase().includes(query)),
	);
	const visible = sortMembers(
		inScope.filter(
			(member) => !search.status || member.status === search.status,
		),
		sort,
	);
	const selected =
		MEMBERS.find((member) => member.id === search.member) ?? null;
	const hasFilters = Boolean(search.status || search.team || search.q);

	return (
		<div className="flex flex-col gap-8">
			<PageHeader
				title="Members"
				description={`Invite and track everyone learning English at ${CURRENT_WORKSPACE.name.replace(/\.$/, "")}`}
				actions={
					<Button
						onClick={() => setInviteOpen(true)}
						className="h-9 rounded-full bg-[#172033] px-4 text-white hover:bg-[#172033]/90"
					>
						<UserPlus />
						Invite members
					</Button>
				}
			/>

			<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
				<div className="flex flex-wrap items-center gap-2">
					{STATUS_FILTERS.map((filter) => (
						<FilterPill
							key={filter.label}
							active={search.status === filter.value}
							count={
								filter.value
									? inScope.filter((member) => member.status === filter.value)
											.length
									: inScope.length
							}
							onClick={() => updateSearch({ status: filter.value })}
						>
							{filter.label}
						</FilterPill>
					))}
					<Select
						value={search.team ?? "all"}
						onValueChange={(value) =>
							updateSearch({
								team: value === "all" ? undefined : (value as TeamId),
							})
						}
					>
						<SelectTrigger
							size="sm"
							className="rounded-full border-[rgba(23,32,51,0.14)] px-3.5 font-medium text-[#172033] text-[13px] shadow-none"
						>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All teams</SelectItem>
							{TEAMS.map((team) => (
								<SelectItem key={team.id} value={team.id}>
									{team.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="flex items-center gap-1">
					<div
						className={cn(
							"flex h-8 items-center rounded-full transition-[width,background-color]",
							searchOpen
								? "w-56 border border-[rgba(23,32,51,0.14)] bg-white pl-3"
								: "w-8",
						)}
					>
						{searchOpen ? (
							<>
								<Search className="size-3.5 shrink-0 text-[#5B6478]" />
								<input
									// biome-ignore lint/a11y/noAutofocus: opened by an explicit click
									autoFocus
									value={search.q ?? ""}
									onChange={(event) =>
										updateSearch({ q: event.target.value || undefined })
									}
									onKeyDown={(event) => {
										if (event.key === "Escape") {
											updateSearch({ q: undefined });
											setSearchOpen(false);
										}
									}}
									placeholder="Search members"
									aria-label="Search members"
									className="h-full min-w-0 flex-1 bg-transparent px-2 text-[#172033] text-[13px] outline-none placeholder:text-[#5B6478]/70"
								/>
								<button
									type="button"
									aria-label="Clear search"
									onClick={() => {
										updateSearch({ q: undefined });
										setSearchOpen(false);
									}}
									className="mr-1 flex size-6 cursor-pointer items-center justify-center rounded-full text-[#5B6478] hover:bg-[#F5F7FA]"
								>
									<X className="size-3.5" />
								</button>
							</>
						) : (
							<button
								type="button"
								aria-label="Search members"
								onClick={() => setSearchOpen(true)}
								className="flex size-8 cursor-pointer items-center justify-center rounded-full text-[#5B6478] hover:bg-[#F5F7FA] hover:text-[#172033]"
							>
								<Search className="size-4" />
							</button>
						)}
					</div>

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<button
								type="button"
								className="flex h-8 cursor-pointer items-center gap-1 rounded-full px-3 font-medium text-[#172033] text-[13px] hover:bg-[#F5F7FA]"
							>
								{SORT_OPTIONS.find((option) => option.value === sort)?.label}
								<ChevronDown className="size-3.5 text-[#5B6478]" />
							</button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-40">
							<DropdownMenuRadioGroup
								value={sort}
								onValueChange={(value) =>
									updateSearch({
										sort:
											value === "newest" ? undefined : (value as MemberSort),
									})
								}
							>
								{SORT_OPTIONS.map((option) => (
									<DropdownMenuRadioItem
										key={option.value}
										value={option.value}
									>
										{option.label}
									</DropdownMenuRadioItem>
								))}
							</DropdownMenuRadioGroup>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>

			{visible.length > 0 || !hasFilters ? (
				<div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-4 min-[420px]:grid-cols-2">
					{!hasFilters ? (
						<InviteMemberCard onClick={() => setInviteOpen(true)} />
					) : null}
					{visible.map((member) => (
						<MemberCard
							key={member.id}
							member={member}
							onSelect={(next) => updateSearch({ member: next.id })}
						/>
					))}
				</div>
			) : (
				<div className="flex flex-col items-center rounded-2xl border border-[rgba(23,32,51,0.14)] border-dashed px-6 py-16 text-center">
					<span className="flex size-11 items-center justify-center rounded-full bg-[#F5F7FA] text-[#5B6478]">
						<SearchX className="size-5" />
					</span>
					<div className="mt-4 font-medium text-[#172033] text-sm">
						No members match these filters
					</div>
					<p className="mt-1 text-[#5B6478] text-[13px]">
						Try another team or status, or clear the search.
					</p>
					<Button
						variant="outline"
						size="sm"
						className="mt-5 rounded-full"
						onClick={() => {
							setSearchOpen(false);
							navigate({
								search: (prev) => ({ sort: prev.sort }),
								replace: true,
							});
						}}
					>
						Clear filters
					</Button>
				</div>
			)}

			<MemberDrawer
				member={selected}
				onOpenChange={(open) => {
					if (!open) updateSearch({ member: undefined });
				}}
			/>
			<InviteDialog open={inviteOpen} onOpenChange={setInviteOpen} />
		</div>
	);
}
