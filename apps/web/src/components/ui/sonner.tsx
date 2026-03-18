"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";
import { useTheme } from "@/components/theme-provider";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const Toaster = ({
	className,
	style,
	toastOptions,
	...props
}: ToasterProps) => {
	const { resolvedTheme } = useTheme();

	return (
		<Sonner
			theme={resolvedTheme as ToasterProps["theme"]}
			className={cn("toaster group", className)}
			toastOptions={{
				...toastOptions,
				classNames: {
					toast: cn(
						"group toast group-[.toaster]:rounded-2xl group-[.toaster]:border group-[.toaster]:border-border/60 group-[.toaster]:bg-background/95 group-[.toaster]:px-4 group-[.toaster]:py-3 group-[.toaster]:text-foreground group-[.toaster]:shadow-lg group-[.toaster]:backdrop-blur-md",
						"group-[.toaster]:data-[state=closed]:fade-out-0 group-[.toaster]:data-[state=open]:slide-in-from-top-2 group-[.toaster]:sm:data-[state=open]:slide-in-from-right-3 group-[.toaster]:data-[state=closed]:animate-out group-[.toaster]:data-[state=open]:animate-in",
						"group-[.toaster]:data-[swipe=cancel]:translate-x-0 group-[.toaster]:data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] group-[.toaster]:data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]",
						"group-[.toaster]:has-[button]:items-start",
						toastOptions?.classNames?.toast,
					),
					title: cn(
						"font-semibold text-sm tracking-[-0.01em]",
						toastOptions?.classNames?.title,
					),
					description: cn(
						"text-[13px] text-muted-foreground leading-5",
						toastOptions?.classNames?.description,
					),
					actionButton: cn(
						buttonVariants({ variant: "gradientblack", size: "sm" }),
						"!mt-3 !h-8 !rounded-xl !px-3 !text-xs",
						toastOptions?.classNames?.actionButton,
					),
					cancelButton: cn(
						buttonVariants({ variant: "outline", size: "sm" }),
						"!mt-3 !h-8 !rounded-xl !border-border/60 !bg-background/80 !px-3 !text-xs hover:!bg-muted/80",
						toastOptions?.classNames?.cancelButton,
					),
					closeButton: cn(
						"!top-3 !right-3 !size-7 !rounded-full !border !border-border/60 !bg-background/80 !text-muted-foreground !shadow-none hover:!bg-muted hover:!text-foreground backdrop-blur-sm transition-colors",
						toastOptions?.classNames?.closeButton,
					),
					success: cn(
						"!border-emerald-200/80 dark:!border-emerald-400/30",
						toastOptions?.classNames?.success,
					),
					error: cn(
						"!border-red-200/80 dark:!border-red-400/30",
						toastOptions?.classNames?.error,
					),
					warning: cn(
						"!border-amber-200/80 dark:!border-amber-400/30",
						toastOptions?.classNames?.warning,
					),
					info: cn(
						"!border-sky-200/80 dark:!border-sky-400/30",
						toastOptions?.classNames?.info,
					),
				},
			}}
			style={
				{
					"--normal-bg":
						"color-mix(in oklab, var(--background) 92%, var(--secondary))",
					"--normal-text": "var(--popover-foreground)",
					"--normal-border":
						"color-mix(in oklab, var(--border) 78%, transparent)",
					"--success-bg":
						"color-mix(in oklab, var(--background) 90%, oklch(0.9 0.1 160))",
					"--success-border":
						"color-mix(in oklab, var(--border) 55%, oklch(0.77 0.14 160))",
					"--success-text": "var(--foreground)",
					"--info-bg":
						"color-mix(in oklab, var(--background) 90%, oklch(0.9 0.07 240))",
					"--info-border":
						"color-mix(in oklab, var(--border) 55%, oklch(0.72 0.11 240))",
					"--info-text": "var(--foreground)",
					"--warning-bg":
						"color-mix(in oklab, var(--background) 88%, oklch(0.92 0.11 90))",
					"--warning-border":
						"color-mix(in oklab, var(--border) 55%, oklch(0.8 0.13 90))",
					"--warning-text": "var(--foreground)",
					"--error-bg":
						"color-mix(in oklab, var(--background) 88%, oklch(0.85 0.08 20))",
					"--error-border":
						"color-mix(in oklab, var(--border) 50%, oklch(0.7 0.18 22))",
					"--error-text": "var(--foreground)",
					...style,
				} as React.CSSProperties
			}
			{...props}
		/>
	);
};

export { Toaster };
