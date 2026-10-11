import { expoClient } from "@better-auth/expo/client";
import { createAuthClient } from "better-auth/react";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { SERVER_URL } from "@/lib/constants";

export const authClient = createAuthClient({
	baseURL: SERVER_URL,
	plugins: [
		expoClient({
			scheme: Constants.expoConfig?.scheme as string,
			storagePrefix: Constants.expoConfig?.scheme as string,
			storage: SecureStore,
		}),
	],
});

// On web the browser attaches the httpOnly session cookie itself (with credentials: "include"),
// and SecureStore has no web implementation, so reading the stored cookie would throw.
export function getAuthRequestInit(): Pick<RequestInit, "credentials"> & {
	headers: Record<string, string>;
} {
	if (Platform.OS === "web") {
		return { credentials: "include", headers: {} };
	}
	const cookie = authClient.getCookie();
	return { credentials: "omit", headers: cookie ? { Cookie: cookie } : {} };
}
