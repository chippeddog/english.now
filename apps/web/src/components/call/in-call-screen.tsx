import type { CallTutor } from "@english.now/api/services/call-tutors";
import { MicOff } from "lucide-react";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { CallCaption } from "@/hooks/use-realtime-call";
import { cn } from "@/lib/utils";
import { CallControls } from "./call-controls";
import { LiveCaptions } from "./live-captions";
import { TutorAvatar } from "./tutor-avatar";

export function formatCallTime(totalSeconds: number) {
	const safe = Math.max(0, Math.floor(totalSeconds));
	const minutes = Math.floor(safe / 60);
	const seconds = safe % 60;
	return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/** Lime halo that follows the tutor's voice, updated outside React renders. */
function VoiceHalo({ getLevel }: { getLevel: () => number }) {
	const haloRef = useRef<HTMLSpanElement>(null);

	useEffect(() => {
		const reduceMotion = window.matchMedia(
			"(prefers-reduced-motion: reduce)",
		).matches;
		let frame = 0;
		let smoothed = 0;

		const update = () => {
			smoothed = smoothed * 0.75 + getLevel() * 0.25;
			const halo = haloRef.current;
			if (halo) {
				const scale = reduceMotion ? 1 : 1 + smoothed * 0.35;
				halo.style.transform = `scale(${scale})`;
				halo.style.opacity = String(Math.min(0.9, 0.15 + smoothed * 1.5));
			}
			frame = requestAnimationFrame(update);
		};

		frame = requestAnimationFrame(update);
		return () => cancelAnimationFrame(frame);
	}, [getLevel]);

	return (
		<span
			ref={haloRef}
			aria-hidden="true"
			className="absolute inset-0 rounded-full bg-[radial-gradient(circle,#D8FF76_0%,rgba(216,255,118,0.35)_55%,transparent_72%)] opacity-15 will-change-transform"
		/>
	);
}

function LearnerLevelBars({ getLevel }: { getLevel: () => number }) {
	const barsRef = useRef<HTMLSpanElement>(null);

	useEffect(() => {
		let frame = 0;
		const weights = [0.6, 1, 0.8];

		const update = () => {
			const level = getLevel();
			const bars = barsRef.current?.children;
			if (bars) {
				for (let index = 0; index < bars.length; index++) {
					const bar = bars[index] as HTMLElement;
					const height = 4 + level * 12 * (weights[index] ?? 1);
					bar.style.height = `${Math.min(14, height)}px`;
				}
			}
			frame = requestAnimationFrame(update);
		};

		frame = requestAnimationFrame(update);
		return () => cancelAnimationFrame(frame);
	}, [getLevel]);

	return (
		<span
			ref={barsRef}
			aria-hidden="true"
			className="flex h-3.5 items-center gap-0.5"
		>
			<span className="w-0.5 rounded-full bg-white" />
			<span className="w-0.5 rounded-full bg-white" />
			<span className="w-0.5 rounded-full bg-white" />
		</span>
	);
}

export function InCallScreen({
	tutor,
	topic,
	captions,
	captionsOn,
	isMuted,
	tutorSpeaking,
	learnerSpeaking,
	canRequestHint,
	elapsedSeconds,
	remainingSeconds,
	getTutorLevel,
	getLearnerLevel,
	onToggleMute,
	onToggleCaptions,
	onRequestHint,
	onHangUp,
}: {
	tutor: CallTutor;
	topic: string | null;
	captions: CallCaption[];
	captionsOn: boolean;
	isMuted: boolean;
	tutorSpeaking: boolean;
	learnerSpeaking: boolean;
	canRequestHint: boolean;
	elapsedSeconds: number;
	remainingSeconds: number | null;
	getTutorLevel: () => number;
	getLearnerLevel: () => number;
	onToggleMute: () => void;
	onToggleCaptions: () => void;
	onRequestHint: () => void;
	onHangUp: () => void;
}) {
	const { t } = useTranslation("app");
	const showTimeLeft = remainingSeconds !== null && remainingSeconds <= 60;

	return (
		<div className="flex h-full w-full flex-col items-center justify-between gap-6 px-6 pt-10 pb-[max(2rem,env(safe-area-inset-bottom))]">
			<div className="flex flex-col items-center gap-1 text-center">
				<span className="font-medium text-sm text-white/60">
					{t("call.phoneCall")}
				</span>
				{topic ? (
					<span className="rounded-full bg-white/10 px-2.5 py-0.5 font-medium text-white/80 text-xs">
						{topic}
					</span>
				) : null}
			</div>

			<div className="flex w-full flex-1 flex-col items-center justify-center gap-6">
				<div className="relative flex size-52 items-center justify-center">
					<VoiceHalo getLevel={getTutorLevel} />
					<TutorAvatar
						tone={tutor.tone}
						className={cn(
							"relative size-32 ring-4 transition-shadow duration-300",
							tutorSpeaking ? "ring-[#D8FF76]" : "ring-white/10",
						)}
					/>
				</div>

				<div className="flex flex-col items-center gap-1.5 text-center">
					<h1 className="font-semibold text-3xl text-white tracking-[-0.022em]">
						{tutor.name}
					</h1>
					<div className="flex items-center gap-2 text-white/70">
						<span className="font-medium text-base tabular-nums">
							{formatCallTime(elapsedSeconds)}
						</span>
						{showTimeLeft ? (
							<span className="rounded-full bg-amber-300/15 px-2 py-0.5 font-medium text-amber-200 text-xs tabular-nums">
								{t("call.timeLeft", {
									time: formatCallTime(remainingSeconds ?? 0),
								})}
							</span>
						) : null}
					</div>
				</div>

				<div className="flex h-8 items-center justify-center">
					{isMuted ? (
						<span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 font-medium text-white/80 text-xs">
							<MicOff className="size-3.5" />
							{t("call.muted")}
						</span>
					) : learnerSpeaking ? (
						<span className="flex items-center gap-2 rounded-full bg-[#007AFF] px-3 py-1 font-medium text-white text-xs">
							<LearnerLevelBars getLevel={getLearnerLevel} />
							{t("call.youAreSpeaking")}
						</span>
					) : tutorSpeaking ? (
						<span className="font-medium text-white/60 text-xs">
							{t("call.speaking", { name: tutor.name })}
						</span>
					) : (
						<span className="font-medium text-white/60 text-xs">
							{t("call.listening")}
						</span>
					)}
				</div>

				{captionsOn ? (
					<div className="w-full max-w-md">
						<LiveCaptions captions={captions} tutorName={tutor.name} />
					</div>
				) : null}
			</div>

			<CallControls
				isMuted={isMuted}
				captionsOn={captionsOn}
				canRequestHint={canRequestHint}
				onToggleMute={onToggleMute}
				onToggleCaptions={onToggleCaptions}
				onRequestHint={onRequestHint}
				onHangUp={onHangUp}
			/>
		</div>
	);
}
