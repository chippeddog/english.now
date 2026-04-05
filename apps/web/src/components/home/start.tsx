import { Trans, useTranslation } from "@english.now/i18n";
import { Link } from "@tanstack/react-router";
import { CheckIcon, PlayIcon } from "lucide-react";
import { useState } from "react";
import DialogDemo from "../dialog-demo";
import { Button } from "../ui/button";

export function Start() {
	const [open, setOpen] = useState(false);
	const { t } = useTranslation("home");
	const { t: tCommon } = useTranslation("common");
	return (
		<div className="mx-auto mt-16 mb-16 max-w-5xl md:mt-32">
			<DialogDemo open={open} setOpen={setOpen} />
			<div
				className="relative flex w-full flex-row justify-center overflow-hidden rounded-t-3xl border border-[#C6F64D] bg-radial from-[#EFFF9B] to-[#D8FF76] px-6 pt-6 pb-6 text-left md:p-10 dark:bg-orange-950"
				style={{
					boxShadow: "inset 0 0 0 1px #C6F64D, inset 0 0 8px 2px #C6F64D",
				}}
			>
				<div className="relative z-10 justify-center text-center">
					{/*<div className="mb-4 flex items-center justify-center gap-0 text-neutral-900">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width={21}
							aria-hidden="true"
							height={44}
							fill="currentColor"
							viewBox="0 0 21 44"
							className="h-10 w-10"
						>
							<path
								d="M14.71 44a6.24 6.24 0 0 1-4.77-2.22 6.2 6.2 0 0 1 8.55.94A6.21 6.21 0 0 1 14.7 44m2.75-7.25a6.2 6.2 0 0 1 1.28-3.78 6.23 6.23 0 0 1 .95 8.55 6.24 6.24 0 0 1-2.23-4.77m-9.28 1.74a6.23 6.23 0 0 1-4.04-3.39 6.22 6.22 0 0 1 8.01 3.13c-1.22.5-2.6.62-3.97.26m4.53-6.3a6.21 6.21 0 0 1 2.21-3.31 6.23 6.23 0 0 1-1.3 8.5 6.23 6.23 0 0 1-.91-5.19M2.27 31.07A6.24 6.24 0 0 1 0 26.32a6.21 6.21 0 0 1 6 6.17 6.21 6.21 0 0 1-3.73-1.42M9 27.23c.9-1.1 2.11-1.8 3.4-2.1a6.23 6.23 0 0 1-4.72 7.2A6.23 6.23 0 0 1 9 27.23M1.2 22.3a6.24 6.24 0 0 1-.96-5.18 6.21 6.21 0 0 1 4.2 7.51A6.21 6.21 0 0 1 1.2 22.3m7.5-1.97a6.21 6.21 0 0 1 3.82-1.15A6.23 6.23 0 0 1 6.1 24.9a6.24 6.24 0 0 1 2.6-4.58M2.12 13.4a6.23 6.23 0 0 1 .73-5.22 6.21 6.21 0 0 1 1.6 8.45 6.22 6.22 0 0 1-2.33-3.23m7.74.5a6.22 6.22 0 0 1 3.98.12 6.23 6.23 0 0 1-7.9 3.4 6.24 6.24 0 0 1 3.92-3.51M5.92 6.29c-.23-1.9.42-3.7 1.63-5a6.22 6.22 0 0 1 .1 8.6 6.21 6.21 0 0 1-1.73-3.6m7.53 1.86a6.22 6.22 0 0 1 3.9.82 6.24 6.24 0 0 1-8.38 1.96 6.24 6.24 0 0 1 4.48-2.78m.97-6.81A6.2 6.2 0 0 1 18.17 0a6.23 6.23 0 0 1-6.13 6.04 6.23 6.23 0 0 1 2.38-4.7"
								fill="currentColor"
								fillRule="evenodd"
							/>
						</svg>
						<div className="flex flex-col items-center justify-center gap-1">
							<span className="flex flex-row items-center justify-center font-semibold text-xs tracking-tight2 sm:text-sm">
								10,473+ Learners
							</span>
							<div className="flex items-center justify-center gap-0.5">
								{Array.from({ length: 5 }).map((_, i) => (
									<svg
										key={i}
										aria-hidden="true"
										focusable="false"
										data-prefix="fas"
										data-icon="star"
										className="svg-inline--fa fa-star fa-sm h-3 w-3 sm:h-4 sm:w-4"
										role="img"
										xmlns="http://www.w3.org/2000/svg"
										viewBox="0 0 576 512"
									>
										<path
											fill="currentColor"
											d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z"
										/>
									</svg>
								))}
							</div>
						</div>
						<svg
							style={{ transform: "scaleX(-1)" }}
							xmlns="http://www.w3.org/2000/svg"
							width={21}
							fill="currentColor"
							height={44}
							viewBox="0 0 21 44"
							aria-hidden="true"
							className="h-10 w-10"
						>
							<path
								d="M14.71 44a6.24 6.24 0 0 1-4.77-2.22 6.2 6.2 0 0 1 8.55.94A6.21 6.21 0 0 1 14.7 44m2.75-7.25a6.2 6.2 0 0 1 1.28-3.78 6.23 6.23 0 0 1 .95 8.55 6.24 6.24 0 0 1-2.23-4.77m-9.28 1.74a6.23 6.23 0 0 1-4.04-3.39 6.22 6.22 0 0 1 8.01 3.13c-1.22.5-2.6.62-3.97.26m4.53-6.3a6.21 6.21 0 0 1 2.21-3.31 6.23 6.23 0 0 1-1.3 8.5 6.23 6.23 0 0 1-.91-5.19M2.27 31.07A6.24 6.24 0 0 1 0 26.32a6.21 6.21 0 0 1 6 6.17 6.21 6.21 0 0 1-3.73-1.42M9 27.23c.9-1.1 2.11-1.8 3.4-2.1a6.23 6.23 0 0 1-4.72 7.2A6.23 6.23 0 0 1 9 27.23M1.2 22.3a6.24 6.24 0 0 1-.96-5.18 6.21 6.21 0 0 1 4.2 7.51A6.21 6.21 0 0 1 1.2 22.3m7.5-1.97a6.21 6.21 0 0 1 3.82-1.15A6.23 6.23 0 0 1 6.1 24.9a6.24 6.24 0 0 1 2.6-4.58M2.12 13.4a6.23 6.23 0 0 1 .73-5.22 6.21 6.21 0 0 1 1.6 8.45 6.22 6.22 0 0 1-2.33-3.23m7.74.5a6.22 6.22 0 0 1 3.98.12 6.23 6.23 0 0 1-7.9 3.4 6.24 6.24 0 0 1 3.92-3.51M5.92 6.29c-.23-1.9.42-3.7 1.63-5a6.22 6.22 0 0 1 .1 8.6 6.21 6.21 0 0 1-1.73-3.6m7.53 1.86a6.22 6.22 0 0 1 3.9.82 6.24 6.24 0 0 1-8.38 1.96 6.24 6.24 0 0 1 4.48-2.78m.97-6.81A6.2 6.2 0 0 1 18.17 0a6.23 6.23 0 0 1-6.13 6.04 6.23 6.23 0 0 1 2.38-4.7"
								fill="currentColor"
								fillRule="evenodd"
							/>
						</svg>
					</div> */}
					<h2 className="font-bold font-lyon text-4xl text-neutral-900 tracking-tight sm:text-5xl lg:text-6xl">
						<Trans components={{ br: <br className="" /> }}>
							{t("start.title")}
						</Trans>
					</h2>
					<div className="mt-6 flex items-center justify-center gap-3">
						<Button
							size="lg"
							asChild
							className="relative inline-flex h-12 shrink-0 cursor-pointer items-center overflow-hidden whitespace-nowrap rounded-2xl bg-linear-to-t from-[#202020] to-[#2F2F2F] text-base text-white shadow-[inset_0_1px_4px_0_rgba(255,255,255,0.4)] outline-none transition-all hover:opacity-90 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-40 has-[>svg]:px-2.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:from-[rgb(192,192,192)] dark:to-[rgb(255,255,255)] dark:shadow-[inset_0_1px_4px_0_rgba(128,128,128,0.2)] dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none"
						>
							<Link to="/login">
								{tCommon("actions.getStarted")}
								{/* <span className="hidden font-lyon text-neutral-500 text-xl italic md:inline">
									for free
								</span> */}
							</Link>
						</Button>
						<Button
							size="lg"
							onClick={() => setOpen(true)}
							variant="outline"
							className="h-12 cursor-pointer rounded-2xl border-none px-6 text-base hover:bg-neutral-100"
						>
							<PlayIcon fill="currentColor" className="size-4" />
							{t("hero.watchDemo")}
						</Button>
					</div>
					{/* <div className="mt-4 text-neutral-600 text-sm">
						{t("start.subtitle")}
					</div> */}
					<div className="mt-5 flex items-center justify-center gap-3 text-neutral-600 text-xs sm:flex-row sm:gap-5">
						<span className="flex items-center sm:gap-1.5">
							<CheckIcon
								aria-hidden="true"
								aria-label="No credit card required"
								className="hidden h-4 sm:block"
							/>
							{t("hero.noCard")}
						</span>
						<span className="flex items-center sm:gap-1.5">
							<CheckIcon
								aria-hidden="true"
								aria-label="7-day free trial"
								className="hidden h-4 sm:block"
							/>
							7-day free trial
						</span>
						<span className="flex items-center sm:gap-1.5">
							<CheckIcon
								aria-hidden="true"
								aria-label="Cancel anytime"
								className="hidden h-4 sm:block"
							/>
							Cancel anytime
						</span>
					</div>
				</div>
				<div className="absolute bottom-0 left-0 w-full">
					<svg
						className="md:-bottom-[5rem] absolute bottom-0 left-0 w-full text-[#C6F64D] blur-[60px] md:left-[-4rem] dark:text-pink-600"
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
						className="-bottom-[2rem] md:-bottom-[12rem] absolute left-0 w-full text-[#C6F64D] blur-[60px] dark:text-violet-500"
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
				</div>
			</div>
		</div>
	);
}
