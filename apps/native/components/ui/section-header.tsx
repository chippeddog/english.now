import { Text, View } from "react-native";

export function ScreenTitle({
	title,
	subtitle,
}: {
	title: string;
	subtitle?: string;
}) {
	return (
		<View className="mb-5 gap-1">
			<Text className="font-bold text-3xl text-neutral-900 tracking-tight">
				{title}
			</Text>
			{subtitle ? (
				<Text className="text-base text-neutral-500">{subtitle}</Text>
			) : null}
		</View>
	);
}

export function SectionHeader({ title }: { title: string }) {
	return (
		<Text className="mb-3 font-semibold text-base text-neutral-900">
			{title}
		</Text>
	);
}

export function FieldLabel({ label }: { label: string }) {
	return (
		<Text className="mb-1.5 font-medium text-neutral-700 text-sm">{label}</Text>
	);
}
