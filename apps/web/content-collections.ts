import { defineCollection, defineConfig } from "@content-collections/core";
import { z } from "zod";

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
});

export default defineConfig({
	content: [posts],
});
