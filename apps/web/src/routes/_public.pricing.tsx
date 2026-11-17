import { resources, useTranslation } from "@english.now/i18n";
import { createFileRoute } from "@tanstack/react-router";
import { CheckIcon, MinusIcon } from "lucide-react";
import { useState } from "react";
import {
	BillingToggle,
	PlanCards,
	PlanCtaButton,
	usePlanCheckout,
	usePlanPricing,
} from "@/components/pricing/plan-cards";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import {
	type BillingPeriod,
	type PricingTier,
	type PricingTierKey,
	pricingTiers,
} from "@/lib/plans";
import { cn } from "@/lib/utils";
import {
	faqSchema,
	jsonLd,
	PUBLIC_PAGES,
	seo,
	softwareApplicationSchema,
} from "@/utils/seo";

const PRICING_FAQ_KEYS = [
	"switchPlans",
	"freeTrial",
	"paymentMethods",
	"studentDiscounts",
	"cancelAnytime",
	"progressSaved",
] as const;

type CompareValueKey =
	| "unlimited"
	| "allLessons"
	| "freeLessons"
	| "threePerWeek"
	| "eightReplies"
	| "threeMinutes"
	| "twentyMinutes"
	| "one"
	| "three"
	| "ten"
	| "fifteen"
	| "preview"
	| "full"
	| "email"
	| "priorityEmail"
	| "dedicatedManager";

type CompareValue = boolean | CompareValueKey;

type CompareRowKey =
	| "lessonAccess"
	| "cefrLevels"
	| "learningPath"
	| "practiceSessions"
	| "conversationLength"
	| "voiceCalls"
	| "pronunciationAttempts"
	| "feedback"
	| "vocabAdds"
	| "vocabReviews"
	| "spacedRepetition"
	| "progressTracking"
	| "analytics"
	| "adminDashboard"
	| "teamReports"
	| "roleTracks"
	| "invoiceBilling"
	| "support";

type CompareSection = {
	key: "lessons" | "practice" | "vocabulary" | "progress" | "team" | "support";
	rows: ReadonlyArray<{
		key: CompareRowKey;
		values: Record<PricingTierKey, CompareValue>;
	}>;
};

const COMPARE_SECTIONS: readonly CompareSection[] = [
	{
		key: "lessons",
		rows: [
			{
				key: "lessonAccess",
				values: {
					free: "freeLessons",
					pro: "allLessons",
					business: "allLessons",
				},
			},
			{ key: "cefrLevels", values: { free: true, pro: true, business: true } },
			{
				key: "learningPath",
				values: { free: false, pro: true, business: true },
			},
		],
	},
	{
		key: "practice",
		rows: [
			{
				key: "practiceSessions",
				values: {
					free: "threePerWeek",
					pro: "unlimited",
					business: "unlimited",
				},
			},
			{
				key: "conversationLength",
				values: {
					free: "eightReplies",
					pro: "unlimited",
					business: "unlimited",
				},
			},
			{
				key: "voiceCalls",
				values: {
					free: "threeMinutes",
					pro: "twentyMinutes",
					business: "twentyMinutes",
				},
			},
			{
				key: "pronunciationAttempts",
				values: { free: "one", pro: "three", business: "three" },
			},
			{
				key: "feedback",
				values: { free: "preview", pro: "full", business: "full" },
			},
		],
	},
	{
		key: "vocabulary",
		rows: [
			{
				key: "vocabAdds",
				values: { free: "ten", pro: "unlimited", business: "unlimited" },
			},
			{
				key: "vocabReviews",
				values: { free: "fifteen", pro: "unlimited", business: "unlimited" },
			},
			{
				key: "spacedRepetition",
				values: { free: true, pro: true, business: true },
			},
		],
	},
	{
		key: "progress",
		rows: [
			{
				key: "progressTracking",
				values: { free: true, pro: true, business: true },
			},
			{ key: "analytics", values: { free: false, pro: true, business: true } },
		],
	},
	{
		key: "team",
		rows: [
			{
				key: "adminDashboard",
				values: { free: false, pro: false, business: true },
			},
			{
				key: "teamReports",
				values: { free: false, pro: false, business: true },
			},
			{
				key: "roleTracks",
				values: { free: false, pro: false, business: true },
			},
			{
				key: "invoiceBilling",
				values: { free: false, pro: false, business: true },
			},
		],
	},
	{
		key: "support",
		rows: [
			{
				key: "support",
				values: {
					free: "email",
					pro: "priorityEmail",
					business: "dedicatedManager",
				},
			},
		],
	},
];

