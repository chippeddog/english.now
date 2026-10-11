import { useMutation } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { trpc } from "@/utils/trpc";

export default function AppLayout() {
	const ensureTodayPlan = useMutation(
		trpc.practice.ensureTodayPlan.mutationOptions({}),
	);
	const { mutate } = ensureTodayPlan;

	useEffect(() => {
		mutate();
	}, [mutate]);

	return (
		<Stack screenOptions={{ headerShown: false }}>
			<Stack.Screen name="(tabs)" />
			<Stack.Screen
				name="settings/timezone"
				options={{
					presentation: "modal",
					headerShown: true,
					title: "Timezone",
				}}
			/>
		</Stack>
	);
}
