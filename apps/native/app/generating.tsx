import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiFetch } from "@/lib/api";
import { queryClient, trpc } from "@/utils/trpc";

const GENERIC_ERROR = "Failed to set up your course. Please try again.";

export default function GeneratingScreen() {
	const [error, setError] = useState<string | null>(null);
	const isRunning = useRef(false);

	const generate = useCallback(async () => {
		if (isRunning.current) {
			return;
		}
		isRunning.current = true;
		setError(null);

		try {
			const response = await apiFetch("/api/content/generate", {
				method: "POST",
			});
			const json = await response.json().catch(() => ({}));

			if (json.status === "enrolled" || json.status === "already_exists") {
				await queryClient.invalidateQueries({
					queryKey: trpc.content.getEnrollment.queryKey(),
				});
				return;
			}

			setError(typeof json.error === "string" ? json.error : GENERIC_ERROR);
		} catch {
			setError(GENERIC_ERROR);
		} finally {
			isRunning.current = false;
		}
	}, []);

	useEffect(() => {
		generate();
	}, [generate]);

	return (
		<SafeAreaView className="flex-1 bg-neutral-50">
			<View className="flex-1 items-center justify-center gap-8 px-6">
				<View className="size-16 items-center justify-center rounded-3xl border border-[#C6F64D] bg-[#D8FF76]">
					<Ionicons name="sparkles" size={28} color="#3f6212" />
				</View>

				<View className="items-center gap-2">
					<Text className="text-center font-bold text-2xl text-neutral-900 tracking-tight">
						Setting Up Your Course
					</Text>
					<Text className="text-center text-neutral-500 text-sm">
						We're preparing your personalized learning path.
					</Text>
				</View>

				{error ? (
					<View className="items-center gap-3">
						<Text className="text-center text-red-600 text-sm">{error}</Text>
						<Pressable
							onPress={generate}
							accessibilityRole="button"
							className="rounded-xl border border-neutral-200 bg-white px-5 py-2.5 active:opacity-70"
						>
							<Text className="font-medium text-neutral-900">Try Again</Text>
						</Pressable>
					</View>
				) : (
					<ActivityIndicator size="large" color="#65a30d" />
				)}
			</View>
		</SafeAreaView>
	);
}
