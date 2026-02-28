import { env } from "@english.now/env/client";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { BookOpen, Check, GraduationCap, Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import Logo from "@/components/logo";
import { Button } from "@/components/ui/button";
import { getProfile } from "@/functions/get-profile";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/generating")({
	beforeLoad: async () => {
		const profile = await getProfile();
		if (!profile?.isOnboardingCompleted) {
			throw redirect({ to: "/onboarding" });
		}
		return { profile };
	},
	component: GeneratingPage,
});

type GenerationStep = {
	id: string;
	label: string;
	icon: typeof GraduationCap;
	progressThreshold: number;
};

const STEPS: GenerationStep[] = [
	{
		id: "outline",
		label: "Creating your course structure",
		icon: GraduationCap,
		progressThreshold: 50,
	},
	{
		id: "lessons",
		label: "Generating personalized lessons",
		icon: BookOpen,
		progressThreshold: 100,
	},
];

function getStepStatus(
	step: GenerationStep,
	serverProgress: number,
	serverStatus: string,
): "pending" | "active" | "completed" | "error" {
	if (serverStatus === "failed") {
		const stepIndex = STEPS.findIndex((s) => s.id === step.id);
		const prevThreshold =
			stepIndex > 0 ? STEPS[stepIndex - 1].progressThreshold : 0;
		if (
			serverProgress > prevThreshold &&
			serverProgress < step.progressThreshold
		) {
			return "error";
		}
		if (serverProgress >= step.progressThreshold) return "completed";
		return "pending";
	}

	if (serverProgress >= step.progressThreshold) return "completed";

	const stepIndex = STEPS.findIndex((s) => s.id === step.id);
	const prevThreshold =
		stepIndex > 0 ? STEPS[stepIndex - 1].progressThreshold : 0;
	if (serverProgress >= prevThreshold) return "active";

	return "pending";
}

function GeneratingPage() {
	const navigate = useNavigate();
	const trpc = useTRPC();
	const [error, setError] = useState<string | null>(null);
	const kickedOff = useRef(false);

	const statusQuery = useQuery({
		...trpc.content.getGenerationStatus.queryOptions(),
		refetchInterval: (query) => {
			const data = query.state.data;
			if (!data) return 2000;
			if (data.status === "ready" || data.status === "failed") return false;
			return 2000;
		},
	});

	const serverProgress = statusQuery.data?.progress ?? 0;
	const serverStatus = statusQuery.data?.status ?? "generating";

	// Kick off generation once
	useEffect(() => {
		if (kickedOff.current) return;
		if (statusQuery.isLoading) return;
		if (statusQuery.data?.status === "ready") {
			navigate({ to: "/home" });
			return;
		}
		if (statusQuery.data?.status === "generating") return;

		kickedOff.current = true;

		(async () => {
			try {
				const session = await authClient.getSession();
				const headers: Record<string, string> = {
					"Content-Type": "application/json",
				};
				if (session.data?.session) {
					headers.Cookie = `better-auth.session_token=${session.data.session.token}`;
				}

				const res = await fetch(`${env.VITE_SERVER_URL}/api/content/generate`, {
					method: "POST",
					headers,
					credentials: "include",
				});

				const json = await res.json();

				if (json.status === "already_exists") {
					navigate({ to: "/home" });
					return;
				}
			} catch (err) {
				console.error("Failed to enqueue generation:", err);
				setError("Failed to start generation. Please try again.");
			}
		})();
	}, [statusQuery.data, statusQuery.isLoading, navigate]);

	// Redirect when done
	useEffect(() => {
		if (statusQuery.data?.status === "ready") {
			const timer = setTimeout(() => navigate({ to: "/home" }), 1500);
			return () => clearTimeout(timer);
		}
		if (statusQuery.data?.status === "failed") {
			setError(
				statusQuery.data.progressMessage ??
					"Generation failed. Please try again.",
			);
		}
	}, [statusQuery.data, navigate]);

	const retry = useCallback(async () => {
		setError(null);
		kickedOff.current = false;
		try {
			const session = await authClient.getSession();
			const headers: Record<string, string> = {
				"Content-Type": "application/json",
			};
			if (session.data?.session) {
				headers.Cookie = `better-auth.session_token=${session.data.session.token}`;
			}

			await fetch(`${env.VITE_SERVER_URL}/api/content/generate`, {
				method: "POST",
				headers,
				credentials: "include",
			});

			statusQuery.refetch();
		} catch (err) {
			console.error("Retry failed:", err);
			setError("Failed to restart generation. Please try again.");
		}
	}, [statusQuery]);

	return (
		<div className="flex min-h-dvh flex-col items-center justify-center bg-background p-6">
			<div className="w-full max-w-md space-y-8">
				<div className="flex justify-center">
					<Logo />
				</div>

				<div className="space-y-2 text-center">
					<h1 className="font-bold text-2xl tracking-tight">
						Preparing Your Learning Path
					</h1>
					<p className="text-muted-foreground text-sm">
						We're creating a personalized course just for you. This takes about
						30 seconds.
					</p>
				</div>

				<div className="space-y-2">
					<div className="h-2 w-full overflow-hidden rounded-full bg-muted">
						<div
							className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
							style={{ width: `${serverProgress}%` }}
						/>
					</div>
					<p className="text-center text-muted-foreground text-xs">
						{serverProgress}% complete
					</p>
				</div>

				<div className="space-y-3">
					{STEPS.map((step) => {
						const status = getStepStatus(step, serverProgress, serverStatus);
						const Icon = step.icon;
						return (
							<div
								key={step.id}
								className={cn(
									"flex items-center gap-3 rounded-lg border p-3 transition-all duration-300",
									status === "active" && "border-primary/50 bg-primary/5",
									status === "completed" &&
										"border-green-500/30 bg-green-50 dark:bg-green-950/20",
									status === "error" &&
										"border-red-500/30 bg-red-50 dark:bg-red-950/20",
									status === "pending" && "border-transparent opacity-50",
								)}
							>
								<div
									className={cn(
										"flex size-8 items-center justify-center rounded-full",
										status === "active" && "bg-primary/10 text-primary",
										status === "completed" &&
											"bg-green-100 text-green-600 dark:bg-green-900/30",
										status === "error" &&
											"bg-red-100 text-red-600 dark:bg-red-900/30",
										status === "pending" && "bg-muted text-muted-foreground",
									)}
								>
									{status === "active" ? (
										<Loader2 className="size-4 animate-spin" />
									) : status === "completed" ? (
										<Check className="size-4" />
									) : (
										<Icon className="size-4" />
									)}
								</div>
								<span
									className={cn(
										"font-medium text-sm",
										status === "completed" &&
											"text-green-700 dark:text-green-400",
										status === "error" && "text-red-700 dark:text-red-400",
										status === "pending" && "text-muted-foreground",
									)}
								>
									{step.label}
								</span>
							</div>
						);
					})}
				</div>

				{error && (
					<div className="space-y-3 text-center">
						<p className="text-red-600 text-sm dark:text-red-400">{error}</p>
						<Button onClick={retry} variant="outline">
							Try Again
						</Button>
					</div>
				)}
			</div>
		</div>
	);
}
