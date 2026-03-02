import { createFileRoute, Link } from "@tanstack/react-router";
import { allPosts } from "content-collections";

export const Route = createFileRoute("/_public/blog/")({
	component: RouteComponent,
});

function RouteComponent() {
	const sortedPosts = allPosts.sort(
		(a, b) => new Date(b.published).getTime() - new Date(a.published).getTime(),
	);

	return (
		<div className="relative">
			<div className="container relative mx-auto max-w-5xl px-4 py-16">
				<div className="mb-16 text-center">
					<h1 className="mb-4 font-bold font-lyon text-4xl tracking-tight md:text-5xl lg:text-6xl">
						Blog
					</h1>
					<p className="mx-auto max-w-2xl text-lg text-muted-foreground">
						Stay up to date with the latest news and updates.
					</p>
				</div>
				<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
					{sortedPosts.map((post) => (
						<Link
							to="/blog/$slug"
							params={{ slug: post._meta.path }}
							key={post._meta.path}
						>
							<h2 className="font-bold text-2xl">{post.title}</h2>
							<p className="text-muted-foreground">{post.summary}</p>
						</Link>
					))}
				</div>
			</div>
		</div>
	);
}
