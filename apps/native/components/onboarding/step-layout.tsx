import type React from "react";
import { ScrollView, Text, View } from "react-native";

type StepLayoutProps = {
	title: string;
	subtitle?: string;
	footer: React.ReactNode;
	children?: React.ReactNode;
	centered?: boolean;
};

export function StepLayout({
	title,
	subtitle,
	footer,
	children,
	centered = false,
}: StepLayoutProps) {
	return (
		<View className="flex-1">
			<ScrollView
				className="flex-1"
				contentContainerClassName={`flex-grow px-5 pt-4 pb-6 ${centered ? "justify-center" : ""}`}
				keyboardShouldPersistTaps="handled"
				showsVerticalScrollIndicator={false}
			>
				<View className="mb-8">
					<Text className="mb-3 text-center font-bold text-3xl text-neutral-900 tracking-tight">
						{title}
					</Text>
					{subtitle ? (
						<Text className="text-center text-base text-neutral-500">
							{subtitle}
						</Text>
					) : null}
				</View>
				{children}
			</ScrollView>
			<View className="px-5 pt-2 pb-4">{footer}</View>
		</View>
	);
}
