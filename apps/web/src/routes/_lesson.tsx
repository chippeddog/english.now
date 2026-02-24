import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import Logo from "@/components/logo";
import { getUser } from "@/functions/get-user";

export const Route = createFileRoute("/_lesson")({
	beforeLoad: async () => {
		const session = await getUser();
		if (!session) {
			throw redirect({ to: "/login" });
		}
		return { session };
	},
	component: LessonLayout,
	pendingComponent: LessonPending,
});

function LessonPending() {
	return (
		<div className="flex h-dvh w-full items-center justify-center">
			<Loader2 className="size-8 animate-spin text-muted-foreground" />
		</div>
	);
}

function LessonLayout() {
	return (
		<div className="flex min-h-dvh w-full bg-neutral-50 dark:bg-neutral-900">
			<main className="relative flex h-full w-full flex-1 flex-col overflow-auto">
				<div className="sticky top-0 z-10 border-black/5 border-b bg-white dark:bg-neutral-900">
					<div className="container relative z-10 mx-auto max-w-3xl px-4">
						<nav className="flex items-center justify-between py-5">
							<Logo link="/lessons" />
						</nav>
					</div>
				</div>
				<Outlet />
			</main>
		</div>
	);
}
