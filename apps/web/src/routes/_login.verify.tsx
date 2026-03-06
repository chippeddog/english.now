import { createFileRoute, redirect } from "@tanstack/react-router";
import VerifyForm from "@/components/auth/verify-form";
import { createTitle, PAGE_TITLE } from "@/utils/title";

type VerifySearch = {
	email?: string;
};

export const Route = createFileRoute("/_login/verify")({
	validateSearch: (search: Record<string, unknown>): VerifySearch => ({
		email: typeof search.email === "string" ? search.email : undefined,
	}),
	beforeLoad: ({ search }) => {
		if (!search.email) {
			throw redirect({ to: "/login" });
		}
	},
	component: RouteComponent,
	head: () => ({
		meta: [
			{
				title: createTitle(PAGE_TITLE.verifyEmail),
			},
		],
	}),
});

function RouteComponent() {
	return <VerifyForm email={Route.useSearch().email as string} />;
}
