import { useTranslation } from "@english.now/i18n";
import { Link } from "@tanstack/react-router";
import { ChevronDownIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

const COLLAPSED_HEIGHT = 340;

export const Letter = () => {
	const { t } = useTranslation("home");
	const [expanded, setExpanded] = useState(false);

	return (
		<div className="container mx-auto max-w-5xl pt-24">
			<div className="mx-auto mb-10 max-w-xl text-center md:mb-14">
				<h2 className="mb-4 font-bold font-lyon text-4xl tracking-tight md:text-5xl">
					{t("letter.title")}
				</h2>
				<p className="text-balance text-center text-muted-foreground text-sm md:mx-auto md:max-w-boundary-sm md:text-lg">
					{t("letter.subtitle")}
				</p>
			</div>
			<motion.div
				className="relative overflow-hidden px-4 pt-4 md:max-h-none! md:overflow-visible md:px-0"
				animate={{
					maxHeight: expanded ? 2000 : COLLAPSED_HEIGHT,
				}}
				initial={false}
				transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
			>
				<AnimatePresence>
					{!expanded && (
						<motion.div
							className="absolute inset-x-0 bottom-0 z-40 flex items-end justify-center bg-linear-to-t from-white via-white/90 to-transparent pb-5 md:hidden"
							style={{ height: 160 }}
							initial={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.3 }}
						>
							<button
								type="button"
								onClick={() => setExpanded(true)}
								className="flex items-center gap-1.5 rounded-full border bg-white px-4 py-2 font-medium text-sm shadow-sm transition-colors hover:bg-neutral-50 active:bg-neutral-100"
							>
								{t("letter.readMore")}
								<ChevronDownIcon className="size-4" />
							</button>
						</motion.div>
					)}
				</AnimatePresence>
				<div className="flex justify-center lg:gap-20">
					<div className="-mt-1.5 relative w-full shrink-0 lg:w-[64%]">
						<div
							className="-rotate-2 sm:-rotate-2 absolute inset-0 transform rounded-lg bg-neutral-50 shadow-3 dark:shadow-none dark:ring dark:ring-border-strong"
							style={{
								boxShadow:
									"rgba(103, 103, 103, 0.08) 0px 0px 0px 1px, rgba(103, 103, 103, 0.12) 0px 4px 16px 0px",
							}}
						/>
						<div
							className="absolute inset-0 rotate-2 transform rounded-lg bg-neutral-50 shadow-2 sm:rotate-2 dark:bg-(--gray-2) dark:shadow-none dark:ring dark:ring-border-strong"
							style={{
								boxShadow:
									"rgba(103, 103, 103, 0.08) 0px 0px 0px 1px, rgba(103, 103, 103, 0.12) 0px 4px 16px 0px",
							}}
						/>
						<div className="relative z-30 size-full rounded-lg bg-white px-5 py-8 shadow-xs sm:px-14 sm:py-10 dark:ring dark:ring-border-strong">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								width={44}
								height={44}
								aria-hidden="true"
								className="text-muted-foreground/40 dark:text-muted-foreground/70"
							>
								<path
									fill="currentColor"
									d="M30.632 33.25c4.345 0 7.868-3.526 7.868-7.875 0-4.35-3.523-7.875-7.868-7.875-1.085 0-2.12.22-3.06.618.187-.343.39-.666.608-.974 1.374-1.945 3.406-3.427 6.044-5.188a1.751 1.751 0 0 0 .485-2.427 1.747 1.747 0 0 0-2.424-.485c-2.606 1.74-5.164 3.538-6.96 6.078-1.845 2.611-2.787 5.85-2.56 10.301.026 4.327 3.538 7.827 7.867 7.827ZM11.4 33.25c4.346 0 7.868-3.526 7.868-7.875 0-4.35-3.522-7.875-7.867-7.875-1.086 0-2.12.22-3.061.618.187-.343.391-.666.609-.974 1.374-1.945 3.405-3.427 6.044-5.188a1.751 1.751 0 0 0 .485-2.427 1.747 1.747 0 0 0-2.425-.485c-2.606 1.74-5.164 3.538-6.959 6.078-1.845 2.611-2.788 5.85-2.56 10.301.025 4.327 3.538 7.827 7.867 7.827Z"
								/>
							</svg>
							<p className="mt-5 text-muted-foreground text-sm leading-relaxed md:mt-5 md:mb-8 md:text-base">
								{t("letter.greeting")} <br />
								<br />
								{t("letter.paragraph1")} <br />
								<br />
								That's when it hit me:{" "}
								<span className="rounded-sm bg-[#D8FF76]/50 px-1 font-medium text-lime-700">
									{t("letter.highlight1")}
								</span>{" "}
								{t("letter.paragraph2")}
								<br />
								<br />
								{t("letter.paragraph3")}{" "}
								<span className="rounded-sm bg-[#D8FF76]/50 px-1 font-medium text-lime-700">
									{t("letter.highlight2")}
								</span>{" "}
								{t("letter.paragraph4")}
								<br />
								<br />
								It is completely{" "}
								<Link className="text-lime-700 underline" to="/login">
									{t("letter.freeToStart")}
								</Link>
								{t("letter.freeNote")}
								<br />
								<br />
								{t("letter.signOff")}
							</p>
							<div className="flex items-center gap-6">
								<p className="flex flex-col gap-1 font-medium text-sm md:text-base">
									<span className="flex items-center gap-2 font-medium">
										{t("letter.founder")}{" "}
										<a
											href="https://x.com/chippeddog"
											target="_blank"
											aria-label="X (Twitter)"
											rel="noopener"
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												className="size-4.5"
												viewBox="0 0 24 24"
												aria-hidden="true"
											>
												<path
													fill="currentColor"
													d="m17.687 3.063l-4.996 5.711l-4.32-5.711H2.112l7.477 9.776l-7.086 8.099h3.034l5.469-6.25l4.78 6.25h6.102l-7.794-10.304l6.625-7.571zm-1.064 16.06L5.654 4.782h1.803l10.846 14.34z"
												/>
											</svg>
										</a>
									</span>
									<span className="hidden text-muted-foreground text-sm md:inline">
										{t("letter.founderTitle")}
									</span>
								</p>
							</div>
						</div>
					</div>
				</div>
			</motion.div>
		</div>
	);
};
