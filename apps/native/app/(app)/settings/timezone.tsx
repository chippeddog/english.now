import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
	ActivityIndicator,
	FlatList,
	Pressable,
	Text,
	TextInput,
	View,
} from "react-native";
import { getDeviceTimezone } from "@/lib/date";
import { showMessage } from "@/lib/toast";
import { queryClient, trpc } from "@/utils/trpc";

function getTimezones() {
	const detected = getDeviceTimezone();
	try {
		const all = Intl.supportedValuesOf("timeZone");
		return all.includes(detected) ? all : [detected, ...all];
	} catch {
		return Array.from(new Set([detected, "UTC"]));
	}
}

export default function TimezoneScreen() {
	const router = useRouter();
	const [search, setSearch] = useState("");
	const { data: profile } = useQuery(trpc.profile.get.queryOptions());
	const current = profile?.timezone || getDeviceTimezone();
	const timezones = useMemo(getTimezones, []);

	const filtered = useMemo(() => {
		const query = search.trim().toLowerCase().replaceAll(" ", "_");
		return query
			? timezones.filter((tz) => tz.toLowerCase().includes(query))
			: timezones;
	}, [search, timezones]);

	const updateTimezone = useMutation(
		trpc.profile.updateProfile.mutationOptions({
			onSuccess: async () => {
				await queryClient.invalidateQueries({
					queryKey: trpc.profile.pathKey(),
				});
				router.back();
			},
			onError: (error) => {
				showMessage("Failed to update timezone", error.message);
			},
		}),
	);

	return (
		<View className="flex-1 bg-neutral-50">
			<View className="border-neutral-200 border-b bg-white p-4">
				<TextInput
					value={search}
					onChangeText={setSearch}
					placeholder="Search timezone..."
					placeholderTextColor="#a3a3a3"
					autoCorrect={false}
					autoCapitalize="none"
					clearButtonMode="while-editing"
					className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-base text-neutral-900"
				/>
			</View>
			<FlatList
				data={filtered}
				keyExtractor={(item) => item}
				keyboardShouldPersistTaps="handled"
				initialNumToRender={30}
				renderItem={({ item }) => {
					const isSelected = item === current;
					const isSaving =
						updateTimezone.isPending &&
						updateTimezone.variables?.timezone === item;
					return (
						<Pressable
							onPress={() =>
								isSelected
									? router.back()
									: updateTimezone.mutate({ timezone: item })
							}
							disabled={updateTimezone.isPending}
							accessibilityRole="radio"
							accessibilityState={{ selected: isSelected }}
							className="flex-row items-center justify-between border-neutral-100 border-b bg-white px-4 py-3.5 active:bg-neutral-50"
						>
							<Text
								className={`text-base ${isSelected ? "font-semibold text-lime-700" : "text-neutral-900"}`}
							>
								{item.replaceAll("_", " ")}
							</Text>
							{isSaving ? (
								<ActivityIndicator size="small" />
							) : isSelected ? (
								<Ionicons name="checkmark" size={20} color="#4d7c0f" />
							) : null}
						</Pressable>
					);
				}}
				ListEmptyComponent={
					<Text className="p-6 text-center text-neutral-500">
						No timezones found
					</Text>
				}
			/>
		</View>
	);
}
