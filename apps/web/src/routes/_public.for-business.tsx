import { createFileRoute, Link } from "@tanstack/react-router";
import {
	BarChart3,
	BriefcaseBusiness,
	Building2,
	Check,
	Globe2,
	Headset,
	type LucideIcon,
	MessagesSquare,
} from "lucide-react";
import { DemoRequestForm } from "@/components/for-business/demo-request-form";
import HeroC from "@/components/home/hero_c";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { PUBLIC_PAGES, seo } from "@/utils/seo";

export const Route = createFileRoute("/_public/for-business")({
	component: ForBusinessPage,
	head: () => seo(PUBLIC_PAGES.forBusiness),
});

type Feature = {
	title: string;
	description: string;
	icon: LucideIcon;
};

const HERO_POINTS = [
	"Practice scenarios matched to each role",
	"Progress reporting for managers and L&D",
	"Available around the clock, in every time zone",
] as const;

const SOLUTIONS: readonly Feature[] = [
	{
		title: "Role-specific practice",
		description:
			"Sales, support, operations, and leadership each get scenarios and vocabulary from their own work.",
		icon: BriefcaseBusiness,
	},
	{
		title: "Speaking practice at scale",
		description:
			"Every employee gets guided AI conversations and instant feedback, without scheduling live tutors.",
		icon: MessagesSquare,
	},
	{
		title: "Visibility for managers",
		description:
			"See who's practicing, how often, and how levels change, so L&D can show adoption and impact.",
		icon: BarChart3,
	},
];

const USE_CASES: readonly Feature[] = [
	{
		title: "Customer support",
		description:
			"Handle escalations, explain fixes clearly, and sound calm and friendly on live calls.",
		icon: Headset,
	},
	{
		title: "Global sales",
		description:
			"Rehearse discovery calls, demos, objection handling, and follow-ups before the real meeting.",
		icon: Globe2,
	},
	{
		title: "Distributed companies",
		description:
			"Give employees across regions and shifts one learning experience they can use on their own schedule.",
		icon: Building2,
	},
];

const AUDIENCES = [
	{
		title: "For employees",
		items: [
			"AI speaking sessions built around realistic workplace situations.",
			"Instant feedback on phrasing, clarity, and pronunciation.",
			"Short daily practice that fits around meetings and shifts.",
			"Practice at their own CEFR level, from A1 to C2.",
		],
	},
	{
		title: "For managers and L&D",
		items: [
			"Onboarding support for your pilot and rollout.",
			"Learners grouped by team, role, or level.",
			"Activity and progress reporting for every team.",
			"One workspace to invite, manage, and remove members.",
		],
	},
] as const;

const PILOT_STEPS = [
	{
		title: "Intro call",
		description:
			"Tell us which teams you want to train, where they struggle, and how you'll measure success.",
	},
	{
		title: "Pilot with one team",
		description:
			"We set up your workspace and invite the first group. Most pilots launch within 2–4 weeks.",
	},
	{
		title: "Review and roll out",
		description:
			"Look at activation and progress together, then add teams one at a time.",
	},
] as const;

const FAQ_ITEMS = [
	{
		question: "Can we try English Now before rolling it out?",
		answer:
			"Yes. Most companies start with a pilot for one team. On the intro call we agree on the scope, the number of learners, and what success looks like.",
	},
	{
		question: "Which English levels does it cover?",
		answer:
			"All CEFR levels from A1 to C2. Each learner practices at their own level, so beginners and fluent speakers can be on the same team.",
	},
	{
		question: "Can employees use the app in their own language?",
		answer:
			"Yes. The interface is available in 14 languages, so beginners can follow instructions while they practice English.",
	},
	{
		question: "What do managers see?",
		answer:
			"A team dashboard with practice activity over time, the mix of CEFR levels across the team, and progress for each member.",
	},
	{
		question: "How is pricing calculated?",
		answer:
			"Pricing depends on the number of learners and the scope of the rollout. We send a quote after the intro call.",
	},
] as const;

const RULE = "border-[rgba(23,32,51,0.08)]";

