import type React from "react";
import { Pressable, Text, View } from "react-native";
import { elevatedCardShadow } from "@/components/onboarding/card-shadow";

export function Card({
	children,
	className = "",
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<View
			className={`rounded-3xl bg-white p-4 ${className}`}
			style={elevatedCardShadow}
		>
			{children}
		</View>
	);
}

export function CardHeader({
	title,
	actionLabel,
	onAction,
	right,
}: {
	title: string;
	actionLabel?: string;
	onAction?: () => void;
	right?: React.ReactNode;
}) {
	return (
		<View className="mb-3 flex-row items-center justify-between px-1">
			<Text className="font-semibold text-neutral-900 text-sm">{title}</Text>
			{actionLabel && onAction ? (
				<Pressable onPress={onAction} hitSlop={8} accessibilityRole="button">
					<Text className="font-medium text-neutral-500 text-xs">
						{actionLabel}
					</Text>
				</Pressable>
			) : (
				right
			)}
		</View>
	);
}
