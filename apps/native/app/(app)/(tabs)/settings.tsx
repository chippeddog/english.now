import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { AccountSection } from "@/components/settings/account-section";
import { BillingSection } from "@/components/settings/billing-section";
import { PersonalizationSection } from "@/components/settings/personalization-section";
import { TabScreen } from "@/components/tab-screen";
import { Card } from "@/components/ui/card";
import { ScreenTitle } from "@/components/ui/section-header";
import { signOut } from "@/lib/social-auth";
import { confirmAction } from "@/lib/toast";

const TABS = [
	{ value: "profile", label: "Account" },
	{ value: "learning", label: "Personalization" },
	{ value: "billing", label: "Billing" },
] as const;

type SettingsTab = (typeof TABS)[number]["value"];

export default function SettingsScreen() {
	const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
	const [isSigningOut, setIsSigningOut] = useState(false);

	const handleSignOut = async () => {
		const confirmed = await confirmAction({
			title: "Sign out?",
			confirmLabel: "Sign Out",
			destructive: true,
		});
		if (!confirmed) return;
		setIsSigningOut(true);
		await signOut();
		setIsSigningOut(false);
	};

	return (
		<TabScreen avoidKeyboard>
			<ScreenTitle title="Settings" />

			<View className="mb-5 flex-row gap-1 rounded-2xl bg-neutral-200/60 p-1">
				{TABS.map((tab) => {
					const isActive = tab.value === activeTab;
					return (
						<Pressable
							key={tab.value}
							onPress={() => setActiveTab(tab.value)}
							accessibilityRole="tab"
							accessibilityState={{ selected: isActive }}
							className={`flex-1 items-center rounded-xl py-2 ${isActive ? "bg-white" : ""}`}
						>
							<Text
								className={`font-medium text-sm ${isActive ? "text-neutral-900" : "text-neutral-500"}`}
								numberOfLines={1}
							>
								{tab.label}
							</Text>
						</Pressable>
					);
				})}
			</View>

			<Card className="p-5">
				{activeTab === "profile" ? (
					<AccountSection />
				) : activeTab === "learning" ? (
					<PersonalizationSection />
				) : (
					<BillingSection />
				)}
			</Card>

			<Pressable
				onPress={handleSignOut}
				disabled={isSigningOut}
				accessibilityRole="button"
				className={`mt-5 flex-row items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white py-3.5 active:opacity-70 ${isSigningOut ? "opacity-50" : ""}`}
			>
				<Ionicons name="log-out-outline" size={18} color="#525252" />
				<Text className="font-medium text-base text-neutral-700">Sign Out</Text>
			</Pressable>
		</TabScreen>
	);
}
