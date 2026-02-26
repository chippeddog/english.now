import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_public/about")({
	component: About,
});

export default function About() {
	return (
		<div className="container relative mx-auto max-w-5xl px-4 py-16">
			<div className="mx-auto mb-14 text-center">
				<h1 className="mb-2 font-bold font-lyon text-4xl tracking-tight md:text-6xl">
					The story behind English Now
				</h1>
				<p className="text-balance text-center text-muted-foreground text-sm md:mx-auto md:max-w-boundary-sm md:text-lg">
					All plans include access to our AI-powered learning tools.
				</p>
			</div>
			<div className="flex justify-center lg:gap-20">
				<div className="-mt-1.5 relative w-full shrink-0 lg:w-[64%]">
					<div
						className="-rotate-1 sm:-rotate-2 absolute inset-0 transform rounded-lg bg-neutral-50 shadow-3 dark:shadow-none dark:ring dark:ring-border-strong"
						style={{
							boxShadow:
								"rgba(103, 103, 103, 0.08) 0px 0px 0px 1px, rgba(103, 103, 103, 0.12) 0px 4px 16px 0px",
						}}
					/>
					<div
						className="absolute inset-0 rotate-1 transform rounded-lg bg-neutral-50 shadow-2 sm:rotate-2 dark:bg-(--gray-2) dark:shadow-none dark:ring dark:ring-border-strong"
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
						<p className="mt-5 text-base text-muted-foreground leading-relaxed md:mt-5 md:mb-8">
							Hi, I'm Dmytro. <br />
							<br />I grew up in Ukraine where learning English felt like an
							impossible mountain to climb. Traditional classes were boring,
							textbooks were outdated, and apps felt more like games than real
							learning tools. <br />
							<br />
							That's when it hit me:{" "}
							<span className="rounded-sm bg-[#D8FF76]/50 px-1 font-medium text-lime-700">
								the best way to learn a language is by actually using it.
							</span>{" "}
							Not by memorizing vocabulary lists or completing gamified lessons
							that give you points but don't prepare you for real-world
							conversations.
							<br />
							<br />
							English.now is my answer to everything that frustrated me about
							language learning. It's built on a simple belief:{" "}
							<span className="rounded-sm bg-[#D8FF76]/50 px-1 font-medium text-lime-700">
								{" "}
								AI can be that patient friend.
							</span>{" "}
							It never judges your mistakes, it's available 24/7, and it adapts
							to exactly where you are in your learning journey.
							<br />
							<br />
							It is completely{" "}
							<Link className="text-lime-700 underline" to="/login">
								free to start
							</Link>
							, and I'm committed to keeping it that way.
							{/* <br />
							<br />
							I'm grateful for your support, and I'm excited to see where this
							journey takes us. */}
							<br />
							<br />
							Thank you for using English Now.
						</p>
						{/* <div className="my-12 rounded-2xl border-[#C6F64D] border-l-4 bg-[#C6F64D]/5 p-6 pl-8">
							<p className="mb-0 font-medium text-foreground italic">
								"I wanted to build something that I wish existed when I was
								learning English — a tool that feels like having a patient,
								always-available friend who helps you practice and improve."
							</p>
						</div> */}
						<div className="flex items-center gap-6">
							<p className="flex flex-col gap-1 font-medium text-sm md:text-base">
								<span className="flex items-center gap-2 font-medium">
									Dmytro Tihunov{" "}
									<a
										href="https://x.com/chippeddog"
										target="_blank"
										rel="noopener"
										aria-label="X (Twitter)"
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
									Founder, English Now
								</span>
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
