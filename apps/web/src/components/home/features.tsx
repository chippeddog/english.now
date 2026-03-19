import { useTranslation } from "@english.now/i18n";
import { Link } from "@tanstack/react-router";
import {
	ArrowRight,
	ArrowUpRightIcon,
	Bookmark,
	CheckIcon,
	CircleDot,
	ClockIcon,
	Flag,
	KeyboardIcon,
	Lightbulb,
	Lock,
	Mic,
	PanelRight,
	PlayIcon,
	Settings,
	Volume2,
	X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { GrammarIcon } from "../icons/grammar";
import { ReviewIcon } from "../icons/review";
import { SpeakingIcon } from "../icons/speaking";
import { VocabularyIcon } from "../icons/vocabulary";
import { Button } from "../ui/button";

function PracticeSpeakingDemo() {
	const [showFeedback, setShowFeedback] = useState(true);
	return (
		<div className="relative flex h-full w-full gap-4">
			<div
				className="relative flex flex-1 flex-col overflow-hidden rounded-2xl bg-white"
				style={{
					boxShadow:
						"0 0 0 1px rgba(0,0,0,.05),0 10px 10px -5px rgba(0,0,0,.04),0 20px 25px -5px rgba(0,0,0,.04),0 20px 32px -12px rgba(0,0,0,.04)",
				}}
			>
				<div className="flex items-center gap-2 border-border/50 border-b px-3 py-2.5">
					<div className="flex w-full items-center justify-between gap-2">
						<div className="flex items-center gap-2">
							<div className="relative size-7 overflow-hidden rounded-lg border border-[#C6F64D] bg-[radial-gradient(100%_100%_at_50%_0%,#EFFF9B_0%,#D8FF76_60%,#C6F64D_100%)]">
								<img
									className="absolute right-0 bottom-[-4px] left-0 mx-auto h-full w-full object-contain"
									src="/logo.svg"
									alt=""
									width={32}
									height={32}
								/>
							</div>
							<span className="font-semibold text-sm">Conversation</span>
						</div>
						<div>
							<Button
								variant="outline"
								size="icon"
								className="size-7 rounded-lg"
								onClick={() => setShowFeedback(!showFeedback)}
							>
								<PanelRight className="size-3.5" />
							</Button>
						</div>
					</div>
				</div>

				<div className="space-y-4 p-4 px-4 pb-0">
					{/* AI Message */}
					<div className="max-w-full select-none md:max-w-[80%]">
						<div
							className="max-w-[90%] rounded-2xl rounded-tl-md bg-white px-3.5 py-2.5 text-sm"
							style={{
								boxShadow:
									"0 0 0 1px #0000000f,0 1px 1px #00000010,inset 0 1px #fff,inset 0 -1px 1px #fff3,inset 0 1px 4px 1px #fff3,inset 0 -2px 1px 1px #0000000f,inset 0 20px 20px #00000002",
							}}
						>
							<p className="text-neutral-900 text-xs leading-relaxed">
								Let's practice ordering at a restaurant. <br />
								What would you say to the waiter?
							</p>
							<div className="mt-1 flex items-center gap-1.5">
								<Button
									variant="outline"
									size="sm"
									className="size-6 rounded-lg text-xs"
								>
									<PlayIcon fill="currentColor" className="size-2" />
								</Button>
								<Button
									variant="outline"
									size="sm"
									className="size-6 rounded-lg text-xs"
								>
									<svg
										className="size-2.5"
										xmlns="http://www.w3.org/2000/svg"
										viewBox="0 0 20 20"
										width="1em"
										aria-hidden="true"
									>
										<path
											d="m6.25 6.013.675 1.8h-1.35zm1.86 1.443c.777-1.022 1.896-1.762 3.28-2.147C10.576 3.534 8.76 2.5 6.25 2.5 2.778 2.5.625 4.475.625 7.656c0 1.622.563 2.928 1.572 3.819L.625 13.047l.469.703a5.6 5.6 0 0 0 3.378-1.134 7.8 7.8 0 0 0 1.778.197c.256 0 .503-.016.747-.035a7.7 7.7 0 0 1-.122-1.372c0-.853.134-1.634.381-2.344h-2.15l-.35.938H3.437l1.876-5h1.875zm5.64 4.206c.31-.28.575-.621.75-1.037h-1.497c.175.416.44.756.75 1.037zm4.053 3.563 1.572 1.572-.469.703a5.6 5.6 0 0 1-3.378-1.134 7.8 7.8 0 0 1-1.778.197c-3.472 0-5.625-1.975-5.625-5.157S10.278 6.25 13.75 6.25s5.625 1.975 5.625 5.156c0 1.622-.562 2.928-1.572 3.819m-1.24-5.85h-2.188v-.937h-1.25v.937h-2.187v1.25h.778a4.4 4.4 0 0 0 1.006 1.725c-.863.425-1.681.544-1.681.544l.437 1.172a6.3 6.3 0 0 0 2.269-.87 6.3 6.3 0 0 0 2.269.87l.437-1.172s-.819-.119-1.681-.544a4.3 4.3 0 0 0 1.006-1.725h.778v-1.25z"
											fill="currentColor"
										/>
									</svg>
								</Button>
							</div>
						</div>
					</div>

					<div className="ml-auto max-w-[90%] select-none md:max-w-[70%]">
						<div
							className="rounded-2xl rounded-tr-md bg-radial from-[#EFFF9B] to-[#D8FF76] px-3.5 py-2.5 text-xs"
							style={{
								boxShadow:
									"0 0 0 1px #0000000f,0 1px 1px #00000010,inset 0 1px #fff,inset 0 -1px 1px #fff3,inset 0 1px 4px 1px #fff3,inset 0 -2px 1px 1px #0000000f,inset 0 20px 20px #00000002",
							}}
						>
							I would like to order the pasta, please.
						</div>
					</div>

					<div className="max-w-[16%] select-none md:max-w-[13%]">
						<div
							className="rounded-2xl rounded-tl-md bg-white px-3.5 py-2.5 text-sm"
							style={{
								boxShadow:
									"0 0 0 1px #0000000f,0 1px 1px #00000010,inset 0 1px #fff,inset 0 -1px 1px #fff3,inset 0 1px 4px 1px #fff3,inset 0 -2px 1px 1px #0000000f,inset 0 20px 20px #00000002",
							}}
						>
							<div className="flex gap-1 py-1">
								<span className="size-1 animate-bounce rounded-full bg-neutral-600 opacity-60" />
								<span
									className="size-1 animate-bounce rounded-full bg-neutral-600 opacity-60"
									style={{ animationDelay: "0.1s" }}
								/>
								<span
									className="size-1 animate-bounce rounded-full bg-neutral-600 opacity-60"
									style={{ animationDelay: "0.2s" }}
								/>
							</div>
						</div>
					</div>

					<div
						className="sticky inset-x-0 mx-auto flex w-fit justify-center overflow-hidden rounded-t-2xl border bg-white p-1.5 transition-all duration-75 ease-in dark:from-surface dark:to-transparent"
						style={{
							boxShadow:
								"rgba(162, 166, 171, 0.2) 0px 0px 0px 0px inset, rgba(162, 166, 171, 0.2) 0px 0px 8px 2px inset",
						}}
					>
						<div className="flex items-center gap-1">
							<Button
								type="button"
								variant="ghost"
								className="size-7 rounded-lg"
								size="sm"
							>
								<Lightbulb className="size-3.5" />
							</Button>
							<Button
								type="button"
								size="sm"
								className={cn(
									"flex size-8 items-center justify-center rounded-lg border border-[#C6F64D] bg-radial from-[#EFFF9B] to-[#D8FF76]",
								)}
							>
								<Mic className="size-3.5 text-lime-900" />
							</Button>
							<Button
								type="button"
								variant="ghost"
								className="size-7 rounded-lg"
								size="sm"
							>
								<Settings className="size-3.5" />
							</Button>
						</div>
					</div>
				</div>
			</div>

			<div
				className="relative hidden w-[180px] self-stretch rounded-2xl bg-white p-4 pt-3 md:block"
				style={{
					boxShadow:
						"0 0 0 1px rgba(0,0,0,.05),0 10px 10px -5px rgba(0,0,0,.04),0 20px 25px -5px rgba(0,0,0,.04),0 20px 32px -12px rgba(0,0,0,.04)",
				}}
			>
				<div className="relative mb-0.5 flex items-center gap-1.5">
					<span className="font-semibold text-xs">Feedback</span>{" "}
					<span className="rounded-md bg-radial from-[#EFFF9B] to-[#D8FF76] px-1.5 py-[1.5px] font-medium text-[11px] text-black normal-case tracking-normal">
						AI
					</span>
				</div>

				<div className="mt-3 flex flex-col gap-2.5">
					<hr className="my-1.5 border-neutral-200 border-dashed" />
				</div>
			</div>
		</div>
	);
}

function ReviewMistakesDemo() {
	const mistakes = [
		{
			id: "mistake1",
			original: "I goed to school",
			corrected: "I went to school",
			type: "Past tense",
		},
		{
			id: "mistake2",
			original: "She don't like it",
			corrected: "She doesn't like it",
			type: "Subject-verb",
		},
		{
			id: "mistake3",
			original: "She don't like it",
			corrected: "She doesn't like it",
			type: "Subject-verb",
		},
	];

	const renderCorrectedSentence = (mistake: (typeof mistakes)[number]) => {
		// In a real app, this would dynamically render based on original/corrected
		return (
			<p className="text-xs leading-relaxed">
				I am so grateful to you{" "}
				<span className="font-medium text-lime-600">
					{mistake.corrected || "for knocking"}
				</span>{" "}
				<span className="text-rose-400 line-through">
					{mistake.original || "that you knocked"}
				</span>{" "}
				me down with <span className="text-rose-400 line-through">our</span>{" "}
				<span className="font-medium text-lime-600">your</span> car.
			</p>
		);
	};

	return (
		<div
			className="flex h-full w-full flex-col gap-2.5 rounded-t-2xl bg-white p-4"
			style={{
				boxShadow:
					"0 0 0 1px rgba(0,0,0,.05),0 10px 10px -5px rgba(0,0,0,.04),0 20px 25px -5px rgba(0,0,0,.04),0 20px 32px -12px rgba(0,0,0,.04)",
			}}
		>
			<div className="mb-1 flex items-center justify-between">
				<h2 className="font-semibold text-sm">Review Mistakes</h2>
				<span className="text-muted-foreground text-xs">3/5 corrected</span>
			</div>

			{mistakes.map((mistake) => (
				<div
					key={mistake.id}
					className="rounded-xl border border-neutral-100 bg-white p-3"
				>
					{/* Header */}
					<div className="mb-3 flex items-center gap-2 text-[11px] text-muted-foreground">
						<span>Correct the Sentence</span>
						<span>|</span>
						<span>Correctness</span>
					</div>

					{/* Correction display */}
					<div className="mb-4 flex items-start justify-between gap-4">
						{renderCorrectedSentence(mistakes[0])}
						<div className="flex shrink-0 gap-1">
							{/* <Button variant="ghost" size="icon" className="size-6">
								<Volume2 className="size-3" />
							</Button> */}
							<Button variant="ghost" size="icon" className="size-6">
								<Bookmark className="size-3" />
							</Button>
						</div>
					</div>

					{/* Actions */}
					<div className="flex items-center gap-2">
						<Button
							size="sm"
							className="group flex h-7 cursor-pointer items-center gap-1 whitespace-nowrap rounded-lg border border-[#C6F64D] bg-[radial-gradient(100%_100%_at_50%_0%,#EFFF9B_0%,#D8FF76_60%,#C6F64D_100%)] px-2 py-1 font-medium text-lime-900 text-xs italic shadow-none transition duration-150 ease-in-out will-change-transform hover:bg-lime-700/10 hover:brightness-95 focus:shadow-none focus:outline-none focus-visible:shadow-none"
						>
							<Mic className="size-3" />
							Practice
						</Button>
						<Button
							size="sm"
							variant="outline"
							className="h-7 rounded-lg text-xs"
						>
							Skip
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className="ml-auto size-6 text-xs"
						>
							<Flag className="size-3" />
						</Button>
					</div>
				</div>
			))}
		</div>
	);
}

function VocabularyDemo() {
	const words = [
		{
			word: "Eloquent",
			phonetic: "/ˈeləkwənt/",
			definition: "Fluent or persuasive in speaking",
			example: '"She gave an eloquent speech."',
			mastery: 85,
		},
		{
			word: "Resilient",
			phonetic: "/rɪˈzɪliənt/",
			definition: "Able to recover quickly from difficulties",
			example: '"He remained resilient through hardships."',
			mastery: 60,
		},
		{
			word: "Ubiquitous",
			phonetic: "/juːˈbɪkwɪtəs/",
			definition: "Present, appearing, or found everywhere",
			example: '"Smartphones are now ubiquitous."',
			mastery: 30,
		},
	];

	return (
		<div
			className="flex w-full select-none flex-col gap-2.5 rounded-t-2xl bg-white p-4"
			style={{
				boxShadow:
					"0 0 0 1px rgba(0,0,0,.05),0 10px 10px -5px rgba(0,0,0,.04),0 20px 25px -5px rgba(0,0,0,.04),0 20px 32px -12px rgba(0,0,0,.04)",
			}}
		>
			<div className="mb-1 flex items-center justify-between">
				<h2 className="font-semibold text-sm">Today's Words</h2>
				<span className="text-muted-foreground text-xs">3/5 learned</span>
			</div>
			{words.map((item) => (
				<div
					key={item.word}
					className="flex items-center gap-2 rounded-xl border border-neutral-100 bg-white p-3.5"
				>
					<button
						type="button"
						className={cn(
							"flex size-8 shrink-0 items-center justify-center rounded-lg text-primary transition-colors hover:bg-neutral-100",
						)}
					>
						<Volume2 className="size-4" />
					</button>
					<div>
						<div className="mb-1 flex items-center justify-between">
							<div className="flex items-baseline gap-2">
								<span className="font-bold text-neutral-800 text-xs">
									{item.word}
								</span>
								<span className="text-[11px] text-neutral-400">
									{item.phonetic}
								</span>
							</div>
						</div>
						<p className="mb-1 text-neutral-600 text-xs">{item.example}</p>
					</div>
				</div>
			))}
		</div>
	);
}

function PersonalizedLessonsDemo() {
	const lessons = [
		{
			id: 1,
			title: "Greetings & Introductions",
			level: "Beginner",
			progress: 100,
			status: "completed" as const,
		},
		{
			id: 3,
			title: "Job Interview Basics",
			level: "Intermediate",
			progress: 45,
			status: "current" as const,
		},
		{
			id: 4,
			title: "Business Email Writing",
			level: "Intermediate",
			progress: 0,
			status: "locked" as const,
		},
		// {
		// 	id: 5,
		// 	title: "Business Email Writing",
		// 	level: "Intermediate",
		// 	progress: 0,
		// 	status: "locked" as const,
		// },
	];

	return (
		<div className="relative flex h-full w-full select-none gap-4">
			<div className="flex flex-1 flex-col gap-3">
				<div
					className="overflow-hidden rounded-2xl bg-white"
					style={{
						boxShadow:
							"0 0 0 1px rgba(0,0,0,.05),0 10px 10px -5px rgba(0,0,0,.04),0 20px 25px -5px rgba(0,0,0,.04),0 20px 32px -12px rgba(0,0,0,.04)",
					}}
				>
					<div className="p-4 pt-3">
						<div className="flex items-start gap-0">
							{/* Left track: circle + dashed line + lesson icons */}
							<div className="relative flex w-9.5 shrink-0 flex-col items-center gap-4">
								{/* Circular progress */}
								<div className="relative flex size-9.5 items-center justify-center">
									<svg
										className="size-9.5"
										viewBox="0 0 56 56"
										aria-hidden="true"
									>
										<title>Level progress</title>
										<circle
											cx="28"
											cy="28"
											r="24"
											fill="none"
											stroke="currentColor"
											strokeWidth="4"
											className="text-neutral-100"
										/>
										<circle
											cx="28"
											cy="28"
											r="24"
											fill="none"
											stroke="currentColor"
											strokeWidth="4"
											strokeLinecap="round"
											strokeDasharray={`${(50 / 100) * 150.8} 150.8`}
											transform="rotate(-90 28 28)"
											className="text-lime-500"
										/>
									</svg>
									<span className="absolute font-bold text-[10px]">50%</span>
								</div>
								{/* Vertical dashed line from circle down through lessons */}
								<div
									className="-translate-x-1/2 absolute top-9.5 bottom-0 left-1/2 w-px border-neutral-200 border-l border-dashed"
									aria-hidden="true"
								/>
								{/* Lesson icons stacked on the line */}
								{lessons.map((lesson) => (
									<div
										key={lesson.id}
										className="relative z-10 flex size-9.5 shrink-0 items-center justify-center"
									>
										<div
											className={cn(
												"flex size-6 items-center justify-center rounded-full border",
												lesson.status === "completed"
													? "border-lime-400 bg-lime-200 text-lime-600"
													: lesson.status === "current"
														? "border border-amber-400 bg-amber-200 text-amber-600"
														: "bg-neutral-100 text-neutral-400",
											)}
										>
											{lesson.status === "completed" ? (
												<CheckIcon className="size-3.5 stroke-[2.5]" />
											) : lesson.status === "current" ? (
												<ClockIcon className="size-3.5" />
											) : (
												<Lock className="size-3" />
											)}
										</div>
									</div>
								))}
							</div>
							<div className="flex min-w-0 flex-1 flex-col pl-3">
								<div>
									<h2 className="font-semibold text-sm">
										Greetings and Introductions
									</h2>
									<p className="text-muted-foreground text-xs">
										Reach 50% to get{" "}
										<span className="font-semibold text-foreground">A2</span>
									</p>
								</div>
								<div className="mt-4 flex flex-col gap-4">
									{lessons.map((lesson) => (
										<div
											key={lesson.id}
											className={cn(
												"flex h-9.5 items-center gap-2",
												lesson.status === "current"
													? "border-neutral-100 bg-white"
													: lesson.status === "completed"
														? "border-neutral-100 bg-white/70"
														: "border-neutral-100 bg-neutral-50/50 opacity-60",
											)}
										>
											<span
												className={cn(
													"font-medium text-xs",
													lesson.status === "locked"
														? "text-neutral-400"
														: "text-neutral-800",
												)}
											>
												{lesson.title}
											</span>
										</div>
									))}
								</div>
							</div>
						</div>
					</div>
				</div>
				<div
					className="overflow-hidden rounded-2xl bg-neutral-50"
					style={{
						boxShadow:
							"rgba(162, 166, 171, 0.15) 0px 0px 0px 0px inset, rgba(162, 166, 171, 0.15) 0px 0px 6px 2px inset",
					}}
				>
					<div className="flex items-center justify-between p-4 py-3">
						<div className="flex items-center gap-3">
							<div className="flex size-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
								<Lock className="size-3" />
							</div>
							<div className="flex flex-col gap-1">
								<h3 className="font-bold font-lyon text-muted-foreground text-sm">
									General English
								</h3>
								<p className="text-muted-foreground text-xs">
									Complete previous units to unlock
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div className="flex flex-col gap-2.5">
				<div
					className="relative hidden w-[180px] rounded-2xl bg-white p-4 pt-3 md:block"
					style={{
						boxShadow:
							"0 0 0 1px rgba(0,0,0,.05),0 10px 10px -5px rgba(0,0,0,.04),0 20px 25px -5px rgba(0,0,0,.04),0 20px 32px -12px rgba(0,0,0,.04)",
					}}
				>
					<h3 className="mb-1 font-semibold text-sm">Beginner A1</h3>
					<p className="text-muted-foreground text-xs">
						Reach 50% to get{" "}
						<span className="font-semibold text-foreground">A2</span>
					</p>
					<div className="mt-3 mb-1 flex items-baseline gap-1">
						<span className="font-bold text-xl">4</span>
						<span className="text-muted-foreground text-xs">/ 94 lessons</span>
					</div>
					<div className="mb-1 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
						<div className="h-full w-[2%] rounded-full bg-neutral-800" />
					</div>
				</div>
			</div>
		</div>
	);
}

export function Features() {
	const { t } = useTranslation("home");
	const _features = [
		{
			id: "grammar",
			icon: SpeakingIcon,
			title: t("features.items.speaking"),
			demo: PracticeSpeakingDemo,
		},
		{
			id: "mistakes",
			icon: ReviewIcon,
			title: t("features.items.mistakes"),
			demo: ReviewMistakesDemo,
		},
		{
			id: "feedback",
			icon: VocabularyIcon,
			title: t("features.items.vocabulary"),
			demo: VocabularyDemo,
		},
		{
			id: "lessons",
			icon: GrammarIcon,
			title: t("features.items.lessons"),
			demo: PersonalizedLessonsDemo,
		},
	];

	return (
		<div className="relative mx-auto md:mt-24">
			<div>
				<div className="mb-10 md:mb-14">
					<h2 className="mb-4 text-center font-bold font-lyon text-4xl tracking-tight md:text-5xl">
						{t("features.title")}
						<br />
						{t("features.titleLine2")}
					</h2>
					<p className="flex items-center justify-center gap-2 text-balance text-muted-foreground text-sm md:max-w-boundary-sm md:text-lg">
						{t("features.learnMore")}{" "}
						<Link
							to="/features"
							className="flex items-center gap-1 text-lime-700 underline transition-all duration-300 hover:text-lime-700/80"
						>
							{t("features.learnMoreLink")}{" "}
							<ArrowUpRightIcon className="size-5" />
						</Link>
					</p>
				</div>
				<div className="-mx-4 flex gap-4 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden">
					{_features.map((feature, _i) => (
						<div
							className={cn(
								"relative h-full min-h-[400px] w-[85vw] shrink-0 overflow-hidden rounded-3xl border border-border/50 md:w-auto md:shrink",
								feature.id === "grammar" || feature.id === "lessons"
									? "md:col-span-2"
									: "md:col-span-1",
							)}
							key={feature.id}
						>
							<div
								className="absolute inset-1 h-full w-full rounded-tl-[1.25rem] px-6 py-6 pt-4 pl-4"
								style={{
									background:
										"radial-gradient(92.09% 124.47% at 50% 99.24%, rgba(245, 245, 245, 0.80) 58.91%, rgba(245, 245, 245, 0.40) 100%)",
									boxShadow:
										"1.899px 1.77px 8.174px 0 rgba(255, 255, 255, 0.13) inset, 1.007px 0.939px 4.087px 0 rgba(255, 255, 255, 0.13) inset",
									mixBlendMode: "plus-lighter",
								}}
							>
								<div className={cn("z-10 mb-3.5 flex items-center gap-2")}>
									<feature.icon className="size-6.5" />
									<h2 className="font-bold font-lyon text-[1.30rem]">
										{feature.title}
									</h2>
								</div>

								<div key={feature.id} className="relative z-10 flex items-end">
									<feature.demo />
								</div>
								{/* <div className="absolute bottom-0 left-0 w-full">
								<svg
									className="absolute bottom-0 left-0 w-full text-[#DCFF6F] blur-[70px]"
									viewBox="0 0 1920 600"
									xmlns="http://www.w3.org/2000/svg"
									preserveAspectRatio="none"
									aria-hidden="true"
								>
									<path
										d="M0,600 C200,100 800,0 1000,400 C1200,100 1600,200 1920,600 L1920,600 L0,600 Z"
										fill="currentColor"
									/>
								</svg>
								<svg
									className="md:-bottom-[10rem] absolute bottom-0 left-0 w-full text-lime-400 blur-[60px] md:left-[-4rem]"
									viewBox="0 0 1920 600"
									xmlns="http://www.w3.org/2000/svg"
									preserveAspectRatio="none"
									aria-hidden="true"
								>
									<path
										d="M0,600 C200,100 800,0 1000,400 C1200,100 1600,200 1920,600 L1920,600 L0,600 Z"
										fill="currentColor"
									/>
								</svg>
								<svg
									className="-bottom-[2rem] md:-bottom-[12rem] absolute left-0 w-full text-[#D8FF76] blur-[60px]"
									viewBox="0 0 1920 600"
									xmlns="http://www.w3.org/2000/svg"
									preserveAspectRatio="none"
									aria-hidden="true"
								>
									<path
										d="M0,500 C200,200 600,100 960,300 C1300,100 1600,0 1920,400 L1920,600 L0,600 Z"
										fill="currentColor"
									/>
								</svg>
							</div> */}
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
