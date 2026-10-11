import { Alert, Platform } from "react-native";

export function showMessage(title: string, message?: string) {
	if (Platform.OS === "web") {
		window.alert(message ? `${title}\n\n${message}` : title);
		return;
	}
	Alert.alert(title, message);
}

export function confirmAction({
	title,
	message,
	confirmLabel,
	destructive = false,
}: {
	title: string;
	message?: string;
	confirmLabel: string;
	destructive?: boolean;
}): Promise<boolean> {
	if (Platform.OS === "web") {
		return Promise.resolve(
			window.confirm(message ? `${title}\n\n${message}` : title),
		);
	}
	return new Promise((resolve) => {
		Alert.alert(title, message, [
			{ text: "Cancel", style: "cancel", onPress: () => resolve(false) },
			{
				text: confirmLabel,
				style: destructive ? "destructive" : "default",
				onPress: () => resolve(true),
			},
		]);
	});
}
