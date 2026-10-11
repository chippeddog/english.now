import { useState } from "react";
import { Text, TextInput, View } from "react-native";
import { LANGUAGES } from "@/lib/onboarding-options";
import { ContinueButton } from "./continue-button";
import { OptionGrid, OptionTile } from "./option-tile";
import { StepLayout } from "./step-layout";

type NativeLanguageStepProps = {
	selected: string;
	onSelect: (id: string) => void;
	onNext: () => void;
	canProceed: boolean;
};

export function NativeLanguageStep({
	selected,
	onSelect,
	onNext,
	canProceed,
}: NativeLanguageStepProps) {
	const [search, setSearch] = useState("");
	const filtered = LANGUAGES.filter((lang) =>
		lang.name.toLowerCase().includes(search.trim().toLowerCase()),
	);

	return (
		<StepLayout
			title="What's your native language?"
			subtitle="We'll use this to personalize translations and explanations"
			footer={<ContinueButton onPress={onNext} disabled={!canProceed} />}
		>
			<View className="mb-4">
				<TextInput
					value={search}
					onChangeText={setSearch}
					placeholder="Search language..."
					placeholderTextColor="#a3a3a3"
					autoCorrect={false}
					autoCapitalize="none"
					clearButtonMode="while-editing"
					className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-base text-neutral-900"
				/>
			</View>

			<OptionGrid>
				{filtered.map((lang) => (
					<OptionTile
						key={lang.id}
						name={lang.name}
						flag={lang.flag}
						isSelected={selected === lang.id}
						onPress={() => onSelect(lang.id)}
					/>
				))}
			</OptionGrid>

			{filtered.length === 0 ? (
				<Text className="mt-4 text-center text-neutral-500 text-sm">
					No languages found
				</Text>
			) : null}
		</StepLayout>
	);
}