function ForBusinessPage() {
	return (
		<div className="relative overflow-hidden bg-white text-[#172033]">
			<section className="container mx-auto max-w-6xl px-4 pt-14 pb-16 md:pt-20 md:pb-20">
				<div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_440px] lg:gap-16">
					<div className="max-w-xl lg:pt-8">
						<div className="flex items-center gap-2 font-medium text-sm">
							For Business
						</div>
						<h1 className="mt-6 max-w-[18ch] text-balance font-geist-serif font-normal text-[clamp(2.5rem,5.4vw,4.25rem)] leading-[1.02] tracking-[-0.035em]">
							Confident spoken English for every team.
						</h1>
						<p className="mt-5 max-w-[56ch] text-[#5B6478] text-lg leading-[1.55]">
							English Now gives employees daily AI speaking practice built
							around their real work, from support calls to sales demos.
							Managers see who's practicing and how levels change.
						</p>
						<ul className="mt-8 space-y-3">
							{HERO_POINTS.map((point) => (
								<li key={point} className="flex items-start gap-3">
									<Check className="mt-1 size-4 shrink-0 text-now-deep" />
									<span className="leading-[1.6]">{point}</span>
								</li>
							))}
						</ul>
					</div>

					<div id="demo-request" className="scroll-mt-28">
						<DemoRequestForm />
					</div>
				</div>
			</section>

			<section className="container mx-auto max-w-6xl px-4">
				<HeroC />
			</section>

			<section className="container mx-auto max-w-5xl px-4 py-20 md:py-28">
				<h2 className="max-w-[24ch] font-semibold text-[2.25rem] leading-[1.12] tracking-[-0.022em]">
					Practice that fits the job.{" "}
					<span className="text-[#5B6478]">
						Each team works on the conversations it has every day, and managers
						can see the results.
					</span>
				</h2>
				<div
					className={`mt-12 grid divide-y border-y md:grid-cols-3 md:divide-x md:divide-y-0 ${RULE} divide-[rgba(23,32,51,0.08)]`}
				>
					{SOLUTIONS.map((item) => (
						<div key={item.title} className="py-8 md:px-8 md:first:pl-0">
							<span className="flex size-8 items-center justify-center rounded-md bg-[#F5F7FA]">
								<item.icon className="size-4" />
							</span>
							<h3 className="mt-5 font-semibold text-[1.3125rem] leading-[1.3] tracking-[-0.012em]">
								{item.title}
							</h3>
							<p className="mt-2 text-[#5B6478] leading-[1.6]">
								{item.description}
							</p>
						</div>
					))}
				</div>
			</section>

			<div className="container mx-auto max-w-5xl px-4">
				<hr className={RULE} />
			</div>

			<section className="container mx-auto grid max-w-5xl gap-12 px-4 py-20 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:py-28">
				<h2 className="max-w-[22ch] font-semibold text-[2.25rem] leading-[1.12] tracking-[-0.022em]">
					Built for teams that talk to the world.{" "}
					<span className="text-[#5B6478]">
						Start with the one that needs it most.
					</span>
				</h2>
				<ul
					className={`divide-y border-y ${RULE} divide-[rgba(23,32,51,0.08)]`}
				>
					{USE_CASES.map((item) => (
						<li key={item.title} className="flex gap-4 py-6">
							<item.icon className="mt-1 size-5 shrink-0 text-[#5B6478]" />
							<div>
								<h3 className="font-semibold text-[1.3125rem] leading-[1.3] tracking-[-0.012em]">
									{item.title}
								</h3>
								<p className="mt-1.5 max-w-[56ch] text-[#5B6478] leading-[1.6]">
									{item.description}
								</p>
							</div>
						</li>
					))}
				</ul>
			</section>

			<section className="container mx-auto max-w-5xl px-4 pb-20 md:pb-28">
				<div
					className={`grid rounded-2xl border md:grid-cols-2 ${RULE} divide-y divide-[rgba(23,32,51,0.08)] md:divide-x md:divide-y-0`}
				>
					{AUDIENCES.map((audience) => (
						<div key={audience.title} className="p-6 md:p-10">
							<h3 className="font-semibold text-[1.3125rem] leading-[1.3] tracking-[-0.012em]">
								{audience.title}
							</h3>
							<ul className="mt-6 space-y-4">
								{audience.items.map((item) => (
									<li key={item} className="flex items-start gap-3">
										<Check className="mt-1 size-4 shrink-0 text-[#5B6478]" />
										<span className="leading-[1.6]">{item}</span>
									</li>
								))}
							</ul>
						</div>
					))}
				</div>
			</section>

			<section className="bg-[#F5F7FA]">
				<div className="container mx-auto max-w-5xl px-4 py-20 md:py-28">
					<h2 className="max-w-[22ch] font-semibold text-[2.25rem] leading-[1.12] tracking-[-0.022em]">
						Start small, then roll out.{" "}
						<span className="text-[#5B6478]">
							A pilot with one team shows what works before you commit.
						</span>
					</h2>
					<ol className="mt-12 grid gap-8 md:grid-cols-3 md:gap-10">
						{PILOT_STEPS.map((step, index) => (
							<li
								key={step.title}
								className="border-[rgba(23,32,51,0.14)] border-t pt-6"
							>
								<span className="flex size-7 items-center justify-center rounded-full bg-white font-medium text-sm tabular-nums shadow-[0_0_0_1px_rgba(23,32,51,0.08)]">
									{index + 1}
								</span>
								<h3 className="mt-5 font-semibold text-[1.3125rem] leading-[1.3] tracking-[-0.012em]">
									{step.title}
								</h3>
								<p className="mt-2 text-[#5B6478] leading-[1.6]">
									{step.description}
								</p>
							</li>
						))}
					</ol>
				</div>
			</section>

			<section className="container mx-auto grid max-w-5xl gap-10 px-4 py-20 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:py-28">
				<div>
					<h2 className="max-w-[16ch] font-semibold text-[2.25rem] leading-[1.12] tracking-[-0.022em]">
						Questions teams ask before a pilot
					</h2>
					<p className="mt-4 text-[#5B6478] leading-[1.6]">
						Something else on your mind?{" "}
						<Link
							to="/contact"
							className="font-medium text-[#172033] underline underline-offset-2 hover:text-[#172033]/80"
						>
							Contact us
						</Link>
						.
					</p>
				</div>
				<Accordion type="single" collapsible className={`border-t ${RULE}`}>
					{FAQ_ITEMS.map((item) => (
						<AccordionItem
							key={item.question}
							value={item.question}
							className={`border-b ${RULE}`}
						>
							<AccordionTrigger className="cursor-pointer py-5 text-left font-medium text-base hover:no-underline">
								{item.question}
							</AccordionTrigger>
							<AccordionContent className="pb-5">
								<p className="max-w-[60ch] text-[#5B6478] text-base leading-[1.6]">
									{item.answer}
								</p>
							</AccordionContent>
						</AccordionItem>
					))}
				</Accordion>
			</section>

			<section className="container mx-auto max-w-5xl px-4 pb-20 md:pb-28">
				<div
					className={`flex flex-col items-center rounded-2xl border px-6 py-16 text-center md:py-20 ${RULE}`}
				>
					<h2 className="max-w-[18ch] font-geist-serif font-normal text-[clamp(2.25rem,4.4vw,3.5rem)] leading-[1.05] tracking-[-0.03em]">
						Start with one team.
					</h2>
					<p className="mt-4 max-w-[48ch] text-[#5B6478] text-lg leading-[1.55]">
						Tell us about your team, and we'll plan a pilot that fits how they
						work.
					</p>
					<div className="mt-8 flex flex-col gap-3 sm:flex-row">
						<Button
							asChild
							className="h-10 rounded-[10px] bg-[#172033] px-5 text-white hover:bg-[#172033]/90 focus-visible:ring-[#007AFF]/40"
						>
							<Link to="/book-a-demo">Book a demo</Link>
						</Button>
						<Button
							asChild
							variant="outline"
							className="h-10 rounded-[10px] border-[rgba(23,32,51,0.14)] bg-white px-5 text-[#172033] shadow-none hover:bg-[#F5F7FA] focus-visible:ring-[#007AFF]/40"
						>
							<Link to="/contact">Contact us</Link>
						</Button>
					</div>
				</div>
			</section>
		</div>
	);
}
