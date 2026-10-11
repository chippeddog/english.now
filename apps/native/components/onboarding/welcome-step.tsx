import { Ionicons } from "@expo/vector-icons";
import { ScrollView, Text, View } from "react-native";
import type { IconName } from "@/lib/onboarding-options";
import { elevatedCardShadow } from "./card-shadow";
import { ContinueButton } from "./continue-button";

const FEATURES: { icon: IconName; text: string }[] = [
	{ icon: "chatbubble-outline", text: "AI-powered conversations" },
	{ icon: "locate-outline", text: "Personalized learning path" },
	{ icon: "trophy-outline", text: "Track your progress" },
];

export function WelcomeStep({ onNext }: { onNext: () => void }) {
	return (
		<View className="flex-1">
			<ScrollView
				className="flex-1"
				contentContainerClassName="flex-grow justify-center px-5 py-8"
				showsVerticalScrollIndicator={false}
			>
				<View className="mb-6 items-center">
					<View className="size-20 items-center justify-center rounded-[28px] border border-[#C6F64D] bg-[#D8FF76]">
						<Ionicons name="chatbubbles" size={36} color="#3f6212" />
					</View>
				</View>

				<Text className="mb-4 text-center font-bold text-4xl text-neutral-900 tracking-tight">
					Learn English, The Smart Way
				</Text>
				<Text className="mb-8 text-center text-base text-neutral-500">
					Practice English with AI, build vocabulary, and master grammar - all
					personalized for you.
				</Text>

				<View className="gap-3">
					{FEATURES.map((feature) => (
						<View
							key={feature.text}
							className="flex-row items-center gap-3 rounded-2xl bg-white p-3"
							style={elevatedCardShadow}
						>
							<View className="size-10 items-center justify-center rounded-xl border border-[#C6F64D] bg-[#D8FF76]">
								<Ionicons name={feature.icon} size={20} color="#4d7c0f" />
							</View>
							<Text className="font-medium text-base text-neutral-900">
								{feature.text}
							</Text>
						</View>
					))}
				</View>
			</ScrollView>
			<View className="px-5 pt-2 pb-4">
				<ContinueButton label="Get Started" onPress={onNext} />
			</View>
		</View>
	);
}
