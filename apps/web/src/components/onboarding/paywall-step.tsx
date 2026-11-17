import { useTranslation } from "@english.now/i18n";
import { ArrowRight, Check, StarIcon } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import _plans from "@/lib/plans";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import {
	Carousel,
	type CarouselApi,
	CarouselContent,
	CarouselItem,
} from "../ui/carousel";

export default function PaywallStep({
	selectedPlan,
	onSelectPlan,
	onComplete,
	onSkip,
}: {
	selectedPlan: string;
	onSelectPlan: (plan: string) => void;
	onComplete: () => void;
	onSkip: () => void;
}) {
	const { t } = useTranslation("onboarding");
	const [carouselApi, setCarouselApi] = useState<CarouselApi>();
	const [currentSlide, setCurrentSlide] = useState(1);

	useEffect(() => {
		if (!carouselApi) return;

		const onSelect = () => {
			setCurrentSlide(carouselApi.selectedScrollSnap());
		};

		setCurrentSlide(carouselApi.selectedScrollSnap());
		carouselApi.on("select", onSelect);

		return () => {
			carouselApi.off("select", onSelect);
		};
	}, [carouselApi]);

	const renderPlanCard = (plan: (typeof _plans)[number]) => {
		const isSelected = selectedPlan === plan.name;
		return (
			<button
				type="button"
				onClick={() => onSelectPlan(plan.name)}
				className={cn(
					"relative flex min-h-[328px] w-full cursor-pointer flex-col rounded-3xl border bg-white p-5 text-left transition-all",
					isSelected ? "border-lime-600" : "border-transparent",
					plan.isPopular && "border-[#C6F64D] hover:border-lime-400",
				)}
				style={{
					boxShadow:
						"0 0 0 1px rgba(0,0,0,.05),0 10px 10px -5px rgba(0,0,0,.04),0 20px 25px -5px rgba(0,0,0,.04),0 20px 32px -12px rgba(0,0,0,.04)",
				}}
			>
				<div className="mb-3 flex flex-col gap-1">
					<div className="flex items-center gap-2">
						<h1 className="flex items-center gap-2 font-bold font-lyon text-xl">
							{plan.name}
						</h1>
						{plan.duration === "year" && (
							<span className="rounded-md bg-radial from-[#EFFF9B] to-[#D8FF76] px-1.5 py-1.5 font-semibold text-[11px] text-lime-900 normal-case tracking-normal md:py-[0.250rem]">
								Save 20%
							</span>
						)}
					</div>
					<p className="text-muted-foreground text-sm">{plan.description}</p>
				</div>
				<div className="mb-4 flex items-baseline gap-1">
					<span className="font-bold text-2xl">${plan.price}</span>
					<span className="text-muted-foreground text-sm">
						/{plan.duration}
					</span>
				</div>

				<ul className="space-y-2">
					{plan.features.map((feature) => (
						<li key={feature} className="flex items-center gap-2 text-sm">
							<Check className="size-4 shrink-0 text-lime-600" />
							{feature}
						</li>
					))}
				</ul>
				<div
					className={cn(
						"mt-auto flex size-6 items-center justify-center self-end rounded-full border transition-all",
						isSelected ? "border-lime-600 bg-lime-600" : "border-neutral-300",
					)}
				>
					{isSelected && <Check className="size-4 text-white" />}
				</div>
			</button>
		);
	};

	const renderPopularWrapper = (
		children: ReactNode,
		extraClassName?: string,
	) => (
		<div
			className={cn("rounded-[1.7rem] p-1.5", extraClassName)}
			style={{
				background:
					"linear-gradient(180deg, #EFFF9B 0%, #D8FF76 60%, #C6F64D 100%)",
				boxShadow: "inset 0 0 0 1px #C6F64D, inset 0 0 8px 2px #C6F64D",
			}}
		>
			<div className="mt-1 mb-2 flex items-center justify-center gap-1.5 text-center font-medium text-[13px] text-lime-900">
				<StarIcon fill="currentColor" className="size-3.5" />
				{t("paywall.mostPopular")}
			</div>{" "}
			{children}
		</div>
	);

	return (
		<div className="flex flex-1 flex-col px-4 py-8">
			<div className="mx-auto w-full max-w-4xl">
				<div className="mb-4 text-center">
					<h1 className="mb-2 font-bold font-lyon text-4xl tracking-tight md:text-5xl">
						{t("paywall.title")}
					</h1>
					<p className="text-muted-foreground md:text-lg">
						{t("paywall.subtitle")}
					</p>
				</div>

				<div className="mb-12 flex items-center justify-center gap-2">
					<div className="-space-x-2 flex">
						{[1, 2, 3, 4, 5].map((i) => (
							<div
								key={i}
								className="flex size-7.5 items-center justify-center rounded-full border-2 border-white bg-[radial-gradient(100%_100%_at_50%_0%,#EFFF9B_0%,#D8FF76_60%,#C6F64D_100%)] font-medium text-lime-900 text-xs"
							>
								{String.fromCharCode(64 + i)}
							</div>
						))}
					</div>
					<div className="text-sm">
						<span className="font-semibold">10,000+</span>
						<span className="text-muted-foreground">
							{" "}
							{t("paywall.learnersThisMonth")}
						</span>
					</div>
				</div>

				{/* Desktop: side-by-side flex layout */}
				<div className="relative mb-8 hidden w-full items-end justify-center gap-5 md:flex">
					{_plans.map((plan) => (
						<div key={plan.name}>
							{plan.isPopular
								? renderPopularWrapper(renderPlanCard(plan), "-mt-4 mb-4")
								: renderPlanCard(plan)}
						</div>
					))}
				</div>

				{/* Mobile: swipeable carousel */}
				<div className="mb-8 md:hidden">
					<Carousel
						opts={{
							align: "center",
							startIndex: 1,
						}}
						setApi={setCarouselApi}
					>
						<CarouselContent className="-ml-3">
							{_plans.map((plan) => (
								<CarouselItem key={plan.name} className="basis-[85%] pl-3">
									{plan.isPopular
										? renderPopularWrapper(renderPlanCard(plan))
										: renderPlanCard(plan)}
								</CarouselItem>
							))}
						</CarouselContent>
					</Carousel>

					<div className="mt-4 flex justify-center gap-1.5">
						{_plans.map((_, index) => (
							<button
								key={_plans[index].name}
								type="button"
								aria-label={`Go to ${_plans[index].name} plan`}
								onClick={() => carouselApi?.scrollTo(index)}
								className={cn(
									"h-1.5 rounded-full transition-all",
									currentSlide === index
										? "w-6 bg-lime-600"
										: "w-1.5 bg-neutral-300",
								)}
							/>
						))}
					</div>
				</div>

				<div className="mx-auto max-w-md">
					<Button
						size="lg"
						variant="progress"
						className="h-14 w-full rounded-2xl text-base"
						onClick={onComplete}
					>
						{selectedPlan === "Free"
							? t("paywall.getStarted")
							: t("paywall.startTrial")}
						<ArrowRight className="ml-2 size-5" />
					</Button>

					<p className="mt-3 text-center text-muted-foreground text-xs">
						{t("paywall.trialNote")}
					</p>

					<div className="mt-6 text-center">
						<button
							type="button"
							onClick={onSkip}
							className="text-muted-foreground text-sm underline transition-colors hover:text-foreground"
						>
							{t("paywall.skipToLimited")}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
