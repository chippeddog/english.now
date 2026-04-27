import { cn } from "@/lib/utils";

type EmojiChipProps = {
	emoji?: string;
	label: string;
	className?: string;
};

export default function EmojiChip({ emoji, label, className }: EmojiChipProps) {
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/50 px-3 py-1 font-medium text-foreground text-xs",
				className,
			)}
		>
			{emoji ? <span aria-hidden="true">{emoji}</span> : null}
			<span>{label}</span>
		</span>
	);
}
