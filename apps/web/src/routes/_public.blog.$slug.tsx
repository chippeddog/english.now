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
		<article>
			<header>
				<h1>{post.title}</h1>
				<p>{post.summary}</p>
			</header>
		</article>
	);
}
