import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getUser } from "@/functions/get-user";
import { createTitle } from "@/utils/title";

export const Route = createFileRoute("/_dashboard/practice/grammar")({
	beforeLoad: async ({ location }) => {
		const session = await getUser();
		if (!session) {
			throw redirect({
				to: "/login",
			});
		}

		const normalized = location.pathname.replace(/\/+$/, "");
		if (normalized === "/practice/grammar") {
			throw redirect({
				to: "/practice",
			});
		}

		return { session };
	},
	component: GrammarLayout,
	head: () => ({
		meta: [
			{
				title: createTitle("Grammar"),
			},
		],
	}),
});

function GrammarLayout() {
	return <Outlet />;
}
