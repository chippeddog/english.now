import { ActivityIndicator, Text, TouchableOpacity } from "react-native";

type PrimaryButtonProps = {
	label: string;
	onPress: () => void;
	isLoading?: boolean;
	disabled?: boolean;
};

export function PrimaryButton({
	label,
	onPress,
	isLoading = false,
	disabled = false,
}: PrimaryButtonProps) {
	const isDisabled = disabled || isLoading;

	return (
		<TouchableOpacity
			onPress={onPress}
			disabled={isDisabled}
			className={`h-12 flex-row items-center justify-center rounded-md bg-primary ${isDisabled ? "opacity-60" : ""}`}
		>
			{isLoading ? (
				<ActivityIndicator size="small" color="#fff" />
			) : (
				<Text className="font-semibold text-base text-primary-foreground">
					{label}
				</Text>
			)}
		</TouchableOpacity>
	);
}
