import { getCallTutor } from "@english.now/api/services/call-tutors";
import { getConversationSessionMeta } from "@english.now/api/services/conversation-mode";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
	CallEndedScreen,
	CallFailedScreen,
} from "@/components/call/call-status-screen";
import { InCallScreen } from "@/components/call/in-call-screen";
import { RingingScreen } from "@/components/call/ringing-screen";
import { useRealtimeCall } from "@/hooks/use-realtime-call";
import { createTitle } from "@/utils/title";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_call/call/$sessionId")({
	component: CallPage,
	head: () => ({
		meta: [
			{
				title: createTitle("Call"),
			},
		],
	}),
});

const WARN_AT_SECONDS = 30;

function hasUserActivation() {
	const { userActivation } = navigator as Navigator & {
		userActivation?: { hasBeenActive: boolean };
	};
	return userActivation?.hasBeenActive ?? true;
}

function CallPage() {
	const { sessionId } = Route.useParams();
	const navigate = useNavigate();
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const { t } = useTranslation("app");
	const [captionsOn, setCaptionsOn] = useState(false);
	const autoStartedRef = useRef(false);
	const warnedRef = useRef(false);
	const cancelledRef = useRef(false);

	const { data, isLoading, error } = useQuery({
		...trpc.conversation.getSession.queryOptions({ sessionId }),
		retry: false,
		refetchOnWindowFocus: false,
	});

	const modeConfig = useMemo(() => {
		if (!data?.session) return null;
		const meta = getConversationSessionMeta(data.session);
		return meta.modeConfig.kind === "phone-call" ? meta.modeConfig : null;
	}, [data?.session]);
	const tutor = getCallTutor(modeConfig?.tutorId);
	const topic = modeConfig?.topic ?? null;
	const isActiveCall = Boolean(modeConfig && data?.session.status === "active");

	const call = useRealtimeCall(sessionId);
	const { start, hangUp } = call;

	const goToReview = useCallback(async () => {
		await Promise.all([
			queryClient.invalidateQueries({
				queryKey: trpc.conversation.getSession.queryKey({ sessionId }),
			}),
			queryClient.invalidateQueries({
				queryKey: trpc.conversation.getReview.queryKey({ sessionId }),
			}),
			queryClient.invalidateQueries({
				queryKey: trpc.practice.getRecentSessions.pathKey(),
			}),
		]);
		navigate({
			to: "/conversation/$sessionId",
			params: { sessionId },
			replace: true,
		});
	}, [navigate, queryClient, sessionId, trpc]);

	useEffect(() => {
		if (error) {
			navigate({ to: "/practice" });
			return;
		}
		if (data && !isActiveCall) {
			navigate({
				to: "/conversation/$sessionId",
				params: { sessionId },
				replace: true,
			});
		}
	}, [data, error, isActiveCall, navigate, sessionId]);

	useEffect(() => {
		if (!isActiveCall || autoStartedRef.current) return;
		autoStartedRef.current = true;
		if (hasUserActivation()) {
			void start();
		}
	}, [isActiveCall, start]);

	useEffect(() => {
		if (cancelledRef.current) return;
		if (call.status === "ended" || call.error === "CALL_ENDED") {
			void goToReview();
		}
	}, [call.error, call.status, goToReview]);

	useEffect(() => {
		if (
			call.status === "live" &&
			call.remainingSeconds !== null &&
			call.remainingSeconds > 0 &&
			call.remainingSeconds <= WARN_AT_SECONDS &&
			!warnedRef.current
		) {
			warnedRef.current = true;
			toast(t("call.endingSoon", { name: tutor.name }));
		}
	}, [call.remainingSeconds, call.status, t, tutor.name]);

	const handleCancelRinging = useCallback(async () => {
		cancelledRef.current = true;
		await hangUp();
		navigate({ to: "/practice/call", replace: true });
	}, [hangUp, navigate]);

	if (isLoading || !data || !isActiveCall) {
		return (
			<div className="flex h-full w-full items-center justify-center">
				<Loader className="size-5 animate-spin text-white/60" />
			</div>
		);
	}

	const elapsedSeconds =
		call.maxSeconds !== null && call.remainingSeconds !== null
			? call.maxSeconds - call.remainingSeconds
			: 0;

	return (
		<div className="relative flex h-full w-full flex-col items-center">
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-x-0 top-0 h-2/3 bg-[radial-gradient(60%_50%_at_50%_30%,rgba(197,224,255,0.14),transparent)]"
			/>
			<div className="relative flex h-full w-full max-w-lg flex-col">
				{call.status === "idle" || call.status === "ringing" ? (
					<RingingScreen
						tutor={tutor}
						topic={topic}
						isRinging={call.status === "ringing"}
						onStart={() => void start()}
						onCancel={() => void handleCancelRinging()}
					/>
				) : call.status === "live" ? (
					<InCallScreen
						tutor={tutor}
						topic={topic}
						captions={call.captions}
						captionsOn={captionsOn}
						isMuted={call.isMuted}
						tutorSpeaking={call.tutorSpeaking}
						learnerSpeaking={call.learnerSpeaking}
						canRequestHint={call.canRequestHint}
						elapsedSeconds={elapsedSeconds}
						remainingSeconds={call.remainingSeconds}
						getTutorLevel={call.getTutorLevel}
						getLearnerLevel={call.getLearnerLevel}
						onToggleMute={call.toggleMute}
						onToggleCaptions={() => setCaptionsOn((value) => !value)}
						onRequestHint={call.requestHint}
						onHangUp={() => void hangUp()}
					/>
				) : call.status === "failed" && call.error ? (
					<CallFailedScreen
						tutor={tutor}
						error={call.error}
						onRetry={() => void start()}
						onEnd={() => void hangUp()}
					/>
				) : (
					<CallEndedScreen tutor={tutor} />
				)}
			</div>
		</div>
	);
}
