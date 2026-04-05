import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Compare } from "@/components/home/compare";
import FAQ from "@/components/home/faq";
import { Features } from "@/components/home/features";
//import { Features as FeaturesA } from "@/components/home/features_a";
import Hero from "@/components/home/hero";
// import { Letter } from "@/components/home/letter";
import { OldNew } from "@/components/home/old-new";
import { Pricing } from "@/components/home/pricing";
import { Start } from "@/components/home/start";
// import { UseCases } from "@/components/home/use-cases";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_public/")({
	component: HomeComponent,
});

function HomeComponent() {
	const trpc = useTRPC();
	useQuery(trpc.healthCheck.queryOptions());

	return (
		<div className="container relative z-10 mx-auto max-w-5xl px-4">
			<Hero />
			<hr className="my-16 border-border/50 border-t md:my-24" />
			<Features />
			{/* <FeaturesA /> */}
			{/* <UseCases /> */}
			{/* <OldNew /> */}
			<Compare />
			{/* <Letter /> */}
			<Pricing />
			<FAQ />
			<Start />
		</div>
	);
}
