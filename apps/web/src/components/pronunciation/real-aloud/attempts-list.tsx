import { Loader2, Pause, Play, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type SavedAttempt = {
	id: string;
	audioUrl: string;
	transcript: string;
	waveformPeaks: number[];
	createdAt: string | Date;
};

let activeAudio: HTMLAudioElement | null = null;

function formatAttemptDate(
	value: string | Date,
	locale: string,
	fallbackLabel: string,
) {
	const date = value instanceof Date ? value : new Date(value);

	if (Number.isNaN(date.getTime())) {
		return fallbackLabel;
	}

	return new Intl.DateTimeFormat(locale, {
		day: "numeric",
		month: "short",
		year: "numeric",
	}).format(date);
}

function formatDuration(totalSeconds: number) {
	const minutes = Math.floor(Math.max(0, totalSeconds) / 60);
	const seconds = Math.max(0, totalSeconds) % 60;

	return `${minutes.toString().padStart(2, "0")}:${seconds
		.toString()
		.padStart(2, "0")}`;
}

function AudioWaveformPlayer({
	audioUrl,
	label,
	createdAt,
	onDelete,
	isDeleting,
}: {
	audioUrl: string;
	label: string;
	createdAt: string | Date;
	onDelete: () => void;
	isDeleting: boolean;
}) {
	const { i18n, t } = useTranslation("app");
	const audioRef = useRef<HTMLAudioElement>(null);
	const [isPlaying, setIsPlaying] = useState(false);
	const [durationSeconds, setDurationSeconds] = useState<number | null>(null);
	const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

	useEffect(() => {
		const audio = audioRef.current;
		if (!audio) return;
		let cancelled = false;

		const setDuration = (duration: number) => {
			if (!Number.isFinite(duration) || duration <= 0 || cancelled) {
				return false;
			}

			setDurationSeconds(Math.round(duration));
			return true;
		};

		const onPlay = () => {
			if (activeAudio && activeAudio !== audio) {
				activeAudio.pause();
			}
			activeAudio = audio;
			setIsPlaying(true);
		};
		const onPause = () => {
			if (activeAudio === audio) activeAudio = null;
			setIsPlaying(false);
		};
		const onEnded = () => {
			setIsPlaying(false);
		};
		const onLoadedMetadata = () => {
			setDuration(audio.duration);
		};
		const onDurationChange = () => {
			setDuration(audio.duration);
		};

		// Recorded webm files do not always expose a valid duration from metadata,
		// so fall back to decoding the audio file directly when needed.
		const loadDurationFallback = async () => {
			if (setDuration(audio.duration)) {
				return;
			}

			try {
				const response = await fetch(audioUrl);
				if (!response.ok) return;

				const audioBuffer = await response.arrayBuffer();
				const audioContext = new AudioContext();

				try {
					const decoded = await audioContext.decodeAudioData(
						audioBuffer.slice(0),
					);
					setDuration(decoded.duration);
				} finally {
					await audioContext.close();
				}
			} catch {
				// Ignore duration parsing failures and keep the date visible.
			}
		};

		audio.addEventListener("play", onPlay);
		audio.addEventListener("pause", onPause);
		audio.addEventListener("ended", onEnded);
		audio.addEventListener("loadedmetadata", onLoadedMetadata);
		audio.addEventListener("durationchange", onDurationChange);
		audio.load();
		void loadDurationFallback();

		return () => {
			cancelled = true;
			audio.removeEventListener("play", onPlay);
			audio.removeEventListener("pause", onPause);
			audio.removeEventListener("ended", onEnded);
			audio.removeEventListener("loadedmetadata", onLoadedMetadata);
			audio.removeEventListener("durationchange", onDurationChange);
		};
	}, [audioUrl]);

	const togglePlay = () => {
		const audio = audioRef.current;
		if (!audio) return;
		if (isPlaying) audio.pause();
		else audio.play();
	};

	const handleDeleteClick = () => {
		if (isDeleting) {
			return;
		}

		if (isConfirmingDelete) {
			onDelete();
			return;
		}

		setIsConfirmingDelete(true);
	};

	useEffect(() => {
		if (!isConfirmingDelete || isDeleting) {
			return;
		}

		const timeoutId = window.setTimeout(() => {
			setIsConfirmingDelete(false);
		}, 3000);

		return () => window.clearTimeout(timeoutId);
	}, [isConfirmingDelete, isDeleting]);
	const attemptMeta = `${formatAttemptDate(
		createdAt,
		i18n.resolvedLanguage || i18n.language,
		t("pronunciation.session.attempts.unknownDate"),
	)}${durationSeconds !== null ? ` · ${formatDuration(durationSeconds)}` : ""}`;

	return (
		<div
			className={cn(
				"group flex w-full items-center justify-between gap-3 rounded-2xl border border-border/50 bg-white p-3 pr-3 text-left transition-colors hover:border-border/80 hover:shadow-xs",
			)}
		>
			{/* biome-ignore lint/a11y/useMediaCaption: pronunciation audio does not need captions */}
			<audio ref={audioRef} src={audioUrl} preload="metadata" />
			<div className="flex items-center gap-3">
				<Button
					variant="ghost"
					size="icon"
					type="button"
					onClick={togglePlay}
					className={cn(
						!isPlaying ? "text-primary" : "text-muted-foreground",
						"rounded-xl",
					)}
				>
					{isPlaying ? (
						<Pause className="size-4" fill="currentColor" />
					) : (
						<Play className="size-4" fill="currentColor" />
					)}
				</Button>
				<div className="flex flex-col gap-0.5">
					<span
						className={cn(
							"font-medium text-sm text-subtle transition-colors duration-150",
							isConfirmingDelete && !isDeleting && "text-red-700",
						)}
					>
						{label}
					</span>
					<span
						className={cn(
							"text-muted-foreground text-xs italic transition-colors duration-150",
							isConfirmingDelete && !isDeleting && "text-red-600",
						)}
					>
						{isConfirmingDelete && !isDeleting
							? t("pronunciation.session.attempts.deleteConfirm")
							: attemptMeta}
					</span>
				</div>
			</div>

			<div className="flex items-center">
				<Button
					variant="ghost"
					size="icon"
					type="button"
					onClick={handleDeleteClick}
					disabled={isDeleting}
					className={cn(
						"rounded-xl",
						isConfirmingDelete &&
							!isDeleting &&
							"text-red-600 hover:bg-red-100 hover:text-red-700",
					)}
				>
					{isDeleting ? (
						<Loader2 className="size-4 animate-spin text-muted-foreground" />
					) : isConfirmingDelete ? (
						<X className="size-4" />
					) : (
						<Trash2 className="size-4" />
					)}
				</Button>
			</div>
		</div>
	);
}

export default function AttemptsList({
	attempts,
	sessionId,
	onDelete,
	deletingAttemptId,
}: {
	attempts: SavedAttempt[];
	sessionId: string;
	onDelete: (input: { attemptId: string; sessionId: string }) => void;
	deletingAttemptId?: string | null;
}) {
	const { t } = useTranslation("app");

	return (
		<>
			{attempts.length > 0 ? (
				<div className="gap-6">
					<div className="flex flex-col gap-3">
						{attempts.map((attempt, i) => (
							<AudioWaveformPlayer
								key={attempt.id}
								audioUrl={attempt.audioUrl}
								label={t("pronunciation.session.attempts.label", {
									count: i + 1,
								})}
								createdAt={attempt.createdAt}
								onDelete={() =>
									onDelete({
										attemptId: attempt.id,
										sessionId,
									})
								}
								isDeleting={deletingAttemptId === attempt.id}
							/>
						))}
					</div>
				</div>
			) : (
				<div className="px-4 py-10 text-center">
					<p className="font-medium text-sm">
						{t("pronunciation.session.attempts.emptyTitle")}
					</p>
					<p className="mt-1 text-muted-foreground text-sm">
						{t("pronunciation.session.attempts.emptyDescription")}
					</p>
				</div>
			)}
		</>
	);
}
