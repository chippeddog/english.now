import { Link } from "expo-router";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { AuthInput } from "@/components/auth/auth-input";
import { AuthScreen } from "@/components/auth/auth-screen";
import { FormMessage } from "@/components/auth/form-message";
import { PrimaryButton } from "@/components/auth/primary-button";
import { AuthDivider, SocialButtons } from "@/components/auth/social-buttons";
import { authClient } from "@/lib/auth-client";
import { WEB_URL } from "@/lib/constants";
import { queryClient } from "@/utils/trpc";

export default function SignInScreen() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [info, setInfo] = useState<string | null>(null);
	const [needsVerification, setNeedsVerification] = useState(false);

	const handleSignIn = async () => {
		if (!email.trim() || !password) {
			setError("Enter your email and password");
			return;
		}

		setIsLoading(true);
		setError(null);
		setInfo(null);
		setNeedsVerification(false);

		const { error: signInError } = await authClient.signIn.email({
			email: email.trim(),
			password,
		});

		setIsLoading(false);

		if (signInError) {
			if (signInError.code === "EMAIL_NOT_VERIFIED") {
				setNeedsVerification(true);
				setError("Please verify your email first. Check your inbox.");
				return;
			}
			setError(signInError.message || "Failed to sign in");
			return;
		}

		queryClient.invalidateQueries();
	};

	const handleResendVerification = async () => {
		setError(null);
		const { error: resendError } = await authClient.sendVerificationEmail({
			email: email.trim(),
			callbackURL: `${WEB_URL}/home`,
		});
		if (resendError) {
			setError(resendError.message || "Failed to resend verification email");
			return;
		}
		setNeedsVerification(false);
		setInfo("Verification email sent. Check your inbox.");
	};

	return (
		<AuthScreen
			title="Welcome back"
			subtitle="Sign in to continue learning English"
		>
			<FormMessage message={error} />
			<FormMessage message={info} variant="success" />

			{needsVerification && (
				<TouchableOpacity onPress={handleResendVerification} className="mb-4">
					<Text className="font-medium text-primary text-sm">
						Resend verification email
					</Text>
				</TouchableOpacity>
			)}

			<SocialButtons onError={setError} disabled={isLoading} />

			<AuthDivider />

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
				placeholder="Your password"
				value={password}
				onChangeText={setPassword}
				secureTextEntry
				autoComplete="password"
				textContentType="password"
				onSubmitEditing={handleSignIn}
			/>

			<View className="mb-6 items-end">
				<Link href="/forgot-password" asChild>
					<TouchableOpacity>
						<Text className="font-medium text-primary text-sm">
							Forgot password?
						</Text>
					</TouchableOpacity>
				</Link>
			</View>

			<PrimaryButton
				label="Sign in"
				onPress={handleSignIn}
				isLoading={isLoading}
			/>

			<View className="mt-6 flex-row justify-center gap-1">
				<Text className="text-muted-foreground text-sm">
					Don't have an account?
				</Text>
				<Link href="/sign-up" asChild>
					<TouchableOpacity>
						<Text className="font-semibold text-primary text-sm">Sign up</Text>
					</TouchableOpacity>
				</Link>
			</View>
		</AuthScreen>
	);
}
