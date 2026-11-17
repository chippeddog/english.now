import { createFileRoute } from "@tanstack/react-router";
import { allPosts } from "content-collections";
import { PUBLIC_PAGES } from "@/utils/seo";

const staticPages = Object.values(PUBLIC_PAGES);

export const Route = createFileRoute("/sitemap.xml")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const BASE_URL = (
					import.meta.env.VITE_APP_URL || new URL(request.url).origin
				).replace(/\/+$/, "");
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
