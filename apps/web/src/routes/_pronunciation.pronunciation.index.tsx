import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_pronunciation/pronunciation/")({
	beforeLoad: () => {
		throw redirect({ to: "/practice" });
	},
	component: () => null,
});