export const Route = createFileRoute("/_public/pricing")({
	component: PricingPage,
	head: () => ({
		...seo(PUBLIC_PAGES.pricing),
		scripts: [
			jsonLd(softwareApplicationSchema()),
			jsonLd(
				faqSchema(
					PRICING_FAQ_KEYS.map(
						(key) => resources.en.home.pricing.faqSection.items[key],
					),
				),
			),
		],
	}),
});

function PricingPage() {
	const { t } = useTranslation("home");
	const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("yearly");
	const [compareTier, setCompareTier] = useState<PricingTierKey>("pro");
	const { checkoutTier, selectPlan } = usePlanCheckout(billingPeriod);
	const { getPriceLabel, getPriceSuffix } = usePlanPricing(billingPeriod);

	function renderCompareValue(value: CompareValue) {
		if (value === true) {
			return (
				<>
					<CheckIcon aria-hidden="true" className="size-4 text-[#28A4FE]" />
					<span className="sr-only">{t("pricing.compare.included")}</span>
				</>
			);
		}
		if (value === false) {
			return (
				<>
					<MinusIcon
						aria-hidden="true"
						className="size-4 text-neutral-300 dark:text-neutral-600"
					/>
					<span className="sr-only">{t("pricing.compare.notIncluded")}</span>
				</>
			);
		}
		return (
			<span className="font-medium text-[#172033] dark:text-white">
				{t(`pricing.compare.values.${value}`)}
			</span>
		);
	}

	function compareColumnClass(tier: PricingTier) {
		return cn(
			tier.key !== compareTier && "hidden md:table-cell",
			tier.isPopular && "bg-[#28A4FE]/10 dark:bg-[#1A1F2E]",
		);
	}

	function renderCompareTable() {
		return (
			<section className="mt-20 md:mt-24">
				{/* <div className="mb-10">
					<h2 className="mb-2 font-bold font-geist-serif text-4xl tracking-tight md:text-5xl">
						{t("pricing.compare.title")}
					</h2>
					<p className="text-lg text-muted-foreground">
						{t("pricing.compare.subtitle")}
					</p>
				</div> */}
				<div className="-mx-4 sticky top-[68px] z-20 bg-white/80 px-4 py-2 backdrop-blur-md md:hidden dark:bg-neutral-900/80">
					<div className="grid grid-cols-3 gap-1 rounded-xl bg-neutral-100 p-1 dark:bg-neutral-800">
						{pricingTiers.map((tier) => (
							<button
								key={tier.key}
								type="button"
								aria-pressed={compareTier === tier.key}
								onClick={() => setCompareTier(tier.key)}
								className={cn(
									"cursor-pointer rounded-lg py-2 font-medium text-sm transition-colors",
									compareTier === tier.key
										? "bg-white text-[#172033] shadow-sm dark:bg-neutral-700 dark:text-white"
										: "text-muted-foreground",
								)}
							>
								{t(`pricing.plans.${tier.key}.name`)}
							</button>
						))}
					</div>
				</div>

				<table className="w-full table-fixed border-separate border-spacing-0 text-sm">
					<caption className="sr-only">{t("pricing.compare.title")}</caption>
					<thead className="hidden md:table-header-group">
						<tr>
							<th
								scope="col"
								className="sticky top-[76px] z-10 w-[34%] bg-white pb-5 text-left align-bottom font-medium text-muted-foreground dark:bg-neutral-900"
							>
								{t("pricing.compare.featureColumn")}
							</th>
							{pricingTiers.map((tier) => (
								<th
									key={tier.key}
									scope="col"
									className={cn(
										"sticky top-[76px] z-10 bg-white px-5 pt-5 pb-5 text-left align-bottom font-normal dark:bg-neutral-900",
										tier.isPopular &&
											"rounded-t-2xl bg-[#28A4FE]/10 dark:bg-[#1A1F2E]",
									)}
								>
									<div className="font-bold font-lyon text-[#172033] text-xl dark:text-white">
										{t(`pricing.plans.${tier.key}.name`)}
									</div>
									<div className="mt-0.5 text-muted-foreground text-xs tabular-nums">
										{getPriceLabel(tier)}
										{getPriceSuffix(tier)}
									</div>
									<div className="mt-4">
										<PlanCtaButton
											tier={tier}
											size="sm"
											checkoutTier={checkoutTier}
											onSelect={selectPlan}
										/>
									</div>
								</th>
							))}
						</tr>
					</thead>
					{COMPARE_SECTIONS.map((section) => (
						<tbody key={section.key}>
							<tr>
								<th
									scope="colgroup"
									className="border-border border-b pt-10 pb-3 text-left font-semibold text-[#172033] dark:text-white"
								>
									{t(`pricing.compare.sections.${section.key}`)}
								</th>
								{pricingTiers.map((tier) => (
									<td
										key={tier.key}
										className={cn(
											"border-border border-b",
											compareColumnClass(tier),
										)}
									/>
								))}
							</tr>
							{section.rows.map((row) => (
								<tr key={row.key}>
									<th
										scope="row"
										className="border-border/60 border-b py-3.5 pr-4 text-left font-normal text-neutral-700 dark:text-neutral-300"
									>
										{t(`pricing.compare.rows.${row.key}`)}
									</th>
									{pricingTiers.map((tier) => (
										<td
											key={tier.key}
											className={cn(
												"border-border/60 border-b px-5 py-3.5 text-right md:text-left",
												compareColumnClass(tier),
											)}
										>
											<span className="inline-flex items-center">
												{renderCompareValue(row.values[tier.key])}
											</span>
										</td>
									))}
								</tr>
							))}
						</tbody>
					))}
				</table>
			</section>
		);
	}

	return (
		<div className="relative">
			<div className="container relative mx-auto max-w-6xl px-4 py-10 md:py-20">
				<div className="mx-auto mb-10 max-w-2xl text-center md:mb-14">
					<h1 className="mb-5 font-bold font-geist-serif text-4xl text-neutral-900 tracking-tight md:text-5xl dark:text-white">
						{t("pricing.pageTitle")}
					</h1>
					<p className="mx-auto max-w-2xl text-balance text-muted-foreground md:text-lg">
						{t("pricing.pageSubtitle")}
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

				<p className="mt-6 flex flex-col items-center gap-1.5 text-foreground/40 text-sm sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-2.5">
					<span>14-day money-back guarantee</span>
					<span
						aria-hidden="true"
						className="hidden text-foreground/20 sm:inline"
					>
						·
					</span>
					<span>Prices in USD</span>
					<span
						aria-hidden="true"
						className="hidden text-foreground/20 sm:inline"
					>
						·
					</span>
					<a
						href="https://paddle.com"
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground/65"
					>
						Secure checkout via{" "}
						<img src="/paddle-logo.svg" alt="Paddle" className="size-11" />
					</a>
				</p>

				<hr className="my-10 border-foreground/5 border-t" />

				{renderCompareTable()}

				<div className="mx-auto mt-20 max-w-4xl md:mt-32">
					<div className="mb-10 text-center">
						<h2 className="mb-2 font-bold font-geist-serif text-4xl tracking-tight md:text-5xl">
							{t("pricing.faqSection.title")}
						</h2>
						<p className="text-lg text-muted-foreground">
							{t("pricing.faqSection.subtitle")}
						</p>
					</div>

					<Accordion
						type="single"
						collapsible
						className="divide-y transition-all duration-300"
					>
						{PRICING_FAQ_KEYS.map((faqKey, index) => (
							<AccordionItem key={faqKey} value={`item-${index}`}>
								<AccordionTrigger className="py-5 text-left font-medium hover:no-underline">
									{t(`pricing.faqSection.items.${faqKey}.question`)}
								</AccordionTrigger>
								<AccordionContent className="pb-5 text-muted-foreground transition-all duration-300">
									{t(`pricing.faqSection.items.${faqKey}.answer`)}
								</AccordionContent>
							</AccordionItem>
						))}
					</Accordion>
				</div>
			</div>
		</div>
	);
}
