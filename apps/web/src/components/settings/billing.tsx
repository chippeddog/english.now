import { env } from "@english.now/env/client";
import { useTranslation } from "@english.now/i18n";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { useUpgradeDialog } from "@/components/dashboard/upgrade-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useTRPC } from "@/utils/trpc";

export const Billing = () => {
	const { i18n, t } = useTranslation("app");
	const trpc = useTRPC();
	const { openDialog } = useUpgradeDialog();
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
					data.error ?? t("settings.billingSection.errors.createPortalSession"),
				);
			}

			window.open(data.url, "_blank");
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: t("settings.billingSection.errors.openCustomerPortal"),
			);
		} finally {
			setIsOpeningPortal(false);
		}
	};

	const freePlanRow = (
		<span className="inline-flex flex-wrap items-center gap-1">
			<span className="text-muted-foreground">
				{t("settings.billingSection.free")}
			</span>
			<Button
				type="button"
				variant="link"
				className="h-auto gap-0.5 p-0 font-medium text-lime-700 italic underline hover:text-lime-800"
				onClick={() => openDialog()}
			>
				({t("settings.billingSection.getPro")})
			</Button>
		</span>
	);

	return (
		<div className="space-y-5">
			<h2 className="font-semibold">{t("settings.billing")}</h2>
			{/* {(!subscriptionData || subscriptionData.status === "canceled") && (
			)} */}
			<div>
				<Label>{t("settings.billingSection.currentPlan")}</Label>
				<p className="mt-1 font-medium">
					{subscriptionData
						? (() => {
								const status = subscriptionData.status;
								if (status === "active" || status === "trialing") {
									return (
										<span className="inline-flex items-center gap-1.5">
											<span className="size-2 rounded-full bg-green-500" />
											{t("settings.billingSection.pro")}{" "}
											<span className="text-muted-foreground">
												(
												{status === "trialing"
													? t("settings.billingSection.statuses.trial")
													: t("settings.billingSection.statuses.active")}
												)
											</span>
										</span>
									);
								}
								if (status === "paused") {
									return (
										<span className="inline-flex items-center gap-1.5">
											<span className="size-2 rounded-full bg-yellow-500" />
											{t("settings.billingSection.pro")}{" "}
											<span className="text-muted-foreground">
												({t("settings.billingSection.statuses.paused")})
											</span>
										</span>
									);
								}
								if (status === "past_due") {
									return (
										<span className="inline-flex items-center gap-1.5">
											<span className="size-2 rounded-full bg-red-500" />
											{t("settings.billingSection.pro")}{" "}
											<span className="text-muted-foreground">
												({t("settings.billingSection.statuses.pastDue")})
											</span>
										</span>
									);
								}
								return freePlanRow;
							})()
						: freePlanRow}
				</p>
			</div>

			{subscriptionData?.currentPeriodEnd &&
				(subscriptionData.status === "active" ||
					subscriptionData.status === "trialing") && (
					<div>
						<Label className="text-muted-foreground">
							{t("settings.billingSection.nextBillingDate")}
						</Label>
						<p className="mt-1 font-medium">
							{new Date(subscriptionData.currentPeriodEnd).toLocaleDateString(
								i18n.resolvedLanguage || i18n.language || "en-US",
								{
									year: "numeric",
									month: "long",
									day: "numeric",
								},
							)}
						</p>
					</div>
				)}

			{subscriptionData && subscriptionData.status !== "canceled" && (
				<div>
					<p className="text-muted-foreground text-sm">
						{t("settings.billingSection.manageDescription")}{" "}
						<Button
							type="button"
							variant="link"
							onClick={() => void handleOpenCustomerPortal()}
							disabled={isOpeningPortal}
							className="h-auto p-0 font-medium text-lime-700 hover:text-lime-800"
						>
							{isOpeningPortal
								? t("settings.billingSection.customerPortalLoading")
								: t("settings.billingSection.customerPortal")}
						</Button>
					</p>
				</div>
			)}
		</div>
	);
};
