import { TrendingDown, TrendingUp } from "lucide-react";
import type * as React from "react";
import { cn } from "@/lib/utils";

export function StatCard({
	label,
	value,
	delta,
	hint,
	children,
}: {
	label: string;
	value: React.ReactNode;
	delta?: { value: string; positive: boolean } | null;
	hint?: string;
	children?: React.ReactNode;
}) {
	return (
		<div className="flex flex-col rounded-2xl border border-[rgba(23,32,51,0.08)] bg-white p-4">
			<div className="text-[#5B6478] text-[13px]">{label}</div>
			<div className="mt-2 flex items-baseline gap-2">
				<div className="font-semibold text-2xl text-[#172033] tabular-nums tracking-[-0.02em]">
					{value}
				</div>
				{delta ? (
					<div
						className={cn(
							"flex items-center gap-0.5 font-medium text-xs",
							delta.positive ? "text-now-deep" : "text-orange-600",
						)}
					>
						{delta.positive ? (
							<TrendingUp className="size-3" />
						) : (
							<TrendingDown className="size-3" />
						)}
						{delta.value}
					</div>
				) : null}
			</div>
			{hint ? <div className="mt-1 text-[#5B6478] text-xs">{hint}</div> : null}
			{children ? <div className="mt-auto pt-3">{children}</div> : null}
		</div>
	);
}
