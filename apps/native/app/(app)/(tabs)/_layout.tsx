import { Tabs } from "expo-router";
import { GlassTabBar } from "@/components/glass-tab-bar";

export default function TabsLayout() {
	return (
		<Tabs
			tabBar={(props) => <GlassTabBar {...props} />}
			screenOptions={{
				headerShown: false,
				sceneStyle: { backgroundColor: "#fafafa" },
			}}
		>
			<Tabs.Screen name="index" options={{ title: "Home" }} />
			<Tabs.Screen name="progress" options={{ title: "Progress" }} />
			<Tabs.Screen name="settings" options={{ title: "Settings" }} />
		</Tabs>
	);
}
