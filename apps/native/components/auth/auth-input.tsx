import { Text, TextInput, type TextInputProps, View } from "react-native";

type AuthInputProps = TextInputProps & {
	label: string;
};

export function AuthInput({ label, ...props }: AuthInputProps) {
	return (
		<View className="mb-4">
			<Text className="mb-1.5 font-medium text-foreground text-sm">
				{label}
			</Text>
			<TextInput
				className="rounded-md border border-input bg-background px-4 py-3.5 text-base text-foreground"
				placeholderTextColor="#9CA3AF"
				{...props}
			/>
		</View>
	);
}
