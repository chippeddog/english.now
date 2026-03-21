import {
	getConversationModeLabel,
	getConversationSessionMeta,
} from "@english.now/api/services/conversation-mode";
import { env } from "@english.now/env/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
	Languages,
	Lightbulb,
	Loader,
	Loader2,
	PauseIcon,
	PlayIcon,
	RefreshCw,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useUpgradeDialog } from "@/components/dashboard/upgrade-dialog";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import useAudioDevices from "@/hooks/use-audio-devices";
import useAudioPlayback from "@/hooks/use-audio-playback";
import useAudioRecorder from "@/hooks/use-audio-recoder";
import { usePracticeTimer } from "@/hooks/use-practice-timer";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/utils/trpc";
import ClickableMessage from "./clickable-message";
import { ControlToolbar } from "./control-toolbar";
import ConversationSettingsDrawer from "./settings-drawer";

type Message = {
	id: string;
	role: "user" | "assistant";
	content: string;
	isStreaming?: boolean;
	audio?: string;
};

type HintSuggestion = {
	text: string;
	translation: string;
};

type VocabularyMode = "off" | "word" | "phrase";

export default function PracticeView({
	sessionId,
	settingsOpen,
	onSettingsOpenChange,
}: {
	sessionId: string;
	settingsOpen: boolean;
	onSettingsOpenChange: (open: boolean) => void;
}) {
	const trpc = useTRPC();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { getElapsedSeconds } = usePracticeTimer();
	const { openDialog } = useUpgradeDialog();
	const [messages, setMessages] = useState<Message[]>([]);
	const [translations, setTranslations] = useState<Record<string, string>>({});
	const [showHint, setShowHint] = useState(false);
	const [hintSuggestion, setHintSuggestion] = useState<HintSuggestion | null>(
		null,
	);
	const [isLoadingHint, setIsLoadingHint] = useState(false);
	const [translatingId, setTranslatingId] = useState<string | null>(null);
	const [showFinishDialog, setShowFinishDialog] = useState(false);
	const [isFinishing, setIsFinishing] = useState(false);
	const [generatingTTS, setGeneratingTTS] = useState<Set<string>>(new Set());
	const [vocabMode, setVocabMode] = useState<VocabularyMode>("off");
	const [autoTranslate, setAutoTranslate] = useState(() => {
		return localStorage.getItem("conversation:autoTranslate") === "true";
	});
	const hasPlayedInitialAudio = useRef(false);
	const audioPlaybackGenerationRef = useRef(0);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const streamRef = useRef<MediaStream | null>(null);

	const { audioDevices, selectedDevice, setSelectedDevice } =
		useAudioDevices(settingsOpen);

	const { data: profile } = useQuery(trpc.profile.get.queryOptions());

	const { data, isLoading } = useQuery({
		...trpc.conversation.getSession.queryOptions({ sessionId }),
		retry: (failureCount, err) => {
			if (err.message.includes("NOT_FOUND")) return false;
			return failureCount < 2;
		},
	});

	const voice = profile?.voiceModel ?? "aura-2-asteria-en";
	const { isPlaying, playAudio, stopAudio } = useAudioPlayback(voice);
	const userMessageCount = messages.filter((m) => m.role === "user").length;
	const canGetFeedback = userMessageCount >= 3;
	const sessionMeta = useMemo(
		() => (data?.session ? getConversationSessionMeta(data.session) : null),
		[data?.session],
	);
	const isRoleplay = sessionMeta?.mode === "roleplay";
	const roleplayObjective =
		sessionMeta?.modeConfig.kind === "roleplay"
			? sessionMeta.modeConfig.objective
			: (sessionMeta?.subtitle ?? "");
	const roleplayCriteria =
		sessionMeta?.modeConfig.kind === "roleplay"
			? sessionMeta.modeConfig.successCriteria
			: [];
	const hintHeading = isRoleplay ? "Try this line" : "You can say";
	const hintLoadingText = isRoleplay
		? "Thinking of a realistic line for this roleplay..."
		: "Thinking of something natural to say...";
	const hintEmptyText = isRoleplay
		? "Tap regenerate to get another realistic line."
		: "Tap regenerate to get a fresh response idea.";
	const finishTitle = isRoleplay ? "Finish roleplay" : "Finish conversation";
	const finishDescription = canGetFeedback
		? isRoleplay
			? "Your roleplay will be analyzed for pronunciation, grammar, vocabulary, and how naturally you handled the scenario."
			: "Your session will be analyzed for pronunciation, grammar, vocabulary, and fluency. You'll receive detailed feedback."
		: `You need at least 3 responses to receive feedback (you have ${userMessageCount}). Are you sure you want to leave?`;

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	const stopAssistantAudio = useCallback(() => {
		audioPlaybackGenerationRef.current += 1;
		stopAudio();
	}, [stopAudio]);

	useEffect(() => {
		return () => {
			if (streamRef.current) {
				for (const track of streamRef.current.getTracks()) {
					track.stop();
				}
			}
			stopAudio();
		};
	}, [stopAudio]);

	useEffect(() => {
		const handler = (e: BeforeUnloadEvent) => {
			if (messages.filter((m) => m.role === "user").length > 0) {
				e.preventDefault();
			}
		};
		window.addEventListener("beforeunload", handler);
		return () => window.removeEventListener("beforeunload", handler);
	}, [messages]);

	useEffect(() => {
		localStorage.setItem("conversation:autoTranslate", String(autoTranslate));
	}, [autoTranslate]);

	const translateMutation = useMutation(
		trpc.conversation.translate.mutationOptions({}),
	);
	const hintMutation = useMutation(trpc.conversation.hint.mutationOptions({}));

	const translateMessage = useCallback(
		async (messageId: string, text: string) => {
			if (translations[messageId]) {
				setTranslations((prev) => {
					const next = { ...prev };
					delete next[messageId];
					return next;
				});
				return;
			}

			setTranslatingId(messageId);
			try {
				const { translation } = await translateMutation.mutateAsync({ text });
				setTranslations((prev) => ({ ...prev, [messageId]: translation }));
			} catch (err) {
				console.error("Translation error:", err);
			} finally {
				setTranslatingId(null);
			}
		},
		[translations, translateMutation],
	);

	const autoTranslateRef = useRef(autoTranslate);
	autoTranslateRef.current = autoTranslate;

	const handleAutoTranslateToggle = useCallback(
		(enabled: boolean) => {
			setAutoTranslate(enabled);
			if (enabled) {
				const untranslated = messages.filter(
					(m) =>
						m.role === "assistant" &&
						!m.isStreaming &&
						m.content &&
						!translations[m.id],
				);
				for (const msg of untranslated) {
					translateMessage(msg.id, msg.content);
				}
			}
		},
		[messages, translations, translateMessage],
	);

	const prevMessagesRef = useRef<Message[]>([]);

	useEffect(() => {
		if (!autoTranslateRef.current) {
			prevMessagesRef.current = messages;
			return;
		}
		for (const msg of messages) {
			if (msg.role !== "assistant" || msg.isStreaming || !msg.content) continue;
			const prev = prevMessagesRef.current.find((m) => m.id === msg.id);
			const justFinishedStreaming = prev?.isStreaming && !msg.isStreaming;
			if (justFinishedStreaming && !translations[msg.id]) {
				translateMessage(msg.id, msg.content);
			}
		}
		prevMessagesRef.current = messages;
	}, [messages, translations, translateMessage]);

	const fetchHintSuggestion = useCallback(async () => {
		if (!sessionId) return;
		setIsLoadingHint(true);
		try {
			const { suggestion } = await hintMutation.mutateAsync({ sessionId });
			setHintSuggestion(suggestion);
		} catch (err) {
			console.error("Hint generation error:", err);
			setHintSuggestion({
				text: "I'm not sure what to say right now.",
				translation: "",
			});
		} finally {
			setIsLoadingHint(false);
		}
	}, [sessionId, hintMutation]);

	const sendMessage = useCallback(
		async (
			content: string,
			inputType: "text" | "voice" = "text",
			audioUrl?: string,
		) => {
			if (!sessionId || !content.trim()) return;
			const audioPlaybackGeneration = audioPlaybackGenerationRef.current;

			const userMessageId = crypto.randomUUID();
			setMessages((prev) => [
				...prev,
				{ id: userMessageId, role: "user", content },
			]);
			setShowHint(false);
			setHintSuggestion(null);

			const aiMessageId = crypto.randomUUID();
			setMessages((prev) => [
				...prev,
				{ id: aiMessageId, role: "assistant", content: "", isStreaming: true },
			]);

			try {
				const response = await fetch(
					`${env.VITE_SERVER_URL}/api/conversation/send`,
					{
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						credentials: "include",
						body: JSON.stringify({
							sessionId,
							content,
							inputType,
							audioUrl,
						}),
					},
				);

				if (!response.ok) {
					const errorData = (await response.json().catch(() => null)) as {
						error?: string;
					} | null;
					if (errorData?.error === "FREE_REPLY_LIMIT_REACHED") {
						openDialog();
						throw new Error("FREE_REPLY_LIMIT_REACHED");
					}
					throw new Error("Failed to send message");
				}

				const reader = response.body?.getReader();
				const decoder = new TextDecoder();
				let fullContent = "";

				if (reader) {
					while (true) {
						const { done, value } = await reader.read();
						if (done) break;

						const chunk = decoder.decode(value);
						fullContent += chunk;

						const displayContent = fullContent.split("\n__TTS_AUDIO__")[0];

						setMessages((prev) =>
							prev.map((msg) =>
								msg.id === aiMessageId
									? { ...msg, content: displayContent }
									: msg,
							),
						);
					}
				}

				const TTS_MARKER = "\n__TTS_AUDIO__";
				let textContent = fullContent;
				let audioBase64: string | undefined;

				if (fullContent.includes(TTS_MARKER)) {
					const [text, audio] = fullContent.split(TTS_MARKER);
					textContent = text;
					audioBase64 = audio;
				}

				setMessages((prev) =>
					prev.map((msg) =>
						msg.id === aiMessageId
							? {
									...msg,
									content: textContent,
									isStreaming: false,
									audio: audioBase64,
								}
							: msg,
					),
				);

				if (
					audioBase64 &&
					audioPlaybackGeneration === audioPlaybackGenerationRef.current
				) {
					playAudio(audioBase64, aiMessageId);
				}
			} catch (error) {
				console.error("Error sending message:", error);
				setMessages((prev) =>
					prev.map((msg) =>
						msg.id === aiMessageId
							? {
									...msg,
									content:
										error instanceof Error &&
										error.message === "FREE_REPLY_LIMIT_REACHED"
											? "You've reached the free conversation cap for today. Upgrade to keep chatting."
											: "Sorry, I couldn't respond. Please try again.",
									isStreaming: false,
								}
							: msg,
					),
				);
			}
		},
		[sessionId, playAudio, openDialog],
	);

	const generateTTS = useCallback(
		async (text: string, messageId: string) => {
			setGeneratingTTS((prev) => new Set(prev).add(messageId));
			try {
				const response = await fetch(
					`${env.VITE_SERVER_URL}/api/conversation/speak`,
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						credentials: "include",
						body: JSON.stringify({ text, voice }),
					},
				);
				if (!response.ok) return null;
				const { audio } = await response.json();

				setMessages((prev) =>
					prev.map((m) => (m.id === messageId ? { ...m, audio } : m)),
				);

				return audio as string;
			} catch (err) {
				console.error("TTS generation error:", err);
				return null;
			} finally {
				setGeneratingTTS((prev) => {
					const next = new Set(prev);
					next.delete(messageId);
					return next;
				});
			}
		},
		[voice],
	);

	const handleFinishSession = useCallback(async () => {
		if (!sessionId) return;
		setIsFinishing(true);
		const durationSeconds = getElapsedSeconds();
		try {
			if (canGetFeedback) {
				const response = await fetch(
					`${env.VITE_SERVER_URL}/api/conversation/finish`,
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						credentials: "include",
						body: JSON.stringify({ sessionId, durationSeconds }),
					},
				);
				if (!response.ok) throw new Error("Failed to finish session");
				await Promise.all([
					queryClient.invalidateQueries({
						queryKey: trpc.conversation.getSession.queryKey({ sessionId }),
					}),
					queryClient.invalidateQueries({
						queryKey: trpc.conversation.getReview.queryKey({ sessionId }),
					}),
				]);
			} else {
				await fetch(`${env.VITE_SERVER_URL}/api/conversation/finish`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					credentials: "include",
					body: JSON.stringify({ sessionId, durationSeconds }),
				});
				navigate({ to: "/practice" });
			}
		} catch (error) {
			console.error("Error finishing session:", error);
			setIsFinishing(false);
		}
	}, [
		sessionId,
		canGetFeedback,
		navigate,
		getElapsedSeconds,
		queryClient,
		trpc,
	]);

	useEffect(() => {
		if (data?.messages && !hasPlayedInitialAudio.current) {
			const loadedMessages = data.messages.map((m) => ({
				id: m.id,
				role: m.role,
				content: m.content,
			}));
			setMessages(loadedMessages as Message[]);

			const lastAiMessage = data.messages
				.filter((m) => m.role === "assistant")
				.pop();

			if (lastAiMessage) {
				hasPlayedInitialAudio.current = true;
				const audioPlaybackGeneration = audioPlaybackGenerationRef.current;
				generateTTS(lastAiMessage.content, lastAiMessage.id).then((audio) => {
					if (
						audio &&
						audioPlaybackGeneration === audioPlaybackGenerationRef.current
					) {
						playAudio(audio, lastAiMessage.id);
					}
				});
			}
		}
	}, [data, generateTTS, playAudio]);

	const { startRecording, stopRecording, cancelRecording, recordingState } =
		useAudioRecorder(sessionId, sendMessage, selectedDevice);
	const handleStartRecording = useCallback(async () => {
		stopAssistantAudio();
		await startRecording();
	}, [startRecording, stopAssistantAudio]);
	return (
		<div className="flex min-h-full flex-1 flex-col">
			<div className="flex-1 space-y-4 px-1 py-4">
				{messages.map((message) => (
					<div
						key={message.id}
						className={cn(
							"flex",
							message.role === "user" ? "justify-end" : "justify-start",
						)}
					>
						<div
							className={cn(
								"max-w-[85%] rounded-2xl px-4 py-4",
								message.role === "user"
									? "rounded-tr-md bg-radial from-[#EFFF9B] to-[#D8FF76]"
									: "rounded-tl-md border-black/5 bg-white",
							)}
							style={{
								boxShadow:
									"0 0 0 1px #0000000f,0 1px 1px #00000010,inset 0 1px #fff,inset 0 -1px 1px #fff3,inset 0 1px 4px 1px #fff3,inset 0 -2px 1px 1px #0000000f,inset 0 20px 20px #00000002",
							}}
						>
							<p className="whitespace-pre-wrap text-sm leading-relaxed">
								<ClickableMessage
									sessionId={sessionId}
									content={message.content}
									vocabMode={vocabMode}
									disabled={message.isStreaming}
								/>
								{message.isStreaming && (
									<span className="flex gap-1 py-1">
										<span className="size-1.5 animate-bounce rounded-full bg-current opacity-60" />
										<span
											className="size-1.5 animate-bounce rounded-full bg-current opacity-60"
											style={{ animationDelay: "0.1s" }}
										/>
										<span
											className="size-1.5 animate-bounce rounded-full bg-current opacity-60"
											style={{ animationDelay: "0.2s" }}
										/>
									</span>
								)}
								{message.role === "assistant" && !message.isStreaming && (
									<span className="mt-2 flex items-center gap-1.5">
										<Button
											variant="outline"
											size="sm"
											className={cn(
												"rounded-lg text-xs",
												isPlaying === message.id &&
													"border-lime-300 bg-lime-100",
											)}
											onClick={() => {
												if (generatingTTS.has(message.id)) return;
												if (isPlaying === message.id) {
													stopAudio();
												} else if (message.audio) {
													playAudio(message.audio, message.id);
												} else {
													const audioPlaybackGeneration =
														audioPlaybackGenerationRef.current;
													generateTTS(message.content, message.id).then(
														(audio) => {
															if (
																audio &&
																audioPlaybackGeneration ===
																	audioPlaybackGenerationRef.current
															) {
																playAudio(audio, message.id);
															}
														},
													);
												}
											}}
											disabled={generatingTTS.has(message.id)}
											title={
												generatingTTS.has(message.id)
													? "Generating audio..."
													: isPlaying === message.id
														? "Stop"
														: "Play"
											}
										>
											{generatingTTS.has(message.id) ? (
												<Loader className="size-3 animate-spin" />
											) : isPlaying === message.id ? (
												<PauseIcon className="size-3" fill="currentColor" />
											) : (
												<PlayIcon className="size-3" fill="currentColor" />
											)}
										</Button>
										<Button
											variant="outline"
											size="sm"
											className={cn(
												"rounded-lg text-xs",
												translations[message.id] &&
													"border-blue-300 bg-blue-100",
											)}
											onClick={() =>
												translateMessage(message.id, message.content)
											}
											disabled={translatingId === message.id}
											title={
												translations[message.id]
													? "Hide translation"
													: "Translate to your language"
											}
										>
											{translatingId === message.id ? (
												<Loader className="size-3 animate-spin" />
											) : (
												<Languages className="size-3" />
											)}
										</Button>
									</span>
								)}
								{translations[message.id] && (
									<p className="mt-2 border-black/10 border-t border-dashed pt-2 text-muted-foreground text-xs italic leading-relaxed">
										{translations[message.id]}
									</p>
								)}
							</p>
						</div>
					</div>
				))}
				<div ref={messagesEndRef} />
			</div>

			<ConversationSettingsDrawer
				open={settingsOpen}
				onOpenChange={onSettingsOpenChange}
				audioDevices={audioDevices}
				selectedDevice={selectedDevice}
				setSelectedDevice={setSelectedDevice}
				autoTranslate={autoTranslate}
				onAutoTranslateChange={handleAutoTranslateToggle}
			/>

			<div className="sticky bottom-0 z-20 shrink-0 bg-linear-to-t from-neutral-50 via-neutral-50/95 to-transparent pt-3 dark:from-neutral-900 dark:via-neutral-900/95">
				{showHint && (
					<div className="mx-auto mb-3 max-w-xs">
						<div className="rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 pb-4 text-amber-700 shadow-[0_1px_1px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.75)]">
							<div className="mb-4 flex items-center justify-between gap-3">
								<div className="flex items-center gap-1">
									<Lightbulb className="size-4 shrink-0" />
									<p className="font-semibold text-xs">{hintHeading}</p>
								</div>
								<button
									type="button"
									className="rounded-full p-0 text-amber-700 hover:text-amber-600"
									onClick={fetchHintSuggestion}
									disabled={isLoading || isLoadingHint}
								>
									<RefreshCw
										className={cn(
											"mr-1 size-3.5",
											isLoadingHint ? "animate-spin" : "",
										)}
									/>
								</button>
							</div>
							{isLoadingHint ? (
								<div className="flex items-center gap-2 py-4 text-amber-700/80 text-sm">
									<Loader className="size-4 animate-spin" />
									<span>{hintLoadingText}</span>
								</div>
							) : hintSuggestion ? (
								<div className="space-y-3">
									<p className="text-sm leading-tight">{hintSuggestion.text}</p>
									{hintSuggestion.translation ? (
										<p className="border-amber-400 border-t border-dashed pt-2 text-amber-700 text-xs italic leading-tight">
											{hintSuggestion.translation}
										</p>
									) : null}
								</div>
							) : (
								<p className="text-[#6d35ff]/80 text-sm">{hintEmptyText}</p>
							)}
						</div>
					</div>
				)}

				<ControlToolbar
					showHint={showHint}
					setShowHint={setShowHint}
					hasHint={Boolean(hintSuggestion)}
					fetchHintSuggestion={fetchHintSuggestion}
					isLoading={isLoading}
					recordingState={recordingState}
					startRecording={handleStartRecording}
					stopRecording={stopRecording}
					cancelRecording={cancelRecording}
					setShowFinishDialog={setShowFinishDialog}
					isFinishing={isFinishing}
					vocabMode={vocabMode}
					setVocabMode={setVocabMode}
				/>
			</div>

			<AlertDialog open={showFinishDialog} onOpenChange={setShowFinishDialog}>
				<AlertDialogContent className="w-sm">
					<AlertDialogHeader>
						<AlertDialogTitle>{finishTitle}</AlertDialogTitle>
						<AlertDialogDescription>{finishDescription}</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel
							className="rounded-xl bg-neutral-100 text-neutral-900 italic hover:bg-neutral-200"
							disabled={isFinishing}
						>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							className={cn(
								"rounded-xl text-white italic",
								canGetFeedback
									? "bg-lime-600 hover:bg-lime-700"
									: "bg-red-600 hover:bg-red-700",
							)}
							onClick={handleFinishSession}
							disabled={isFinishing}
						>
							{isFinishing ? (
								<Loader2 className="size-4 animate-spin" />
							) : canGetFeedback ? (
								"Finish & Get Feedback"
							) : (
								"Leave without feedback"
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
