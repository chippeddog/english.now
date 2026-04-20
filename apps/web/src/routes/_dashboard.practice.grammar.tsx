import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getUser } from "@/functions/get-user";
import { createTitle } from "@/utils/title";

export const Route = createFileRoute("/_dashboard/practice/grammar")({
	beforeLoad: async () => {
		const session = await getUser();
		if (!session) {
			throw redirect({
				to: "/login",
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
