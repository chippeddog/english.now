import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import ReportIssueDialog from "@/components/conversation/report-issue-dialog";
import Logo from "@/components/logo";
import { getUser } from "@/functions/get-user";

export const Route = createFileRoute("/_conversation")({
	beforeLoad: async () => {
		const session = await getUser();
		if (!session) {
			throw redirect({
				to: "/login",
			});
		}
		return { session };
	},
	component: ConversationLayout,
	pendingComponent: ConversationPending,
});

function ConversationPending() {
	return (
		<div className="flex h-dvh w-full items-center justify-center">
			<Loader2 className="size-8 animate-spin text-muted-foreground" />
		</div>
	);
}

function ConversationLayout() {
	return (
		<div className="flex h-dvh w-full bg-neutral-50 dark:bg-neutral-900">
			<main className="relative flex h-full w-full flex-1 flex-col overflow-auto">
				<div className="sticky border-black/5 border-b bg-white">
					<div className="container relative z-10 mx-auto max-w-3xl px-4">
						<nav className="flex grid-cols-2 items-center justify-between py-5 md:grid-cols-5">
							<div className="items-center gap-2 md:flex">
								<Logo />
							</div>
							<ReportIssueDialog />
						</nav>
					</div>
				</div>
				<Outlet />
			</main>
		</div>
	);
}
