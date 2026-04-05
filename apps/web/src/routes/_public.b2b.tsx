import { createFileRoute, Link } from "@tanstack/react-router";
import {
	ArrowRight,
	BarChart3,
	BriefcaseBusiness,
	Building2,
	CheckCircle2,
	Globe2,
	GraduationCap,
	type LucideIcon,
	ShieldCheck,
	Users,
} from "lucide-react";

export const Route = createFileRoute("/_public/b2b")({
	component: B2BPage,
	head: () => ({
		meta: [
			{
				title: "English Now for Enterprise",
			},
			{
				name: "description",
				content:
					"Example enterprise page for teams that want AI-powered English practice, progress tracking, and scalable onboarding.",
			},
		],
	}),
});

type Feature = {
	title: string;
	description: string;
	icon: LucideIcon;
};

const HERO_STATS = [
	{
		value: "2-4 weeks",
		label: "Typical pilot launch",
	},
	{
		value: "20-5,000+",
		label: "Team sizes supported",
	},
	{
		value: "24/7",
		label: "Practice availability across time zones",
	},
] satisfies ReadonlyArray<{ value: string; label: string }>;

const SOLUTIONS: readonly Feature[] = [
	{
		title: "Role-specific learning paths",
		description:
			"Create practice tracks for sales, support, operations, and leadership with vocabulary tied to real work.",
		icon: BriefcaseBusiness,
	},
	{
		title: "Speaking practice at scale",
		description:
			"Give every employee guided AI conversations, instant feedback, and repetition without scheduling live tutors.",
		icon: GraduationCap,
	},
	{
		title: "Manager visibility",
		description:
			"Track activation, practice consistency, and progress signals so L&D teams can prove adoption and impact.",
		icon: BarChart3,
	},
];

const USE_CASES: readonly Feature[] = [
	{
		title: "Customer support teams",
		description:
			"Train for empathy, escalations, and confident spoken English in customer-facing scenarios.",
		icon: Users,
	},
	{
		title: "Global sales teams",
		description:
			"Practice discovery calls, demos, objection handling, and follow-ups before important meetings.",
		icon: Globe2,
	},
	{
		title: "Distributed companies",
		description:
			"Offer one scalable learning experience for employees working across regions, shifts, and time zones.",
		icon: Building2,
	},
] as const;

const ADMIN_FEATURES = [
	"Dedicated onboarding support for your pilot or rollout.",
	"Structured cohorts by team, role, or language level.",
	"Clear usage and progress reporting for managers.",
	"Enterprise-ready setup with secure access patterns.",
] as const;

const LEARNER_FEATURES = [
	"AI speaking sessions built around realistic workplace situations.",
	"Instant feedback on phrasing, clarity, and confidence.",
	"Repeatable practice loops instead of one-off chat responses.",
	"Flexible daily usage that fits busy work schedules.",
] as const;

