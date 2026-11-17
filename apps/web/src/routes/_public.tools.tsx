import { createFileRoute } from "@tanstack/react-router";
import { PUBLIC_PAGES, seo } from "@/utils/seo";

export const Route = createFileRoute("/_public/tools")({
	component: RouteComponent,
	head: () => seo(PUBLIC_PAGES.tools),
});

function RouteComponent() {
	return (
		<div className="container relative z-10 mx-auto max-w-6xl px-4 py-2 pt-10 pb-18 md:pt-18">
			<div className="mx-auto mb-12 flex max-w-2xl flex-col items-center gap-4 text-center">
				<h1 className="font-bold font-geist-serif text-4xl tracking-tight md:text-5xl dark:text-white">
					Free English Tools
				</h1>
				<p className="mx-auto max-w-2xl text-balance text-muted-foreground">
					Simple, free tools to help you practice and improve your English every
					day.
				</p>
			</div>

			<div className="flex flex-col items-center gap-4 rounded-2xl border px-6 py-16 text-center">
				<span className="text-xl">🚧</span>
				<p className="max-w-md text-balance text-muted-foreground">
					New free tools for learners are on the way. In the meantime, start
					practicing with English Now.
				</p>
			</div>
		</div>
	);
}
