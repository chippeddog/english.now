import { cn } from "@/lib/utils";

interface RouteLoaderProps {
	className?: string;
}

export function RouteLoader({ className }: RouteLoaderProps) {
	return (
		<div
			className={cn(
				"flex h-dvh w-full items-center justify-center bg-neutral-50 dark:bg-neutral-900",
				className,
			)}
			aria-live="polite"
		>
			<svg
				className="size-6 animate-spin text-neutral-900 motion-reduce:animate-none dark:text-neutral-100"
				viewBox="0 0 24 24"
				fill="none"
				aria-hidden="true"
			>
				<circle
					className="opacity-20"
					cx="12"
					cy="12"
					r="10"
					stroke="currentColor"
					strokeWidth="2.5"
				/>
				<path
					d="M12 2a10 10 0 0 1 10 10"
					stroke="currentColor"
					strokeWidth="2.5"
					strokeLinecap="round"
				/>
			</svg>
			<span className="sr-only">Loading page</span>
		</div>
	);
}

export default function Loader() {
	return <RouteLoader />;
}
