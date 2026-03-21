"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";
import { useTheme } from "@/components/theme-provider";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Shared elevated shadow (set on toaster as `--toast-elevated-shadow`, inherited by toasts) */
const toastElevatedShadow = "![box-shadow:var(--toast-elevated-shadow)]";
const toastElevatedShadowOnDefault =
	"group-[.toaster]:![box-shadow:var(--toast-elevated-shadow)]";

/** Rich toast shell: same shadow + padding for all semantic types */
const richToastSurfaceCore =
	"!rounded-2xl !border !px-5 !py-3.5 !text-sm !font-medium " +
	toastElevatedShadow;

const richToastCloseButton =
	"group-data-[rich-colors=true]:group-data-[type=error]:!top-3 group-data-[rich-colors=true]:group-data-[type=error]:!right-3 group-data-[rich-colors=true]:group-data-[type=error]:!size-7 group-data-[rich-colors=true]:group-data-[type=error]:!rounded-full group-data-[rich-colors=true]:group-data-[type=error]:!border group-data-[rich-colors=true]:group-data-[type=error]:!border-white/25 group-data-[rich-colors=true]:group-data-[type=error]:!bg-white/15 group-data-[rich-colors=true]:group-data-[type=error]:!text-white group-data-[rich-colors=true]:group-data-[type=error]:!shadow-none group-data-[rich-colors=true]:group-data-[type=error]:hover:!bg-white/25 " +
	"group-data-[rich-colors=true]:group-data-[type=success]:!top-3 group-data-[rich-colors=true]:group-data-[type=success]:!right-3 group-data-[rich-colors=true]:group-data-[type=success]:!size-7 group-data-[rich-colors=true]:group-data-[type=success]:!rounded-full group-data-[rich-colors=true]:group-data-[type=success]:!border group-data-[rich-colors=true]:group-data-[type=success]:!border-lime-800/20 group-data-[rich-colors=true]:group-data-[type=success]:!bg-lime-900/10 group-data-[rich-colors=true]:group-data-[type=success]:!text-lime-800 group-data-[rich-colors=true]:group-data-[type=success]:!shadow-none group-data-[rich-colors=true]:group-data-[type=success]:hover:!bg-lime-900/15 " +
	"group-data-[rich-colors=true]:group-data-[type=info]:!top-3 group-data-[rich-colors=true]:group-data-[type=info]:!right-3 group-data-[rich-colors=true]:group-data-[type=info]:!size-7 group-data-[rich-colors=true]:group-data-[type=info]:!rounded-full group-data-[rich-colors=true]:group-data-[type=info]:!border group-data-[rich-colors=true]:group-data-[type=info]:!border-white/25 group-data-[rich-colors=true]:group-data-[type=info]:!bg-white/15 group-data-[rich-colors=true]:group-data-[type=info]:!text-white group-data-[rich-colors=true]:group-data-[type=info]:!shadow-none group-data-[rich-colors=true]:group-data-[type=info]:hover:!bg-white/25 " +
	"group-data-[rich-colors=true]:group-data-[type=warning]:!top-3 group-data-[rich-colors=true]:group-data-[type=warning]:!right-3 group-data-[rich-colors=true]:group-data-[type=warning]:!size-7 group-data-[rich-colors=true]:group-data-[type=warning]:!rounded-full group-data-[rich-colors=true]:group-data-[type=warning]:!border group-data-[rich-colors=true]:group-data-[type=warning]:!border-white/25 group-data-[rich-colors=true]:group-data-[type=warning]:!bg-white/15 group-data-[rich-colors=true]:group-data-[type=warning]:!text-white group-data-[rich-colors=true]:group-data-[type=warning]:!shadow-none group-data-[rich-colors=true]:group-data-[type=warning]:hover:!bg-white/25";

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
						"group toast group-[.toaster]:rounded-2xl group-[.toaster]:border group-[.toaster]:border-border/60 group-[.toaster]:bg-background/95 group-[.toaster]:px-4 group-[.toaster]:py-3 group-[.toaster]:text-foreground group-[.toaster]:backdrop-blur-md",
						toastElevatedShadowOnDefault,
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
						"group-data-[rich-colors=true]:group-data-[type=error]:!text-white/90 group-data-[rich-colors=true]:group-data-[type=success]:!text-lime-800/85 group-data-[rich-colors=true]:group-data-[type=info]:!text-white/90 group-data-[rich-colors=true]:group-data-[type=warning]:!text-white/90",
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
						richToastCloseButton,
						toastOptions?.classNames?.closeButton,
					),
					success: cn(
						richToastSurfaceCore,
						"!text-lime-700",
						toastOptions?.classNames?.success,
					),
					error: cn(
						richToastSurfaceCore,
						"!text-white",
						toastOptions?.classNames?.error,
					),
					warning: cn(
						richToastSurfaceCore,
						"!text-white",
						toastOptions?.classNames?.warning,
					),
					info: cn(
						richToastSurfaceCore,
						"!text-white",
						toastOptions?.classNames?.info,
					),
				},
			}}
			style={
				{
					"--toast-elevated-shadow":
						"rgba(0, 0, 0, 0.06) 0px 0px 0px 1px, rgba(0, 0, 0, 0.063) 0px 1px 1px, rgb(255, 255, 255) 0px 1px inset, rgba(255, 255, 255, 0.2) 0px -1px 1px inset, rgba(255, 255, 255, 0.2) 0px 1px 4px 1px inset, rgba(0, 0, 0, 0.06) 0px -2px 1px 1px inset, rgba(0, 0, 0, 0.008) 0px 20px 20px inset",
					"--normal-bg":
						"color-mix(in oklab, var(--background) 92%, var(--secondary))",
					"--normal-text": "var(--popover-foreground)",
					"--normal-border":
						"color-mix(in oklab, var(--border) 78%, transparent)",
					/* Brand lime success (matches primary CTA gradient: #EFFF9B → #D8FF76 → #C6F64D) */
					"--success-bg": "#E4FE9E",
					"--success-border": "#C6F64D",
					/* Tailwind default `lime-700` */
					"--success-text": "#4d7c0f",
					"--info-bg": "#3b82f6",
					"--info-border": "#1d4ed8",
					"--info-text": "#ffffff",
					"--warning-bg": "#f59e0b",
					"--warning-border": "#b45309",
					"--warning-text": "#ffffff",
					"--error-bg": "#db524e",
					"--error-border": "#b93a36",
					"--error-text": "#ffffff",
					...style,
				} as React.CSSProperties
			}
			{...props}
		/>
	);
};

export { Toaster };
