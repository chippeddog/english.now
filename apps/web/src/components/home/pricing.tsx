import { useNavigate } from "@tanstack/react-router";
import { CheckIcon, Loader2, StarIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { openCheckout } from "@/lib/paddle";
import _plans from "@/lib/plans";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import {
	Carousel,
	type CarouselApi,
	CarouselContent,
	CarouselItem,
} from "../ui/carousel";

export function Pricing() {
	const { data: session } = authClient.useSession();
	const [isLoading, setIsLoading] = useState(false);
	const navigate = useNavigate();
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

	const renderPlanCard = (_plan: (typeof _plans)[number]) => (
		<div
			className={`relative min-h-[428px] w-full gap-6 overflow-hidden rounded-3xl bg-background p-6 ${_plan.isPopular ? "border-[#C6F64D]" : ""}`}
			style={{
				boxShadow:
					"0 0 0 1px rgba(0,0,0,.05),0 10px 10px -5px rgba(0,0,0,.04),0 20px 25px -5px rgba(0,0,0,.04),0 20px 32px -12px rgba(0,0,0,.04)",
			}}
		>
			<div className="relative z-10 mb-4">
				<div className="flex flex-col gap-1.5">
					<div
						data-slot="card-title"
						className="flex items-center gap-2 font-semibold text-lg"
					>
						<span className="font-bold font-lyon text-2xl">{_plan.name}</span>
						{_plan.duration === "year" && (
							<span className="rounded-md bg-radial from-[#EFFF9B] to-[#D8FF76] px-2 py-3 font-semibold text-lime-900 text-sm normal-case tracking-normal md:py-[0.250rem] md:text-xs">
								Save 20%
							</span>
						)}
					</div>
					<div className="text-muted-foreground text-sm">
						{_plan.description}
					</div>
				</div>
			</div>
			<div className="relative z-10 flex items-baseline">
				<div className="font-semibold text-3xl leading-none tracking-snug md:text-4xl">
					${_plan.price}
				</div>
				<div className="ml-1 text-muted-foreground text-sm md:text-sm md:leading-7">
					/{_plan.duration}
				</div>
			</div>
			<div className="relative z-10 my-6 flex items-center gap-4">
				<Button
					disabled={isLoading}
					variant={_plan.isPopular ? "default" : "outline"}
					onClick={() => handlePlanClick(_plan)}
					className={cn(
						"inline-flex h-9 w-full cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-4 py-2 font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
						_plan.isPopular
							? "h-9 bg-linear-to-t from-[#202020] to-[#2F2F2F] text-white shadow-[inset_0_1px_4px_0_rgba(255,255,255,0.4)] outline-none transition-all hover:opacity-90 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:shadow-[inset_0_1px_4px_0_rgba(128,128,128,0.2)] [&_svg]:pointer-events-none"
							: "h-9 border border-border/50 bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
					)}
				>
					{isLoading ? (
						<Loader2 className="size-4 animate-spin" />
					) : _plan.price > 0 ? (
						"Start 7-day trial"
					) : (
						"Get started"
					)}
				</Button>
			</div>
			<div className="relative z-10 mb-4 font-medium text-black/50 text-sm">
				What's included
			</div>
			<ul className="relative z-10 space-y-3 text-sm">
				{_plan.features.map((feature) => (
					<li className="flex items-center justify-start gap-2" key={feature}>
						<CheckIcon className="size-4 shrink-0 text-muted-foreground" />
						{feature}
					</li>
				))}
			</ul>
		</div>
	);

	const renderPopularWrapper = (
		children: React.ReactNode,
		extraClassName?: string,
	) => (
		<div
			className={cn("rounded-[1.7rem] p-2", extraClassName)}
			style={{
				background:
					"linear-gradient(180deg, #EFFF9B 0%, #D8FF76 60%, #C6F64D 100%)",
				boxShadow: "inset 0 0 0 1px #C6F64D, inset 0 0 8px 2px #C6F64D",
			}}
		>
			<div className="mt-1.5 mb-2.5 flex items-center justify-center gap-1.5 text-center font-medium text-lime-900 text-sm">
				<StarIcon fill="currentColor" className="size-4" />
				Most Popular
			</div>
			{children}
		</div>
	);

	const renderPlans = () => (
		<>
			{/* Desktop */}
			<div className="relative hidden w-full flex-row items-center justify-between gap-3 md:flex">
				{_plans.map((_plan) => (
					<div className="w-full" key={_plan.name}>
						{_plan.isPopular ? (
							<div className="relative">
								{renderPopularWrapper(renderPlanCard(_plan))}
							</div>
						) : (
							<div className="relative">
								<div className="p-2">{renderPlanCard(_plan)}</div>
							</div>
						)}
					</div>
				))}
			</div>

			{/* Mobile carousel */}
			<div className="overflow-hidden md:hidden">
				<Carousel
					opts={{
						align: "center",
						startIndex: 1,
					}}
					setApi={setCarouselApi}
				>
					<CarouselContent className="-ml-4">
						{_plans.map((_plan) => (
							<CarouselItem key={_plan.name} className="basis-[80%] pl-4">
								{_plan.isPopular
									? renderPopularWrapper(renderPlanCard(_plan))
									: renderPlanCard(_plan)}
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
		</>
	);

	async function handlePlanClick(plan: (typeof _plans)[number]) {
		setIsLoading(true);
		if (!plan.paddlePriceId) {
			navigate({ to: "/signup" });
			return;
		}

		if (!session?.user) {
			navigate({ to: "/signup" });
			return;
		}

		await openCheckout({
			priceId: plan.paddlePriceId,
			userId: session.user.id,
			email: session.user.email,
		}).finally(() => {
			setIsLoading(false);
		});
	}
	return (
		<div className="mx-auto mt-24">
			<div className="mb-14 text-center">
				<h2 className="mb-4 font-bold font-lyon text-4xl tracking-tight md:text-5xl">
					Pricing
				</h2>
				<p className="text-balance text-center text-muted-foreground text-sm md:mx-auto md:max-w-boundary-sm md:text-lg">
					Choose the plan that's right for you.
				</p>
			</div>
			{renderPlans()}
		</div>
	);
}
