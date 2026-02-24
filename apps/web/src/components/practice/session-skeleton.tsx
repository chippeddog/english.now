export default function SessionSkeleton() {
	return (
		<div className="flex animate-pulse items-center gap-2 rounded-xl border border-border/50 p-2.5">
			<div className="size-11 rounded-full bg-neutral-100" />
			<div className="flex flex-1 flex-col gap-1.5">
				<div className="h-4 w-28 rounded bg-neutral-100" />
				<div className="h-3 w-20 rounded bg-neutral-100" />
			</div>
			<div className="h-4 w-17 rounded bg-neutral-100" />
		</div>
	);
}
