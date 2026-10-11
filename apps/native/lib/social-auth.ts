import * as AppleAuthentication from "expo-apple-authentication";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { authClient } from "@/lib/auth-client";
import { queryClient } from "@/utils/trpc";

type GoogleSigninModule =
	typeof import("@react-native-google-signin/google-signin");

export type SocialAuthResult = { error: string | null };

const isExpoGo =
	Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let googleModule: GoogleSigninModule | null | undefined;
let isGoogleConfigured = false;

// The Google Sign-In native module is not bundled in Expo Go, so it must be required lazily
// to keep the rest of the app usable there.
function loadGoogleSignin(): GoogleSigninModule | null {
	if (googleModule !== undefined) {
		return googleModule;
	}
	if (isExpoGo) {
		googleModule = null;
		return googleModule;
	}
	try {
		googleModule = require("@react-native-google-signin/google-signin");
	} catch {
		googleModule = null;
	}
	return googleModule ?? null;
}

function getGoogleSignin() {
	const google = loadGoogleSignin();
	if (!google) {
		return null;
	}
	if (!isGoogleConfigured) {
		google.GoogleSignin.configure({
			webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
			iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
			scopes: ["profile", "email"],
		});
		isGoogleConfigured = true;
	}
	return google;
}

function getErrorCode(error: unknown) {
	if (error && typeof error === "object" && "code" in error) {
		return String(error.code);
	}
	return null;
}

function getErrorMessage(error: unknown, fallback: string) {
	if (error instanceof Error && error.message) {
		return error.message;
	}
	return fallback;
}

export async function signInWithApple(): Promise<SocialAuthResult> {
	try {
		const credential = await AppleAuthentication.signInAsync({
			requestedScopes: [
				AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
				AppleAuthentication.AppleAuthenticationScope.EMAIL,
			],
		});

		if (!credential.identityToken) {
			return { error: "Apple did not return an identity token" };
		}

		const { error } = await authClient.signIn.social({
			provider: "apple",
			idToken: { token: credential.identityToken },
		});

		if (error) {
			return { error: error.message || "Failed to sign in with Apple" };
		}

		// Apple only shares the user's name on the first authorization and never inside the token.
		const fullName = [
			credential.fullName?.givenName,
			credential.fullName?.familyName,
		]
			.filter(Boolean)
			.join(" ");
		if (fullName) {
			await authClient.updateUser({ name: fullName });
		}

		return { error: null };
	} catch (error) {
		if (getErrorCode(error) === "ERR_REQUEST_CANCELED") {
			return { error: null };
		}
		return { error: getErrorMessage(error, "Failed to sign in with Apple") };
	}
}

export async function signInWithGoogle(): Promise<SocialAuthResult> {
	const google = getGoogleSignin();
	if (!google) {
		return {
			error: isExpoGo
				? "Google sign-in isn't available in Expo Go. Use a development build (expo run:ios / expo run:android)."
				: "Google sign-in is not available in this build.",
		};
	}

	const { GoogleSignin, isCancelledResponse, statusCodes } = google;

	try {
		await GoogleSignin.hasPlayServices({
			showPlayServicesUpdateDialog: true,
		});

		const response = await GoogleSignin.signIn();
		if (isCancelledResponse(response)) {
			return { error: null };
		}

		const idToken = response.data.idToken;
		if (!idToken) {
			return { error: "Google did not return an ID token" };
		}

		const { error } = await authClient.signIn.social({
			provider: "google",
			idToken: { token: idToken },
		});

		if (error) {
			return { error: error.message || "Failed to sign in with Google" };
		}

		return { error: null };
	} catch (error) {
		const code = getErrorCode(error);
		if (
			code === statusCodes.SIGN_IN_CANCELLED ||
			code === statusCodes.IN_PROGRESS
		) {
			return { error: null };
		}
		if (code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
			return { error: "Google Play Services is not available" };
		}
		return { error: getErrorMessage(error, "Failed to sign in with Google") };
	}
}

export async function signOut() {
	await authClient.signOut();
	try {
		await getGoogleSignin()?.GoogleSignin.signOut();
	} catch {}
	queryClient.clear();
}
