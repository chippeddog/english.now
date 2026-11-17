import { Trans, useTranslation } from "@english.now/i18n";
import { Link } from "@tanstack/react-router";
import {
	Bell,
	BookOpen,
	ChevronLeft,
	CircleHelp,
	House,
	MessagesSquare,
	Mic,
	PlayIcon,
	Plus,
	Search,
	Smartphone,
	Sparkles,
	Video,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import { cn } from "@/lib/utils";
import DialogDemo from "../dialog-demo";
import { Button } from "../ui/button";

type FaceTone = "peach" | "sky" | "violet" | "amber" | "mint";

type Highlight = {
	word: string;
	kind: "fix" | "error";
};

type ThreadMessage = {
	id: string;
	from: "now" | "you";
	time: string;
	text: string;
	highlight?: Highlight;
};

const sessions: {
	id: string;
	title: string;
	preview: string;
	active?: boolean;
	faces: FaceTone[];
	extra?: number;
}[] = [
	{
		id: "cafe",
		title: "Cafe order",
		preview: "I'd like a latte, please.",
		active: true,
		faces: ["sky", "peach"],
	},
	{
		id: "interview",
		title: "Job interview",
		preview: "Tell me about yourself.",
		faces: ["violet", "amber"],
		extra: 2,
	},
	{
		id: "airport",
		title: "Airport check-in",
		preview: "A window seat, please.",
		faces: ["mint"],
	},
	{
		id: "smalltalk",
		title: "Weekend small talk",
		preview: "How was your weekend?",
		faces: ["peach", "violet"],
	},
];

const recents: { id: string; title: string; preview: string }[] = [
	{
		id: "past",
		title: "Past tense drill",
		preview: "I went, not I goed.",
	},
	{
		id: "phrasal",
		title: "Phrasal verbs",
		preview: "Pick up the pace.",
	},
];

const thread: ThreadMessage[] = [
	{
		id: "m1",
		from: "now",
		time: "9:12 AM",
		text: "You're at a cafe. How do you order a latte?",
	},
	{
		id: "m2",
		from: "you",
		time: "9:13 AM",
		text: "I want a latte, please.",
		highlight: { word: "want", kind: "error" },
	},
	{
		id: "m3",
		from: "now",
		time: "9:13 AM",
		text: "Almost — I'd like a latte, please.",
		highlight: { word: "I'd like", kind: "fix" },
	},
	{
		id: "m4",
		from: "you",
		time: "9:14 AM",
		text: "I'd like a latte, please.",
	},
	{
		id: "m5",
		from: "now",
		time: "9:14 AM",
		text: "That's it. Sounds natural.",
	},
];

const faceToneClass: Record<FaceTone, string> = {
	peach: "bg-[#FFD0B5]",
	sky: "bg-[#C5E0FF]",
	violet: "bg-[#E3D4FF]",
	amber: "bg-[#FFE3A3]",
	mint: "bg-[#C8F5C4]",
};

function Face({ tone, className }: { tone: FaceTone; className?: string }) {
	return (
		<span
			className={cn(
				"relative inline-flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full",
				faceToneClass[tone],
				className,
			)}
		>
			<svg viewBox="0 0 32 32" className="size-[78%]" aria-hidden="true">
				<circle cx="11.5" cy="14" r="1.7" fill="#2b241c" />
				<circle cx="20.5" cy="14" r="1.7" fill="#2b241c" />
				<path
					d="M12.2 20.2c1.2 1.5 2.5 2.1 3.8 2.1s2.6-.6 3.8-2.1"
					fill="none"
					stroke="#2b241c"
					strokeWidth="1.5"
					strokeLinecap="round"
				/>
			</svg>
		</span>
	);
}

function NowMark({ className }: { className?: string }) {
	return (
		<span
			className={cn(
				"relative inline-flex size-7 shrink-0 overflow-hidden rounded-[9px] border border-[#C6F64D] bg-[radial-gradient(100%_100%_at_50%_0%,#EFFF9B_0%,#D8FF76_60%,#C6F64D_100%)]",
				className,
			)}
		>
			<img
				src="/logo.svg"
				alt=""
				className="-bottom-1 absolute h-[118%] w-full object-contain"
			/>
		</span>
	);
}

function FaceStack({ faces, extra }: { faces: FaceTone[]; extra?: number }) {
	return (
		<span className="ml-auto flex shrink-0 items-center">
			<span className="-space-x-1.5 flex">
				{faces.map((tone) => (
					<Face key={tone} tone={tone} className="size-5 ring-2 ring-white" />
				))}
			</span>
			{extra ? (
				<span className="ml-1 text-[11px] text-neutral-400">+{extra}</span>
			) : null}
		</span>
	);
}

function RichText({
	text,
	highlight,
	allowError,
}: {
	text: string;
	highlight?: Highlight;
	allowError?: boolean;
}) {
	if (!highlight) return text;
	if (highlight.kind === "error" && !allowError) return text;
	const index = text.indexOf(highlight.word);
	if (index < 0) return text;

	return (
		<>
			{text.slice(0, index)}
			<span
				className={
					highlight.kind === "fix"
						? "font-semibold text-lime-700"
						: "underline decoration-rose-400 decoration-wavy underline-offset-[3px]"
				}
			>
				{highlight.word}
			</span>
			{text.slice(index + highlight.word.length)}
		</>
	);
}

function RailIcon({
	children,
	active,
}: {
	children: ReactNode;
	active?: boolean;
}) {
	return (
		<span
			className={cn(
				"flex size-8 items-center justify-center rounded-lg text-neutral-400",
				active && "bg-neutral-900 text-white",
			)}
		>
			{children}
		</span>
	);
}

function StatusIcons() {
	return (
		<span className="flex items-center gap-[5px] text-neutral-950">
			<svg width="15" height="10" viewBox="0 0 15 10" aria-hidden="true">
				<rect x="0" y="6" width="2.4" height="4" rx="0.5" fill="currentColor" />
				<rect x="4" y="4" width="2.4" height="6" rx="0.5" fill="currentColor" />
				<rect x="8" y="2" width="2.4" height="8" rx="0.5" fill="currentColor" />
				<rect
					x="12"
					y="0"
					width="2.4"
					height="10"
					rx="0.5"
					fill="currentColor"
				/>
			</svg>
			<svg width="13" height="10" viewBox="0 0 13 10" aria-hidden="true">
				<path
					d="M6.5 1.6c1.9 0 3.6.7 4.9 1.9l-.8.8A5.8 5.8 0 0 0 6.5 2.9 5.8 5.8 0 0 0 2.4 4.3l-.8-.8A7 7 0 0 1 6.5 1.6Z"
					fill="currentColor"
				/>
				<path
					d="M6.5 4.5c1.1 0 2.1.4 2.9 1.1l-.8.8A2.8 2.8 0 0 0 6.5 5.6c-.8 0-1.5.3-2.1.8l-.8-.8A4 4 0 0 1 6.5 4.5Z"
					fill="currentColor"
				/>
				<circle cx="6.5" cy="8.2" r="1.15" fill="currentColor" />
			</svg>
			<svg width="22" height="10" viewBox="0 0 22 10" aria-hidden="true">
				<rect
					x="0.6"
					y="0.6"
					width="18"
					height="8.8"
					rx="2"
					stroke="currentColor"
					strokeWidth="1.1"
					fill="none"
				/>
				<rect x="2" y="2" width="13.2" height="6" rx="1" fill="currentColor" />
				<path d="M20.2 3.2v3.6a1.6 1.6 0 0 0 0-3.6Z" fill="currentColor" />
			</svg>
		</span>
	);
}

function DesktopApp() {
	return (
		<div className="absolute top-10 right-[132px] bottom-10 left-10 z-10 hidden overflow-hidden rounded-2xl border border-black/[0.06] bg-white md:flex lg:top-10 lg:right-[170px] lg:bottom-10 lg:left-10">
			<div className="hidden w-[206px] shrink-0 flex-col border-black/[0.05] border-r lg:flex">
				<div className="flex shrink-0 items-center gap-1.5">
					<span className="size-2.5 rounded-full bg-destructive" />
					<span className="size-2.5 rounded-full bg-warning" />
					<span className="size-2.5 rounded-full bg-success" />
				</div>
			</div>

			<div className="relative flex min-w-0 flex-1 flex-col">
				<div className="flex h-12 shrink-0 items-center gap-2 border-black/[0.05] border-b pr-16 pl-3 lg:pr-20">
					<span className="flex size-6 items-center justify-center rounded-md border border-black/10 text-neutral-400">
						<MessagesSquare className="size-3.5" />
					</span>
					<span className="-space-x-1.5 flex">
						<NowMark className="size-6 rounded-lg ring-2 ring-white" />
						<Face tone="sky" className="size-6 ring-2 ring-white" />
					</span>
					<span className="truncate font-semibold text-[13px] text-neutral-900">
						Cafe order
					</span>
				</div>
				d
			</div>
		</div>
	);
}

function PhoneMock() {
	return (
		<div className="-bottom-10 absolute z-0 w-[248px] md:top-10 md:right-3 md:left-auto md:w-[210px] md:translate-x-0 lg:right-10 lg:w-[256px]">
			<span className="-left-[2px] absolute top-[17%] h-6 w-[3px] rounded-l bg-[#3f3f3f]" />
			<span className="-left-[2px] absolute top-[26%] h-10 w-[3px] rounded-l bg-[#3f3f3f]" />
			<span className="-left-[2px] absolute top-[38%] h-10 w-[3px] rounded-l bg-[#3f3f3f]" />
			<span className="-right-[2px] absolute top-[30%] h-14 w-[3px] rounded-r bg-[#3f3f3f]" />
			<div className="h-full rounded-[2.55rem] bg-[#111] p-[7px] shadow-[0_28px_60px_-16px_rgba(0,0,0,0.55)] ring-1 ring-white/15">
				<div className="relative flex h-full flex-col overflow-hidden rounded-[2.1rem] bg-white">
					<div className="relative flex items-center justify-between px-5 pt-3 pb-1">
						<span className="font-semibold text-[12px] text-neutral-950 tracking-tight">
							9:15
						</span>
						<span className="-translate-x-1/2 absolute top-[9px] left-1/2 h-[20px] w-[68px] rounded-full bg-black" />
						<StatusIcons />
					</div>

					<div className="flex items-center justify-between px-3 pt-1">
						<ChevronLeft className="size-5 text-[#007AFF]" strokeWidth={2.4} />
						<span className="-space-x-1.5 flex">
							<NowMark className="size-6 rounded-lg ring-2 ring-white" />
							<Face tone="sky" className="size-6 ring-2 ring-white" />
						</span>
						<Video className="size-4 text-[#007AFF]" />
					</div>
					<div className="mt-1.5 flex justify-center">
						<span className="rounded-full bg-neutral-100 px-2 py-0.5 font-medium text-[11px] text-neutral-700">
							Cafe order ›
						</span>
					</div>

					<div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden px-2.5 pt-3.5 pb-5">
						{thread.map((message) =>
							message.from === "you" ? (
								<div key={message.id} className="flex justify-end">
									<p className="max-w-[88%] rounded-[18px] rounded-br-md bg-[#007AFF] px-3 py-1.5 text-[12.5px] text-white leading-snug">
										{message.text}
									</p>
								</div>
							) : (
								<div key={message.id} className="flex items-end gap-1.5">
									<NowMark className="mb-0.5 size-[18px] rounded-md" />
									<div className="max-w-[86%]">
										<p className="mb-0.5 ml-1 text-[10px] text-neutral-400">
											Now
										</p>
										<p className="rounded-[18px] rounded-bl-md bg-[#E9E9EB] px-3 py-1.5 text-[12.5px] text-neutral-900 leading-snug">
											<RichText
												text={message.text}
												highlight={
													message.highlight?.kind === "fix"
														? message.highlight
														: undefined
												}
											/>
										</p>
									</div>
								</div>
							),
						)}
					</div>

					<div className="-translate-x-1/2 pointer-events-none absolute bottom-1.5 left-1/2 h-1 w-[88px] rounded-full bg-neutral-950" />
				</div>
			</div>
		</div>
	);
}

function ProductStage() {
	return (
		<div
			aria-hidden="true"
			className="relative mt-4 h-[520px] w-full overflow-hidden rounded-3xl bg-[#F7F8F4] sm:h-[560px]"
		>
			<img
				src="/image.jpg"
				alt="hero section background"
				width="1600"
				height="1066"
				loading="eager"
				decoding="async"
				className="absolute top-0 left-0 h-full w-full object-cover"
			/>
			<DesktopApp />
			{/* <PhoneMock /> */}
		</div>
	);
}

export default function HeroC() {
	const { t } = useTranslation("home");
	const [open, setOpen] = useState(false);

	return (
		<section className="relative pt-10 md:pt-16">
			<DialogDemo open={open} setOpen={setOpen} />
			<div className="relative mx-auto flex flex-col items-center">
				<ProductStage />
			</div>
		</section>
	);
}
