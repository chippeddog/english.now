import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AdminMenu } from "@/components/business/admin-menu";
import {
	BusinessMobileBar,
	BusinessSidebar,
} from "@/components/business/sidebar";
import { createTitle } from "@/utils/title";

export const Route = createFileRoute("/business")({
	component: BusinessLayout,
	head: () => ({
		meta: [
			{ title: createTitle("Business") },
			{ name: "robots", content: "noindex, nofollow" },
		],
	}),
});

function BusinessLayout() {
	return (
		<div className="flex min-h-screen bg-white text-[#172033]">
			<BusinessSidebar />
			<div className="flex min-w-0 flex-1 flex-col">
				<BusinessMobileBar />
				<div className="relative flex-1">
					<div className="absolute top-5 right-6 hidden lg:block">
						<AdminMenu />
					</div>
					<main className="mx-auto w-full max-w-4xl px-4 pt-8 pb-16 sm:px-6 lg:pt-14">
						<Outlet />
					</main>
				</div>
			</div>
		</div>
	);
}
