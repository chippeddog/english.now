import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

type OnboardingHeaderProps = {
	progress?: number;
	onBack?: () => void;
	onSignOut: () => void;
	isSigningOut?: boolean;
};

export function OnboardingHeader({
	progress,
	onBack,
	onSignOut,
	isSigningOut = false,
}: OnboardingHeaderProps) {
	return (
		<View>
			<View className="h-1 bg-neutral-200">
				{progress !== undefined ? (
					<View
						className="h-full bg-[#C6F64D]"
						style={{ width: `${Math.round(progress * 100)}%` }}
					/>
				) : null}
			</View>
			<View className="flex-row items-center justify-between px-4 py-3">
				{onBack ? (
					<Pressable
						onPress={onBack}
						accessibilityRole="button"
						accessibilityLabel="Back"
						hitSlop={8}
						className="size-10 items-center justify-center rounded-xl border border-neutral-200 bg-white active:opacity-70"
					>
						<Ionicons name="chevron-back" size={20} color="#171717" />
					</Pressable>
				) : (
					<View className="size-10" />
				)}
				<Text className="font-bold text-lg text-neutral-900">english.now</Text>
				<Pressable
					onPress={onSignOut}
					disabled={isSigningOut}
					accessibilityRole="button"
					accessibilityLabel="Sign out"
					hitSlop={8}
					className={`size-10 items-center justify-center rounded-xl border border-neutral-200 bg-white active:opacity-70 ${isSigningOut ? "opacity-50" : ""}`}
				>
					<Ionicons name="log-out-outline" size={18} color="#171717" />
				</Pressable>
			</View>
		</View>
	);
}
