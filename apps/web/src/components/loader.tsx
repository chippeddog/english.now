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
			className={cn(
				"flex items-center justify-center px-4 py-12 text-neutral-900 grayscale",
				className,
			)}
			aria-live="polite"
		>
			{/* <LogoMark
				variant="neutral"
				className={cn(
					"size-12 animate-bounce shadow-[0_10px_30px_rgba(17,17,17,0.08)]",
					markClassName,
				)}
			/> */}
			<svg
				className="size-7 animate-bounce"
				width="147"
				height="182"
				fill="currentColor"
				viewBox="0 0 147 182"
				xmlns="http://www.w3.org/2000/svg"
				aria-hidden="true"
			>
				<path
					d="M67.334 5.42313C63.3714 11.1355 58.8324 16.7032 48.0974 28.7064C35.129 43.2404 29.7975 51.9897 28.2125 61.0282L27.3479 65.9452L25.4747 62.2575C24.466 60.1605 21.7282 56.5451 19.3507 54.1589C14.3074 48.8804 14.7397 48.5912 9.91253 60.0882C-1.25475 86.6977 -3.12797 114.97 5.01333 135.361C14.3794 158.861 33.1837 174.697 59.1927 181.06C61.6422 181.638 67.334 182 73.9623 182C83.4004 181.928 85.6339 181.711 91.974 179.975C119.496 172.383 139.669 151.269 145.793 123.575C147.018 117.79 147.162 115.187 146.874 104.269C146.297 85.2515 142.767 70.8621 134.121 53.2189C129.871 44.3973 120.649 29.791 115.894 24.3679L113.444 21.5479L110.274 23.6448C105.015 27.1156 98.8905 33.768 96.8012 38.2511L94.8559 42.445L94.4236 37.7449C93.8472 32.2495 92.9827 29.6464 89.6685 23.7171C87.363 19.6679 80.3745 10.557 73.8182 3.18157L71.0804 4.05312e-06L67.334 5.42313ZM43.0541 115.187C50.7632 119.67 57.0312 123.503 57.0312 123.792C57.0312 124.081 56.0946 125.6 54.9419 127.19C52.4202 130.733 48.8899 132.469 44.2789 132.469C37.8667 132.397 33.0396 129.07 29.5093 122.056C27.3479 117.79 26.6995 107.161 28.6447 107.161C28.9329 107.161 35.4172 110.776 43.0541 115.187ZM119.568 111.789C120.288 125.889 107.968 136.518 97.0173 131.312C94.7118 130.227 90.1728 125.238 90.1728 123.792C90.1728 123.069 117.839 107.161 118.631 107.378C119.064 107.522 119.424 109.475 119.568 111.789Z"
					fill="#190A26"
				/>
				<path
					d="M58 124.268C58 122.549 38.0595 111.381 28.0893 106.012C27.021 105.435 23.8163 125.341 37.7034 131.247C51.5906 137.154 58 126.415 58 124.268Z"
					fill="white"
				/>
				<path
					d="M89 124.268C89 122.549 108.94 111.381 118.911 106.012C119.979 105.435 123.184 125.341 109.297 131.247C95.4094 137.154 89 126.415 89 124.268Z"
					fill="white"
				/>
			</svg>
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
