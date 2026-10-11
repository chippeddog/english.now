import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { ProgressBar } from "@/components/ui/progress-bar";
import { FieldLabel, SectionHeader } from "@/components/ui/section-header";
import { apiFetch } from "@/lib/api";
import type { RouterOutputs } from "@/lib/api-types";
import { showMessage } from "@/lib/toast";
import { trpc } from "@/utils/trpc";

type UsageLimits = RouterOutputs["profile"]["getUsageLimits"];
type LimitKey =
	| "conversation"
	| "lessonStarts"
	| "vocabularyAdds"
	| "vocabularyReviews";
type DailyLimit = UsageLimits[LimitKey];

const USAGE_ITEMS: { key: LimitKey; label: string }[] = [
	{ key: "conversation", label: "AI practice" },
	{ key: "lessonStarts", label: "New lessons" },
	{ key: "vocabularyAdds", label: "Vocabulary adds" },
	{ key: "vocabularyReviews", label: "Vocabulary reviews" },
];

function PlanLabel({ status }: { status: string | null | undefined }) {
	if (status === "active" || status === "trialing") {
		return (
			<Text className="font-medium text-base text-neutral-900">
				Pro{" "}
				<Text className="text-lime-700 italic">
					({status === "trialing" ? "Trial" : "Active"})
				</Text>
			</Text>
		);
	}
	if (status === "paused" || status === "past_due") {
		return (
			<View className="flex-row items-center gap-1.5">
				<View
					className={`size-2 rounded-full ${status === "paused" ? "bg-yellow-500" : "bg-red-500"}`}
				/>
				<Text className="font-medium text-base text-neutral-900">
					Pro{" "}
					<Text className="text-neutral-500">
						({status === "paused" ? "Paused" : "Past Due"})
					</Text>
				</Text>
			</View>
		);
	}
	return <Text className="font-medium text-base text-neutral-500">Free</Text>;
}

export function BillingSection() {
	const { data: subscription, isLoading: isLoadingSubscription } = useQuery(
		trpc.profile.getSubscription.queryOptions(),
	);
	const { data: limits, isLoading: isLoadingLimits } = useQuery(
		trpc.profile.getUsageLimits.queryOptions(),
	);
	const [isOpeningPortal, setIsOpeningPortal] = useState(false);

	const status = subscription?.status;
	const isActive = status === "active" || status === "trialing";

	const openPortal = async () => {
		setIsOpeningPortal(true);
		try {
			const response = await apiFetch("/api/paddle/customer-portal", {
				method: "POST",
			});
			const data = (await response.json().catch(() => ({}))) as {
				url?: string;
				error?: string;
			};
			if (!response.ok || !data.url) {
				throw new Error(
					data.error ?? "Failed to create a customer portal session",
				);
			}
			await WebBrowser.openBrowserAsync(data.url);
		} catch (error) {
			showMessage(
				"Failed to open the customer portal",
				error instanceof Error ? error.message : undefined,
			);
		} finally {
			setIsOpeningPortal(false);
		}
	};

	return (
		<View className="gap-5">
			<SectionHeader title="Billing & Subscription" />

			<View>
				<FieldLabel label="Your current plan" />
				{isLoadingSubscription ? (
					<ActivityIndicator className="self-start" />
				) : (
					<PlanLabel status={status} />
				)}
			</View>

			{isActive && subscription?.currentPeriodEnd ? (
				<View>
					<FieldLabel label="Next billing date" />
					<Text className="font-medium text-base text-neutral-900">
						{new Date(subscription.currentPeriodEnd).toLocaleDateString(
							"en-US",
							{ year: "numeric", month: "long", day: "numeric" },
						)}
					</Text>
				</View>
			) : null}

			{subscription && status !== "canceled" ? (
				<View>
					<Text className="mb-2 text-neutral-600 text-sm">
						To manage your subscription, update payment details, or cancel, open
						your customer portal.
					</Text>
					<Pressable
						onPress={openPortal}
						disabled={isOpeningPortal}
						accessibilityRole="button"
						className="flex-row items-center gap-1 self-start active:opacity-70"
					>
						<Text className="font-medium text-lime-700">
							{isOpeningPortal ? "Opening portal..." : "Manage subscription"}
						</Text>
						<Ionicons
							name="arrow-up-outline"
							size={14}
							color="#4d7c0f"
							style={{ transform: [{ rotate: "45deg" }] }}
						/>
					</Pressable>
				</View>
			) : null}

			<View className="border-neutral-200 border-t pt-5">
				<SectionHeader title="Usage" />
				{isLoadingLimits ? (
					<View className="flex-row items-center gap-2 py-4">
						<ActivityIndicator size="small" />
						<Text className="text-neutral-500 text-sm">
							Loading usage limits...
						</Text>
					</View>
				) : !limits ? (
					<Text className="py-4 text-neutral-500 text-sm">
						Unable to load usage limits right now.
					</Text>
				) : (
					<View className="gap-5">
						{USAGE_ITEMS.map((item) => (
							<UsageItem
								key={item.key}
								label={item.label}
								limit={limits[item.key]}
							/>
						))}
					</View>
				)}
			</View>
		</View>
	);
}

function UsageItem({ label, limit }: { label: string; limit: DailyLimit }) {
	const isUnlimited = limit.limit == null || limit.remaining == null;
	const remaining = limit.remaining ?? 0;
	const total = limit.limit ?? 0;
	const progress = isUnlimited
		? 100
		: Math.max(0, Math.min(100, (remaining / Math.max(1, total)) * 100));
	const isExhausted = !isUnlimited && remaining === 0;

	return (
		<View>
			<View className="mb-2 flex-row items-center justify-between gap-3">
				<Text className="font-medium text-neutral-900 text-sm">{label}</Text>
				<View
					className={`rounded-full px-2.5 py-1 ${isUnlimited ? "bg-lime-100" : isExhausted ? "bg-amber-100" : "bg-neutral-100"}`}
				>
					<Text
						className={`font-medium text-xs ${isUnlimited ? "text-lime-700" : isExhausted ? "text-amber-700" : "text-neutral-700"}`}
					>
						{isUnlimited ? "Unlimited" : `${remaining}/${total} left`}
					</Text>
				</View>
			</View>
			<ProgressBar
				value={progress}
				colorClassName={
					isUnlimited
						? "bg-lime-500"
						: isExhausted
							? "bg-amber-500"
							: "bg-neutral-900"
				}
			/>
			<Text className="mt-2 text-neutral-500 text-xs">
				{isUnlimited
					? "Unlimited access on your current plan."
					: isExhausted
						? `You used all ${total} for this period.`
						: `${limit.used} used, ${remaining} left.`}
			</Text>
		</View>
	);
}
