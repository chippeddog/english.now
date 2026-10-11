import type { ConfigContext, ExpoConfig } from "expo/config";

function getGoogleIosUrlScheme() {
	const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
	if (!iosClientId) {
		return null;
	}
	const clientPrefix = iosClientId.replace(".apps.googleusercontent.com", "");
	return `com.googleusercontent.apps.${clientPrefix}`;
}

export default ({ config }: ConfigContext): ExpoConfig => {
	const iosUrlScheme = getGoogleIosUrlScheme();

	if (!iosUrlScheme) {
		console.warn(
			"EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID is not set; native Google Sign-In will not be configured.",
		);
	}

	return {
		...config,
		name: config.name ?? "english.now",
		slug: config.slug ?? "english.now",
		plugins: [
			...(config.plugins ?? []),
			...(iosUrlScheme
				? [
						["@react-native-google-signin/google-signin", { iosUrlScheme }] as [
							string,
							{ iosUrlScheme: string },
						],
					]
				: []),
		],
	};
};
