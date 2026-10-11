import { Ionicons } from "@expo/vector-icons";
import * as AppleAuthentication from "expo-apple-authentication";
import { useEffect, useState } from "react";
import {
	ActivityIndicator,
	Platform,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import {
	type SocialAuthResult,
	signInWithApple,
	signInWithGoogle,
} from "@/lib/social-auth";
import { useColorScheme } from "@/lib/use-color-scheme";

type SocialButtonsProps = {
	onError: (message: string | null) => void;
	disabled?: boolean;
};

type Provider = "apple" | "google";

export function SocialButtons({
	onError,
	disabled = false,
}: SocialButtonsProps) {
	const { isDarkColorScheme } = useColorScheme();
	const [isAppleAvailable, setIsAppleAvailable] = useState(false);
	const [pendingProvider, setPendingProvider] = useState<Provider | null>(null);

	useEffect(() => {
		if (Platform.OS !== "ios") {
			return;
		}
		AppleAuthentication.isAvailableAsync()
			.then(setIsAppleAvailable)
			.catch(() => setIsAppleAvailable(false));
	}, []);

	const run = async (
		provider: Provider,
		signIn: () => Promise<SocialAuthResult>,
	) => {
		if (pendingProvider) {
			return;
		}
		onError(null);
		setPendingProvider(provider);
		const { error } = await signIn();
		setPendingProvider(null);
		if (error) {
			onError(error);
		}
	};

	const isDisabled = disabled || pendingProvider !== null;

	return (
		<View className="gap-3">
			{isAppleAvailable && (
				<View
					style={{ pointerEvents: isDisabled ? "none" : "auto" }}
					className={isDisabled ? "opacity-60" : ""}
				>
					<AppleAuthentication.AppleAuthenticationButton
						buttonType={
							AppleAuthentication.AppleAuthenticationButtonType.CONTINUE
						}
						buttonStyle={
							isDarkColorScheme
								? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
								: AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
						}
						cornerRadius={8}
						style={{ height: 48, width: "100%" }}
						onPress={() => run("apple", signInWithApple)}
					/>
				</View>
			)}

			<TouchableOpacity
				onPress={() => run("google", signInWithGoogle)}
				disabled={isDisabled}
				className={`h-12 flex-row items-center justify-center gap-2 rounded-md border border-border bg-card ${isDisabled ? "opacity-60" : ""}`}
			>
				{pendingProvider === "google" ? (
					<ActivityIndicator size="small" />
				) : (
					<>
						<Ionicons
							name="logo-google"
							size={18}
							color={isDarkColorScheme ? "#fff" : "#111"}
						/>
						<Text className="font-semibold text-base text-foreground">
							Continue with Google
						</Text>
					</>
				)}
			</TouchableOpacity>
		</View>
	);
}

export function AuthDivider() {
	return (
		<View className="my-6 flex-row items-center gap-3">
			<View className="h-px flex-1 bg-border" />
			<Text className="text-muted-foreground text-sm">or</Text>
			<View className="h-px flex-1 bg-border" />
		</View>
	);
}
