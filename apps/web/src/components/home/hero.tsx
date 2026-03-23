import { i18n, Trans, useTranslation } from "@english.now/i18n";
import { Link } from "@tanstack/react-router";
import { CheckIcon, Flag, Mic, PlayIcon } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import DialogDemo from "../dialog-demo";
import { Button } from "../ui/button";

export default function Hero() {
	const { t } = useTranslation("home");
	const [open, setOpen] = useState(false);
	const avatarLetters = [
		{ id: "1", letter: "A" },
		{ id: "2", letter: "L" },
		{ id: "3", letter: "M" },
		{ id: "4", letter: "O" },
	];

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
			<p className="text-[11px] leading-relaxed">
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
		<section className="relative pt-10 md:pt-16">
			<DialogDemo open={open} setOpen={setOpen} />
			<div className="relative mx-auto flex flex-col md:flex-row md:items-center">
				<div className="mb-16 flex flex-1 flex-col items-start gap-6 text-center sm:mb-6 md:mb-0 md:text-left">
					<h1
						className={cn(
							"font-bold font-lyon text-5xl text-neutral-900 tracking-tight lg:text-6xl dark:text-white",
							{
								"text-4xl leading-tight sm:text-4xl lg:text-5xl":
									i18n.language === "uk",
							},
						)}
					>
						<Trans components={{ br: <br className="" /> }}>
							{t("hero.title")}
						</Trans>
					</h1>

					<p className="max-w-md text-base text-muted-foreground leading-relaxed lg:text-lg">
						{t("hero.subtitle")}
					</p>

					<div className="flex w-full flex-wrap items-center justify-center gap-3 pt-2 md:justify-start">
						<Button
							variant="gradientblack"
							size="xl"
							asChild
							className="relative cursor-pointer overflow-hidden"
						>
							<Link to="/login">
								{t("hero.getStarted")}
								<span className="hidden font-lyon text-neutral-500 text-xl italic md:inline">
									for free
								</span>
							</Link>
						</Button>
						<Button
							size="lg"
							onClick={() => setOpen(true)}
							variant="outline"
							className="h-12 cursor-pointer rounded-2xl border-neutral-300 px-6 text-base hover:bg-neutral-100"
						>
							<PlayIcon fill="currentColor" className="size-4" />
							{t("hero.watchDemo")}
						</Button>
					</div>

					<div className="hidden items-center gap-4 pt-4 text-muted-foreground text-sm sm:flex">
						<div className="flex flex-col items-center justify-center gap-3 text-muted-foreground text-xs sm:flex-row sm:gap-5">
							<span className="flex items-center gap-1.5">
								<CheckIcon
									aria-label="No credit card required"
									className="size-4"
								/>
								{t("hero.noCard")}
							</span>
							<span className="flex items-center gap-1.5">
								<CheckIcon aria-label="7-day free trial" className="size-4" />
								7-day free trial
							</span>
							<span className="flex items-center gap-1.5">
								<CheckIcon aria-label="Cancel anytime" className="size-4" />
								Cancel anytime
							</span>
						</div>
						{/* <span className="-space-x-1 flex">
								{avatarLetters.map(({ id, letter }) => (
									<div
										key={id}
										className="flex size-7 items-center justify-center rounded-full border-2 border-white bg-[radial-gradient(100%_100%_at_50%_0%,#EFFF9B_0%,#D8FF76_60%,#C6F64D_100%)] font-bold font-lyon text-lime-800 text-xs shadow-xs"
									>
										{letter}
									</div>
								))}
							</span> */}
						{/* <span>Loved by {t("hero.learners", { count: 10000 })}</span> */}

						{/* <span className="h-4 w-px bg-neutral-400" /> */}
						{/* <span>No Credit Card Required</span> */}
						{/* *No Credit Card Required{" "}
						<span className="h-3 w-px bg-neutral-400" /> 7-day free trial */}
						{/* t("hero.noCard")} */}
					</div>
				</div>

				<div className="relative min-h-[330px] flex-1 overflow-hidden border-border/50 border-b lg:min-h-[440px]">
					<div
						className="absolute right-0 bottom-0 h-full w-full overflow-hidden rounded-t-3xl border border-[#C6F64D] bg-[radial-gradient(100%_100%_at_50%_0%,#EFFF9B_0%,#D8FF76_60%,#C6F64D_100%)]"
						style={{
							boxShadow: "inset 0 0 0 1px #C6F64D, inset 0 0 8px 2px #C6F64D",
						}}
					/>

					<div
						className="absolute bottom-0 left-6 z-20 flex h-[45%] w-[200px] select-none flex-col overflow-hidden rounded-t-3xl border border-[#C6F64D] border-b-0 p-4 shadow-xl sm:relative sm:h-[55%] md:absolute md:w-[240px]"
						style={{
							background:
								"linear-gradient(45deg, white 70%, rgba(255,255,255,0.8) 100%)",
						}}
					>
						<div className="relative mb-3 flex items-center gap-1.5">
							<span className="font-semibold text-xs md:text-sm">
								Review Mistakes
							</span>{" "}
							<span className="rounded-md bg-radial from-[#EFFF9B] to-[#D8FF76] px-1.5 py-0.5 font-medium text-lime-900 text-xs normal-case tracking-normal md:py-[0.165rem] md:text-xs">
								AI
							</span>
						</div>
						{/* <span className="font-medium text-xs mb-3">Here's your feedback:</span> */}
						{/* <div className="text-neutral-900 text-sm">
							<span className="font-medium text-xs">Here's your feedback:</span>
							<div className="mt-3 flex flex-col divide-neutral-200">
								<div className="relative h-[48px]">
									<span className="absolute top-0 rounded-t-md bg-[#D8FF76] px-1.5 py-0.5 font-semibold text-lime-700 text-xs">
										Fluency
									</span>
									<span className="absolute bottom-0 rounded-b-md border-2 border-[#D8FF76] bg-[#D8FF76]/50 px-1.5 py-0.5 text-neutral-900 text-xs md:text-sm">
										Good use of phrases.
									</span>
								</div>
								<hr className="my-3 border-neutral-200 border-dashed" />
								<div className="relative h-[74px]">
									<span className="absolute top-0 rounded-t-md bg-[#F8E95F] px-1.5 py-0.5 font-semibold text-[#A55500] text-xs">
										Grammar
									</span>
									<span className="absolute bottom-0 rounded-b-md border-2 border-[#F8E95F] bg-[#F8E95F]/50 px-1.5 py-0.5 text-neutral-900 text-xs leading-[1.45rem] md:text-sm">
										Minor mistakes, ("<b>He go</b>" should be "<b>He goes</b>").
									</span>
								</div>
							</div>
						</div> */}
						<div className="flex flex-col gap-2">
							{mistakes.map((mistake) => (
								<div
									key={mistake.id}
									className="rounded-xl border border-neutral-100 bg-white p-3"
								>
									{/* Header */}
									<div className="mb-3 flex items-center gap-2 text-[10px] text-muted-foreground">
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
										</div>
									</div>

									{/* Actions */}
									<div className="flex items-center gap-2">
										<Button
											size="sm"
											className="group flex h-7 cursor-pointer items-center gap-1 whitespace-nowrap rounded-lg border border-[#C6F64D] bg-[radial-gradient(100%_100%_at_50%_0%,#EFFF9B_0%,#D8FF76_60%,#C6F64D_100%)] px-2 py-1 font-medium text-[11px] text-lime-900 italic shadow-none transition duration-150 ease-in-out will-change-transform hover:bg-lime-700/10 hover:brightness-95 focus:shadow-none focus:outline-none focus-visible:shadow-none"
										>
											<Mic className="size-3" />
											Practice
										</Button>
										<Button
											size="sm"
											variant="outline"
											className="h-7 rounded-lg text-[11px]"
										>
											Skip
										</Button>
										<Button
											variant="ghost"
											size="icon"
											className="ml-auto size-6"
										>
											<Flag className="size-3" />
										</Button>
									</div>
								</div>
							))}
						</div>
						<div className="mt-3 flex flex-col text-neutral-900">
							{/* <p className="font-medium text-xs">You're in the flow!</p> */}
							{/* <span className="text-[10px] text-neutral-500">
								Natural back-and-forth and good turn-taking.
							</span> */}

							{/* <div className="mt-2 flex flex-col items-center">
								<div className="relative h-5 w-full">
									<div className="relative flex h-5 w-full gap-0.5 rounded-lg">
										<div
											className="grow rounded-sm bg-red-600 opacity-20"
											style={{ width: "15%" }}
										/>
										<div
											className="grow rounded-sm bg-orange-600 opacity-20"
											style={{ width: "15%" }}
										/>
										<div
											className="grow rounded-sm bg-yellow-500 opacity-20"
											style={{ width: "15%" }}
										/>
										<div
											className="grow rounded-sm bg-green-500 opacity-20"
											style={{ width: "15%" }}
										/>
										<div
											className="grow rounded-sm bg-green-600 opacity-20"
											style={{ width: "15%" }}
										/>
										<div
											className="grow rounded-sm rounded-r-sm bg-green-700 opacity-100"
											style={{ width: "25%", transform: "scaleY(1.15)" }}
										/>
									</div>
									<div
										className="-translate-y-1/2 absolute top-1/2 h-8 w-1 rounded-full bg-neutral-900 ring-2 ring-neutral-100"
										style={{ left: "86.3551%" }}
									/>
									<div
										className="-top-8 -translate-x-4 absolute"
										style={{ left: "87.5%" }}
									>
										<div className="flex min-w-8 max-w-8 items-center justify-center rounded bg-green-700 px-0 py-0.5 font-bold text-white text-xs">
											86
										</div>
									</div>
								</div>
								<div className="mt-1.5 flex w-full justify-between text-[10px] text-neutral-500">
									<span>Stilted</span>
									<span>Natural</span>
								</div>
							</div>
							<hr className="my-3 border-neutral-200 border-dashed" />
							<div className="flex mt-1 flex-col gap-2 rounded-lg border border-border/50 bg-white p-2">
								<div className="flex flex-row items-center justify-between gap-2">
									<p className="w-[72px] min-w-[72px] shrink-0 whitespace-nowrap font-medium text-[10px] text-neutral-500">
										Turn length
									</p>
									<div className="relative flex w-full flex-row items-center justify-between gap-0.5">
										{[
											"filled-0",
											"filled-1",
											"filled-2",
											"filled-3",
											"filled-4",
										].map((key, i) => (
											<div
												key={key}
												className={cn(
													"h-3 w-1.5 rounded-[2px]",
													i < 5 ? "bg-orange-300" : "bg-neutral-100",
												)}
											/>
										))}
										{[
											"empty-0",
											"empty-1",
											"empty-2",
											"empty-3",
											"empty-4",
										].map((key) => (
											<div
												key={key}
												className="h-3 w-1.5 rounded-[2px] bg-neutral-100"
											/>
										))}
									</div>
									<p className="min-w-6 max-w-6 text-right font-bold text-[10px] text-neutral-600">
										43%
									</p>
								</div>
								<p className="text-[10px] text-neutral-500">
									Mix of short and medium replies. Keeps the conversation going.
								</p>
							</div> */}
						</div>
					</div>

					<div className="absolute top-6 right-6 bottom-6 z-10 ml-auto h-full w-[320px] max-w-sm select-none overflow-hidden rounded-3xl border border-[#C6F64D] bg-white shadow-xl md:relative md:w-[370px] lg:absolute lg:top-8 lg:right-6">
						<div className="border-border/50 border-b px-4 py-3">
							<div className="flex items-center gap-2">
								<div className="relative size-8 overflow-hidden rounded-xl border border-[#C6F64D] bg-[radial-gradient(100%_100%_at_50%_0%,#EFFF9B_0%,#D8FF76_60%,#C6F64D_100%)]">
									<img
										className="absolute bottom-[-4px] h-full w-full object-contain"
										src="/logo.svg"
										alt=""
										width={32}
										height={32}
									/>
								</div>
								<span className="font-semibold text-sm">Practice Session</span>
							</div>
						</div>

						<div className="space-y-4 p-4">
							<div className="flex gap-2">
								<div
									className="max-w-[90%] rounded-2xl rounded-tl-md bg-white px-3.5 py-2.5"
									style={{
										boxShadow:
											"0 0 0 1px #0000000f,0 1px 1px #00000010,inset 0 1px #fff,inset 0 -1px 1px #fff3,inset 0 1px 4px 1px #fff3,inset 0 -2px 1px 1px #0000000f,inset 0 20px 20px #00000002",
									}}
								>
									<p className="text-neutral-900 text-xs md:text-sm">
										Let's practice ordering at a restaurant. What would you say
										to the waiter?
									</p>
									<div className="mt-1.5 flex items-center gap-1.5">
										<Button
											variant="outline"
											size="sm"
											className="size-7 rounded-lg text-xs"
										>
											<PlayIcon fill="currentColor" className="size-2.5" />
										</Button>
										<Button
											variant="outline"
											size="sm"
											className="size-7 rounded-lg text-xs"
										>
											<svg
												className="size-3"
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

							<div className="flex justify-end">
								<div
									className="rounded-2xl rounded-tr-md bg-radial from-[#EFFF9B] to-[#D8FF76] px-3.5 py-2.5"
									style={{
										boxShadow:
											"0 0 0 1px #0000000f,0 1px 1px #00000010,inset 0 1px #fff,inset 0 -1px 1px #fff3,inset 0 1px 4px 1px #fff3,inset 0 -2px 1px 1px #0000000f,inset 0 20px 20px #00000002",
									}}
								>
									<p className="text-neutral-900 text-xs md:text-sm">
										I would like to order the pasta, please.
									</p>
								</div>
							</div>

							<div className="flex gap-2">
								<div
									className="max-w-[90%] rounded-2xl rounded-tl-md bg-white px-3.5 py-2.5"
									style={{
										boxShadow:
											"0 0 0 1px #0000000f,0 1px 1px #00000010,inset 0 1px #fff,inset 0 -1px 1px #fff3,inset 0 1px 4px 1px #fff3,inset 0 -2px 1px 1px #0000000f,inset 0 20px 20px #00000002",
									}}
								>
									<p className="text-neutral-900 text-xs md:text-sm">
										Perfect! <span className="font-medium">98% accuracy</span>.
										Your pronunciation is improving! Keep going!
									</p>
									<div className="mt-1.5 flex items-center gap-1.5">
										<Button
											variant="outline"
											size="sm"
											className="size-7 rounded-lg text-xs"
										>
											<PlayIcon fill="currentColor" className="size-2.5" />
										</Button>
										<Button
											variant="outline"
											size="sm"
											className="size-7 rounded-lg text-xs"
										>
											<svg
												className="size-3"
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

							<div className="flex justify-end">
								<div
									className="rounded-2xl rounded-tr-md bg-radial from-[#EFFF9B] to-[#D8FF76] px-3.5 py-2.5 text-sm"
									style={{
										boxShadow:
											"0 0 0 1px #0000000f,0 1px 1px #00000010,inset 0 1px #fff,inset 0 -1px 1px #fff3,inset 0 1px 4px 1px #fff3,inset 0 -2px 1px 1px #0000000f,inset 0 20px 20px #00000002",
									}}
								>
									<p className="text-neutral-900">Thank you!</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
