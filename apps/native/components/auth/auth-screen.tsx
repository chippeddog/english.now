import type React from "react";
import {
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	Text,
	View,
} from "react-native";
import { Container } from "@/components/container";

type AuthScreenProps = {
	title: string;
	subtitle?: string;
	children: React.ReactNode;
};

export function AuthScreen({ title, subtitle, children }: AuthScreenProps) {
	return (
		<Container>
			<KeyboardAvoidingView
				className="flex-1"
				behavior={Platform.OS === "ios" ? "padding" : undefined}
			>
				<ScrollView
					className="flex-1"
					contentContainerClassName="flex-grow justify-center px-6 py-10"
					keyboardShouldPersistTaps="handled"
				>
					<View className="mb-8">
						<Text className="mb-2 font-bold text-3xl text-foreground">
							{title}
						</Text>
						{subtitle ? (
							<Text className="text-base text-muted-foreground">
								{subtitle}
							</Text>
						) : null}
					</View>
					{children}
				</ScrollView>
			</KeyboardAvoidingView>
		</Container>
	);
}
