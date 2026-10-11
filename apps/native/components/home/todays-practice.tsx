import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
	ActivityIndicator,
	Pressable,
	ScrollView,
	Text,
	View,
} from "react-native";
import { Card, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { openOnWeb } from "@/lib/open-on-web";
import { showMessage } from "@/lib/toast";
import { queryClient, trpc } from "@/utils/trpc";

type ActivityType = "conversation" | "pronunciation" | "vocabulary";

type PracticeActivity = {
	id: string;
	emoji: string;
	title: string;
	duration: number;
	type: ActivityType;
	typeLabel: string;
	startedAt: string | null;
	completedAt: string | null;
	sessionId: string | null;
};

type FeatureAccess = { hasAccess: boolean; latestResourceId: string | null };

type PracticeAccess = {
	isPro: boolean;
	conversation: FeatureAccess;
	pronunciation: FeatureAccess;
};

type GateState = "available" | "resume" | "locked";

const SKELETON_KEYS = ["s1", "s2", "s3"] as const;
const PREPARING_STATUSES = new Set(["missing", "queued", "generating"]);

function getGateState(
	access: PracticeAccess | null,
	activity: PracticeActivity,
): GateState {
	if (activity.type === "vocabulary") return "available";
	const featureAccess = access?.[activity.type];
	if (!access || access.isPro || featureAccess?.hasAccess) return "available";
	if (
		activity.sessionId &&
		activity.sessionId === featureAccess?.latestResourceId
	) {
		return "resume";
	}
	return "locked";
}

function isFreeLimitError(error: unknown) {
	return (
		error instanceof Error &&
		(error.message.includes("FREE_WEEKLY_PRACTICE_LIMIT_REACHED") ||
			error.message.includes("FREE_DAILY_LIMIT_REACHED"))
	);
}

function showUpgradeMessage() {
	showMessage(
		"Upgrade to unlock",
		"You've used today's free practice. Upgrade on english.now to keep practicing.",
	);
}

function invalidatePlans() {
	queryClient.invalidateQueries({
		queryKey: trpc.practice.getHomeTodayPlan.queryKey(),
	});
	queryClient.invalidateQueries({
		queryKey: trpc.practice.getTodayPlan.queryKey(),
	});
}

export function TodaysPractice() {
	const [startingId, setStartingId] = useState<string | null>(null);

	const { data, isLoading } = useQuery({
		...trpc.practice.getHomeTodayPlan.queryOptions(),
		refetchInterval: (query) =>
			PREPARING_STATUSES.has(query.state.data?.status ?? "") ? 3000 : false,
	});

	const ensurePlan = useMutation(
		trpc.practice.ensureTodayPlan.mutationOptions({
			onSuccess: invalidatePlans,
		}),
	);
	const startActivity = useMutation(
		trpc.practice.startActivity.mutationOptions({ onSuccess: invalidatePlans }),
	);
	const startPronunciation = useMutation(
		trpc.pronunciation.startSession.mutationOptions({}),
	);
	const startConversation = useMutation(
		trpc.conversation.start.mutationOptions({}),
	);

	const status: string | undefined = data?.status;
	const {
		mutate: ensure,
		isPending: isEnsuring,
		isSuccess: hasEnsured,
	} = ensurePlan;

	useEffect(() => {
		if (
			(status === "missing" || status === "failed") &&
			!isEnsuring &&
			!hasEnsured
		) {
			ensure();
		}
	}, [status, isEnsuring, hasEnsured, ensure]);

	const activities = (data?.activities ?? []) as PracticeActivity[];
	const access = (data?.access ?? null) as PracticeAccess | null;
	const completedCount = activities.filter((a) => a.completedAt).length;
	const isPreparing =
		!isLoading && (isEnsuring || PREPARING_STATUSES.has(status ?? ""));

	async function handleStart(activity: PracticeActivity) {
		if (activity.completedAt || startingId) return;

		if (getGateState(access, activity) === "locked") {
			showUpgradeMessage();
			return;
		}

		setStartingId(activity.id);
		try {
			if (activity.type === "conversation") {
				const sessionId =
					activity.sessionId ??
					(await startConversation.mutateAsync({ activityId: activity.id }))
						.sessionId;
				invalidatePlans();
				await openOnWeb(`/conversation/${sessionId}`);
				return;
			}

			if (activity.type === "pronunciation") {
				const sessionId =
					activity.sessionId ??
					(await startPronunciation.mutateAsync({ activityId: activity.id }))
						.sessionId;
				invalidatePlans();
				await openOnWeb(`/pronunciation/${sessionId}`);
				return;
			}

			if (!activity.startedAt && !activity.sessionId) {
				await startActivity.mutateAsync({
					activityId: activity.id,
					sessionId: `vocabulary:${activity.id}`,
				});
			}
			await openOnWeb("/practice");
		} catch (error) {
			if (isFreeLimitError(error)) {
				showUpgradeMessage();
				return;
			}
			showMessage(
				"Couldn't start activity",
				error instanceof Error ? error.message : "Please try again.",
			);
		} finally {
			setStartingId(null);
		}
	}

	const renderSkeletons = () => (
		<View className="flex-row gap-3">
			{SKELETON_KEYS.map((key) => (
				<View
					key={key}
					className="h-44 w-44 justify-between rounded-2xl border border-neutral-100 p-4"
				>
					<View className="gap-2">
						<Skeleton className="h-4 w-16" />
						<Skeleton className="size-9" />
						<Skeleton className="h-4 w-full" />
					</View>
					<Skeleton className="h-7 w-24" />
				</View>
			))}
		</View>
	);

	return (
		<Card className="p-2.5">
			<CardHeader
				title="Today's Practice"
				right={
					activities.length > 0 ? (
						<Text className="text-neutral-500 text-sm">
							{completedCount}/{activities.length}
						</Text>
					) : undefined
				}
			/>

			{isLoading && activities.length === 0 ? (
				renderSkeletons()
			) : isPreparing && activities.length === 0 ? (
				<View>
					<View className="opacity-40">{renderSkeletons()}</View>
					<View className="absolute inset-0 items-center justify-center">
						<View className="flex-row items-center gap-2 rounded-2xl bg-neutral-200/80 px-4 py-3">
							<ActivityIndicator size="small" color="#737373" />
							<Text className="font-medium text-neutral-600 text-sm">
								Preparing your daily practice
							</Text>
						</View>
					</View>
				</View>
			) : activities.length === 0 ? (
				<View className="items-center rounded-2xl border border-neutral-200 border-dashed bg-neutral-50 px-4 py-6">
					<Text className="text-center text-neutral-500 text-sm">
						{status === "failed"
							? data?.error || "We could not prepare today's practice yet."
							: "We're preparing today's practice for you."}
					</Text>
					<Pressable
						onPress={() => ensure()}
						disabled={isEnsuring}
						accessibilityRole="button"
						className="mt-3 rounded-xl border border-neutral-200 bg-white px-4 py-2 active:opacity-70"
					>
						<Text className="font-medium text-neutral-900 text-sm">
							{isEnsuring ? "Preparing..." : "Try again"}
						</Text>
					</Pressable>
				</View>
			) : (
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerClassName="gap-3"
				>
					{activities.map((activity) => (
						<ActivityCard
							key={activity.id}
							activity={activity}
							gateState={getGateState(access, activity)}
							isStarting={startingId === activity.id}
							onPress={() => handleStart(activity)}
						/>
					))}
				</ScrollView>
			)}
		</Card>
	);
}

function ActivityCard({
	activity,
	gateState,
	isStarting,
	onPress,
}: {
	activity: PracticeActivity;
	gateState: GateState;
	isStarting: boolean;
	onPress: () => void;
}) {
	const isCompleted = activity.completedAt !== null;
	const isStarted =
		!isCompleted &&
		(activity.startedAt !== null || activity.sessionId !== null);
	const isLocked = gateState === "locked";

	const tone = isCompleted
		? {
				card: "border-lime-200 bg-lime-50",
				pill: "border-lime-200 bg-lime-50",
				text: "text-lime-700",
				title: "text-lime-900",
			}
		: isLocked
			? {
					card: "border-neutral-200 bg-neutral-50",
					pill: "border-neutral-200 bg-neutral-100",
					text: "text-neutral-600",
					title: "text-neutral-900",
				}
			: isStarted
				? {
						card: "border-amber-200 bg-amber-50",
						pill: "border-amber-200 bg-amber-50",
						text: "text-amber-700",
						title: "text-amber-900",
					}
				: {
						card: "border-neutral-200 bg-white",
						pill: "border-neutral-200 bg-white",
						text: "text-neutral-600",
						title: "text-neutral-900",
					};

	const badge = isCompleted
		? {
				icon: "checkmark" as const,
				className: "border-lime-400 bg-lime-200",
				color: "#65a30d",
			}
		: isLocked
			? {
					icon: "lock-closed" as const,
					className: "border-neutral-300 bg-neutral-100",
					color: "#737373",
				}
			: isStarted
				? {
						icon: "time-outline" as const,
						className: "border-amber-400 bg-amber-200",
						color: "#d97706",
					}
				: null;

	return (
		<Pressable
			onPress={onPress}
			disabled={isCompleted || isStarting}
			accessibilityRole="button"
			className={`min-h-44 w-48 justify-between rounded-2xl border p-4 active:opacity-80 ${tone.card} ${isStarting ? "opacity-70" : ""}`}
		>
			{badge ? (
				<View
					className={`absolute top-4 right-4 size-6 items-center justify-center rounded-full border ${badge.className}`}
				>
					<Ionicons name={badge.icon} size={13} color={badge.color} />
				</View>
			) : null}
			<View>
				<Text className="mb-4 font-medium text-neutral-600 text-xs italic">
					{activity.duration} {activity.duration === 1 ? "minute" : "minutes"}
				</Text>
				<Text className="mb-2 text-3xl">{activity.emoji}</Text>
				<Text
					className={`font-medium text-sm leading-snug ${tone.title}`}
					numberOfLines={3}
				>
					{activity.title}
				</Text>
			</View>
			<View className="mt-3 flex-row items-center justify-between">
				<View className={`rounded-xl border px-2.5 py-1.5 ${tone.pill}`}>
					<Text className={`font-medium text-xs italic ${tone.text}`}>
						{isLocked
							? "Upgrade to unlock"
							: gateState === "resume"
								? "Resume"
								: activity.typeLabel}
					</Text>
				</View>
				{isStarting ? (
					<ActivityIndicator size="small" color="#737373" />
				) : !isCompleted && !isLocked && !isStarted ? (
					<Ionicons name="chevron-forward" size={16} color="#a3a3a3" />
				) : null}
			</View>
		</Pressable>
	);
}
