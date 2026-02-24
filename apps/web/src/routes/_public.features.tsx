import { createFileRoute } from "@tanstack/react-router";
import { PlayIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_public/features")({
	component: RouteComponent,
});

const features = [
	{
		id: "conversations",
		title: "AI Conversations",
		description:
			"Practice speaking with our AI tutor in real-life scenarios. Get instant feedback on your pronunciation and grammar.",
		video: "/features/conversations.gif", // Replace with your Screen Studio GIF
		badge: "Speaking",
	},
	{
		id: "feedback",
		title: "Instant Feedback",
		description:
			"Receive detailed corrections and explanations for every mistake. Learn why something is wrong, not just that it's wrong.",
		video: "/features/feedback.gif", // Replace with your Screen Studio GIF
		badge: "AI-Powered",
	},
	{
		id: "vocabulary",
		title: "Smart Vocabulary",
		description:
			"Build your vocabulary with spaced repetition. Words are introduced in context and reviewed at optimal intervals.",
		video: "/features/vocabulary.gif", // Replace with your Screen Studio GIF
		badge: "Learning",
	},
	{
		id: "progress",
		title: "Track Progress",
		description:
			"See your improvement over time with detailed analytics. Track streaks, accuracy, and areas that need work.",
		video: "/features/progress.gif", // Replace with your Screen Studio GIF
		badge: "Analytics",
	},
	{
		id: "pronunciation",
		title: "Pronunciation Coach",
		description:
			"Perfect your accent with our speech recognition technology. Get word-by-word feedback on how to sound more natural.",
		video: "/features/pronunciation.gif", // Replace with your Screen Studio GIF
		badge: "Speaking",
	},
	{
		id: "lessons",
		title: "Personalized Lessons",
		description:
			"Lessons adapt to your level and goals. Whether you're preparing for a job interview or casual conversation.",
		video: "/features/lessons.gif", // Replace with your Screen Studio GIF
		badge: "Adaptive",
	},
];

function FeatureBlock({
	feature,
	reverse = false,
}: {
	feature: (typeof features)[0];
	reverse?: boolean;
}) {
	return (
		<div
			className={`flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-16 ${reverse ? "lg:flex-row-reverse" : ""}`}
		>
			{/* Video/GIF Container */}
			<div className="relative min-h-[300px] flex-1 overflow-hidden border-border/50 border-b lg:min-h-[440px]">
				<div
					className="absolute right-0 bottom-0 h-full w-full overflow-hidden rounded-t-3xl border border-[#C6F64D] bg-[radial-gradient(100%_100%_at_50%_0%,#EFFF9B_0%,#D8FF76_60%,#C6F64D_100%)]"
					style={{
						boxShadow: "inset 0 0 0 1px #C6F64D, inset 0 0 8px 2px #C6F64D",
					}}
				/>

				<div
					className="absolute bottom-0 left-6 z-20 flex h-[55%] w-[200px] select-none flex-col overflow-hidden rounded-t-3xl border border-[#C6F64D] border-b-0 p-4 shadow-xl md:relative md:w-[240px] lg:absolute"
					style={{
						background:
							"linear-gradient(45deg, white 70%, rgba(255,255,255,0.8) 100%)",
					}}
				>
					<div className="relative mb-0.5 flex items-center gap-1.5">
						<span className="font-semibold text-xs md:text-sm">Feedback</span>{" "}
						<span className="rounded-md bg-radial from-[#EFFF9B] to-[#D8FF76] px-1.5 py-0.5 font-medium text-black text-sm text-xs normal-case tracking-normal md:py-[0.165rem] md:text-xs">
							AI
						</span>
					</div>

					<p className="text-neutral-900 text-sm">
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
					</p>
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
									Let's practice ordering at a restaurant. What would you say to
									the waiter?
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

			{/* Content */}
			<div className="flex-1 lg:max-w-md">
				<span className="mb-3 inline-block rounded-full bg-[radial-gradient(100%_100%_at_50%_0%,#EFFF9B_0%,#D8FF76_60%,#C6F64D_100%)] px-3 py-1 font-medium text-lime-800 text-xs">
					{feature.badge}
				</span>
				<h2 className="mb-4 font-bold font-lyon text-3xl tracking-tight md:text-4xl">
					{feature.title}
				</h2>
				<p className="text-lg text-muted-foreground leading-relaxed">
					{feature.description}
				</p>
			</div>
		</div>
	);
}

function RouteComponent() {
	return (
		<div className="container relative z-10 mx-auto max-w-5xl px-4 py-2 pt-18">
			<div className="mb-20 flex flex-col items-center text-center">
				<h1 className="mb-6 font-bold font-lyon text-5xl tracking-tight md:text-6xl">
					Everything you need to master English
				</h1>
			</div>

			{/* Features Grid */}
			<div className="space-y-24 pb-20 md:space-y-32">
				{features.map((feature, index) => (
					<FeatureBlock
						key={feature.id}
						feature={feature}
						reverse={index % 2 === 1}
					/>
				))}
			</div>

			{/* CTA Section */}
			<div
				className="mb-20 rounded-3xl border border-border/50 bg-neutral-50 p-8 text-center md:p-16"
				style={{
					boxShadow:
						"rgba(162, 166, 171, 0.2) 0px 0px 0px 0px inset, rgba(162, 166, 171, 0.2) 0px 0px 8px 2px inset",
				}}
			>
				<h2 className="mb-4 font-bold font-lyon text-3xl tracking-tight md:text-4xl">
					Ready to start learning?
				</h2>
				<p className="mx-auto mb-8 max-w-xl text-muted-foreground">
					Join thousands of learners who are already improving their English
					with our AI-powered platform.
				</p>
				<a
					href="/login"
					className="inline-flex h-12 items-center justify-center rounded-2xl bg-linear-to-t from-[#202020] to-[#2F2F2F] px-8 font-medium text-base text-white shadow-[inset_0_1px_4px_0_rgba(255,255,255,0.4)] transition-all hover:opacity-90"
				>
					Get started for free
				</a>
			</div>
		</div>
	);
}
