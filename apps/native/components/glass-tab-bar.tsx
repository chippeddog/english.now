import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { GlassView } from "expo-glass-effect";
import type { Tabs } from "expo-router";
import type React from "react";
import type { ComponentProps } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { canUseLiquidGlass } from "@/lib/glass";
import type { IconName } from "@/lib/onboarding-options";

type TabBarProps = Parameters<
	NonNullable<ComponentProps<typeof Tabs>["tabBar"]>
>[0];

export const GLASS_TAB_BAR_HEIGHT = 64;
export const GLASS_TAB_BAR_MARGIN = 12;

const TAB_ICONS: Record<string, { active: IconName; inactive: IconName }> = {
	index: { active: "home", inactive: "home-outline" },
	progress: { active: "stats-chart", inactive: "stats-chart-outline" },
	settings: { active: "settings", inactive: "settings-outline" },
};

const capsuleStyle = {
	height: GLASS_TAB_BAR_HEIGHT,
	borderRadius: GLASS_TAB_BAR_HEIGHT / 2,
	flexDirection: "row",
	alignItems: "center",
	padding: 6,
	overflow: "hidden",
} as const;

function TabBarSurface({ children }: { children: React.ReactNode }) {
	if (canUseLiquidGlass) {
		return (
			<GlassView isInteractive glassEffectStyle="regular" style={capsuleStyle}>
				{children}
			</GlassView>
		);
	}

	return (
		<View
			className="rounded-full border border-white/70"
			style={{
				shadowColor: "#000",
				shadowOffset: { width: 0, height: 8 },
				shadowOpacity: 0.12,
				shadowRadius: 24,
				elevation: 8,
			}}
		>
			<BlurView
				intensity={60}
				tint="systemChromeMaterialLight"
				style={capsuleStyle}
			>
				<View className="absolute inset-0 bg-white/50" />
				{children}
			</BlurView>
		</View>
	);
}

export function GlassTabBar({ state, descriptors, navigation }: TabBarProps) {
	const insets = useSafeAreaInsets();

	return (
		<View
			className="absolute right-0 left-0 items-center px-6"
			style={{
				bottom: Math.max(insets.bottom, GLASS_TAB_BAR_MARGIN),
				pointerEvents: "box-none",
			}}
		>
			<View className="w-full max-w-md">
				<TabBarSurface>
					{state.routes.map((route, index) => {
						const isFocused = state.index === index;
						const options = descriptors[route.key]?.options;
						const label =
							typeof options?.title === "string" ? options.title : route.name;
						const icons = TAB_ICONS[route.name] ?? {
							active: "ellipse",
							inactive: "ellipse-outline",
						};

						const onPress = () => {
							const event = navigation.emit({
								type: "tabPress",
								target: route.key,
								canPreventDefault: true,
							});
							if (!isFocused && !event.defaultPrevented) {
								navigation.navigate(route.name, route.params);
							}
						};

						return (
							<Pressable
								key={route.key}
								onPress={onPress}
								onLongPress={() =>
									navigation.emit({ type: "tabLongPress", target: route.key })
								}
								accessibilityRole="tab"
								accessibilityState={{ selected: isFocused }}
								accessibilityLabel={label}
								className={`h-full flex-1 items-center justify-center gap-0.5 rounded-full ${isFocused ? "bg-[#D8FF76]/80" : ""}`}
							>
								<Ionicons
									name={isFocused ? icons.active : icons.inactive}
									size={22}
									color={isFocused ? "#3f6212" : "#404040"}
								/>
								<Text
									className={`text-[11px] ${isFocused ? "font-semibold text-lime-900" : "font-medium text-neutral-700"}`}
								>
									{label}
								</Text>
							</Pressable>
						);
					})}
				</TabBarSurface>
			</View>
		</View>
	);
}
