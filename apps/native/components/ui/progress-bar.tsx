import { View } from "react-native";

export function ProgressBar({
	value,
	colorClassName = "bg-lime-500",
	className = "",
}: {
	value: number;
	colorClassName?: string;
	className?: string;
}) {
	const clamped = Math.max(0, Math.min(100, value));

	return (
		<View
			className={`h-1.5 overflow-hidden rounded-full bg-neutral-100 ${className}`}
		>
			<View
				className={`h-full rounded-full ${colorClassName}`}
				style={{ width: `${clamped}%` }}
			/>
		</View>
	);
}
