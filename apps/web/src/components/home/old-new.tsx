import { ArrowRight, CheckIcon, Sparkles, XIcon } from "lucide-react";
import type { ReactNode } from "react";

type ComparisonItem = {
	beforeTitle: string;
	beforeDescription: string;
	afterTitle: string;
	afterDescription: string;
};

const COMPARISON_ITEMS: readonly ComparisonItem[] = [
	{
		beforeTitle: "Passive study",
		beforeDescription:
			"Grammar rules, saved posts, and random videos pile up without enough real speaking practice.",
		afterTitle: "Real conversation practice",
		afterDescription:
			"English.now gives you guided speaking sessions built around situations you actually want to handle.",
	},
	{
		beforeTitle: "Late or missing feedback",
		beforeDescription:
			"You repeat the same mistakes because nobody catches them while you are speaking.",
		afterTitle: "Corrections while it is fresh",
		afterDescription:
			"Get instant feedback on wording, grammar, and clarity before the mistake becomes a habit.",
	},
	{
		beforeTitle: "Everything feels disconnected",
		beforeDescription:
			"Your notes, vocabulary, and practice all live in different places, so progress feels messy.",
		afterTitle: "One focused learning loop",
		afterDescription:
			"Practice, review, and repetition stay connected so every session builds on the last one.",
	},
	{
		beforeTitle: "Momentum breaks easily",
		beforeDescription:
			"Miss a lesson or lose motivation for a few days, and your English routine disappears.",
		afterTitle: "Practice whenever you are ready",
		afterDescription:
			"Open the app, speak for a few minutes, and keep moving forward without scheduling around anyone else.",
	},
];

const WARM_PREVIEW_ROWS = [
	{ id: "amber-1", className: "bg-amber-300" },
	{ id: "neutral-1", className: "bg-neutral-200" },
	{ id: "neutral-2", className: "bg-neutral-200" },
	{ id: "rose-1", className: "bg-rose-200" },
	{ id: "neutral-3", className: "bg-neutral-200" },
	{ id: "amber-2", className: "bg-amber-300" },
	{ id: "rose-2", className: "bg-rose-200" },
	{ id: "neutral-4", className: "bg-neutral-200" },
	{ id: "neutral-5", className: "bg-neutral-200" },
	{ id: "rose-3", className: "bg-rose-200" },
	{ id: "amber-3", className: "bg-amber-300" },
	{ id: "neutral-6", className: "bg-neutral-200" },
	{ id: "rose-4", className: "bg-rose-200" },
	{ id: "neutral-7", className: "bg-neutral-200" },
	{ id: "neutral-8", className: "bg-neutral-200" },
] as const;

function PreviewLabel({ children }: { children: ReactNode }) {
	return (
		<span className="rounded-full bg-neutral-900 px-4 py-1 font-medium text-white text-xs tracking-wide">
			{children}
		</span>
	);
}

function OldWayPreview() {
	return (
		<div className="relative h-30 w-[188px] sm:h-36 sm:w-[232px]">
			<div
				className="absolute inset-x-8 top-5 h-22 rounded-2xl border bg-white p-3 shadow-[0_20px_40px_-28px_rgba(0,0,0,0.45)] sm:h-24"
				style={{ transform: "rotate(-8deg)" }}
			>
				<div className="flex items-center gap-1.5">
					<span className="h-2 w-10 rounded-full bg-amber-200" />
					<span className="h-2 w-6 rounded-full bg-neutral-200" />
				</div>
				<div className="mt-3 space-y-1.5">
					<div className="h-2 rounded-full bg-neutral-100" />
					<div className="h-2 w-[82%] rounded-full bg-neutral-100" />
					<div className="h-2 w-[64%] rounded-full bg-neutral-100" />
				</div>
			</div>
			<div
				className="absolute inset-x-4 top-3 h-22 rounded-2xl border bg-[#FFF7E6] p-3 shadow-[0_20px_40px_-28px_rgba(0,0,0,0.45)] sm:h-24"
				style={{ transform: "rotate(-2deg)" }}
			>
				<div className="grid grid-cols-5 gap-1">
					{WARM_PREVIEW_ROWS.map((item) => (
						<span
							key={item.id}
							className={`h-2 rounded-full ${item.className}`}
						/>
					))}
				</div>
			</div>
			<div className="absolute inset-x-0 top-0 h-24 rounded-2xl border bg-white p-3 shadow-[0_24px_48px_-28px_rgba(0,0,0,0.55)] sm:h-26">
				<div className="grid grid-cols-[24px_1fr_1fr] gap-2">
					<div className="space-y-1.5">
						<div className="h-2 rounded-full bg-neutral-200" />
						<div className="h-2 rounded-full bg-neutral-200" />
						<div className="h-2 rounded-full bg-neutral-200" />
						<div className="h-2 rounded-full bg-neutral-200" />
					</div>
					<div className="space-y-1.5">
						<div className="h-2 rounded-full bg-lime-200" />
						<div className="h-2 rounded-full bg-amber-200" />
						<div className="h-2 rounded-full bg-sky-200" />
						<div className="h-2 rounded-full bg-rose-200" />
					</div>
					<div className="space-y-1.5">
						<div className="h-2 rounded-full bg-sky-200" />
						<div className="h-2 rounded-full bg-rose-200" />
						<div className="h-2 rounded-full bg-lime-200" />
						<div className="h-2 rounded-full bg-amber-200" />
					</div>
				</div>
			</div>
		</div>
	);
}

