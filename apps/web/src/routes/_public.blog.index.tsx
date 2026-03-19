import { createFileRoute, Link } from "@tanstack/react-router";
import { allPosts } from "content-collections";
import { formatCalendarDate } from "@/utils/date";

export const Route = createFileRoute("/_public/blog/")({
	component: RouteComponent,
});

function RouteComponent() {
	const sortedPosts = [...allPosts].sort(
		(a, b) => new Date(b.published).getTime() - new Date(a.published).getTime(),
	);

	return (
		<div className="container relative z-10 mx-auto max-w-5xl px-4 py-10 md:py-20">
			<div className="mx-auto mb-16 max-w-2xl text-center">
				<h1 className="mb-4 font-bold font-lyon text-4xl text-neutral-900 tracking-tight md:text-5xl dark:text-white">
					Blog
				</h1>
				<p className="mx-auto text-balance text-muted-foreground md:text-lg">
					Stay up to date with the latest news and updates.
				</p>
			</div>
			<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
				{sortedPosts.map((post) => (
					<Link
						to="/blog/$slug"
						params={{ slug: post.slug }}
						key={post.slug}
						className="rounded-3xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
					>
						<div className="mb-3 flex items-center gap-3 text-muted-foreground text-sm">
							<time dateTime={post.published}>
								{formatCalendarDate(post.published, {
									month: "short",
									day: "numeric",
									year: "numeric",
								})}
							</time>
							<span>•</span>
							<span>{post.readingTime} min read</span>
						</div>
						<h2 className="mb-3 font-bold text-2xl">{post.title}</h2>
						<p className="text-muted-foreground">{post.summary}</p>
					</Link>
				))}
			</div>
		</div>
	);
}
