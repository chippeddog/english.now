import type * as React from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
	title,
	description,
	actions,
	className,
}: {
	title: string;
	description?: string;
	actions?: React.ReactNode;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
				className,
			)}
		>
			<div>
				<h1 className="font-medium text-[#172033] text-[2rem] leading-[1.15] tracking-[-0.02em]">
					{title}
				</h1>
				{description ? (
					<p className="mt-1.5 text-[#5B6478] text-sm">{description}</p>
				) : null}
			</div>
			{actions ? (
				<div className="flex items-center gap-2">{actions}</div>
			) : null}
		</div>
	);
}

export function FilterPill({
	active,
	children,
	onClick,
	count,
}: {
	active: boolean;
	children: React.ReactNode;
	onClick: () => void;
	count?: number;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			aria-pressed={active}
			className={cn(
				"inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 font-medium text-[13px] transition-colors",
				active
					? "border-[#172033] bg-[#172033] text-white"
					: "border-[rgba(23,32,51,0.14)] bg-white text-[#172033] hover:bg-[#F5F7FA]",
			)}
		>
			{children}
			{count !== undefined ? (
				<span
					className={cn(
						"tabular-nums",
						active ? "text-white/60" : "text-[#5B6478]",
					)}
				>
					{count}
				</span>
			) : null}
		</button>
	);
}
