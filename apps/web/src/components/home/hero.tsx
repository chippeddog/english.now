import { Trans, useTranslation } from "@english.now/i18n";
import { Link } from "@tanstack/react-router";
import { Coffee, Flame, Heart, Play, PlayIcon, Volume2 } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { type ReactNode, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";

const lifted =
	"shadow-[0_0_0_1px_rgba(23,32,51,0.06),0_10px_10px_-5px_rgba(23,32,51,0.04),0_20px_25px_-5px_rgba(23,32,51,0.05),0_20px_32px_-12px_rgba(23,32,51,0.06)]";

const waveform = [6, 10, 16, 9, 14, 20, 12, 7, 15, 18, 10, 6, 12, 16, 8, 5];

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

function NowBubble({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) {
	return (
		<p
			className={cn(
				"w-fit max-w-full rounded-[18px] rounded-bl-md bg-[#E9E9EB] px-3 py-1.5 text-[#172033] text-[13px] leading-snug",
				className,
			)}
		>
			{children}
		</p>
	);
}

function YouBubble({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) {
	return (
		<p
			className={cn(
				"ml-auto w-fit max-w-full rounded-[18px] rounded-br-md bg-[#007AFF] px-3 py-1.5 text-[13px] text-white leading-snug",
				className,
			)}
		>
			{children}
		</p>
	);
}

function Mistake({ children }: { children: ReactNode }) {
	return (
		<span className="underline decoration-[#FFB4C0] decoration-wavy underline-offset-[3px]">
			{children}
		</span>
	);
}

function Fix({ children }: { children: ReactNode }) {
	return <span className="font-semibold text-lime-800">{children}</span>;
}

function FakeButton({
	children,
	primary,
}: {
	children: ReactNode;
	primary?: boolean;
}) {
	return (
		<span
			className={cn(
				"inline-flex h-7 items-center gap-1 rounded-md px-2.5 font-medium text-[12px]",
				primary
					? "bg-[#172033] text-white"
					: "border border-[rgba(23,32,51,0.14)] bg-white text-[#172033]",
			)}
		>
			{children}
		</span>
	);
}

function TypingDots() {
	return (
		<span className="flex w-fit items-center gap-1 rounded-[18px] rounded-bl-md bg-[#E9E9EB] px-3 py-2.5">
			{[0, 1, 2].map((dot) => (
				<motion.span
					key={dot}
					className="size-1.5 rounded-full bg-neutral-400"
					animate={{ opacity: [0.3, 1, 0.3] }}
					transition={{
						duration: 1,
						repeat: Number.POSITIVE_INFINITY,
						delay: dot * 0.15,
					}}
				/>
			))}
		</span>
	);
}

function CafeThread() {
	const reduceMotion = useReducedMotion();
	const [fixed, setFixed] = useState(false);

	useEffect(() => {
		if (reduceMotion) {
			setFixed(true);
			return;
		}
		const timer = setTimeout(() => setFixed(true), 2400);
		return () => clearTimeout(timer);
	}, [reduceMotion]);

	return (
		<div className="flex w-[230px] flex-col gap-1.5">
			<span className="mb-1 flex size-16 items-center justify-center rounded-2xl bg-[linear-gradient(160deg,#FFE3C8_0%,#FFC9A3_100%)]">
				<Coffee className="size-7 text-[#7A4A2A]" strokeWidth={1.6} />
			</span>
			<NowBubble>What can I get you?</NowBubble>
			<YouBubble>
				I <Mistake>want</Mistake> a latte.
			</YouBubble>
			<div className="min-h-[30px]">
				<AnimatePresence mode="wait" initial={false}>
					{fixed ? (
						<motion.div
							key="fix"
							initial={{ opacity: 0, y: 6 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.3 }}
						>
							<NowBubble>
								Say “<Fix>I'd like</Fix> a latte, please.”
							</NowBubble>
						</motion.div>
					) : (
						<motion.div key="typing" exit={{ opacity: 0 }}>
							<TypingDots />
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</div>
	);
}

function WordCard() {
	return (
		<div className={cn("w-[300px] rounded-2xl bg-white p-3", lifted)}>
			<div className="flex items-start gap-2.5">
				{/* <NowMark className="size-8 rounded-[10px]" /> */}
				<div className="min-w-0 flex-1">
					{/* <p className="flex items-baseline gap-1.5 text-[13px]">
						<span className="font-semibold text-[#172033]">Now</span>
						<span className="text-[11px] text-neutral-400">10:02 AM</span>
					</p> */}
					{/* <p className="text-[#5B6478] text-[13px] leading-snug">
						New word from your café chat:
					</p> */}
					<p className="text-[13px] leading-snug">
						<span className="font-semibold text-[#172033]">pick up</span>{" "}
						<span className="text-neutral-400 italic">phrasal verb</span>
					</p>
					<p className="text-[#172033] text-[13px] leading-snug">
						To collect someone. “I'll pick you up at eight.”
					</p>
					<div className="mt-2.5 flex gap-1.5">
						<FakeButton primary>Save word</FakeButton>
						<FakeButton>
							<Volume2 className="size-3.5" />
							Hear it
						</FakeButton>
					</div>
				</div>
			</div>
		</div>
	);
}

function ScoreRing({ score }: { score: number }) {
	const radius = 15;
	const circumference = 2 * Math.PI * radius;
	return (
		<span className="relative flex size-11 items-center justify-center">
			<svg
				viewBox="0 0 36 36"
				className="-rotate-90 absolute inset-0"
				aria-hidden="true"
			>
				<circle
					cx="18"
					cy="18"
					r={radius}
					fill="none"
					stroke="#EEF1F5"
					strokeWidth="3"
				/>
				<circle
					cx="18"
					cy="18"
					r={radius}
					fill="none"
					stroke="#65A30D"
					strokeWidth="3"
					strokeLinecap="round"
					strokeDasharray={circumference}
					strokeDashoffset={circumference * (1 - score / 100)}
				/>
			</svg>
			<span className="font-semibold text-[#172033] text-[12px]">{score}</span>
		</span>
	);
}

function PronunciationCard() {
	return (
		<div className="flex w-[230px] flex-col gap-1.5">
			<YouBubble>How do I say “thought”?</YouBubble>
			<div className={cn("rounded-2xl bg-white p-3", lifted)}>
				<div className="flex items-center justify-between">
					<div>
						<p className="font-semibold text-[#172033] text-[15px]">thought</p>
						<p className="text-[#5B6478] text-[12px]">/θɔːt/</p>
					</div>
					<ScoreRing score={92} />
				</div>
				<div className="mt-2.5 flex h-6 items-center gap-[3px]">
					{waveform.map((height, index) => (
						<span
							// biome-ignore lint/suspicious/noArrayIndexKey: static decorative bars
							key={index}
							className={cn(
								"w-[3px] rounded-full",
								index < 11 ? "bg-[#172033]" : "bg-neutral-300",
							)}
							style={{ height }}
						/>
					))}
				</div>
				<p className="mt-2 text-[12px] text-lime-800">
					Clear “th”. Keep your tongue between your teeth.
				</p>
			</div>
		</div>
	);
}

function GrammarCard() {
	return (
		<div className="flex w-[260px] flex-col gap-1.5">
			<YouBubble>
				Yesterday I <Mistake>goed</Mistake> to work.
			</YouBubble>
			<div className={cn("rounded-2xl bg-white p-3", lifted)}>
				<p className="flex items-center gap-1.5 font-medium text-[#5B6478] text-[12px]">
					<span className="size-2 rounded-full bg-[#B9A3F0]" />
					Past simple
				</p>
				<p className="mt-1 text-[15px]">
					<span className="text-neutral-400 line-through decoration-rose-400">
						goed
					</span>{" "}
					<span className="font-semibold text-lime-800">went</span>
				</p>
				<p className="text-[#172033] text-[13px] leading-snug">
					“Go” is irregular: go, went, gone.
				</p>
				<div className="mt-2.5 flex gap-1.5">
					<FakeButton>Practice</FakeButton>
					<FakeButton>Explain more</FakeButton>
				</div>
			</div>
		</div>
	);
}

function LessonCard() {
	return (
		<div className={cn("w-[280px] rounded-2xl bg-white p-3", lifted)}>
			<div className="flex items-center justify-between">
				<p className="font-medium text-[#5B6478] text-[12px]">Today's lesson</p>
				<span className="rounded-md bg-blue-50 px-1.5 py-0.5 font-medium text-[11px] text-blue-700">
					B1
				</span>
			</div>
			<p className="mt-1 font-semibold text-[#172033] text-[15px]">
				Small talk at work
			</p>
			<div className="mt-2.5 flex gap-1">
				{[0, 1, 2, 3, 4].map((step) => (
					<span
						key={step}
						className={cn(
							"h-1.5 flex-1 rounded-full",
							step < 3 ? "bg-[#D8FF76]" : "bg-[#EEF1F5]",
						)}
					/>
				))}
			</div>
			<div className="mt-2.5 flex items-center justify-between text-[12px]">
				<span className="text-[#5B6478]">5 min left</span>
				<span className="flex items-center gap-1 font-medium text-[#172033]">
					<Flame className="size-3.5 fill-orange-400 text-orange-500" />
					12-day streak
				</span>
			</div>
		</div>
	);
}

function VoiceThread() {
	return (
		<div className="flex w-[240px] flex-col gap-1.5">
			<div className="relative ml-auto">
				<span className="-top-2.5 -left-2.5 absolute flex size-6 items-center justify-center rounded-full bg-white shadow-[0_2px_6px_rgba(23,32,51,0.15)]">
					<Heart className="size-3.5 fill-rose-500 text-rose-500" />
				</span>
				<span className="flex items-center gap-2 rounded-[18px] rounded-br-md bg-[#007AFF] py-2 pr-3 pl-2 text-white">
					<span className="flex size-6 items-center justify-center rounded-full bg-white/20">
						<Play className="size-3 fill-white" />
					</span>
					<span className="flex h-4 items-center gap-[2px]">
						{waveform.slice(0, 13).map((height, index) => (
							<span
								// biome-ignore lint/suspicious/noArrayIndexKey: static decorative bars
								key={index}
								className="w-[2px] rounded-full bg-white/80"
								style={{ height: height * 0.7 }}
							/>
						))}
					</span>
					<span className="text-[11px] text-white/80">0:04</span>
				</span>
			</div>
			<NowBubble>
				Your “th” sounds clear now. Ready for a harder word?
			</NowBubble>
		</div>
	);
}

function Floating({
	className,
	index,
	rotate = 0,
	children,
}: {
	className: string;
	index: number;
	rotate?: number;
	children: ReactNode;
}) {
	const reduceMotion = useReducedMotion();

	return (
		<motion.div
			className={cn(
				"absolute max-xl:scale-[0.76] xl:[@media(max-height:820px)]:scale-[0.82]",
				className,
			)}
			initial={
				reduceMotion
					? false
					: { opacity: 0, transform: "translate3d(0, 16px, 0)" }
			}
			animate={{ opacity: 1, transform: "translate3d(0, 0px, 0)" }}
			transition={{
				delay: 0.3 + index * 0.08,
				duration: 0.7,
				ease: [0.2, 0.8, 0.2, 1],
			}}
		>
			<div style={{ transform: `rotate(${rotate}deg)` }}>{children}</div>
		</motion.div>
	);
}

export default function Hero() {
	const { t } = useTranslation("home");
	const reduceMotion = useReducedMotion();

	return (
		<section className="relative">
			<div
				aria-hidden="true"
				className="-translate-x-1/2 -translate-y-1/2 pointer-events-none absolute top-1/2 left-1/2 hidden h-full max-h-[920px] w-[min(1200px,calc(100vw-2rem))] select-none lg:block"
			>
				<Floating
					index={0}
					rotate={-2}
					className="top-11 left-0 origin-top-left"
				>
					<CafeThread />
				</Floating>
				<Floating
					index={1}
					className="top-10 left-[calc(50%-150px)] origin-top [@media(max-height:700px)]:hidden"
				>
					<WordCard />
				</Floating>
				<Floating
					index={2}
					rotate={2}
					className="top-11 right-0 origin-top-right"
				>
					<PronunciationCard />
				</Floating>
				<Floating
					index={3}
					rotate={1.5}
					className="bottom-32 left-[2%] origin-bottom-left"
				>
					<GrammarCard />
				</Floating>
				<Floating
					index={4}
					className="bottom-10 left-[calc(50%-140px)] origin-bottom [@media(max-height:700px)]:hidden"
				>
					<LessonCard />
				</Floating>
				<Floating
					index={5}
					rotate={-2}
					className="right-[1%] bottom-30 origin-bottom-right"
				>
					<VoiceThread />
				</Floating>
			</div>

			<div className="relative z-10 flex min-h-[calc(100svh-61px)] items-center justify-center py-10 md:min-h-[calc(100svh-77px)] lg:min-h-[max(520px,calc(100svh-77px))]">
				<motion.div
					className="mx-auto flex w-full flex-col items-center text-center"
					initial={reduceMotion ? false : { opacity: 0, y: 12 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
				>
					<h1 className="pb-2 font-bold font-geist-serif text-[#16152a] text-[clamp(2.5rem,min(5.4vw,8.5svh),4.25rem)] leading-[1.20] tracking-[-0.055em] dark:text-white">
						<Trans components={{ br: <br className="hidden sm:inline" /> }}>
							{t("hero.title")}
						</Trans>
					</h1>

					<p className="mx-auto mt-4 max-w-2xl text-muted-foreground leading-relaxed md:text-lg">
						{t("hero.subtitle")}
					</p>

					<div className="mt-8 flex items-center justify-center gap-2.5">
						<Button
							size="lg"
							asChild
							className="text-white dark:bg-white dark:text-[#172033] dark:hover:bg-white/90"
						>
							<Link to="/login">{t("hero.getStarted")}</Link>
						</Button>
						<Button
							size="lg"
							variant="outline"
							asChild
							className="border-[rgba(23,32,51,0.14)] px-4 text-[#172033] shadow-none hover:bg-[#F5F7FA] focus-visible:ring-[#007AFF]/40 dark:text-white"
						>
							<Link to="/book-a-demo">Book a demo</Link>
						</Button>
					</div>
					<p className="mt-4 text-[13px] text-muted-foreground">
						{t("hero.noCard")}
					</p>
				</motion.div>
			</div>

			<div
				aria-hidden="true"
				className="pointer-events-none flex select-none flex-col items-center gap-6 lg:hidden"
			>
				<div className="-rotate-1">
					<CafeThread />
				</div>
				<div className="rotate-1">
					<LessonCard />
				</div>
			</div>
		</section>
	);
}
