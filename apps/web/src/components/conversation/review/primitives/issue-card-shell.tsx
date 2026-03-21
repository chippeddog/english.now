import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function IssueCardShell({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"w-full rounded-2xl border bg-white p-4 text-left shadow-sm",
				className,
			)}
		>
			{children}
		</div>
	);
}

export function IssueCardEyebrow({
	primary,
	secondary,
}: {
	primary: string;
	secondary: string;
}) {
	return (
		<div className="mb-3 flex items-center gap-2 text-[11px] text-muted-foreground">
			<span className="font-medium">{primary}</span>
			<span aria-hidden>|</span>
			<span>{secondary}</span>
		</div>
	);
}
