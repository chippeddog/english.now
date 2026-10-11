import { Ionicons } from "@expo/vector-icons";
import type React from "react";
import { Pressable, Text, View } from "react-native";
import type { IconName } from "@/lib/onboarding-options";
import { cardShadow } from "./card-shadow";

type OptionTileProps = {
	name: string;
	icon?: IconName;
	flag?: string;
	isSelected: boolean;
	onPress: () => void;
};

export function OptionTile({
	name,
	icon,
	flag,
	isSelected,
	onPress,
}: OptionTileProps) {
	return (
		<Pressable
			onPress={onPress}
			accessibilityRole="checkbox"
			accessibilityState={{ checked: isSelected }}
			className={`relative w-[48%] rounded-2xl border-2 ${flag ? "flex-row items-center gap-2.5 p-4" : "items-center gap-3 p-5"} ${isSelected ? "border-lime-500 bg-lime-50" : "border-transparent bg-white"}`}
			style={isSelected ? undefined : cardShadow}
		>
			{isSelected ? (
				<View className="absolute top-2.5 right-2.5 size-5 items-center justify-center rounded-full bg-lime-500">
					<Ionicons name="checkmark" size={12} color="#fff" />
				</View>
			) : null}
			{flag ? (
				<Text className="text-2xl">{flag}</Text>
			) : icon ? (
				<View
					className={`size-14 items-center justify-center rounded-xl ${isSelected ? "bg-[#D8FF76]" : "bg-neutral-100"}`}
				>
					<Ionicons
						name={icon}
						size={28}
						color={isSelected ? "#4d7c0f" : "#525252"}
					/>
				</View>
			) : null}
			<Text
				className={`shrink font-semibold text-neutral-900 ${flag ? "text-base" : "text-center text-sm"}`}
				numberOfLines={2}
			>
				{name}
			</Text>
		</Pressable>
	);
}

export function OptionGrid({ children }: { children: React.ReactNode }) {
	return (
		<View className="flex-row flex-wrap justify-between gap-y-3">
			{children}
		</View>
	);
}
