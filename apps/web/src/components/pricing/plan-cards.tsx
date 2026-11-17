import { useTranslation } from "@english.now/i18n";
import { useNavigate } from "@tanstack/react-router";
import { CheckIcon, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
} from "@/components/ui/carousel";
import { authClient } from "@/lib/auth-client";
import { openCheckout } from "@/lib/paddle";
import {
	type BillingPeriod,
	getMonthlyEquivalent,
	getYearlySavingsPercent,
	type PricingTier,
	type PricingTierKey,
	pricingTiers,
} from "@/lib/plans";
import { cn } from "@/lib/utils";

const CARD_SHADOW =
	"0 0 0 1px rgba(0,0,0,.05),0 10px 10px -5px rgba(0,0,0,.04),0 20px 25px -5px rgba(0,0,0,.04),0 20px 32px -12px rgba(0,0,0,.04)";

export function formatPrice(value: number) {
	return value === 0 ? "$0" : `$${value.toFixed(2)}`;
}

export function usePlanCheckout(billingPeriod: BillingPeriod) {
	const { data: session } = authClient.useSession();
	const navigate = useNavigate();
	const [checkoutTier, setCheckoutTier] = useState<PricingTierKey | null>(null);

	async function selectPlan(tier: PricingTier) {
		if (tier.cta === "contact") {
			navigate({ to: "/contact" });
			return;
		}

		const priceId = tier.paddlePriceIds?.[billingPeriod];
		if (!priceId || !session?.user) {
			navigate({ to: "/signup" });
			return;
		}

		setCheckoutTier(tier.key);
		try {
			await openCheckout({
				priceId,
				userId: session.user.id,
				email: session.user.email,
			});
		} finally {
			setCheckoutTier(null);
		}
	}

	return { checkoutTier, selectPlan };
}

export function usePlanPricing(billingPeriod: BillingPeriod) {
	const { t } = useTranslation("home");

	function getPriceLabel(tier: PricingTier) {
		const price = getMonthlyEquivalent(tier, billingPeriod);
		return price === null ? t("pricing.customPrice") : formatPrice(price);
	}

	function getPriceSuffix(tier: PricingTier) {
		if (!tier.prices) return null;
		if (tier.prices.monthly === 0) return t("pricing.priceSuffix.forever");
		return t("pricing.priceSuffix.month");
	}

	function getBilledNote(tier: PricingTier) {
		if (!tier.prices) return t("pricing.billedNote.custom");
		if (tier.prices.monthly === 0) return t("pricing.billedNote.free");
		const yearlyPrice = formatPrice(tier.prices.yearly);
		return billingPeriod === "yearly"
			? t("pricing.billedNote.yearly", { price: yearlyPrice })
			: t("pricing.billedNote.monthly");
	}

	return { getPriceLabel, getPriceSuffix, getBilledNote };
}

export function BillingToggle({
	value,
	onChange,
}: {
	value: BillingPeriod;
	onChange: (period: BillingPeriod) => void;
}) {
	const { t } = useTranslation("home");

	return (
		<div className="flex flex-col items-center justify-center gap-3">
			<fieldset className="relative inline-grid grid-cols-2 rounded-full bg-neutral-100 p-1 ring-1 ring-black/5 dark:bg-neutral-800 dark:ring-white/10">
				<legend className="sr-only">{t("pricing.billing.label")}</legend>
				<span
					aria-hidden="true"
					className={cn(
						"absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-white shadow-sm ring-1 ring-black/5 transition-transform duration-300 ease-out dark:bg-neutral-700",
						value === "yearly" && "translate-x-full",
					)}
				/>
				{(["monthly", "yearly"] as const).map((period) => (
					<button
						key={period}
						type="button"
						aria-pressed={value === period}
						onClick={() => onChange(period)}
						className={cn(
							"relative z-10 inline-flex cursor-pointer items-center justify-center gap-2 rounded-full px-5 py-2 font-medium text-sm transition-colors",
							value === period
								? "text-[#172033] dark:text-white"
								: "text-muted-foreground hover:text-[#172033] dark:hover:text-white",
						)}
					>
						{t(`pricing.billing.${period}`)}
					</button>
				))}
			</fieldset>
			<div className="mt-2 text-muted-foreground text-sm">
				<span className="font-medium text-[#172033] dark:text-white">
					Save about 20%
				</span>{" "}
				on annual billing
			</div>
		</div>
	);
}

