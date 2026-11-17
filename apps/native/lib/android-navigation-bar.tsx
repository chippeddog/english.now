import { NavigationBar } from "expo-navigation-bar";
import { Platform } from "react-native";

export async function setAndroidNavigationBar(theme: "light" | "dark") {
	if (Platform.OS !== "android") return;
	// Android draws edge-to-edge, so only the button style can be controlled.
	NavigationBar.setStyle(theme);
}
