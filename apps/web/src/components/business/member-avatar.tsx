import { cn } from "@/lib/utils";

const AVATAR_TINTS = [
	{ bg: "#C5E0FF", fg: "#1E3A5F" },
	{ bg: "#FFD0B5", fg: "#6B2E10" },
	{ bg: "#FFE3A3", fg: "#5C4205" },
	{ bg: "#E3D4FF", fg: "#3F2A6B" },
	{ bg: "#C8F5C4", fg: "#1F4D1B" },
] as const;

const SIZES = {
	sm: "size-8 text-xs",
	md: "size-10 text-sm",
	lg: "size-16 text-lg",
	xl: "size-20 text-xl",
} as const;

function getInitials(name: string) {
	return name
		.split(" ")
		.map((part) => part[0])
		.filter(Boolean)
		.slice(0, 2)
		.join("")
		.toUpperCase();
}

function getTint(name: string) {
	let hash = 0;
	for (const char of name) {
		hash = (hash * 31 + char.charCodeAt(0)) | 0;
	}
	return AVATAR_TINTS[Math.abs(hash) % AVATAR_TINTS.length];
}

export function MemberAvatar({
	name,
	size = "md",
	muted = false,
	className,
}: {
	name: string;
	size?: keyof typeof SIZES;
	muted?: boolean;
	className?: string;
}) {
	const tint = getTint(name);

	return (
		<div
			aria-hidden="true"
			className={cn(
				"flex shrink-0 select-none items-center justify-center rounded-full font-semibold",
				SIZES[size],
				muted && "border border-[rgba(23,32,51,0.18)] border-dashed",
				className,
			)}
			style={
				muted
					? { backgroundColor: "#F5F7FA", color: "#5B6478" }
					: { backgroundColor: tint.bg, color: tint.fg }
			}
		>
			{getInitials(name)}
		</div>
	);
}
