import { createFileRoute } from "@tanstack/react-router";
import { allPosts } from "content-collections";

const BASE_URL = "https://english.now";

const staticPages = [
	{ path: "/", changefreq: "weekly", priority: "1.0" },
	{ path: "/about", changefreq: "monthly", priority: "0.8" },
	{ path: "/features", changefreq: "monthly", priority: "0.8" },
	{ path: "/pricing", changefreq: "monthly", priority: "0.8" },
	{ path: "/blog", changefreq: "weekly", priority: "0.7" },
	{ path: "/privacy", changefreq: "yearly", priority: "0.3" },
	{ path: "/terms", changefreq: "yearly", priority: "0.3" },
	{ path: "/refund", changefreq: "yearly", priority: "0.3" },
];

export const Route = createFileRoute("/sitemap.xml")({
	server: {
		handlers: {
			GET: async () => {
				const staticEntries = staticPages
					.map(
						(page) => `  <url>
    <loc>${BASE_URL}${page.path}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`,
					)
					.join("\n");

				const blogEntries = allPosts
					.map(
						(post) => `  <url>
    <loc>${BASE_URL}/blog/${post.slug}</loc>
    <lastmod>${post.published}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`,
					)
					.join("\n");

				const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticEntries}
${blogEntries}
</urlset>`;

				return new Response(sitemap, {
					headers: {
						"Content-Type": "application/xml",
						"Cache-Control": "public, max-age=3600",
					},
				});
			},
		},
	},
});
