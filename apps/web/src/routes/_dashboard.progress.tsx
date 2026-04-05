import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_dashboard/progress")({
	component: RouteComponent,
});

function RouteComponent() {
	return <div>Hello "/_dashboard/progress"!</div>;
}
