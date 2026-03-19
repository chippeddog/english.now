import parse, { Element, type HTMLReactParserOptions } from "html-react-parser";

type MarkdownProps = {
	html: string;
	className?: string;
};

export function Markdown({ html, className }: MarkdownProps) {
	const options: HTMLReactParserOptions = {
		replace: (domNode) => {
			if (domNode instanceof Element) {
				if (domNode.name === "img") {
					return (
						<img
							{...domNode.attribs}
							loading="lazy"
							alt={domNode.attribs.alt}
							className="rounded-lg shadow-md"
						/>
					);
				}
			}
		},
	};

	return <div className={className}>{parse(html, options)}</div>;
}
