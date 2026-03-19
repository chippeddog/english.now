import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { allPosts } from "content-collections";
import { Markdown } from "@/components/Markdown";
import { formatCalendarDate } from "@/utils/date";

export const Route = createFileRoute("/_public/blog/$slug")({
	component: RouteComponent,
	loader: ({ params }) => {
		const post = allPosts.find((p) => p.slug === params.slug);
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
			<div className="mb-8">
				<Link
					to="/blog"
					className="text-muted-foreground transition-colors hover:text-foreground"
				>
					Back to blog
				</Link>
			</div>

			<article className="mx-auto max-w-3xl">
				<header className="mb-10 border-border border-b pb-8">
					<div className="mb-4 flex flex-wrap items-center gap-3 text-muted-foreground text-sm">
						<time dateTime={post.published}>
							{formatCalendarDate(post.published, {
								month: "long",
								day: "numeric",
								year: "numeric",
							})}
						</time>
						<span>•</span>
						<span>{post.readingTime} min read</span>
					</div>
					<h1 className="mb-4 font-bold font-lyon text-4xl tracking-tight md:text-5xl">
						{post.title}
					</h1>
					<p className="max-w-2xl text-balance text-lg text-muted-foreground">
						{post.summary}
					</p>
				</header>

				{post.headings.length > 1 ? (
					<nav className="mb-10 rounded-2xl border border-border bg-muted/40 p-5">
						<p className="mb-3 font-medium text-muted-foreground text-sm uppercase tracking-wide">
							On this page
						</p>
						<div className="flex flex-col gap-2">
							{post.headings
								.filter((heading) => heading.level >= 2)
								.map((heading) => (
									<a
										href={`#${heading.id}`}
										key={heading.id}
										className="text-muted-foreground transition-colors hover:text-foreground"
									>
										{heading.text}
									</a>
								))}
						</div>
					</nav>
				) : null}

				<Markdown
					html={post.html}
					className="text-base text-foreground leading-8 [&_.anchor]:no-underline [&_a]:text-primary [&_a]:underline-offset-4 hover:[&_a]:underline [&_blockquote]:border-primary [&_blockquote]:border-l-2 [&_blockquote]:pl-4 [&_h1]:mt-12 [&_h1]:mb-5 [&_h1]:font-bold [&_h1]:font-lyon [&_h1]:text-4xl [&_h2]:mt-12 [&_h2]:mb-4 [&_h2]:font-lyon [&_h2]:font-semibold [&_h2]:text-3xl [&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:font-semibold [&_h3]:text-2xl [&_li]:mb-2 [&_ol]:my-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-5 [&_pre]:my-6 [&_pre]:overflow-x-auto [&_pre]:rounded-2xl [&_pre]:bg-muted [&_pre]:p-4 [&_strong]:font-semibold [&_ul]:my-6 [&_ul]:list-disc [&_ul]:pl-6"
				/>
			</article>
		</div>
	);
}
