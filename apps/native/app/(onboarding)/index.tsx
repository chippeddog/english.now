import { useMutation } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import {
	ActivityIndicator,
	BackHandler,
	KeyboardAvoidingView,
	Platform,
	View,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { ContinueButton } from "@/components/onboarding/continue-button";
import { NativeLanguageStep } from "@/components/onboarding/native-language-step";
import { OnboardingHeader } from "@/components/onboarding/onboarding-header";
import { OptionRow } from "@/components/onboarding/option-row";
import { OptionGrid, OptionTile } from "@/components/onboarding/option-tile";
import { PlanSummaryStep } from "@/components/onboarding/plan-summary-step";
import { StepLayout } from "@/components/onboarding/step-layout";
import { WelcomeStep } from "@/components/onboarding/welcome-step";
import { apiFetch } from "@/lib/api";
import {
	defaultOnboardingData,
	FOCUS_AREAS,
	GOALS,
	INTERESTS,
	LEVELS,
	type OnboardingData,
	STEPS,
	TIME_OPTIONS,
} from "@/lib/onboarding-options";
import {
	clearOnboardingProgress,
	loadOnboardingProgress,
	saveOnboardingProgress,
} from "@/lib/onboarding-storage";
import { signOut } from "@/lib/social-auth";
import { queryClient, trpc } from "@/utils/trpc";

type OnboardingPayload = {
	nativeLanguage: string;
	proficiencyLevel: string;
	dailyGoal: number;
	focusAreas: string[];
	interests: string[];
	goal: string;
	timezone: string;
};

function getTimezone() {
	try {
		return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
	} catch {
		return "UTC";
	}
}

export default function OnboardingScreen() {
	const [isHydrated, setIsHydrated] = useState(false);
	const [currentStep, setCurrentStep] = useState(0);
	const [data, setData] = useState<OnboardingData>(defaultOnboardingData);
	const [isSigningOut, setIsSigningOut] = useState(false);

	const saveOnboardingMutation = useMutation({
		mutationFn: async (input: OnboardingPayload) => {
			const response = await apiFetch("/api/profile/onboarding", {
				method: "POST",
				body: JSON.stringify(input),
			});
			if (!response.ok) {
				throw new Error("Failed to save your answers. Please try again.");
			}
			return response.json();
		},
		onSuccess: async () => {
			await clearOnboardingProgress();
			await queryClient.invalidateQueries({
				queryKey: trpc.profile.get.queryKey(),
			});
		},
	});

	useEffect(() => {
		loadOnboardingProgress().then((saved) => {
			if (saved) {
				setData(saved.data);
				setCurrentStep(saved.step);
			}
			setIsHydrated(true);
		});
	}, []);

	useEffect(() => {
		if (!isHydrated) {
			return;
		}
		saveOnboardingProgress({ data, step: currentStep });
	}, [data, currentStep, isHydrated]);

	const nextStep = useCallback(() => {
		setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
	}, []);

	const prevStep = useCallback(() => {
		setCurrentStep((prev) => Math.max(prev - 1, 0));
	}, []);

	useEffect(() => {
		const subscription = BackHandler.addEventListener(
			"hardwareBackPress",
			() => {
				if (currentStep > 0) {
					prevStep();
					return true;
				}
				return false;
			},
		);
		return () => subscription.remove();
	}, [currentStep, prevStep]);

	const handleSubmit = () => {
		saveOnboardingMutation.mutate({
			nativeLanguage: data.nativeLanguage || "en",
			proficiencyLevel: data.level || "beginner",
			dailyGoal: Number.parseInt(data.time, 10) || 15,
			focusAreas: data.focus.length > 0 ? data.focus : ["speaking"],
			interests: data.interests,
			goal: data.goal || "personal",
			timezone: getTimezone(),
		});
	};

	const handleSignOut = async () => {
		setIsSigningOut(true);
		await clearOnboardingProgress();
		await signOut();
		setIsSigningOut(false);
	};

	const toggleIn = (key: "focus" | "interests", id: string) => {
		setData((prev) => ({
			...prev,
			[key]: prev[key].includes(id)
				? prev[key].filter((value) => value !== id)
				: [...prev[key], id],
		}));
	};

	const stepId = STEPS[currentStep];

	const canProceed = (() => {
		switch (stepId) {
			case "native-language":
				return !!data.nativeLanguage;
			case "level":
				return !!data.level;
			case "goal":
				return !!data.goal;
			case "time":
				return !!data.time;
			case "focus":
				return data.focus.length > 0;
			case "interests":
				return data.interests.length > 0;
			default:
				return true;
		}
	})();

	const continueButton = (
		<ContinueButton onPress={nextStep} disabled={!canProceed} />
	);

	const renderStep = () => {
		switch (stepId) {
			case "welcome":
				return <WelcomeStep onNext={nextStep} />;
			case "native-language":
				return (
					<NativeLanguageStep
						selected={data.nativeLanguage}
						onSelect={(id) =>
							setData((prev) => ({ ...prev, nativeLanguage: id }))
						}
						onNext={nextStep}
						canProceed={canProceed}
					/>
				);
			case "level":
				return (
					<StepLayout
						title="What's your English level?"
						subtitle="This helps us personalize your learning experience"
						footer={continueButton}
					>
						<View className="gap-3">
							{LEVELS.map((level) => (
								<OptionRow
									key={level.id}
									name={level.name}
									description={level.description}
									emoji={level.emoji}
									isSelected={data.level === level.id}
									onPress={() =>
										setData((prev) => ({ ...prev, level: level.id }))
									}
								/>
							))}
						</View>
					</StepLayout>
				);
			case "goal":
				return (
					<StepLayout
						title="What's your main goal?"
						subtitle="We'll create a learning path tailored to your needs"
						footer={continueButton}
					>
						<View className="gap-3">
							{GOALS.map((goal) => (
								<OptionRow
									key={goal.id}
									name={goal.name}
									description={goal.description}
									icon={goal.icon}
									isSelected={data.goal === goal.id}
									onPress={() =>
										setData((prev) => ({ ...prev, goal: goal.id }))
									}
								/>
							))}
						</View>
					</StepLayout>
				);
			case "time":
				return (
					<StepLayout
						title="How much time can you practice daily?"
						subtitle="Consistency is key to language learning"
						footer={continueButton}
					>
						<View className="gap-3">
							{TIME_OPTIONS.map((option) => (
								<OptionRow
									key={option.id}
									name={option.name}
									description={option.description}
									emoji={option.emoji}
									isSelected={data.time === option.id}
									onPress={() =>
										setData((prev) => ({ ...prev, time: option.id }))
									}
								/>
							))}
						</View>
					</StepLayout>
				);
			case "focus":
				return (
					<StepLayout
						title="What do you want to focus on?"
						subtitle="Select all that apply — you can change this later"
						footer={continueButton}
					>
						<OptionGrid>
							{FOCUS_AREAS.map((area) => (
								<OptionTile
									key={area.id}
									name={area.name}
									icon={area.icon}
									isSelected={data.focus.includes(area.id)}
									onPress={() => toggleIn("focus", area.id)}
								/>
							))}
						</OptionGrid>
					</StepLayout>
				);
			case "interests":
				return (
					<StepLayout
						title="What are you interested in?"
						subtitle="Pick topics you enjoy — we'll tailor conversations to your interests"
						footer={continueButton}
					>
						<OptionGrid>
							{INTERESTS.map((interest) => (
								<OptionTile
									key={interest.id}
									name={interest.name}
									icon={interest.icon}
									isSelected={data.interests.includes(interest.id)}
									onPress={() => toggleIn("interests", interest.id)}
								/>
							))}
						</OptionGrid>
					</StepLayout>
				);
			case "plan":
				return (
					<PlanSummaryStep
						data={data}
						onSubmit={handleSubmit}
						isSubmitting={saveOnboardingMutation.isPending}
						error={saveOnboardingMutation.error?.message ?? null}
					/>
				);
			default:
				return null;
		}
	};

	if (!isHydrated) {
		return (
			<View className="flex-1 items-center justify-center bg-neutral-50">
				<ActivityIndicator />
			</View>
		);
	}

	return (
		<SafeAreaView className="flex-1 bg-neutral-50">
			{currentStep > 0 ? (
				<OnboardingHeader
					progress={(currentStep + 1) / STEPS.length}
					onBack={prevStep}
					onSignOut={handleSignOut}
					isSigningOut={isSigningOut}
				/>
			) : null}
			<KeyboardAvoidingView
				className="flex-1"
				behavior={Platform.OS === "ios" ? "padding" : undefined}
			>
				<Animated.View
					key={stepId}
					entering={FadeIn.duration(200)}
					className="flex-1"
				>
					{renderStep()}
				</Animated.View>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}
