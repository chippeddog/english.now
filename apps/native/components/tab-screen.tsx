import type React from "react";
import {
	KeyboardAvoidingView,
	Platform,
	RefreshControl,
	ScrollView,
} from "react-native";
import {
	SafeAreaView,
	useSafeAreaInsets,
} from "react-native-safe-area-context";
import { AppHeader } from "@/components/app-header";
import {
	GLASS_TAB_BAR_HEIGHT,
	GLASS_TAB_BAR_MARGIN,
} from "@/components/glass-tab-bar";

type TabScreenProps = {
	children: React.ReactNode;
	refreshing?: boolean;
	onRefresh?: () => void;
	avoidKeyboard?: boolean;
};

export function TabScreen({
	children,
	refreshing = false,
	onRefresh,
	avoidKeyboard = false,
}: TabScreenProps) {
	const insets = useSafeAreaInsets();
	// The floating tab bar overlays the scene, so content must scroll clear of it.
	const bottomPadding =
		GLASS_TAB_BAR_HEIGHT + Math.max(insets.bottom, GLASS_TAB_BAR_MARGIN) + 24;

	const scrollView = (
		<ScrollView
			contentContainerClassName="px-4 pt-2"
			contentContainerStyle={{ paddingBottom: bottomPadding }}
			contentInsetAdjustmentBehavior="never"
			keyboardShouldPersistTaps="handled"
			refreshControl={
				onRefresh ? (
					<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
				) : undefined
			}
		>
			{children}
		</ScrollView>
	);

	return (
		<SafeAreaView className="flex-1 bg-neutral-50" edges={["top"]}>
			<AppHeader />
			{avoidKeyboard ? (
				<KeyboardAvoidingView
					className="flex-1"
					behavior={Platform.OS === "ios" ? "padding" : undefined}
				>
					{scrollView}
				</KeyboardAvoidingView>
			) : (
				scrollView
			)}
		</SafeAreaView>
	);
}
