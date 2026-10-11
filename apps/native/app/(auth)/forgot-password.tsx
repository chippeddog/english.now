import { router } from "expo-router";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { AuthInput } from "@/components/auth/auth-input";
import { AuthScreen } from "@/components/auth/auth-screen";
import { FormMessage } from "@/components/auth/form-message";
import { PrimaryButton } from "@/components/auth/primary-button";
import { authClient } from "@/lib/auth-client";
import { WEB_URL } from "@/lib/constants";

export default function ForgotPasswordScreen() {
	const [email, setEmail] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isSent, setIsSent] = useState(false);

	const handleSubmit = async () => {
		if (!email.trim()) {
			setError("Enter your email");
			return;
		}

		setIsLoading(true);
		setError(null);

		const { error: resetError } = await authClient.requestPasswordReset({
			email: email.trim(),
			redirectTo: `${WEB_URL}/reset-password`,
		});

		setIsLoading(false);

		if (resetError) {
			setError(resetError.message || "Failed to send reset email");
			return;
		}

		setIsSent(true);
	};

	if (isSent) {
		return (
			<AuthScreen
				title="Check your email"
				subtitle={`If an account exists for ${email.trim()}, you'll receive a link to reset your password.`}
			>
				<PrimaryButton
					label="Back to sign in"
					onPress={() => router.replace("/sign-in")}
				/>
			</AuthScreen>
		);
	}

	return (
		<AuthScreen
			title="Reset password"
			subtitle="Enter your email and we'll send you a reset link"
		>
			<FormMessage message={error} />

			<AuthInput
				label="Email"
				placeholder="you@example.com"
				value={email}
				onChangeText={setEmail}
				keyboardType="email-address"
				autoCapitalize="none"
				autoComplete="email"
				textContentType="emailAddress"
				onSubmitEditing={handleSubmit}
			/>

			<View className="mt-2">
				<PrimaryButton
					label="Send reset link"
					onPress={handleSubmit}
					isLoading={isLoading}
				/>
			</View>

			<TouchableOpacity onPress={() => router.back()} className="mt-6">
				<Text className="text-center font-medium text-primary text-sm">
					Back to sign in
				</Text>
			</TouchableOpacity>
		</AuthScreen>
	);
}
