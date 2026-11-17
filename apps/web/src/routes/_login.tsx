import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getUser } from "@/functions/get-user";

export const Route = createFileRoute("/_login")({
	beforeLoad: async () => {
		const session = await getUser();
		if (session) {
			throw redirect({
				to: "/home",
			});
		}
	},
	component: LoginLayout,
});

function LoginLayout() {
	return (
		<div className="flex min-h-screen flex-col">
			<div className="flex size-full flex-1 items-center justify-center bg-neutral-50 dark:bg-neutral-900">
				<Outlet />
			</div>
		</div>
	);
}
