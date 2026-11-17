import { createFileRoute } from "@tanstack/react-router";
import { BookDemoCalendar } from "@/components/for-business/book-demo-calendar";
import { PUBLIC_PAGES, seo } from "@/utils/seo";

export const Route = createFileRoute("/_public/book-a-demo")({
	component: BookADemoPage,
	head: () => seo(PUBLIC_PAGES.bookADemo),
});

function BookADemoPage() {
	return (
		<div className="bg-white text-[#172033]">
			<section className="container mx-auto max-w-6xl px-4 pt-14 pb-16 md:pt-20 md:pb-24">
				<div className="gap-10">
					<div className="mx-auto mb-10 max-w-2xl text-center md:mb-14">
						<h1 className="mb-5 font-bold font-geist-serif text-4xl text-neutral-900 tracking-tight md:text-5xl dark:text-white">
							Book a demo
						</h1>
						<p className="mx-auto mt-5 max-w-[40ch] text-[#5B6478] text-lg leading-[1.55]">
							Pick a time for an intro call. We'll look at the teams you want to
							train and what a first pilot includes.
						</p>
					</div>

					<div>
						<BookDemoCalendar />
					</div>
				</div>
			</section>
		</div>
	);
}
