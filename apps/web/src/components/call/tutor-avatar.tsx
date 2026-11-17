import type { CallTutorTone } from "@english.now/api/services/call-tutors";
import { cn } from "@/lib/utils";

const toneClass: Record<CallTutorTone, string> = {
	sky: "bg-[#C5E0FF]",
	peach: "bg-[#FFD0B5]",
	violet: "bg-[#E3D4FF]",
	amber: "bg-[#FFE3A3]",
	mint: "bg-[#C8F5C4]",
};

export function TutorAvatar({
	tone,
	className,
}: {
	tone: CallTutorTone;
	className?: string;
}) {
	return (
		<span
			aria-hidden="true"
			className={cn(
				"relative inline-flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full",
				toneClass[tone],
				className,
			)}
		>
			<svg viewBox="0 0 32 32" className="size-[78%]" aria-hidden="true">
				<circle cx="11.5" cy="14" r="1.7" fill="#2b241c" />
				<circle cx="20.5" cy="14" r="1.7" fill="#2b241c" />
				<path
					d="M12.2 20.2c1.2 1.5 2.5 2.1 3.8 2.1s2.6-.6 3.8-2.1"
					fill="none"
					stroke="#2b241c"
					strokeWidth="1.5"
					strokeLinecap="round"
				/>
			</svg>
		</span>
	);
}
