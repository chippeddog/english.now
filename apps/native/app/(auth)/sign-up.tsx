import { Link, router } from "expo-router";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { AuthInput } from "@/components/auth/auth-input";
import { AuthScreen } from "@/components/auth/auth-screen";
import { FormMessage } from "@/components/auth/form-message";
import { PrimaryButton } from "@/components/auth/primary-button";
import { AuthDivider, SocialButtons } from "@/components/auth/social-buttons";
import { authClient } from "@/lib/auth-client";
import { WEB_URL } from "@/lib/constants";

const MIN_PASSWORD_LENGTH = 8;

export default function SignUpScreen() {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [sentToEmail, setSentToEmail] = useState<string | null>(null);

	const handleSignUp = async () => {
		if (!name.trim() || !email.trim() || !password) {
			setError("Fill in all fields");
			return;
		}
		if (password.length < MIN_PASSWORD_LENGTH) {
			setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
			return;
		}

		setIsLoading(true);
		setError(null);

		const { error: signUpError } = await authClient.signUp.email({
			name: name.trim(),
			email: email.trim(),
			password,
			callbackURL: `${WEB_URL}/home`,
		});

		setIsLoading(false);

		if (signUpError) {
			setError(signUpError.message || "Failed to create account");
			return;
		}

		setSentToEmail(email.trim());
		setPassword("");
	};

	if (sentToEmail) {
		return (
			<AuthScreen
				title="Check your email"
				subtitle={`We sent a verification link to ${sentToEmail}. Open it to activate your account, then sign in.`}
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
			title="Create your account"
			subtitle="Start practicing English with AI"
		>
			<FormMessage message={error} />

			<SocialButtons onError={setError} disabled={isLoading} />

			<AuthDivider />

			<AuthInput
				label="Name"
				placeholder="Your name"
				value={name}
				onChangeText={setName}
				autoComplete="name"
				textContentType="name"
			/>
			<AuthInput
				label="Email"
				placeholder="you@example.com"
				value={email}
				onChangeText={setEmail}
				keyboardType="email-address"
				autoCapitalize="none"
				autoComplete="email"
				textContentType="emailAddress"
			/>
			<AuthInput
				label="Password"
				placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
				value={password}
				onChangeText={setPassword}
				secureTextEntry
				autoComplete="new-password"
				textContentType="newPassword"
				onSubmitEditing={handleSignUp}
			/>

			<View className="mt-2">
				<PrimaryButton
					label="Create account"
					onPress={handleSignUp}
					isLoading={isLoading}
				/>
			</View>

			<View className="mt-6 flex-row justify-center gap-1">
				<Text className="text-muted-foreground text-sm">
					Already have an account?
				</Text>
				<Link href="/sign-in" asChild>
					<TouchableOpacity>
						<Text className="font-semibold text-primary text-sm">Sign in</Text>
					</TouchableOpacity>
				</Link>
			</View>
		</AuthScreen>
	);
}
