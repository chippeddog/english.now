import { toString } from "hast-util-to-string";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { visit } from "unist-util-visit";

export type MarkdownHeading = {
	id: string;
	text: string;
	level: number;
};

export type MarkdownResult = {
	markup: string;
	headings: Array<MarkdownHeading>;
};

export async function renderMarkdown(content: string): Promise<MarkdownResult> {
	const headings: Array<MarkdownHeading> = [];

	const result = await unified()
		.use(remarkParse) // Parse markdown
		.use(remarkGfm) // Support GitHub Flavored Markdown
		.use(remarkRehype, { allowDangerousHtml: true }) // Convert to HTML AST
		.use(rehypeRaw) // Process raw HTML in markdown
		.use(rehypeSlug) // Add IDs to headings
		.use(rehypeAutolinkHeadings, {
			behavior: "wrap",
			properties: { className: ["anchor"] },
		})
		.use(() => (tree) => {
			// Extract headings for table of contents
			visit(tree, "element", (node: any) => {
				if (["h1", "h2", "h3", "h4", "h5", "h6"].includes(node.tagName)) {
					headings.push({
						id: node.properties?.id || "",
						text: toString(node),
						level: Number.parseInt(node.tagName.charAt(1), 10),
					});
				}
			});
		})
		.use(rehypeStringify) // Serialize to HTML string
		.process(content);

	return {
		markup: String(result),
		headings,
	};
}
