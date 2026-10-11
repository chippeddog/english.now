import Constants from "expo-constants";
import { Platform } from "react-native";

export const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL || "https://english.now";

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1"]);

// A physical device can't reach the dev machine through a loopback URL, so in development
// native builds swap it for the host Metro is served from. Web keeps the loopback host because
// the session cookie is Secure + SameSite=Lax, which browsers only accept over http on localhost.
function resolveServerUrl() {
	const configured = process.env.EXPO_PUBLIC_SERVER_URL ?? "";
	if (!__DEV__ || Platform.OS === "web") {
		return configured;
	}

	const devHost = Constants.expoConfig?.hostUri?.split(":")[0];
	if (!devHost) {
		return configured;
	}

	try {
		const url = new URL(configured);
		if (!LOOPBACK_HOSTS.has(url.hostname)) {
			return configured;
		}
		url.hostname = devHost;
		return url.origin;
	} catch {
		return configured;
	}
}

export const SERVER_URL = resolveServerUrl();

export const NAV_THEME = {
	light: {
		background: "hsl(0 0% 100%)",
		border: "hsl(220 13% 91%)",
		card: "hsl(0 0% 100%)",
		notification: "hsl(0 84.2% 60.2%)",
		primary: "hsl(221.2 83.2% 53.3%)",
		text: "hsl(222.2 84% 4.9%)",
	},
	dark: {
		background: "hsl(222.2 84% 4.9%)",
		border: "hsl(217.2 32.6% 17.5%)",
		card: "hsl(222.2 84% 4.9%)",
		notification: "hsl(0 72% 51%)",
		primary: "hsl(217.2 91.2% 59.8%)",
		text: "hsl(210 40% 98%)",
	},
};
