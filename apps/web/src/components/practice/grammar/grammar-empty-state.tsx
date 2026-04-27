export default function GrammarEmptyState({
	searchQuery,
}: {
	searchQuery: boolean;
}) {
	return (
		<div className="flex h-full flex-col items-center justify-center gap-2.5 text-center">
			<p className="font-semibold">
				{searchQuery
					? "No grammar topics match your search"
					: "No grammar topics here yet"}
			</p>
			<p className="text-muted-foreground text-sm">
				Try a different search or switch back to "Recommended".
			</p>
		</div>
	);
}
