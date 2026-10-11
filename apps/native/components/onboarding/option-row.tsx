import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import type { IconName } from "@/lib/onboarding-options";
import { cardShadow } from "./card-shadow";

type OptionRowProps = {
	name: string;
	description: string;
	emoji?: string;
	icon?: IconName;
	isSelected: boolean;
	onPress: () => void;
};

export function OptionRow({
	name,
	description,
	emoji,
	icon,
	isSelected,
	onPress,
}: OptionRowProps) {
	return (
		<Pressable
			onPress={onPress}
			accessibilityRole="radio"
			accessibilityState={{ selected: isSelected }}
			className={`flex-row items-center gap-4 rounded-2xl border-2 p-4 ${isSelected ? "border-lime-400 bg-lime-50" : "border-transparent bg-white"}`}
			style={isSelected ? undefined : cardShadow}
		>
			<View
				className={`size-12 items-center justify-center rounded-2xl ${isSelected ? "bg-[#D8FF76]" : "bg-neutral-100"}`}
			>
				{emoji ? (
					<Text className="text-2xl">{emoji}</Text>
				) : icon ? (
					<Ionicons
						name={icon}
						size={24}
						color={isSelected ? "#4d7c0f" : "#525252"}
					/>
				) : null}
			</View>
			<View className="flex-1">
				<Text className="font-semibold text-base text-neutral-900">{name}</Text>
				<Text className="text-neutral-500 text-sm">{description}</Text>
			</View>
			<View
				className={`size-6 items-center justify-center rounded-full border-2 ${isSelected ? "border-lime-500 bg-lime-500" : "border-neutral-300"}`}
			>
				{isSelected ? (
					<Ionicons name="checkmark" size={16} color="#fff" />
				) : null}
			</View>
		</Pressable>
	);
}
