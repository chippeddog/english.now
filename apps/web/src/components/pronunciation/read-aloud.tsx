import { env } from "@english.now/env/client";
import { useMutation } from "@tanstack/react-query";
import {
	ArrowRight,
	Check,
	ChevronDown,
	Loader2,
	Mic,
	MicOff,
	Pause,
	Play,
	Trash2,
	X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import usePronunciationRecorder from "@/hooks/use-pronunciation-recorder";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/utils/trpc";

type ParagraphItem = {
	text: string;
	topic: string;
	cefrLevel: string;
	wordCount: number;
	focusAreas: string[];
	tips: string;
};

type SavedAttempt = {
	id: string;
	audioUrl: string;
	transcript: string;
	waveformPeaks: number[];
};

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

let activeAudio: HTMLAudioElement | null = null;

function AudioWaveformPlayer({
	audioUrl,
	peaks,
	label,
	onDelete,
	isDeleting,
}: {
	audioUrl: string;
	peaks: number[];
	label: string;
	onDelete: () => void;
	isDeleting: boolean;
}) {
	const audioRef = useRef<HTMLAudioElement>(null);
	const waveformRef = useRef<HTMLDivElement>(null);
	const rafRef = useRef<number>(0);
	const [isPlaying, setIsPlaying] = useState(false);
	const [progress, setProgress] = useState(0);

	useEffect(() => {
		const audio = audioRef.current;
		if (!audio) return;

		const tick = () => {
			if (audio.duration && Number.isFinite(audio.duration)) {
				setProgress(audio.currentTime / audio.duration);
			}
			rafRef.current = requestAnimationFrame(tick);
		};

		const onPlay = () => {
			if (activeAudio && activeAudio !== audio) {
				activeAudio.pause();
			}
			activeAudio = audio;
			setIsPlaying(true);
			rafRef.current = requestAnimationFrame(tick);
		};
		const onPause = () => {
			if (activeAudio === audio) activeAudio = null;
			setIsPlaying(false);
			cancelAnimationFrame(rafRef.current);
		};
		const onEnded = () => {
			setIsPlaying(false);
			setProgress(0);
			cancelAnimationFrame(rafRef.current);
		};

		audio.addEventListener("play", onPlay);
		audio.addEventListener("pause", onPause);
		audio.addEventListener("ended", onEnded);
		return () => {
			cancelAnimationFrame(rafRef.current);
			audio.removeEventListener("play", onPlay);
			audio.removeEventListener("pause", onPause);
			audio.removeEventListener("ended", onEnded);
		};
	}, []);

	const togglePlay = () => {
		const audio = audioRef.current;
		if (!audio) return;
		if (isPlaying) audio.pause();
		else audio.play();
	};

	const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
		const audio = audioRef.current;
		const waveform = waveformRef.current;
		if (
			!audio ||
			!waveform ||
			!audio.duration ||
			!Number.isFinite(audio.duration)
		)
			return;

		const rect = waveform.getBoundingClientRect();
		const ratio = Math.max(
			0,
			Math.min(1, (e.clientX - rect.left) / rect.width),
		);
		audio.currentTime = ratio * audio.duration;
		setProgress(ratio);
	};

	const playedBars = Math.floor(progress * peaks.length);

	return (
		<div className="relative flex items-center gap-3 rounded-xl border p-3 dark:bg-neutral-800">
			{/* biome-ignore lint/a11y/useMediaCaption: pronunciation audio does not need captions */}
			<audio ref={audioRef} src={audioUrl} preload="auto" />
			<span className="-translate-y-1/2 absolute top-0 left-2 bg-neutral-50 px-1 font-medium text-muted-foreground text-subtle text-xs italic transition-colors duration-150">
				{label}
			</span>
			<button
				type="button"
				onClick={togglePlay}
				className="relative flex size-9 shrink-0 cursor-pointer items-center justify-center gap-1.5 overflow-hidden whitespace-nowrap rounded-full bg-linear-to-t from-[#202020] to-[#2F2F2F] font-base text-white shadow-[inset_0_1px_4px_0_rgba(255,255,255,0.4)] outline-none backdrop-blur transition-all hover:bg-gray-50 hover:opacity-90 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-40 aria-invalid:border-destructive aria-invalid:ring-destructive/20"
			>
				{isPlaying ? (
					<Pause className="size-4" fill="currentColor" />
				) : (
					<Play className="size-4" fill="currentColor" />
				)}
			</button>
			<div
				ref={waveformRef}
				role="slider"
				tabIndex={0}
				aria-label="Audio progress"
				aria-valuemin={0}
				aria-valuemax={100}
				aria-valuenow={Math.round(progress * 100)}
				className="relative flex h-10 flex-1 cursor-pointer items-center gap-px"
				onClick={handleSeek}
				onKeyDown={(e) => {
					const audio = audioRef.current;
					if (!audio?.duration || !Number.isFinite(audio.duration)) return;
					if (e.key === "ArrowRight")
						audio.currentTime = Math.min(audio.duration, audio.currentTime + 2);
					else if (e.key === "ArrowLeft")
						audio.currentTime = Math.max(0, audio.currentTime - 2);
				}}
			>
				{peaks.map((peak, i) => (
					<div
						key={`bar-${i}-${peak.toFixed(2)}`}
						className={cn(
							"w-[2px] rounded-full transition-colors duration-100",
							i < playedBars
								? "bg-primary"
								: "bg-neutral-200 dark:bg-neutral-600",
						)}
						style={{ height: `${Math.max(4, peak * 32)}px` }}
					/>
				))}
				{progress > 0 && progress < 1 && (
					<div
						className="pointer-events-none absolute top-0 h-full w-0.5 rounded-full bg-primary"
						style={{ left: `${progress * 100}%` }}
					/>
				)}
			</div>
			<button
				type="button"
				className="-translate-y-1/2 absolute top-0 right-2 flex size-5 cursor-pointer items-center justify-center rounded-xl border bg-neutral-50"
				onClick={onDelete}
				disabled={isDeleting}
			>
				{isDeleting ? (
					<Loader2 className="size-3 animate-spin text-muted-foreground" />
				) : (
					<X className="size-3 text-muted-foreground" />
				)}
			</button>
			{/* <a
				href={audioUrl}
				download
				className="flex size-8 shrink-0 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-neutral-700"
			>
				<Download className="size-4 text-muted-foreground" />
			</a> */}
		</div>
	);
}

