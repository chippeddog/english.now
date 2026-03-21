import { Bot, UserIcon, Volume1, Volume2 } from "lucide-react";
import { useMemo } from "react";
import ClickableMessage from "@/components/conversation/clickable-message";
import { TranscriptHighlightedText } from "@/components/conversation/review/transcript-highlighted-text";
import { highlightsForUserMessage } from "@/lib/conversation-review-ui";
import { cn } from "@/lib/utils";
import type { ReviewProblem } from "@/types/conversation-review";

type MessageRow = {
	id: string;
	role: string;
	content: string;
	audioUrl?: string | null;
};

export function TranscriptReviewRail({
	sessionId,
	messages,
	problems,
	playingId,
	onPlayAudio,
}: {
	sessionId: string;
	messages: MessageRow[];
	problems: ReviewProblem[];
	playingId: string | null;
	onPlayAudio: (url: string, id: string) => void;
}) {
	const userMessageIds = useMemo(
		() => new Set(messages.filter((m) => m.role === "user").map((m) => m.id)),
		[messages],
	);

	return (
		<div
			className="rounded-3xl bg-white dark:bg-neutral-950"
			style={{
				boxShadow:
					"0 0 0 1px rgba(0,0,0,.05),0 10px 10px -5px rgba(0,0,0,.04),0 20px 25px -5px rgba(0,0,0,.04),0 20px 32px -12px rgba(0,0,0,.04)",
			}}
		>
			<div className="flex flex-wrap items-center justify-between gap-2 border-neutral-200 border-b px-4 py-3 dark:border-neutral-800">
				<p className="font-semibold text-sm">Transcript</p>
			</div>
			<div className="max-h-[calc(100vh-180px)] space-y-4 divide-y divide-dashed divide-neutral-200 overflow-y-auto p-5 dark:divide-neutral-800">
				{messages.map((msg) => (
					<TranscriptReviewMessage
						key={msg.id}
						sessionId={sessionId}
						messageId={msg.id}
						content={msg.content}
						role={msg.role as "user" | "assistant"}
						audioUrl={msg.audioUrl}
						playingId={playingId}
						onPlayAudio={onPlayAudio}
						highlights={
							msg.role === "user"
								? highlightsForUserMessage(
										problems,
										msg.id,
										msg.content,
										userMessageIds,
									)
								: []
						}
					/>
				))}
			</div>
		</div>
	);
}

function TranscriptReviewMessage({
	sessionId,
	messageId,
	content,
	role,
	audioUrl,
	playingId,
	onPlayAudio,
	highlights,
}: {
	sessionId: string;
	messageId: string;
	content: string;
	role: "user" | "assistant";
	audioUrl?: string | null;
	playingId: string | null;
	onPlayAudio: (url: string, id: string) => void;
	highlights: ReturnType<typeof highlightsForUserMessage>;
}) {
	return (
		<div className="pb-3" data-review-message={messageId}>
			<div className="flex gap-3">
				<div className="flex shrink-0 flex-col items-center gap-1">
					<div
						className={cn(
							"flex size-7 items-center justify-center rounded-full font-medium text-xs",
							role === "assistant"
								? "bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
								: "bg-lime-100 text-lime-700 dark:bg-lime-950 dark:text-lime-300",
						)}
					>
						{role === "assistant" ? (
							<Bot className="size-4" />
						) : (
							<UserIcon className="size-4" aria-label="User" />
						)}
					</div>
				</div>
				<div className="min-w-0 flex-1">
					<div className="mb-1 flex items-center gap-2">
						<span className="flex items-center gap-1.5 font-semibold text-sm">
							{role === "assistant" ? "Assistant" : "You"}
							{role === "user" && audioUrl ? (
								<button
									type="button"
									onClick={() => onPlayAudio(audioUrl, messageId)}
									className={cn(
										"rounded-md p-0.5 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800",
										playingId === messageId
											? "text-primary"
											: "text-muted-foreground",
									)}
									aria-label={
										playingId === messageId
											? "Stop playback"
											: "Play your recording"
									}
									aria-pressed={playingId === messageId}
								>
									{playingId === messageId ? (
										<Volume2 className="size-4" />
									) : (
										<Volume1 className="size-4" />
									)}
								</button>
							) : null}
						</span>
					</div>
					<p className="text-sm leading-relaxed">
						{role === "user" && highlights.length > 0 ? (
							<TranscriptHighlightedText
								text={content}
								highlights={highlights}
							/>
						) : (
							<ClickableMessage
								sessionId={sessionId}
								content={content}
								vocabMode="off"
							/>
						)}
					</p>
				</div>
			</div>
		</div>
	);
}
