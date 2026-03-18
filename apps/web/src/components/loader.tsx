import { Loader as LoaderIcon } from "lucide-react";
import type { ReactNode } from "react";
import { LogoMark } from "@/components/logo";
import { cn } from "@/lib/utils";

interface LoaderBrandProps {
	className?: string;
	markClassName?: string;
}

interface RouteLoaderProps {
	className?: string;
	markClassName?: string;
}

interface RouteShellLoaderProps {
	className?: string;
	header?: ReactNode;
	mainClassName?: string;
	loaderWrapperClassName?: string;
	markClassName?: string;
}

function LoaderBrand({ className, markClassName }: LoaderBrandProps) {
	return (
		<div
			className={cn("flex items-center justify-center px-4 py-12", className)}
			aria-live="polite"
		>
			<LogoMark
				variant="neutral"
				className={cn(
					"size-12 animate-bounce shadow-[0_10px_30px_rgba(17,17,17,0.08)]",
					markClassName,
				)}
			/>
			<span className="sr-only">Loading page</span>
		</div>
	);
}

export function RouteLoader({ className, markClassName }: RouteLoaderProps) {
	return (
		<div
			className={cn(
				"flex h-dvh w-full items-center justify-center bg-neutral-50 dark:bg-neutral-900",
				className,
			)}
		>
			<LoaderBrand markClassName={markClassName} />
		</div>
	);
}

export function RouteShellLoader({
	className,
	header,
	mainClassName,
	loaderWrapperClassName,
	markClassName,
}: RouteShellLoaderProps) {
	return (
		<div
			className={cn(
				"flex min-h-dvh w-full bg-neutral-50 dark:bg-neutral-900",
				className,
			)}
		>
			<main
				className={cn(
					"relative flex h-full w-full flex-1 flex-col overflow-auto",
					mainClassName,
				)}
			>
				{header}
				<LoaderIcon className="size-5 animate-spin text-muted-foreground" />
			</main>
		</div>
	);
}

export default function Loader() {
	return <RouteLoader />;
}