function EnglishNowPreview() {
	return (
		<div className="relative flex h-30 w-30 items-center justify-center">
			<div className="absolute inset-0 rounded-4xl border border-white/60" />
			<Sparkles className="-left-5 absolute top-3 size-4 text-[#C6D87B]" />
			<Sparkles className="-right-4 absolute bottom-5 size-3.5 text-[#C6D87B]" />
			<div className="relative size-20 overflow-hidden rounded-3xl border border-[#C6F64D] bg-[radial-gradient(100%_100%_at_50%_0%,#EFFF9B_0%,#D8FF76_60%,#C6F64D_100%)]">
				<img
					className="absolute bottom-[-15px] h-full w-full object-contain"
					src="/logo.svg"
					alt="English Now Logo"
					width={62}
					height={62}
				/>
			</div>
		</div>
	);
}

function ComparisonCell({
	icon,
	title,
	description,
	accent,
}: {
	icon: ReactNode;
	title: string;
	description: string;
	accent: "before" | "after";
}) {
	const iconClassName =
		accent === "after"
			? "border-emerald-200 bg-emerald-50 text-emerald-600"
			: "border-rose-200 bg-rose-50 text-rose-500";

	return (
		<div className="flex items-start gap-3">
			<div
				className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${iconClassName}`}
			>
				{icon}
			</div>
			<div>
				<h3 className="font-semibold text-base text-neutral-900">{title}</h3>
				<p className="mt-1 text-muted-foreground text-sm leading-relaxed sm:text-[15px]">
					{description}
				</p>
			</div>
		</div>
	);
}

export function OldNew() {
	return (
		<section className="mx-auto mt-16 max-w-5xl md:mt-24">
			<div className="mx-auto mb-10 max-w-2xl text-center md:mb-14">
				<h2 className="mb-4 font-bold font-lyon text-4xl tracking-tight md:text-5xl">
					From old-school English study to real fluency
				</h2>
				<p className="text-balance text-muted-foreground text-sm md:text-lg">
					English.now replaces scattered study habits with structured speaking
					practice, instant feedback, and a clearer path to confident English.
				</p>
			</div>

			<div className="overflow-hidden sm:p-8 md:p-10">
				<div className="flex flex-col items-center justify-around gap-6 sm:gap-8 md:flex-row md:gap-14">
					<div className="flex flex-col items-center gap-4">
						<OldWayPreview />
						<PreviewLabel>Before</PreviewLabel>
					</div>

					{/* <ArrowRight className="size-10 rotate-90 text-neutral-300 md:size-12 md:rotate-0" /> */}

					<div className="flex flex-col items-center gap-4">
						<EnglishNowPreview />
						<PreviewLabel>After</PreviewLabel>
					</div>
				</div>

				<div className="mt-8 border-border/60 border-t pt-2 sm:mt-10">
					{COMPARISON_ITEMS.map((item) => (
						<div
							key={item.beforeTitle}
							className="grid gap-5 border-border/60 border-b py-5 last:border-b-0 md:grid-cols-2 md:gap-10 md:py-6"
						>
							<ComparisonCell
								icon={<XIcon className="size-4" />}
								title={item.beforeTitle}
								description={item.beforeDescription}
								accent="before"
							/>
							<div className="md:border-border/60 md:border-l md:pl-10">
								<ComparisonCell
									icon={<CheckIcon className="size-4" />}
									title={item.afterTitle}
									description={item.afterDescription}
									accent="after"
								/>
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
