import { cn } from "@/lib/utils";

type ExampleBubbleProps = {
	sentence: string;
	highlight: string;
	note?: string;
	className?: string;
};

function escapeForRegExp(value: string) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default function ExampleBubble({
	sentence,
	highlight,
	note,
	className,
}: ExampleBubbleProps) {
	return (
		<div
			className={cn(
				"rounded-2xl border border-violet-200/70 bg-violet-50/70 px-4 py-3",
				className,
			)}
		>
			<p
				className="text-sm leading-relaxed"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: needed for inline highlight rendering
				dangerouslySetInnerHTML={{
					__html: sentence.replace(
						new RegExp(`(${escapeForRegExp(highlight)})`, "gi"),
						'<strong class="rounded-md bg-white px-1.5 py-0.5 font-semibold text-violet-700">$1</strong>',
					),
				}}
			/>
			{note ? (
				<p className="mt-2 text-muted-foreground text-xs italic">{note}</p>
			) : null}
		</div>
	);
}
