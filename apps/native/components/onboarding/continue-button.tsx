import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, Text } from "react-native";

type ContinueButtonProps = {
	label?: string;
	onPress: () => void;
	disabled?: boolean;
	isLoading?: boolean;
};

export function ContinueButton({
	label = "Continue",
	onPress,
	disabled = false,
	isLoading = false,
}: ContinueButtonProps) {
	const isDisabled = disabled || isLoading;

	return (
		<Pressable
			onPress={onPress}
			disabled={isDisabled}
			accessibilityRole="button"
			accessibilityState={{ disabled: isDisabled }}
			className={`h-14 flex-row items-center justify-center gap-2 rounded-2xl border border-[#C6F64D] bg-[#D8FF76] active:opacity-80 ${isDisabled ? "opacity-50" : ""}`}
		>
			{isLoading ? (
				<ActivityIndicator size="small" color="#365314" />
			) : (
				<>
					<Text className="font-semibold text-base text-lime-900">{label}</Text>
					<Ionicons name="arrow-forward" size={20} color="#365314" />
				</>
			)}
		</Pressable>
	);
}