export function PlanCtaButton({
	tier,
	size,
	checkoutTier,
	onSelect,
}: {
	tier: PricingTier;
	size: "sm" | "lg";
	checkoutTier: PricingTierKey | null;
	onSelect: (tier: PricingTier) => void;
}) {
	const { t } = useTranslation("home");

	function getCtaLabel() {
		if (tier.cta === "contact") return t("pricing.contactSales");
		if (tier.cta === "checkout") return t("pricing.startTrial");
		return t("pricing.getStarted");
	}

	return (
		<Button
			size={size}
			disabled={checkoutTier !== null}
			variant={tier.isPopular ? "gradientBlue" : "outline"}
			onClick={() => onSelect(tier)}
			className={cn(
				"w-full",
				size === "sm" &&
					"h-auto min-h-8 whitespace-normal py-1.5 leading-tight",
				!tier.isPopular &&
					"border-[rgba(23,32,51,0.14)] text-[#172033] shadow-none dark:text-white",
			)}
		>
			{checkoutTier === tier.key ? (
				<Loader2 className="size-4 animate-spin" />
			) : (
				getCtaLabel()
			)}
		</Button>
	);
}

export function PlanCards({
	billingPeriod,
	checkoutTier,
	onSelect,
}: {
	billingPeriod: BillingPeriod;
	checkoutTier: PricingTierKey | null;
	onSelect: (tier: PricingTier) => void;
}) {
	const { t } = useTranslation("home");
	const { getPriceLabel, getPriceSuffix, getBilledNote } =
		usePlanPricing(billingPeriod);

	function renderPlanCard(tier: PricingTier) {
		const features = t(`pricing.plans.${tier.key}.features`, {
			returnObjects: true,
		}) as string[];
		const showsDiscount =
			billingPeriod === "yearly" && getYearlySavingsPercent(tier) > 0;
		const priceSuffix = getPriceSuffix(tier);

		return (
			<div className="p-2">
				<div
					className={cn(
						"relative flex w-full flex-col rounded-3xl bg-background p-6 md:min-h-[540px]",
						tier.isPopular && "border border-[#28A4FE]",
					)}
					style={{ boxShadow: CARD_SHADOW }}
				>
					<div className="font-bold font-geist-serif text-2xl">
						{t(`pricing.plans.${tier.key}.name`)}
					</div>
					<p className="mt-1.5 text-muted-foreground text-sm">
						{t(`pricing.plans.${tier.key}.description`)}
					</p>

					<div className="mt-6 flex items-baseline gap-1.5">
						{showsDiscount && tier.prices && (
							<span className="text-lg text-muted-foreground tabular-nums line-through decoration-1">
								{formatPrice(tier.prices.monthly)}
							</span>
						)}
						<span className="font-medium text-3xl tabular-nums tracking-tight">
							{getPriceLabel(tier)}
						</span>
						{priceSuffix && (
							<span className="text-muted-foreground text-sm">
								{priceSuffix}
							</span>
						)}
					</div>
					<p className="mt-1.5 text-muted-foreground text-xs">
						{getBilledNote(tier)}
					</p>

					<div className="mt-6">
						<PlanCtaButton
							tier={tier}
							size="lg"
							checkoutTier={checkoutTier}
							onSelect={onSelect}
						/>
					</div>

					<div className="mt-6 mb-4 font-medium text-black/50 text-sm dark:text-white/50">
						{tier.key === "free"
							? t("pricing.whatsIncluded")
							: t(`pricing.plans.${tier.key}.includedLabel`)}
					</div>
					<ul className="space-y-3 text-sm">
						{features.map((feature) => (
							<li className="flex items-start gap-2" key={feature}>
								<CheckIcon
									className={cn(
										"mt-0.5 size-4 shrink-0",
										tier.isPopular ? "text-[#3479d7]" : "text-muted-foreground",
									)}
								/>
								{feature}
							</li>
						))}
					</ul>
				</div>
			</div>
		);
	}

	return (
		<>
			<div className="relative hidden w-full flex-row items-end justify-between gap-3 md:flex">
				{pricingTiers.map((tier) => (
					<div className="w-full" key={tier.key}>
						{renderPlanCard(tier)}
					</div>
				))}
			</div>

			<div className="overflow-hidden md:hidden">
				<Carousel opts={{ align: "center", startIndex: 1 }}>
					<CarouselContent className="items-end pb-4">
						{pricingTiers.map((tier) => (
							<CarouselItem key={tier.key} className="basis-[85%] pr-2 pl-2">
								{renderPlanCard(tier)}
							</CarouselItem>
						))}
					</CarouselContent>
				</Carousel>
			</div>
		</>
	);
}
