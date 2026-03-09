import { createFileRoute, notFound } from "@tanstack/react-router";
import { allPosts } from "content-collections";

export const Route = createFileRoute("/_public/blog/$slug")({
	component: RouteComponent,
	loader: ({ params }) => {
		const post = allPosts.find((p) => p._meta.path === params.slug);
		if (!post) {
			throw notFound();
		}
		return post;
	},
});

function RouteComponent() {
	const post = Route.useLoaderData();
	return (
		<div className="container relative mx-auto max-w-5xl px-4 py-16">
			<article>
				<header>
					<h1>{post.title}</h1>
					<p>{post.summary}</p>
				</header>
			</article>
		</div>
	);
}
