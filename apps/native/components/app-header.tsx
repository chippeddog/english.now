import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { GlassView } from "expo-glass-effect";
import { useRouter } from "expo-router";
import type React from "react";
import { Pressable, Text, View } from "react-native";
import { cardShadow } from "@/components/onboarding/card-shadow";
import { canUseLiquidGlass } from "@/lib/glass";
import { openOnWeb } from "@/lib/open-on-web";
import { trpc } from "@/utils/trpc";

function HeaderCapsule({
	children,
	onPress,
	accessibilityLabel,
	tintColor,
	fallbackClassName = "bg-white",
}: {
	children: React.ReactNode;
	onPress: () => void;
	accessibilityLabel: string;
	tintColor?: string;
	fallbackClassName?: string;
}) {
	const content = (
		<View className="h-10 flex-row items-center gap-1.5 px-3.5">
			{children}
		</View>
	);

	return (
		<Pressable
			onPress={onPress}
			accessibilityRole="button"
			accessibilityLabel={accessibilityLabel}
			className="active:opacity-80"
		>
			{canUseLiquidGlass ? (
				<GlassView
					isInteractive
					tintColor={tintColor}
					style={{ borderRadius: 20, overflow: "hidden" }}
				>
					{content}
				</GlassView>
			) : (
				<View
					className={`overflow-hidden rounded-full ${fallbackClassName}`}
					style={cardShadow}
				>
					{content}
				</View>
			)}
		</Pressable>
	);
}

export function AppHeader() {
	const router = useRouter();
	const { data: profile, isPending } = useQuery(
		trpc.profile.get.queryOptions(),
	);
	const streak = profile?.currentStreak ?? 0;
	const isPro = profile?.subscription.isPro ?? false;

	return (
		<View className="flex-row items-center justify-between px-4 pt-2 pb-3">
			<Text className="font-bold text-neutral-900 text-xl tracking-tight">
				english.now
			</Text>
			<View className="flex-row items-center gap-2">
				<HeaderCapsule
					onPress={() => router.navigate("/progress")}
					accessibilityLabel={`${streak} day streak`}
				>
					<Ionicons
						name={streak > 0 ? "flame" : "flame-outline"}
						size={18}
						color={streak > 0 ? "#f59e0b" : "#a3a3a3"}
					/>
					<Text className="font-semibold text-base text-neutral-900">
						{streak}
					</Text>
				</HeaderCapsule>
				{isPending ? null : isPro ? (
					<View className="h-10 flex-row items-center gap-1 rounded-full border border-[#C6F64D] bg-[#D8FF76] px-3.5">
						<Ionicons name="flash" size={14} color="#3f6212" />
						<Text className="font-bold text-lime-900 text-sm">PRO</Text>
					</View>
				) : (
					<HeaderCapsule
						onPress={() => openOnWeb("/pricing")}
						accessibilityLabel="Upgrade to Pro"
						tintColor="#D8FF76"
						fallbackClassName="border border-[#C6F64D] bg-[#D8FF76]"
					>
						<Ionicons name="flash" size={14} color="#3f6212" />
						<Text className="font-semibold text-lime-900 text-sm">Get Pro</Text>
					</HeaderCapsule>
				)}
			</View>
		</View>
	);
}
