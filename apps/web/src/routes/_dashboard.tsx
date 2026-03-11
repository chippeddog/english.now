import { useMutation } from "@tanstack/react-query";
import {
	createFileRoute,
	Outlet,
	redirect,
	useRouterState,
} from "@tanstack/react-router";
import { Loader } from "lucide-react";
import { useEffect } from "react";
import Navbar from "@/components/app/navbar";
import { getProfile } from "@/functions/get-profile";
import { getUser } from "@/functions/get-user";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_dashboard")({
	beforeLoad: async ({ context }) => {
		const session = await getUser();
		if (!session) {
			throw redirect({ to: "/login" });
		}

		const profile = await getProfile();
		if (!profile?.isOnboardingCompleted) {
			throw redirect({ to: "/onboarding" });
		}

		context.queryClient.setQueryData(
			context.trpc.profile.get.queryOptions().queryKey,
			profile,
		);

		return { session };
	},
	component: DashboardLayout,
	pendingComponent: DashboardPending,
});

function DashboardPending() {
	return (
		<div className="flex h-dvh w-full">
			<main className="relative flex h-full w-full flex-1 flex-col overflow-auto">
				<Navbar />
				<div className="flex justify-center pt-24">
					<Loader className="size-8 animate-spin text-muted-foreground" />
				</div>
			</main>
		</div>
	);
}

function DashboardLayout() {
	const trpc = useTRPC();
	const ensureTodayPlan = useMutation(
		trpc.practice.ensureTodayPlan.mutationOptions({}),
	);

	useEffect(() => {
		if (!ensureTodayPlan.isPending && !ensureTodayPlan.isSuccess) {
			ensureTodayPlan.mutate();
		}
	}, [ensureTodayPlan.isPending, ensureTodayPlan.isSuccess]);

	// const matches = useMatches();
	// const isSettingsPage = matches.some(
	// 	(match) => match.pathname === "/settings",
	// );
	// Check if we're transitioning to a different layout (like conversation)
	const isTransitioningAway = useRouterState({
		select: (s) => {
			const targetPath = s.resolvedLocation?.pathname;
			const isLeavingDashboard = targetPath?.startsWith("/conversation");
			return s.isLoading && isLeavingDashboard;
		},
	});

	if (isTransitioningAway) {
		return (
			<div className="flex h-dvh w-full items-center justify-center">
				<Loader className="size-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<div className="flex w-full bg-neutral-50 dark:bg-neutral-900">
			<main className="relative flex h-fit min-h-screen w-full flex-1 flex-col overflow-auto">
				<Navbar />
				<Outlet />
			</main>
		</div>
	);
}
