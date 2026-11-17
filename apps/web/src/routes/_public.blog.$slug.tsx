import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { allPosts } from "content-collections";
import { Markdown } from "@/components/Markdown";
import { formatCalendarDate } from "@/utils/date";
import {
	absoluteUrl,
	breadcrumbSchema,
	jsonLd,
	organizationSchema,
	PUBLIC_PAGES,
	seo,
} from "@/utils/seo";
import { createTitle } from "@/utils/title";

export const Route = createFileRoute("/_public/blog/$slug")({
	component: RouteComponent,
	loader: ({ params }) => {
		const post = allPosts.find((p) => p.slug === params.slug);
		if (!post) {
			throw notFound();
		}
		return post;
	},
	head: ({ loaderData: post }) => {
		if (!post) return {};

		const path = `/blog/${post.slug}`;

		return {
			...seo({
				title: createTitle(post.title),
				description: post.summary,
				path,
				type: "article",
				publishedTime: post.published,
			}),
			scripts: [
				jsonLd({
					"@type": "BlogPosting",
					headline: post.title,
					description: post.summary,
					datePublished: post.published,
					url: absoluteUrl(path),
					mainEntityOfPage: absoluteUrl(path),
					image: absoluteUrl("/og-image.png"),
					wordCount: post.content.trim().split(/\s+/).length,
					author: organizationSchema,
					publisher: organizationSchema,
				}),
				jsonLd(
					breadcrumbSchema([
						{ name: PUBLIC_PAGES.home.name, path: PUBLIC_PAGES.home.path },
						{ name: PUBLIC_PAGES.blog.name, path: PUBLIC_PAGES.blog.path },
						{ name: post.title, path },
					]),
				),
			],
		};
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
					className="typeset typeset-docs max-w-[37em]"
				/>
			</article>
		</div>
	);
}
