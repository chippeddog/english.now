import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { IconName } from "@/lib/onboarding-options";

export type SelectOption = {
	id: string;
	label: string;
	icon?: IconName;
	flag?: string;
};

type SelectSheetProps = {
	visible: boolean;
	title: string;
	options: SelectOption[];
	selected: string[];
	multiple?: boolean;
	onClose: () => void;
	onSubmit: (selected: string[]) => void;
};

export function SelectSheet({
	visible,
	title,
	options,
	selected,
	multiple = false,
	onClose,
	onSubmit,
}: SelectSheetProps) {
	const [draft, setDraft] = useState(selected);

	useEffect(() => {
		if (visible) {
			setDraft(selected);
		}
	}, [visible, selected]);

	const handlePress = (id: string) => {
		if (!multiple) {
			onSubmit([id]);
			onClose();
			return;
		}
		setDraft((prev) =>
			prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id],
		);
	};

	return (
		<Modal
			visible={visible}
			animationType="slide"
			presentationStyle="pageSheet"
			onRequestClose={onClose}
		>
			<SafeAreaView className="flex-1 bg-neutral-50" edges={["bottom"]}>
				<View className="flex-row items-center justify-between border-neutral-200 border-b bg-white px-4 py-3">
					<Pressable onPress={onClose} hitSlop={8} accessibilityRole="button">
						<Text className="text-base text-neutral-500">Cancel</Text>
					</Pressable>
					<Text className="font-semibold text-base text-neutral-900">
						{title}
					</Text>
					{multiple ? (
						<Pressable
							onPress={() => {
								onSubmit(draft);
								onClose();
							}}
							hitSlop={8}
							accessibilityRole="button"
						>
							<Text className="font-semibold text-base text-lime-700">
								Done
							</Text>
						</Pressable>
					) : (
						<View className="w-12" />
					)}
				</View>
				<ScrollView contentContainerClassName="p-4 gap-2">
					{options.map((option) => {
						const isSelected = draft.includes(option.id);
						return (
							<Pressable
								key={option.id}
								onPress={() => handlePress(option.id)}
								accessibilityRole={multiple ? "checkbox" : "radio"}
								accessibilityState={
									multiple ? { checked: isSelected } : { selected: isSelected }
								}
								className={`flex-row items-center gap-3 rounded-2xl border px-4 py-3.5 ${isSelected ? "border-lime-400 bg-lime-50" : "border-neutral-200 bg-white"}`}
							>
								{option.flag ? (
									<Text className="text-xl">{option.flag}</Text>
								) : option.icon ? (
									<Ionicons name={option.icon} size={20} color="#525252" />
								) : null}
								<Text className="flex-1 text-base text-neutral-900">
									{option.label}
								</Text>
								{isSelected ? (
									<Ionicons name="checkmark-circle" size={22} color="#65a30d" />
								) : null}
							</Pressable>
						);
					})}
				</ScrollView>
			</SafeAreaView>
		</Modal>
	);
}

export function SelectField({
	label,
	value,
	placeholder,
	disabled = false,
	onPress,
}: {
	label: string;
	value?: string;
	placeholder: string;
	disabled?: boolean;
	onPress: () => void;
}) {
	return (
		<View>
			<Text className="mb-1.5 font-medium text-neutral-700 text-sm">
				{label}
			</Text>
			<Pressable
				onPress={onPress}
				disabled={disabled}
				accessibilityRole="button"
				className={`min-h-12 flex-row items-center justify-between gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-3 active:opacity-70 ${disabled ? "opacity-50" : ""}`}
			>
				<Text
					className={`flex-1 text-base ${value ? "text-neutral-900" : "text-neutral-400"}`}
					numberOfLines={2}
				>
					{value || placeholder}
				</Text>
				<Ionicons name="chevron-down" size={18} color="#a3a3a3" />
			</Pressable>
		</View>
	);
}
