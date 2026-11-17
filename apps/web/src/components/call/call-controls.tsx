import {
	Captions,
	CaptionsOff,
	Lightbulb,
	Mic,
	MicOff,
	PhoneOff,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

function ControlButton({
	label,
	icon: Icon,
	active = false,
	disabled = false,
	onClick,
}: {
	label: string;
	icon: ComponentType<SVGProps<SVGSVGElement>>;
	active?: boolean;
	disabled?: boolean;
	onClick: () => void;
}) {
	return (
		<div className="flex flex-col items-center gap-2">
			<button
				type="button"
				aria-label={label}
				aria-pressed={active}
				disabled={disabled}
				onClick={onClick}
				className={cn(
					"flex size-16 cursor-pointer items-center justify-center rounded-full outline-none transition-colors focus-visible:ring-[#007AFF]/40 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-40",
					active
						? "bg-white text-[#172033]"
						: "bg-white/10 text-white hover:bg-white/15",
				)}
			>
				<Icon className="size-6" strokeWidth={1.8} />
			</button>
			<span className="font-medium text-white/70 text-xs">{label}</span>
		</div>
	);
}

export function CallControls({
	isMuted,
	captionsOn,
	canRequestHint,
	onToggleMute,
	onToggleCaptions,
	onRequestHint,
	onHangUp,
}: {
	isMuted: boolean;
	captionsOn: boolean;
	canRequestHint: boolean;
	onToggleMute: () => void;
	onToggleCaptions: () => void;
	onRequestHint: () => void;
	onHangUp: () => void;
}) {
	const { t } = useTranslation("app");

	return (
		<div className="flex items-start justify-center gap-5 sm:gap-7">
			<ControlButton
				label={isMuted ? t("call.unmute") : t("call.mute")}
				icon={isMuted ? MicOff : Mic}
				active={isMuted}
				onClick={onToggleMute}
			/>
			<ControlButton
				label={t("call.captions")}
				icon={captionsOn ? Captions : CaptionsOff}
				active={captionsOn}
				onClick={onToggleCaptions}
			/>
			<ControlButton
				label={t("call.help")}
				icon={Lightbulb}
				disabled={!canRequestHint}
				onClick={onRequestHint}
			/>
			<div className="flex flex-col items-center gap-2">
				<button
					type="button"
					aria-label={t("call.end")}
					onClick={onHangUp}
					className="flex size-16 cursor-pointer items-center justify-center rounded-full bg-[#FF3B30] text-white outline-none transition-colors hover:bg-[#FF3B30]/90 focus-visible:ring-[#FF3B30]/40 focus-visible:ring-[3px]"
				>
					<PhoneOff className="size-6" strokeWidth={1.8} />
				</button>
				<span className="font-medium text-white/70 text-xs">
					{t("call.end")}
				</span>
			</div>
		</div>
	);
}
