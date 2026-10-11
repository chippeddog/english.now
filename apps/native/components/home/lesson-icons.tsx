import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";
import type { IconName } from "@/lib/onboarding-options";

export type LessonStatus = "completed" | "current" | "available" | "locked";
export type UnitStatus = "completed" | "active" | "locked";

const LESSON_TYPE_ICONS: Record<string, IconName> = {
	grammar: "create-outline",
	vocabulary: "book-outline",
	reading: "document-text-outline",
	listening: "volume-medium-outline",
	speaking: "play-outline",
	writing: "school-outline",
	input: "book-outline",
	teach: "create-outline",
	practice: "play-outline",
	review: "checkmark",
	assessment: "school-outline",
};

function Circle({
	className,
	icon,
	color,
	size = 14,
}: {
	className: string;
	icon: IconName;
	color: string;
	size?: number;
}) {
	return (
		<View
			className={`size-7 items-center justify-center rounded-full border ${className}`}
		>
			<Ionicons name={icon} size={size} color={color} />
		</View>
	);
}

const COMPLETED = (
	<Circle
		className="border-emerald-600 bg-emerald-600"
		icon="checkmark"
		color="#fff"
		size={16}
	/>
);
const LOCKED = (
	<Circle
		className="border-neutral-200 bg-white"
		icon="lock-closed"
		color="#d4d4d4"
		size={12}
	/>
);

export function LessonIcon({ status, type }: { status: string; type: string }) {
	if (status === "completed") return COMPLETED;
	if (status === "locked") return LOCKED;
	const icon = LESSON_TYPE_ICONS[type] ?? "book-outline";
	return status === "current" ? (
		<Circle
			className="border-lime-300 bg-lime-200"
			icon={icon}
			color="#4d7c0f"
		/>
	) : (
		<Circle
			className="border-neutral-200 bg-white"
			icon={icon}
			color="#a3a3a3"
		/>
	);
}

export function UnitStatusIcon({ status }: { status: string }) {
	if (status === "completed") return COMPLETED;
	if (status === "locked") return LOCKED;
	return (
		<Circle
			className="border-lime-300 bg-lime-200"
			icon="play"
			color="#4d7c0f"
		/>
	);
}
