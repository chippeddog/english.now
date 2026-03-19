import { defineCollection, defineConfig } from "@content-collections/core";
import { z } from "zod";
import { renderMarkdown } from "./src/utils/markdown";

function getReadingTime(content: string) {
	const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
	return Math.max(1, Math.ceil(wordCount / 200));
}

const posts = defineCollection({
	name: "posts",
	directory: "./src/content/blog",
	include: "**/*.md",
	schema: z.object({
		title: z.string(),
		summary: z.string(),
		published: z.string().date(),
		content: z.string(),
	}),
	transform: async (document, context) => {
		const rendered = await context.cache(document.content, renderMarkdown);

		return {
			...document,
			slug: document._meta.path,
			html: rendered.markup,
			headings: rendered.headings,
			readingTime: getReadingTime(document.content),
		};
	},
});

export default defineConfig({
	content: [posts],
});