export default function ReadAloudMode({
	sessionId,
	paragraph,
	initialAttempts,
	onFinish,
}: {
	sessionId: string;
	paragraph: ParagraphItem;
	initialAttempts?: { id: string; audioUrl: string; transcript: string }[];
	onFinish: () => void;
}) {
	const trpc = useTRPC();
	const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
	const [selectedDevice, setSelectedDevice] = useState<string>("");
	const [selectedDeviceOpen, setSelectedDeviceOpen] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [isFinishing, setIsFinishing] = useState(false);
	const [attempts, setAttempts] = useState<SavedAttempt[]>(() =>
		(initialAttempts ?? [])
			.filter((a) => a.audioUrl)
			.map((a, i) => ({
				id: a.id,
				audioUrl: a.audioUrl,
				transcript: a.transcript,
				waveformPeaks: generateRandomPeaks(50, i),
			})),
	);

	const {
		isRecording,
		transcript: liveTranscript,
		finalTranscript,
		interimTranscript,
		startRecording,
		stopRecording,
		resetTranscript,
	} = usePronunciationRecorder();

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
		const response = await fetch(
			`${env.VITE_SERVER_URL}/api/pronunciation/assess-and-complete`,
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ sessionId: sid }),
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
		if (!isRecording) return;
		await stopRecording();
		resetTranscript();
	};

	const handleRecord = async () => {
		if (isRecording) {
			const blob = await stopRecording();
			if (!blob) return;

			setIsSaving(true);
			try {
				const [audioUrl, peaks] = await Promise.all([
					uploadAudio(blob),
					extractWaveformPeaks(blob),
				]);

				const transcript = finalTranscript || liveTranscript || "";

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
								},
							]);
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
			await startRecording();
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

	const showTracking = isRecording || (isSaving && Boolean(liveTranscript));

	useEffect(() => {
		const getAudioDevices = async () => {
			try {
				await navigator.mediaDevices.getUserMedia({ audio: true });
				const devices = await navigator.mediaDevices.enumerateDevices();
				const audioInputs = devices.filter(
					(device) => device.kind === "audioinput",
				);
				setAudioDevices(audioInputs);
				if (audioInputs.length > 0 && !selectedDevice) {
					setSelectedDevice(audioInputs[0].deviceId);
				}
			} catch (err) {
				console.error("Error getting audio devices:", err);
			}
		};

		getAudioDevices();
	}, [selectedDevice]);

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="font-bold font-lyon text-3xl tracking-tight md:text-3xl">
					{paragraph.topic}
				</h1>

				{/* Finish Button */}
				{attempts.length > 0 &&
					!isRecording &&
					!isSaving &&
					!submitAttempt.isPending && (
						<div className="flex justify-center">
							<Button
								size="lg"
								onClick={handleFinish}
								disabled={isFinishing}
								className="flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-xl border border-[#C6F64D] bg-[radial-gradient(100%_100%_at_50%_0%,#EFFF9B_0%,#D8FF76_60%,#C6F64D_100%)] px-2.5 py-1.5 font-medium text-lime-900 text-sm italic shadow-none transition duration-150 ease-in-out will-change-transform hover:bg-lime-700/10 hover:brightness-95 focus:shadow-none focus:outline-none focus-visible:shadow-none"
							>
								{isFinishing ? "Analyzing..." : "Finish & Get Feedback"}
							</Button>
						</div>
					)}
			</div>
			<div
				className="rounded-3xl bg-white p-6 dark:bg-neutral-800"
				style={{
					boxShadow:
						"0 0 0 1px rgba(0,0,0,.05),0 10px 10px -5px rgba(0,0,0,.04),0 20px 25px -5px rgba(0,0,0,.04),0 20px 32px -12px rgba(0,0,0,.04)",
				}}
			>
				<div className="mb-4 flex items-center justify-between border-border/50 border-b pb-4 italic">
					<div className="flex items-center gap-2 font-medium">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className="size-6"
							viewBox="0 0 24 24"
							aria-hidden="true"
						>
							<path
								fill="currentColor"
								d="M16.934 8.965A8.002 8.002 0 0 0 1 10c0 1.892.657 3.631 1.756 5.001C3.564 16.01 4 17.125 4 18.306V22h9l.001-3H15a2 2 0 0 0 2-2v-2.929l1.96-.84c.342-.146.372-.494.224-.727zM3 10a6 6 0 0 1 11.95-.779l.057.442l1.543 2.425l-1.55.664V17h-3.998L11 20H6v-1.694c0-1.639-.591-3.192-1.685-4.556A5.97 5.97 0 0 1 3 10m18.154 8.102l-1.665-1.11A8.96 8.96 0 0 0 21 12a8.96 8.96 0 0 0-1.51-4.993l1.664-1.11A10.95 10.95 0 0 1 23 12c0 2.258-.68 4.356-1.846 6.102"
							/>
						</svg>
						Read the following paragraph:
					</div>
					{attempts.length > 0 && (
						<span className="text-muted-foreground text-sm">
							{attempts.length} attempt
							{attempts.length !== 1 ? "s" : ""}
						</span>
					)}
				</div>
				<p className="font-medium text-xl leading-relaxed tracking-wide">
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

				<p className="mt-4 flex gap-1 rounded-xl bg-neutral-50 p-3 text-left text-muted-foreground text-sm italic">
					{paragraph.tips}
				</p>
			</div>

			<div className="flex items-center justify-between gap-3">
				<Popover open={selectedDeviceOpen} onOpenChange={setSelectedDeviceOpen}>
					<PopoverTrigger asChild>
						<Button
							size="lg"
							type="button"
							variant="ghost"
							className={cn(
								"rounded-xl",
								selectedDeviceOpen && "bg-neutral-100",
							)}
						>
							<Mic className="size-5 shrink-0 opacity-50" />
							<ChevronDown
								className={cn(
									"size-4.5 shrink-0 opacity-50 transition-transform duration-200",
									selectedDeviceOpen && "rotate-180",
								)}
							/>
						</Button>
					</PopoverTrigger>
					<PopoverContent
						side="bottom"
						align="start"
						sideOffset={12}
						className="w-72 rounded-xl p-4"
					>
						<div className="flex flex-col gap-4">
							<div className="flex flex-col gap-2">
								<div className="flex flex-col gap-0.5">
									{audioDevices.map((device, i) => (
										<button
											key={device.deviceId}
											type="button"
											onClick={() => setSelectedDevice(device.deviceId)}
											className={cn(
												"flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
												selectedDevice === device.deviceId && "bg-muted",
											)}
										>
											<span className="font-medium">
												{device.label || `Microphone ${i + 1}`}
											</span>
											{selectedDevice === device.deviceId && (
												<Check className="size-4 text-primary" />
											)}
										</button>
									))}
									{audioDevices.length === 0 && (
										<p className="px-3 py-2 text-muted-foreground text-sm">
											No audio devices found
										</p>
									)}
								</div>
							</div>
						</div>
					</PopoverContent>
				</Popover>
				{/* <Select value={selectedDevice} onValueChange={setSelectedDevice}>
					<SelectTrigger className="rounded-xl bg-white px-3 py-2">
						<Mic className="size-5 shrink-0 opacity-50" />
						<SelectValue placeholder="Select microphone" />
					</SelectTrigger>
					<SelectContent align="center">
						{audioDevices.map((device) => (
							<SelectItem key={device.deviceId} value={device.deviceId}>
								{device.label || `Microphone ${device.deviceId.slice(0, 5)}`}
							</SelectItem>
						))}
					</SelectContent>
				</Select> */}

				<div className="flex items-center justify-end gap-2">
					<Button
						variant={isRecording ? "destructive" : "ghost"}
						className={cn("rounded-xl", isRecording && "text-white")}
						size="lg"
						onClick={handleCancelRecording}
						disabled={isSaving || !isRecording}
					>
						<Trash2 className="size-5" />
					</Button>
					{/* <Separator orientation="vertical" /> */}
					<Button
						size="lg"
						variant={isRecording ? "destructive" : "default"}
						onClick={handleRecord}
						disabled={isSaving || submitAttempt.isPending || isFinishing}
						className={cn(
							"relative flex cursor-pointer gap-1.5 overflow-hidden whitespace-nowrap rounded-xl bg-linear-to-t from-[#202020] to-[#2F2F2F] font-base text-white italic shadow-[inset_0_1px_4px_0_rgba(255,255,255,0.4)] outline-none backdrop-blur transition-all hover:opacity-90 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none",
							isRecording && "animate-pulse",
						)}
					>
						{isSaving || submitAttempt.isPending ? (
							<Loader2 className="size-5 animate-spin" />
						) : isRecording ? (
							<MicOff className="size-5" />
						) : (
							<Mic className="size-5" />
						)}
						{isSaving || submitAttempt.isPending
							? "Saving..."
							: isRecording
								? "Stop Recording"
								: "Record"}
					</Button>
				</div>
			</div>

			{/* Live Transcript */}
			{(isRecording || (isSaving && liveTranscript)) && (
				<div className="rounded-xl border border-dashed bg-muted/50 p-4">
					<p className="mb-1 text-center font-medium text-muted-foreground text-xs uppercase tracking-wider">
						Live transcript
					</p>
					<p className="min-h-8 text-center text-lg">
						{liveTranscript || (
							<span className="text-muted-foreground italic">
								Start speaking...
							</span>
						)}
					</p>
				</div>
			)}

			<div className="flex flex-col gap-6 border-border/50 border-t pt-6">
				{attempts.length > 0 && (
					<div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
						{attempts.map((attempt, i) => (
							<AudioWaveformPlayer
								key={attempt.id}
								audioUrl={attempt.audioUrl}
								peaks={attempt.waveformPeaks}
								label={`Attempt ${i + 1}`}
								onDelete={() =>
									deleteAttempt.mutate({
										attemptId: attempt.id,
										sessionId,
									})
								}
								isDeleting={
									deleteAttempt.isPending &&
									deleteAttempt.variables?.attemptId === attempt.id
								}
							/>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
