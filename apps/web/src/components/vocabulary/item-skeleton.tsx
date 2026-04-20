export default function ItemSkeleton() {
	return (
		<div className="flex animate-pulse items-center justify-between gap-3 rounded-2xl border border-border/50 p-2.5 px-3 dark:bg-slate-900">
			<div className="flex items-center gap-3">
				<div className="size-8 shrink-0 rounded-lg bg-neutral-100" />
				<div className="flex flex-col gap-1.5">
					<div className="h-5 w-28 rounded bg-neutral-100" />
					<div className="h-3 w-40 rounded bg-neutral-100" />
				</div>
			</div>
			<div className="flex shrink-0 items-center gap-2">
				<div className="h-3 w-12 rounded bg-neutral-100" />
				<div className="size-4 rounded-full bg-neutral-100" />
				<div className="size-6 rounded bg-neutral-100" />
			</div>
		</div>
	);
}
