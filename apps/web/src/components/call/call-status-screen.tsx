import type { CallTutor } from "@english.now/api/services/call-tutors";
import { Loader2, Phone } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { CallErrorCode } from "@/hooks/use-realtime-call";
import { TutorAvatar } from "./tutor-avatar";

const RETRYABLE_ERRORS = new Set<CallErrorCode>([
	"MIC_DENIED",
	"UNAVAILABLE",
	"CONNECTION_LOST",
]);

export function CallEndedScreen({ tutor }: { tutor: CallTutor }) {
	const { t } = useTranslation("app");

	return (
		<div className="flex h-full w-full flex-col items-center justify-center gap-6 px-6">
			<TutorAvatar
				tone={tutor.tone}
				className="size-24 opacity-80 ring-4 ring-white/10"
			/>
			<div className="flex flex-col items-center gap-2 text-center">
				<h1 className="font-semibold text-2xl text-white tracking-[-0.022em]">
					{t("call.callEnded")}
				</h1>
				<p className="flex items-center gap-2 text-sm text-white/70">
					<Loader2 className="size-4 animate-spin" />
					{t("call.preparingReview")}
				</p>
			</div>
		</div>
	);
}

export function CallFailedScreen({
	tutor,
	error,
	onRetry,
	onEnd,
}: {
	tutor: CallTutor;
	error: CallErrorCode;
	onRetry: () => void;
	onEnd: () => void;
}) {
	const { t } = useTranslation("app");
	const canRetry = RETRYABLE_ERRORS.has(error);

	return (
		<div className="flex h-full w-full flex-col items-center justify-center gap-6 px-6">
			<TutorAvatar
				tone={tutor.tone}
				className="size-24 opacity-80 ring-4 ring-white/10"
			/>
			<div className="flex max-w-sm flex-col items-center gap-2 text-center">
				<h1 className="font-semibold text-2xl text-white tracking-[-0.022em]">
					{tutor.name}
				</h1>
				<p className="text-sm text-white/70">{t(`call.errors.${error}`)}</p>
			</div>
			<div className="flex flex-col items-center gap-3 sm:flex-row">
				{canRetry ? (
					<button
						type="button"
						onClick={onRetry}
						className="flex h-10 cursor-pointer items-center gap-2 rounded-[10px] bg-[#34C759] px-5 font-medium text-sm text-white outline-none transition-colors hover:bg-[#34C759]/90 focus-visible:ring-[#34C759]/40 focus-visible:ring-[3px]"
					>
						<Phone className="size-4" />
						{t("call.callAgain")}
					</button>
				) : null}
				<button
					type="button"
					onClick={onEnd}
					className="flex h-10 cursor-pointer items-center rounded-[10px] bg-white/10 px-5 font-medium text-sm text-white outline-none transition-colors hover:bg-white/15 focus-visible:ring-[#007AFF]/40 focus-visible:ring-[3px]"
				>
					{canRetry ? t("call.endCall") : t("call.seeReview")}
				</button>
			</div>
		</div>
	);
}