function B2BPage() {
	return (
		<div className="relative overflow-hidden bg-[#070b14] text-white">
			{/* <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(198,246,77,0.16),transparent_32%),radial-gradient(circle_at_80%_20%,rgba(99,102,241,0.18),transparent_24%)]" /> */}
			<section className="container relative mx-auto max-w-5xl px-4 pt-14 pb-12 md:pt-24 md:pb-18">
				<div className="grid items-end gap-12 lg:grid-cols-[minmax(0,1fr)_360px]">
					<div className="max-w-3xl">
						<span className="-skew-x-12 inline-block whitespace-nowrap rounded-lg border border-gray-200 bg-linear-to-br from-gray-800 to-gray-900 px-2 py-1 font-sans font-semibold text-sm text-white leading-none will-change-transform dark:from-gray-50 dark:to-gray-100 dark:text-gray-900">
							<span>Enterprise</span>
						</span>
						<h1 className="mt-6 font-bold font-lyon text-5xl tracking-tight md:text-7xl">
							English training for teams that need real communication.
						</h1>
						<p className="mt-6 max-w-2xl text-balance text-lg text-neutral-300 leading-8">
							English Now helps companies improve spoken English across customer
							support, sales, and global operations with AI practice that is
							consistent, scalable, and measurable.
						</p>
						<div className="mt-8 flex flex-col gap-3 sm:flex-row">
							<Link
								to="/contact"
								className="inline-flex h-11 items-center justify-center rounded-xl bg-[#d8ff76] px-5 font-semibold text-[#11140c] transition hover:bg-[#e6ff9f]"
							>
								Talk to sales
							</Link>
							<Link
								to="/signup"
								className="inline-flex h-11 items-center justify-center rounded-xl border border-white/12 bg-white/5 px-5 font-medium text-white transition hover:bg-white/10"
							>
								Start a pilot
							</Link>
						</div>
					</div>

					<div className="rounded-3xl border border-white/10 bg-white/4 p-6 shadow-2xl shadow-black/20 backdrop-blur">
						<div className="flex items-center gap-3">
							<div className="flex size-11 items-center justify-center rounded-2xl bg-[#d8ff76] text-[#11140c]">
								<ShieldCheck className="size-5" />
							</div>
							<div>
								<p className="font-medium text-neutral-200 text-sm">
									Enterprise-ready rollout
								</p>
								<p className="text-neutral-400 text-sm">
									Pilot first, then expand by team.
								</p>
							</div>
						</div>
						<div className="mt-6 space-y-3">
							{[
								"Speaking practice aligned to job roles",
								"Clear reporting for managers and L&D",
								"Always-on access for distributed teams",
							].map((item) => (
								<div
									key={item}
									className="flex items-start gap-3 rounded-2xl border border-white/8 bg-black/20 px-4 py-3"
								>
									<CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#d8ff76]" />
									<span className="text-neutral-200 text-sm">{item}</span>
								</div>
							))}
						</div>
					</div>
				</div>

				<div className="mt-10 grid gap-4 md:grid-cols-3">
					{HERO_STATS.map((stat) => (
						<div
							key={stat.label}
							className="rounded-3xl border border-white/8 bg-white/3 px-5 py-6"
						>
							<div className="font-semibold text-3xl text-white">
								{stat.value}
							</div>
							<div className="mt-2 text-neutral-400 text-sm">{stat.label}</div>
						</div>
					))}
				</div>
			</section>

			<section className="container relative mx-auto max-w-5xl px-4 py-10 md:py-16">
				<div className="max-w-2xl">
					<p className="font-medium text-[#d8ff76] text-sm uppercase tracking-[0.18em]">
						Solutions
					</p>
					<h2 className="mt-4 font-bold font-lyon text-4xl tracking-tight md:text-5xl">
						What companies actually buy from us
					</h2>
				</div>
				<div className="mt-8 grid gap-5 md:grid-cols-3">
					{SOLUTIONS.map((item) => (
						<div
							key={item.title}
							className="rounded-3xl border border-white/8 bg-white/3 p-6"
						>
							<div className="flex size-11 items-center justify-center rounded-2xl bg-white/6 text-[#d8ff76]">
								<item.icon className="size-5" />
							</div>
							<h3 className="mt-5 font-semibold text-xl">{item.title}</h3>
							<p className="mt-3 text-neutral-400 leading-7">
								{item.description}
							</p>
						</div>
					))}
				</div>
			</section>

			<section className="container relative mx-auto max-w-5xl px-4 py-10 md:py-16">
				<div className="rounded-4xl border border-white/8 bg-[#0d1220] p-6 md:p-10">
					<div className="max-w-2xl">
						<p className="font-medium text-[#d8ff76] text-sm uppercase tracking-[0.18em]">
							Use Cases
						</p>
						<h2 className="mt-4 font-bold font-lyon text-4xl tracking-tight md:text-5xl">
							Fit the product to the team, not the other way around
						</h2>
					</div>
					<div className="mt-8 grid gap-5 md:grid-cols-3">
						{USE_CASES.map((item) => (
							<div
								key={item.title}
								className="rounded-3xl border border-white/8 bg-white/3 p-6"
							>
								<item.icon className="size-5 text-[#d8ff76]" />
								<h3 className="mt-4 font-semibold text-xl">{item.title}</h3>
								<p className="mt-3 text-neutral-400 leading-7">
									{item.description}
								</p>
							</div>
						))}
					</div>
				</div>
			</section>

			<section className="container relative mx-auto max-w-5xl px-4 py-10 md:py-16">
				<div className="grid gap-6 lg:grid-cols-2">
					<div className="rounded-4xl border border-white/8 bg-white/3 p-6 md:p-8">
						<h2 className="font-bold font-lyon text-3xl tracking-tight md:text-4xl">
							What learners get
						</h2>
						<div className="mt-6 space-y-4">
							{LEARNER_FEATURES.map((item) => (
								<div key={item} className="flex items-start gap-3">
									<CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#d8ff76]" />
									<p className="text-neutral-300 leading-7">{item}</p>
								</div>
							))}
						</div>
					</div>

					<div className="rounded-4xl border border-white/8 bg-white/3 p-6 md:p-8">
						<h2 className="font-bold font-lyon text-3xl tracking-tight md:text-4xl">
							What admins get
						</h2>
						<div className="mt-6 space-y-4">
							{ADMIN_FEATURES.map((item) => (
								<div key={item} className="flex items-start gap-3">
									<CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#d8ff76]" />
									<p className="text-neutral-300 leading-7">{item}</p>
								</div>
							))}
						</div>
					</div>
				</div>
			</section>

			<section className="container relative mx-auto max-w-5xl px-4 pt-10 pb-18 md:pt-16 md:pb-24">
				<div className="rounded-4xl border border-[#d8ff76]/30 bg-[linear-gradient(135deg,rgba(216,255,118,0.12),rgba(255,255,255,0.04))] p-8 md:p-10">
					<p className="font-medium text-[#d8ff76] text-sm uppercase tracking-[0.18em]">
						Next step
					</p>
					<h2 className="mt-4 max-w-3xl font-bold font-lyon text-4xl tracking-tight md:text-5xl">
						Start with a simple pilot, then roll out to the rest of the
						organization.
					</h2>
					<p className="mt-5 max-w-2xl text-lg text-neutral-300 leading-8">
						This is a sample enterprise page for now, but it is ready to act as
						the foundation for a real sales landing page with case studies,
						security details, and a proper demo request flow.
					</p>
					<div className="mt-8 flex flex-col gap-3 sm:flex-row">
						<Link
							to="/contact"
							className="inline-flex h-11 items-center justify-center rounded-xl bg-[#d8ff76] px-5 font-semibold text-[#11140c] transition hover:bg-[#e6ff9f]"
						>
							Request a demo
							<ArrowRight className="ml-2 size-4" />
						</Link>
						<Link
							to="/about"
							className="inline-flex h-11 items-center justify-center rounded-xl border border-white/12 bg-white/5 px-5 font-medium text-white transition hover:bg-white/10"
						>
							Learn more about English Now
						</Link>
					</div>
				</div>
			</section>
		</div>
	);
}
