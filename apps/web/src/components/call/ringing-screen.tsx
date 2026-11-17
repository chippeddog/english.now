import type { CallTutor } from "@english.now/api/services/call-tutors";
import { Phone, PhoneOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { TutorAvatar } from "./tutor-avatar";

export function RingingScreen({
	tutor,
	topic,
	isRinging,
	onStart,
	onCancel,
}: {
	tutor: CallTutor;
	topic: string | null;
	isRinging: boolean;
	onStart: () => void;
	onCancel: () => void;
}) {
	const { t } = useTranslation("app");

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

			<div className="flex flex-1 flex-col items-center justify-center gap-6">
				<div className="relative flex size-52 items-center justify-center">
					{isRinging ? (
						<>
							<span
								aria-hidden="true"
								className="absolute inset-8 rounded-full bg-white/10 motion-safe:animate-ping"
							/>
							<span
								aria-hidden="true"
								className="absolute inset-12 rounded-full bg-white/10 [animation-delay:400ms] motion-safe:animate-ping"
							/>
						</>
					) : null}
					<TutorAvatar
						tone={tutor.tone}
						className="relative size-32 ring-4 ring-white/10"
					/>
				</div>
				<div className="flex flex-col items-center gap-1.5 text-center">
					<h1 className="font-semibold text-3xl text-white tracking-[-0.022em]">
						{tutor.name}
					</h1>
					<p className="font-medium text-base text-white/70">
						{isRinging ? t("call.calling") : tutor.tagline}
					</p>
				</div>
			</div>

			<div className="flex flex-col items-center gap-2">
				{isRinging ? (
					<>
						<button
							type="button"
							aria-label={t("call.end")}
							onClick={onCancel}
							className="flex size-16 cursor-pointer items-center justify-center rounded-full bg-[#FF3B30] text-white outline-none transition-colors hover:bg-[#FF3B30]/90 focus-visible:ring-[#FF3B30]/40 focus-visible:ring-[3px]"
						>
							<PhoneOff className="size-6" strokeWidth={1.8} />
						</button>
						<span className="font-medium text-white/70 text-xs">
							{t("call.end")}
						</span>
					</>
				) : (
					<>
						<button
							type="button"
							aria-label={t("call.startCall")}
							onClick={onStart}
							className="flex size-16 cursor-pointer items-center justify-center rounded-full bg-[#34C759] text-white outline-none transition-colors hover:bg-[#34C759]/90 focus-visible:ring-[#34C759]/40 focus-visible:ring-[3px]"
						>
							<Phone className="size-6" strokeWidth={1.8} />
						</button>
						<span className="font-medium text-white/70 text-xs">
							{t("call.tapToCall")}
						</span>
					</>
				)}
			</div>
		</div>
	);
}
