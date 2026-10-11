import { Text, View } from "react-native";

type FormMessageProps = {
	message: string | null;
	variant?: "error" | "success";
};

export function FormMessage({ message, variant = "error" }: FormMessageProps) {
	if (!message) {
		return null;
	}

	return (
		<View
			className={
				variant === "error"
					? "mb-4 rounded-md bg-destructive/10 p-3"
					: "mb-4 rounded-md bg-primary/10 p-3"
			}
		>
			<Text
				className={
					variant === "error"
						? "text-destructive text-sm"
						: "text-primary text-sm"
				}
			>
				{message}
			</Text>
		</View>
	);
}
