import {
	ArrowRight,
	BookOpen,
	MessageCircle,
	Sparkles,
	Trophy,
} from "lucide-react";
import { Button } from "../ui/button";

export default function Demo2() {
	return (
		<section className="relative min-h-[680px] overflow-hidden bg-[#f8f8f6] px-6 py-8 sm:py-12">
			{/* Subtle background pattern */}
			<div className="pointer-events-none absolute inset-0 opacity-30">
				<div className="absolute top-20 left-10 h-64 w-64 rounded-full bg-[#C6F64D]/20 blur-3xl" />
				<div className="absolute right-20 bottom-40 h-72 w-72 rounded-full bg-[#D8FF76]/20 blur-3xl" />
			</div>

			<div className="relative mx-auto flex max-w-6xl flex-col gap-8 lg:flex-row lg:items-start lg:gap-12">
				{/* Left side - Content */}
				<div className="flex flex-1 flex-col items-start gap-6 pt-4 lg:pt-8">
					{/* Announcement bar */}
					<a
						href="#"
						className="group flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-1.5 text-sm shadow-sm transition-all hover:border-[#C6F64D] hover:shadow-md"
					>
						<span className="flex items-center gap-1.5">
							<Sparkles className="size-3.5 text-[#9AC700]" />
							<span className="text-neutral-600">New AI Tutor released.</span>
						</span>
						<span className="font-medium text-neutral-900">Try it now</span>
						<ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
					</a>

					{/* Headline */}
					<h1 className="font-bold font-lyon text-5xl text-neutral-900 leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
						Master English
						<br />
						<span className="text-neutral-900">with confidence</span>
					</h1>

					{/* Description */}
					<p className="max-w-md text-lg text-neutral-600 leading-relaxed">
						English Now is an AI-powered platform that helps you learn English
						faster through personalized lessons, real conversations, and instant
						feedback.
					</p>

					{/* CTAs */}
					<div className="flex flex-wrap items-center gap-3 pt-2">
						<Button
							size="lg"
							className="h-12 rounded-full bg-neutral-900 px-6 text-base hover:bg-neutral-800"
						>
							Get started for free
						</Button>
						<Button
							size="lg"
							variant="outline"
							className="h-12 rounded-full border-neutral-300 px-6 text-base hover:bg-neutral-100"
						>
							Book a demo
						</Button>
					</div>

					{/* Trust indicators */}
					<div className="flex items-center gap-4 pt-4 text-neutral-500 text-sm">
						<span className="flex items-center gap-1.5">
							<span className="-space-x-1 flex">
								{[1, 2, 3, 4].map((i) => (
									<div
										key={i}
										className="size-6 rounded-full border-2 border-white bg-gradient-to-br from-[#EFFF9B] to-[#C6F64D]"
									/>
								))}
							</span>
							<span>10k+ learners</span>
						</span>
						<span className="h-4 w-px bg-neutral-300" />
						<span>No credit card required</span>
					</div>
				</div>

				{/* Right side - Visual showcase */}
				<div className="relative flex-1 lg:min-h-[540px]">
					{/* Main app card */}
					<div className="relative z-10 ml-auto w-full max-w-sm overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl lg:absolute lg:top-4 lg:right-0">
						{/* App header */}
						<div className="border-neutral-100 border-b bg-neutral-50/50 px-4 py-3">
							<div className="flex items-center gap-2">
								<div className="relative size-8 overflow-hidden rounded-xl border border-[#C6F64D] bg-[radial-gradient(100%_100%_at_50%_0%,#EFFF9B_0%,#D8FF76_60%,#C6F64D_100%)]">
									<img
										className="absolute bottom-[-3px] h-full w-full object-contain"
										src="/logo.svg"
										alt=""
										width={32}
										height={32}
									/>
								</div>
								<span className="font-semibold text-sm">Practice Session</span>
							</div>
						</div>

						{/* Chat content */}
						<div className="space-y-3 p-4">
							{/* AI message */}
							<div className="flex gap-2">
								<div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#C6F64D]/20">
									<Sparkles className="size-3.5 text-[#7A9B00]" />
								</div>
								<div className="rounded-2xl rounded-tl-md bg-neutral-100 px-3.5 py-2.5 text-sm">
									<p className="text-neutral-700">
										Great job! Let's practice ordering at a restaurant. What
										would you say to the waiter?
									</p>
								</div>
							</div>

							{/* User message */}
							<div className="flex justify-end">
								<div className="rounded-2xl rounded-tr-md bg-[#C6F64D] px-3.5 py-2.5 text-sm">
									<p className="text-neutral-900">
										I would like to order the pasta, please.
									</p>
								</div>
							</div>

							{/* AI feedback */}
							<div className="flex gap-2">
								<div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#C6F64D]/20">
									<Sparkles className="size-3.5 text-[#7A9B00]" />
								</div>
								<div className="rounded-2xl rounded-tl-md bg-neutral-100 px-3.5 py-2.5 text-sm">
									<p className="text-neutral-700">
										Perfect! <span className="font-medium">98% accuracy</span>.
										Your pronunciation is improving!
									</p>
								</div>
							</div>
						</div>
					</div>

					{/* Floating feature cards with arrows */}

					{/* Arrow 1 - pointing to AI chat */}
					<svg
						className="absolute top-16 right-[340px] z-20 hidden h-16 w-24 lg:block"
						viewBox="0 0 100 70"
						fill="none"
					>
						<path
							d="M5 60 Q 30 60, 50 40 T 95 15"
							stroke="#1a1a1a"
							strokeWidth="2"
							strokeLinecap="round"
							fill="none"
							strokeDasharray="4 3"
						/>
						<path
							d="M90 10 L 98 15 L 90 22"
							stroke="#1a1a1a"
							strokeWidth="2"
							fill="none"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>

					{/* Feature card 1 - AI Conversations */}
					<div className="absolute top-8 left-0 z-20 hidden rounded-xl border border-neutral-200 bg-white p-3 shadow-lg lg:block">
						<div className="flex items-center gap-2">
							<div className="flex size-8 items-center justify-center rounded-lg bg-[#C6F64D]/20">
								<MessageCircle className="size-4 text-[#7A9B00]" />
							</div>
							<div>
								<p className="font-medium text-neutral-900 text-xs">
									AI Conversations
								</p>
								<p className="text-[10px] text-neutral-500">
									Real-world scenarios
								</p>
							</div>
						</div>
					</div>

					{/* Arrow 2 - pointing to lessons card */}
					<svg
						className="absolute top-[220px] right-[320px] z-20 hidden h-16 w-20 lg:block"
						viewBox="0 0 80 70"
						fill="none"
					>
						<path
							d="M5 35 Q 25 35, 45 30 T 75 20"
							stroke="#1a1a1a"
							strokeWidth="2"
							strokeLinecap="round"
							fill="none"
							strokeDasharray="4 3"
						/>
						<path
							d="M70 15 L 78 20 L 72 28"
							stroke="#1a1a1a"
							strokeWidth="2"
							fill="none"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>

					{/* Feature card 2 - Structured Lessons */}
					<div className="absolute top-[180px] left-4 z-20 hidden rounded-xl border border-neutral-200 bg-white p-3 shadow-lg lg:block">
						<div className="flex items-center gap-2">
							<div className="flex size-8 items-center justify-center rounded-lg bg-blue-100">
								<BookOpen className="size-4 text-blue-600" />
							</div>
							<div>
								<p className="font-medium text-neutral-900 text-xs">
									Structured Lessons
								</p>
								<p className="text-[10px] text-neutral-500">
									Grammar & vocabulary
								</p>
							</div>
						</div>
					</div>

					{/* Arrow 3 - pointing to progress card */}
					<svg
						className="absolute right-[300px] bottom-[140px] z-20 hidden h-20 w-20 lg:block"
						viewBox="0 0 80 80"
						fill="none"
					>
						<path
							d="M5 20 Q 20 40, 40 50 T 75 60"
							stroke="#1a1a1a"
							strokeWidth="2"
							strokeLinecap="round"
							fill="none"
							strokeDasharray="4 3"
						/>
						<path
							d="M70 55 L 78 62 L 68 68"
							stroke="#1a1a1a"
							strokeWidth="2"
							fill="none"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>

					{/* Feature card 3 - Track Progress */}
					<div className="absolute bottom-32 left-0 z-20 hidden rounded-xl border border-neutral-200 bg-white p-3 shadow-lg lg:block">
						<div className="flex items-center gap-2">
							<div className="flex size-8 items-center justify-center rounded-lg bg-amber-100">
								<Trophy className="size-4 text-amber-600" />
							</div>
							<div>
								<p className="font-medium text-neutral-900 text-xs">
									Track Progress
								</p>
								<p className="text-[10px] text-neutral-500">
									Daily streaks & XP
								</p>
							</div>
						</div>
					</div>

					{/* Stats card - floating bottom right */}
					<div className="absolute right-8 bottom-4 z-20 hidden overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg lg:block">
						<div className="bg-gradient-to-r from-[#C6F64D]/20 to-[#EFFF9B]/20 px-4 py-2">
							<p className="font-medium text-neutral-700 text-xs">
								Your Progress
							</p>
						</div>
						<div className="flex gap-4 px-4 py-3">
							<div className="text-center">
								<p className="font-bold font-lyon text-neutral-900 text-xl">
									12
								</p>
								<p className="text-[10px] text-neutral-500">Day streak</p>
							</div>
							<div className="h-auto w-px bg-neutral-200" />
							<div className="text-center">
								<p className="font-bold font-lyon text-neutral-900 text-xl">
									B2
								</p>
								<p className="text-[10px] text-neutral-500">Level</p>
							</div>
							<div className="h-auto w-px bg-neutral-200" />
							<div className="text-center">
								<p className="font-bold font-lyon text-neutral-900 text-xl">
									847
								</p>
								<p className="text-[10px] text-neutral-500">Words</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
