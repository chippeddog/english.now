import { env } from "@english.now/env/client";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useUpgradeDialog } from "@/components/dashboard/upgrade-dialog";
import AttemptsList, {
	type SavedAttempt,
} from "@/components/pronunciation/real-aloud/attempts-list";
import PronunciationSettingsDrawer from "@/components/pronunciation/settings-drawer";
import useAudioDevices from "@/hooks/use-audio-devices";
import usePronunciationRecorder from "@/hooks/use-pronunciation-recorder";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/utils/trpc";
import { Separator } from "../ui/separator";
import ControlBar from "./real-aloud/control-bar";

type ParagraphItem = {
	text: string;
	topic: string;
	cefrLevel: string;
	wordCount: number;
	focusAreas: string[];
	tips: string;
};

const RECORDING_COUNTDOWN_START = 3;

function normalizeWord(w: string): string {
	return w.toLowerCase().replace(/[^a-z0-9']/g, "");
}

function wordsMatch(a: string, b: string): boolean {
	const aN = normalizeWord(a);
	const bN = normalizeWord(b);
	if (aN === bN) return true;
	if (aN.length < 3 || bN.length < 3) return false;
	const shorter = aN.length <= bN.length ? aN : bN;
	const longer = aN.length > bN.length ? aN : bN;
	return longer.startsWith(shorter);
}

function matchTranscriptPosition(
	paragraphWords: string[],
	transcriptText: string,
): number {
	if (!transcriptText.trim()) return 0;

	const tWords = transcriptText.split(/\s+/).filter(Boolean);
	let pIdx = 0;

	for (const tWord of tWords) {
		if (pIdx >= paragraphWords.length) break;

		let found = false;
		const windowEnd = Math.min(pIdx + 3, paragraphWords.length);
		for (let look = pIdx; look < windowEnd; look++) {
			if (wordsMatch(paragraphWords[look], tWord)) {
				pIdx = look + 1;
				found = true;
				break;
			}
		}
		if (!found) {
			pIdx++;
		}
	}

	return Math.min(pIdx, paragraphWords.length);
}

async function extractWaveformPeaks(
	blob: Blob,
	numBars = 50,
): Promise<number[]> {
	try {
		const arrayBuffer = await blob.arrayBuffer();
		const audioContext = new AudioContext();
		const audioBuffer = await audioContext.decodeAudioData(
			arrayBuffer.slice(0),
		);
		const channelData = audioBuffer.getChannelData(0);

		const peaks: number[] = [];
		const samplesPerBar = Math.floor(channelData.length / numBars);

		for (let i = 0; i < numBars; i++) {
			let sum = 0;
			const start = i * samplesPerBar;
			const end = Math.min(start + samplesPerBar, channelData.length);
			for (let j = start; j < end; j++) {
				sum += Math.abs(channelData[j]);
			}
			peaks.push(sum / (end - start));
		}

		const max = Math.max(...peaks);
		audioContext.close();
		return peaks.map((p) => (max > 0 ? p / max : 0));
	} catch {
		return Array.from({ length: numBars }, (_, i) => {
			const x = Math.sin(i * 12.9898 + i * 78.233) * 43758.5453;
			return 0.15 + (x - Math.floor(x)) * 0.85;
		});
	}
}

function generateRandomPeaks(numBars: number, seed: number): number[] {
	return Array.from({ length: numBars }, (_, i) => {
		const x = Math.sin((i + seed) * 12.9898 + (i + seed) * 78.233) * 43758.5453;
		return 0.15 + (x - Math.floor(x)) * 0.85;
	});
}

async function blobToBase64(blob: Blob): Promise<string> {
	const arrayBuffer = await blob.arrayBuffer();
	const bytes = new Uint8Array(arrayBuffer);
	let binary = "";
	for (let i = 0; i < bytes.length; i++) {
		binary += String.fromCharCode(bytes[i] ?? 0);
	}
	return btoa(binary);
}

export default function ReadAloudMode({
	sessionId,
	paragraph,
	initialAttempts,
	attemptAccess,
	onFinish,
	getElapsedSeconds,
	settingsOpen,
	onSettingsOpenChange,
}: {
	sessionId: string;
	paragraph: ParagraphItem;
	initialAttempts?: {
		id: string;
		audioUrl: string;
		transcript: string;
		createdAt: string | Date;
	}[];
	attemptAccess?: {
		isPro: boolean;
		used: number;
		limit: number | null;
		remaining: number | null;
		reachedLimit: boolean;
	};
	onFinish: () => void;
	getElapsedSeconds?: () => number;
	settingsOpen: boolean;
	onSettingsOpenChange: (open: boolean) => void;
}) {
	const trpc = useTRPC();
	const { t } = useTranslation("app");
	const { openDialog } = useUpgradeDialog();
	const [isSaving, setIsSaving] = useState(false);
	const [isFinishing, setIsFinishing] = useState(false);
	const [countdownValue, setCountdownValue] = useState<number | null>(null);
	const [attempts, setAttempts] = useState<SavedAttempt[]>(() =>
		(initialAttempts ?? [])
			.filter((a) => a.audioUrl)
			.map((a, i) => ({
				id: a.id,
				audioUrl: a.audioUrl,
				transcript: a.transcript,
				waveformPeaks: generateRandomPeaks(50, i),
				createdAt: a.createdAt,
			})),
	);

	const currentAttemptAccess = useMemo(() => {
		if (!attemptAccess) {
			return undefined;
		}

		const used = attempts.length;
		if (attemptAccess.limit == null) {
			return {
				...attemptAccess,
				used,
				remaining: null,
				reachedLimit: false,
			};
		}

		const remaining = Math.max(0, attemptAccess.limit - used);

		return {
			...attemptAccess,
			used,
			remaining,
			reachedLimit: remaining <= 0,
		};
	}, [attemptAccess, attempts.length]);
	const { audioDevices, selectedDevice, setSelectedDevice, microphoneAccess } =
		useAudioDevices(true);

	const {
		isRecording,
		isPaused,
		transcript: liveTranscript,
		finalTranscript,
		interimTranscript,
		startRecording,
		pauseRecording,
		resumeRecording,
		stopRecording,
		cancelRecording,
		resetTranscript,
	} = usePronunciationRecorder(selectedDevice);
	const countdownTimeoutRef = useRef<number | null>(null);

	const submitAttempt = useMutation(
		trpc.pronunciation.submitAttempt.mutationOptions({}),
	);

	const deleteAttempt = useMutation(
		trpc.pronunciation.deleteAttempt.mutationOptions({
			onSuccess: (_data, variables) => {
				setAttempts((prev) => prev.filter((a) => a.id !== variables.attemptId));
			},
		}),
	);

	async function uploadAudio(audioBlob: Blob): Promise<string> {
		const audio = await blobToBase64(audioBlob);

		const response = await fetch(
			`${env.VITE_SERVER_URL}/api/pronunciation/upload`,
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ audio, sessionId }),
			},
		);

		if (!response.ok) {
			throw new Error("Failed to upload audio");
		}

		const data = await response.json();
		return data.audioUrl;
	}

	async function enqueueProcessing(sid: string): Promise<void> {
		const durationSeconds = getElapsedSeconds?.();
		const response = await fetch(
			`${env.VITE_SERVER_URL}/api/pronunciation/assess-and-complete`,
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ sessionId: sid, durationSeconds }),
			},
		);

		if (!response.ok) {
			const err = await response.json().catch(() => ({}));
			throw new Error(
				(err as { error?: string }).error || "Failed to start processing",
			);
		}
	}

	const handleCancelRecording = async () => {
		if (!isRecording && !isPaused) return;
		await cancelRecording();
		resetTranscript();
	};

	const handlePauseToggle = () => {
		if (isPaused) {
			resumeRecording();
			return;
		}

		pauseRecording();
	};

	const handleRecord = async () => {
		if (!isRecording && !isPaused && currentAttemptAccess?.reachedLimit) {
			if (!currentAttemptAccess.isPro) {
				openDialog();
			}
			return;
		}

		if (isRecording || isPaused) {
			const blob = await stopRecording();
			if (!blob) return;

			const transcript = (finalTranscript || liveTranscript || "").trim();
			if (!transcript) {
				resetTranscript();
				toast.error(t("pronunciation.session.noSpeechDetected"));
				return;
			}

			setIsSaving(true);
			try {
				const [audioUrl, peaks] = await Promise.all([
					uploadAudio(blob),
					extractWaveformPeaks(blob),
				]);

				submitAttempt.mutate(
					{
						sessionId,
						itemIndex: 0,
						transcript,
						audioUrl,
					},
					{
						onSuccess: (data) => {
							setAttempts((prev) => [
								...prev,
								{
									id: data.attemptId,
									audioUrl,
									transcript,
									waveformPeaks: peaks,
									createdAt: new Date(),
								},
							]);
						},
						onError: (error) => {
							if (error.message.includes("FREE_ATTEMPT_LIMIT_REACHED")) {
								openDialog();
							}
						},
					},
				);
			} catch (err) {
				console.error("Save error:", err);
			} finally {
				setIsSaving(false);
			}
		} else {
			resetTranscript();
			setCountdownValue(RECORDING_COUNTDOWN_START);
		}
	};

	const handleFinish = async () => {
		setIsFinishing(true);
		try {
			await enqueueProcessing(sessionId);
			onFinish();
		} catch (err) {
			console.error("Failed to start processing:", err);
			setIsFinishing(false);
		}
	};

	const paragraphWords = useMemo(
		() => paragraph.text.split(/\s+/),
		[paragraph.text],
	);

	const maxConfirmedRef = useRef(0);

	const rawConfirmed = useMemo(
		() => matchTranscriptPosition(paragraphWords, finalTranscript),
		[paragraphWords, finalTranscript],
	);

	if (!finalTranscript.trim()) {
		maxConfirmedRef.current = 0;
	} else if (rawConfirmed > maxConfirmedRef.current) {
		maxConfirmedRef.current = rawConfirmed;
	}
	const confirmedUpTo = maxConfirmedRef.current;

	const activeUpTo = useMemo(() => {
		if (!interimTranscript.trim()) return confirmedUpTo;
		const count = interimTranscript.split(/\s+/).filter(Boolean).length;
		return Math.min(confirmedUpTo + count, paragraphWords.length);
	}, [confirmedUpTo, interimTranscript, paragraphWords.length]);

	const hasRecordingSession = isRecording || isPaused;
	const showTracking =
		hasRecordingSession || (isSaving && Boolean(liveTranscript));

	useEffect(() => {
		if (countdownValue == null) {
			return;
		}

		if (countdownValue <= 0) {
			setCountdownValue(null);
			void startRecording();
			return;
		}

		countdownTimeoutRef.current = window.setTimeout(() => {
			setCountdownValue((prev) => (prev == null ? null : prev - 1));
		}, 1000);

		return () => {
			if (countdownTimeoutRef.current != null) {
				window.clearTimeout(countdownTimeoutRef.current);
				countdownTimeoutRef.current = null;
			}
		};
	}, [countdownValue, startRecording]);

	useEffect(() => {
		return () => {
			if (countdownTimeoutRef.current != null) {
				window.clearTimeout(countdownTimeoutRef.current);
			}
		};
	}, []);

	const isRecordDisabled =
		isSaving ||
		submitAttempt.isPending ||
		isFinishing ||
		countdownValue != null ||
		(!hasRecordingSession && microphoneAccess !== "granted") ||
		(Boolean(currentAttemptAccess) &&
			!hasRecordingSession &&
			Boolean(currentAttemptAccess?.reachedLimit));

	const recordTooltipLabel =
		isSaving || submitAttempt.isPending
			? t("pronunciation.session.savingRecording")
			: isPaused
				? t("pronunciation.session.savePausedRecording")
				: isRecording
					? t("pronunciation.session.stopRecording")
					: countdownValue != null
						? t("pronunciation.session.recordingStartsIn", {
								count: countdownValue,
							})
						: currentAttemptAccess?.reachedLimit
							? currentAttemptAccess.isPro
								? t("pronunciation.session.attemptLimitReached", {
										count: currentAttemptAccess.limit ?? 3,
									})
								: t("pronunciation.session.freeAttemptLimitReached")
							: microphoneAccess !== "granted"
								? t("pronunciation.session.microphoneAccessRequired")
								: currentAttemptAccess?.limit != null
									? t("pronunciation.session.recordingsLeft", {
											count: currentAttemptAccess.remaining ?? 0,
										})
									: t("pronunciation.session.startRecording");

	return (
		<div className="space-y-6 pb-[calc(6rem+env(safe-area-inset-bottom))]">
			<div className="flex items-center justify-between">
				<h1 className="font-bold font-lyon text-2xl tracking-tight md:text-3xl">
					{paragraph.topic}
				</h1>
			</div>
			<div
				className="relative overflow-hidden rounded-3xl bg-white p-6 dark:bg-neutral-800"
				style={{
					boxShadow:
						"0 0 0 1px rgba(0,0,0,.05),0 10px 10px -5px rgba(0,0,0,.04),0 20px 25px -5px rgba(0,0,0,.04),0 20px 32px -12px rgba(0,0,0,.04)",
				}}
			>
				{countdownValue != null && (
					<div className="absolute inset-0 z-20 flex items-center justify-center bg-black/25">
						<div className="flex size-44 items-center justify-center rounded-full bg-black/45 text-white shadow-2xl">
							<span className="select-none font-bold font-lyon text-[7rem] leading-none">
								{countdownValue}
							</span>
						</div>
					</div>
				)}
				<div className="flex items-center justify-between italic">
					<div className="flex items-center gap-2 font-medium text-sm md:text-base">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className="size-5 md:size-6"
							viewBox="0 0 24 24"
							aria-hidden="true"
						>
							<path
								fill="currentColor"
								d="M16.934 8.965A8.002 8.002 0 0 0 1 10c0 1.892.657 3.631 1.756 5.001C3.564 16.01 4 17.125 4 18.306V22h9l.001-3H15a2 2 0 0 0 2-2v-2.929l1.96-.84c.342-.146.372-.494.224-.727zM3 10a6 6 0 0 1 11.95-.779l.057.442l1.543 2.425l-1.55.664V17h-3.998L11 20H6v-1.694c0-1.639-.591-3.192-1.685-4.556A5.97 5.97 0 0 1 3 10m18.154 8.102l-1.665-1.11A8.96 8.96 0 0 0 21 12a8.96 8.96 0 0 0-1.51-4.993l1.664-1.11A10.95 10.95 0 0 1 23 12c0 2.258-.68 4.356-1.846 6.102"
							/>
						</svg>
						{t("pronunciation.session.readParagraph")}
					</div>
				</div>
				<Separator className="my-4 border-dashed bg-border/50" />
				<p className="font-medium leading-relaxed tracking-wide md:text-lg">
					{showTracking
						? paragraphWords.map((word, i) => (
								<span key={`${i}-${word}`}>
									<span
										className={cn(
											"rounded px-0.5 transition-colors duration-200",
											i < confirmedUpTo && "bg-primary/10 text-primary",
											i >= confirmedUpTo &&
												i < activeUpTo &&
												"bg-primary/5 text-primary/70",
											i >= activeUpTo && "text-muted-foreground/40",
										)}
									>
										{word}
									</span>
									{i < paragraphWords.length - 1 ? " " : ""}
								</span>
							))
						: paragraph.text}
				</p>
				<p className="mt-4 flex gap-1 rounded-xl bg-neutral-50 p-3 text-left text-muted-foreground text-xs italic md:text-sm">
					{paragraph.tips}
				</p>
			</div>

			{/* {showTracking && (
				<div className="mt-5 rounded-3xl border border-dashed bg-muted/50 p-4">
					<p className="mb-1 text-center font-medium text-muted-foreground text-xs uppercase tracking-wider">
						{t("pronunciation.session.liveTranscript")}
					</p>
					<p className="min-h-8 text-center text-lg">
						{liveTranscript || (
							<span className="text-muted-foreground italic">
								{t("pronunciation.session.startSpeaking")}
							</span>
						)}
					</p>
				</div>
			)} */}

			<AttemptsList
				attempts={attempts}
				sessionId={sessionId}
				onDelete={deleteAttempt.mutate}
				deletingAttemptId={
					deleteAttempt.isPending ? deleteAttempt.variables?.attemptId : null
				}
			/>

			<PronunciationSettingsDrawer
				open={settingsOpen}
				onOpenChange={onSettingsOpenChange}
				audioDevices={audioDevices}
				selectedDevice={selectedDevice}
				setSelectedDevice={setSelectedDevice}
			/>

			<ControlBar
				attemptAccess={currentAttemptAccess}
				attemptCount={attempts.length}
				hasRecordingSession={hasRecordingSession}
				isPaused={isPaused}
				isRecording={isRecording}
				isSaving={isSaving}
				submitPending={submitAttempt.isPending}
				isFinishing={isFinishing}
				onPauseToggle={handlePauseToggle}
				onCancelRecording={handleCancelRecording}
				onRecord={handleRecord}
				isRecordDisabled={isRecordDisabled}
				recordTooltipLabel={recordTooltipLabel}
				showFinish={
					attempts.length > 0 &&
					!hasRecordingSession &&
					countdownValue == null &&
					!isSaving &&
					!submitAttempt.isPending
				}
				onFinish={handleFinish}
			/>
		</div>
	);
}
