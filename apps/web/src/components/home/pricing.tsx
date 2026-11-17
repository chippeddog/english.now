import { useTranslation } from "@english.now/i18n";
import { useState } from "react";
import {
	BillingToggle,
	PlanCards,
	usePlanCheckout,
} from "@/components/pricing/plan-cards";
import type { BillingPeriod } from "@/lib/plans";

export function Pricing() {
	const { t } = useTranslation("home");
	const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("yearly");
	const { checkoutTier, selectPlan } = usePlanCheckout(billingPeriod);

	return (
		<div className="mx-auto mt-16 md:mt-24">
			<div className="mb-10 text-center md:mb-14">
				<h2 className="mb-4 text-center font-bold font-geist-serif text-4xl tracking-tight md:text-5xl">
					{t("pricing.title")}
				</h2>
				<p className="text-balance text-center text-muted-foreground text-sm md:mx-auto md:max-w-boundary-sm md:text-lg">
					{t("pricing.subtitle")}
				</p>
				<div className="mt-8">
					<BillingToggle value={billingPeriod} onChange={setBillingPeriod} />
				</div>
			</div>
			<PlanCards
				billingPeriod={billingPeriod}
				checkoutTier={checkoutTier}
				onSelect={selectPlan}
			/>
		</div>
	);
}
