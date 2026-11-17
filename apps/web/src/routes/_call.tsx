import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { Loader } from "lucide-react";
import { getUser } from "@/functions/get-user";

export const Route = createFileRoute("/_call")({
	beforeLoad: async () => {
		const session = await getUser();
		if (!session) {
			throw redirect({
				to: "/login",
			});
		}
		return { session };
	},
	component: CallLayout,
	pendingComponent: CallPending,
});

function CallPending() {
	return (
		<div className="flex h-dvh w-full items-center justify-center bg-[#172033]">
			<Loader className="size-5 animate-spin text-white/60" />
		</div>
	);
}

function CallLayout() {
	return (
		<div className="flex h-dvh w-full bg-[#172033] text-white">
			<main className="relative flex h-full w-full flex-1 flex-col overflow-hidden">
				<Outlet />
			</main>
		</div>
	);
}
