import { env } from "@english.now/env/client";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useTRPC } from "@/utils/trpc";

export const Billing = () => {
	const trpc = useTRPC();
	const { data: subscriptionData } = useQuery(
		trpc.profile.getSubscription.queryOptions(),
	);
	const [isOpeningPortal, setIsOpeningPortal] = useState(false);
	const handleOpenCustomerPortal = async () => {
		setIsOpeningPortal(true);
		try {
			const response = await fetch(
				`${env.VITE_SERVER_URL}/api/paddle/customer-portal`,
				{
					method: "POST",
					credentials: "include",
				},
			);
			const data = (await response.json()) as { error?: string; url?: string };

			if (!response.ok || !data.url) {
				throw new Error(
					data.error ?? "Failed to create a customer portal session",
				);
			}

			window.open(data.url, "_blank");
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to open the customer portal",
			);
		} finally {
			setIsOpeningPortal(false);
		}
	};

	return (
		<div className="space-y-6">
			{/* {(!subscriptionData ||
								subscriptionData.status === "canceled") && (
								<Button
									className="bg-[radial-gradient(100%_100%_at_50%_0%,#EFFF9B_0%,#D8FF76_60%,#C6F64D_100%)] text-slate-900 hover:brightness-95"
									onClick={() => {
										if (!session?.user) return;
										openCheckout({
											priceId: PADDLE_PRICE_IDS.monthly,
											userId: session.user.id,
											email: session.user.email,
										});
									}}
								>
									<Zap className="size-4" />
									Upgrade
								</Button>
							)} */}
			<div>
				<Label className="text-muted-foreground">Your current plan</Label>
				<p className="mt-1 font-medium">
					{subscriptionData
						? (() => {
								const status = subscriptionData.status;
								if (status === "active" || status === "trialing") {
									return (
										<span className="inline-flex items-center gap-1.5">
											<span className="size-2 rounded-full bg-green-500" />
											Pro{" "}
											<span className="text-muted-foreground">
												({status === "trialing" ? "Trial" : "Active"})
											</span>
										</span>
									);
								}
								if (status === "paused") {
									return (
										<span className="inline-flex items-center gap-1.5">
											<span className="size-2 rounded-full bg-yellow-500" />
											Pro{" "}
											<span className="text-muted-foreground">(Paused)</span>
										</span>
									);
								}
								if (status === "past_due") {
									return (
										<span className="inline-flex items-center gap-1.5">
											<span className="size-2 rounded-full bg-red-500" />
											Pro{" "}
											<span className="text-muted-foreground">(Past Due)</span>
										</span>
									);
								}
								return <span className="text-muted-foreground">Free</span>;
							})()
						: "Free"}
				</p>
			</div>

			{/* Billing Period */}
			{subscriptionData?.currentPeriodEnd &&
				(subscriptionData.status === "active" ||
					subscriptionData.status === "trialing") && (
					<div>
						<Label className="text-muted-foreground">Next billing date</Label>
						<p className="mt-1 font-medium">
							{new Date(subscriptionData.currentPeriodEnd).toLocaleDateString(
								"en-US",
								{
									year: "numeric",
									month: "long",
									day: "numeric",
								},
							)}
						</p>
					</div>
				)}

			{/* Manage Subscription */}
			{subscriptionData && subscriptionData.status !== "canceled" && (
				<div>
					<p className="text-muted-foreground text-sm">
						To manage your subscription, update payment details, or cancel, open
						your{" "}
						<Button
							type="button"
							variant="link"
							onClick={() => void handleOpenCustomerPortal()}
							disabled={isOpeningPortal}
							className="h-auto p-0 font-medium text-lime-700 hover:text-lime-800"
						>
							{isOpeningPortal
								? "Paddle customer portal..."
								: "Paddle customer portal"}
						</Button>
					</p>
				</div>
			)}
		</div>
	);
};
