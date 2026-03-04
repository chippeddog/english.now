import { env } from "@english.now/env/client";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import Logo from "@/components/logo";
import { Button } from "@/components/ui/button";
import { getProfile } from "@/functions/get-profile";
import { authClient } from "@/lib/auth-client";
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

function GeneratingPage() {
	const navigate = useNavigate();
	const trpc = useTRPC();
	const [error, setError] = useState<string | null>(null);
	const kickedOff = useRef(false);

	const enrollmentQuery = useQuery({
		...trpc.content.getEnrollment.queryOptions(),
		refetchInterval: false,
	});

	useEffect(() => {
		if (enrollmentQuery.isLoading) return;

		if (enrollmentQuery.data) {
			navigate({ to: "/home" });
			return;
		}

		if (kickedOff.current) return;
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

				if (json.status === "already_exists" || json.status === "enrolled") {
					navigate({ to: "/home" });
					return;
				}

				if (json.error) {
					setError(json.error);
				}
			} catch (err) {
				console.error("Failed to enroll:", err);
				setError("Failed to set up your course. Please try again.");
			}
		})();
	}, [enrollmentQuery.data, enrollmentQuery.isLoading, navigate]);

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

			const res = await fetch(`${env.VITE_SERVER_URL}/api/content/generate`, {
				method: "POST",
				headers,
				credentials: "include",
			});

			const json = await res.json();
			if (json.status === "already_exists" || json.status === "enrolled") {
				navigate({ to: "/home" });
			} else if (json.error) {
				setError(json.error);
			}
		} catch (err) {
			console.error("Retry failed:", err);
			setError("Failed to set up your course. Please try again.");
		}
	}, [navigate]);

	return (
		<div className="flex min-h-dvh flex-col items-center justify-center bg-background p-6">
			<div className="w-full max-w-md space-y-8">
				<div className="flex justify-center">
					<Logo />
				</div>

				<div className="space-y-2 text-center">
					<h1 className="font-bold text-2xl tracking-tight">
						Setting Up Your Course
					</h1>
					<p className="text-muted-foreground text-sm">
						We're preparing your personalized learning path.
					</p>
				</div>

				{!error && (
					<div className="flex justify-center">
						<Loader2 className="size-8 animate-spin text-primary" />
					</div>
				)}

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
