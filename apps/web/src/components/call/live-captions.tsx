import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { CallCaption } from "@/hooks/use-realtime-call";
import { cn } from "@/lib/utils";

export function LiveCaptions({
	captions,
	tutorName,
}: {
	captions: CallCaption[];
	tutorName: string;
}) {
	const { t } = useTranslation("app");
	const endRef = useRef<HTMLDivElement>(null);
	const lastCaption = captions.at(-1);

	useEffect(() => {
		if (!lastCaption) return;
		endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
	}, [lastCaption]);

	return (
		<div
			aria-live="polite"
			className="flex max-h-56 w-full flex-col gap-2 overflow-y-auto px-1 [mask-image:linear-gradient(to_bottom,transparent,black_24px)]"
		>
			{captions.length === 0 ? (
				<p className="pt-6 text-center text-sm text-white/50">
					{t("call.captionsEmpty")}
				</p>
			) : (
				captions.map((caption) =>
					caption.role === "user" ? (
						<p
							key={caption.id}
							className={cn(
								"max-w-[85%] self-end rounded-[18px] rounded-br-md bg-[#007AFF] px-3.5 py-2 text-sm text-white",
								!caption.final && "opacity-70",
							)}
						>
							{caption.text}
						</p>
					) : (
						<div key={caption.id} className="flex max-w-[85%] flex-col gap-1">
							<span className="pl-1 font-medium text-[11px] text-white/50">
								{tutorName}
							</span>
							<p
								className={cn(
									"rounded-[18px] rounded-bl-md bg-white/10 px-3.5 py-2 text-sm text-white",
									!caption.final && "opacity-80",
								)}
							>
								{caption.text}
							</p>
						</div>
					),
				)
			)}
			<div ref={endRef} />
		</div>
	);
}
