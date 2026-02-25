import { Loader } from "lucide-react";

export default function SessionLoader() {
	return (
		// <div className="container mx-auto flex min-h-[60vh] max-w-5xl flex-col items-center justify-center px-4 py-8">
		<div className="container mx-auto flex min-h-dvh max-w-3xl flex-col items-center justify-center px-4 py-8">
			<div className="flex flex-col items-center gap-4">
				<Loader className="size-7 animate-spin text-lime-600" />
				<p className="font-medium text-foreground-muted">Loading session...</p>
			</div>
		</div>
	);
}
