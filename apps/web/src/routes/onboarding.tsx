import { env } from "@english.now/env/client";
import { useTranslation } from "@english.now/i18n";
import { usePostHog } from "@posthog/react";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import {
	ArrowRight,
	BookOpen,
	Briefcase,
	Check,
	Clapperboard,
	Cpu,
	Dumbbell,
	Gamepad2,
	GraduationCap,
	LogOut,
	MessageCircle,
	Music,
	Palette,
	Plane,
	Target,
	Users,
	UtensilsCrossed,
	Zap,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { LanguageSwitcher } from "@/components/language-switcher";
import Loader from "@/components/loader";
import Logo from "@/components/logo";
import NativeLanguageStep from "@/components/onboarding/nativelanguage-step";
import PaywallStep from "@/components/onboarding/paywall-step";
import SelectionStep from "@/components/onboarding/selection-step";
import WelcomeStep from "@/components/onboarding/welcome-step";
import { Button } from "@/components/ui/button";
import { getProfile } from "@/functions/get-profile";
import { authClient } from "@/lib/auth-client";
import { openCheckout } from "@/lib/paddle";
import _plans from "@/lib/plans";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onboarding")({
	beforeLoad: async () => {
		const profile = await getProfile();
		if (profile?.isOnboardingCompleted) {
			throw redirect({ to: "/home" });
		}
		return { profile };
	},
	component: OnboardingPage,
});

type OnboardingData = {
	nativeLanguage: string;
	level: string;
	goal: string;
	time: string;
	focus: string[];
	interests: string[];
};

const STEPS = [
	{ id: "welcome", title: "Welcome" },
	{ id: "native-language", title: "Native Language" },
	{ id: "level", title: "Your Level" },
	{ id: "goal", title: "Your Goal" },
	{ id: "time", title: "Daily Time" },
	{ id: "focus", title: "Focus Areas" },
	{ id: "interests", title: "Interests" },
	{ id: "plan", title: "Your Plan" },
	{ id: "paywall", title: "Get Started" },
];

const LEVELS = [
	{
		id: "beginner",
		name: "Beginner",
		description: "I know some basic words and phrases",
		icon: "🌱",
	},
	{
		id: "elementary",
		name: "Elementary",
		description: "I can have simple conversations",
		icon: "🌿",
	},
	{
		id: "intermediate",
		name: "Intermediate",
		description: "I can discuss various topics",
		icon: "🌳",
	},
	{
		id: "upper-intermediate",
		name: "Upper Intermediate",
		description: "I'm comfortable in most situations",
		icon: "🌲",
	},
	{
		id: "advanced",
		name: "Advanced",
		description: "I want to perfect my English",
		icon: "🏔️",
	},
];

const GOALS = [
	{
		id: "career",
		name: "Career Growth",
		description: "Get better job opportunities",
		icon: Briefcase,
	},
	{
		id: "travel",
		name: "Travel",
		description: "Communicate while traveling",
		icon: Plane,
	},
	{
		id: "education",
		name: "Education",
		description: "Study abroad or pass exams",
		icon: GraduationCap,
	},
	{
		id: "social",
		name: "Social",
		description: "Make friends and connect",
		icon: Users,
	},
	{
		id: "personal",
		name: "Personal Growth",
		description: "Challenge myself to learn",
		icon: Target,
	},
	{
		id: "content",
		name: "Entertainment",
		description: "Enjoy movies, books & music",
		icon: BookOpen,
	},
];

const TIME_OPTIONS = [
	{
		id: "5",
		name: "5 minutes",
		description: "Quick daily practice",
		icon: "⚡",
	},
	{
		id: "10",
		name: "10 minutes",
		description: "Steady progress",
		icon: "🚶",
	},
	{
		id: "15",
		name: "15 minutes",
		description: "Serious learning",
		icon: "🏃",
	},
	{
		id: "20",
		name: "20+ minutes",
		description: "Intensive study",
		icon: "🚀",
	},
];

const FOCUS_AREAS = [
	{ id: "speaking", name: "Speaking", icon: MessageCircle },
	{ id: "vocabulary", name: "Vocabulary", icon: BookOpen },
	{ id: "grammar", name: "Grammar", icon: GraduationCap },
	{ id: "pronunciation", name: "Pronunciation", icon: Zap },
];

const INTERESTS = [
	{ id: "technology", name: "Technology", icon: Cpu },
	{ id: "travel", name: "Travel", icon: Plane },
	{ id: "music", name: "Music", icon: Music },
	{ id: "movies", name: "Movies & TV", icon: Clapperboard },
	{ id: "food", name: "Food & Cooking", icon: UtensilsCrossed },
	{ id: "fitness", name: "Health & Fitness", icon: Dumbbell },
	{ id: "business", name: "Business", icon: Briefcase },
	{ id: "art", name: "Art & Design", icon: Palette },
	{ id: "gaming", name: "Gaming", icon: Gamepad2 },
	{ id: "books", name: "Books & Literature", icon: BookOpen },
];

const defaultOnboardingData: OnboardingData = {
	nativeLanguage: "",
	level: "",
	goal: "",
	time: "",
	focus: [],
	interests: [],
};

function loadSavedProgress(): { data: OnboardingData; step: number } | null {
	try {
		const saved = localStorage.getItem("onboarding-progress");
		if (saved) {
			const parsed = JSON.parse(saved);
			return {
				data: parsed.data || defaultOnboardingData,
				step: parsed.step || 0,
			};
		}
	} catch (_e) {
		// Ignore parsing errors
	}
	return null;
}

function OnboardingPage() {
	const { t } = useTranslation("onboarding");
	const posthog = usePostHog();
	const [isScrolled, setIsScrolled] = useState(false);
	const navigate = useNavigate();
	const { data: session } = authClient.useSession();
	const [isHydrated, setIsHydrated] = useState(false);
	const [currentStep, setCurrentStep] = useState(0);
	const [data, setData] = useState<OnboardingData>(defaultOnboardingData);
	const [isAnimating, setIsAnimating] = useState(false);
	const [selectedPlan, setSelectedPlan] = useState("yearly");
	const isInitialMount = useRef(true);

	const saveOnboardingMutation = useMutation({
		mutationFn: async (input: {
			nativeLanguage: string;
			proficiencyLevel: string;
			dailyGoal: number;
			focusAreas: string[];
			interests: string[];
			goal: string;
			timezone: string;
		}) => {
			const response = await fetch(
				`${env.VITE_SERVER_URL}/api/profile/onboarding`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					credentials: "include",
					body: JSON.stringify(input),
				},
			);
			if (!response.ok) throw new Error("Failed to save onboarding");
			return response.json();
		},
	});

	// Hydrate state from localStorage before showing any content
	useEffect(() => {
		const saved = loadSavedProgress();
		if (saved) {
			setData(saved.data);
			setCurrentStep(saved.step);
		}
		setIsHydrated(true);
	}, []);

	// Save progress to localStorage (skip initial mount to avoid overwriting)
	useEffect(() => {
		if (isInitialMount.current) {
			isInitialMount.current = false;
			return;
		}
		localStorage.setItem(
			"onboarding-progress",
			JSON.stringify({ data, step: currentStep }),
		);
	}, [data, currentStep]);

	// Handle scroll to show navbar
	useEffect(() => {
		const handleScroll = () => {
			setIsScrolled(window.scrollY > 0);
		};

		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	const nextStep = useCallback(() => {
		if (currentStep < STEPS.length - 1) {
			setIsAnimating(true);
			setTimeout(() => {
				setCurrentStep((prev) => prev + 1);
				setIsAnimating(false);
			}, 150);
		}
	}, [currentStep]);

	const handleComplete = useCallback(async () => {
		try {
			const plan = _plans.find((p) => p.name === selectedPlan);

			await saveOnboardingMutation.mutateAsync({
				nativeLanguage: data.nativeLanguage || "en",
				proficiencyLevel: data.level,
				dailyGoal: Number.parseInt(data.time) || 15,
				focusAreas: data.focus,
				interests: data.interests,
				goal: data.goal,
				timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
			});

			posthog.capture("onboarding_completed", {
				selected_plan: selectedPlan,
				level: data.level,
				goal: data.goal,
				daily_goal_minutes: Number.parseInt(data.time) || 15,
				focus_areas: data.focus,
				native_language: data.nativeLanguage || "en",
				has_paid_plan: Boolean(plan?.paddlePriceId),
			});

			// Clear local progress
			localStorage.removeItem("onboarding-progress");
			localStorage.setItem("selected-plan", selectedPlan);

			// Paid plan (Monthly/Yearly): open Paddle checkout
			if (plan?.paddlePriceId && session?.user) {
				await openCheckout({
					priceId: plan.paddlePriceId,
					userId: session.user.id,
					email: session.user.email,
				});
				return;
			}

			// Free plan: continue to content generation
			navigate({ to: "/generating" });
		} catch (error) {
			console.error("Failed to save onboarding:", error);
		}
	}, [navigate, selectedPlan, data, saveOnboardingMutation, session, posthog]);

	const handleSkip = useCallback(async () => {
		try {
			await saveOnboardingMutation.mutateAsync({
				nativeLanguage: data.nativeLanguage || "en",
				proficiencyLevel: data.level || "beginner",
				dailyGoal: Number.parseInt(data.time) || 15,
				focusAreas: data.focus.length > 0 ? data.focus : ["speaking"],
				interests: data.interests,
				goal: data.goal || "personal",
				timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
			});

			posthog.capture("onboarding_skipped", {
				step_skipped_at: currentStep,
				level: data.level || "beginner",
				goal: data.goal || "personal",
			});

			localStorage.removeItem("onboarding-progress");
			navigate({ to: "/generating" });
		} catch (error) {
			console.error("Failed to save onboarding:", error);
		}
	}, [navigate, data, saveOnboardingMutation, posthog, currentStep]);

	const toggleFocus = (focusId: string) => {
		setData((prev) => ({
			...prev,
			focus: prev.focus.includes(focusId)
				? prev.focus.filter((f) => f !== focusId)
				: [...prev.focus, focusId],
		}));
	};

	const toggleInterest = (interestId: string) => {
		setData((prev) => ({
			...prev,
			interests: prev.interests.includes(interestId)
				? prev.interests.filter((i) => i !== interestId)
				: [...prev.interests, interestId],
		}));
	};

	const canProceed = () => {
		switch (STEPS[currentStep]?.id) {
			case "welcome":
				return true;
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
			case "plan":
				return true;
			case "paywall":
				return true;
			default:
				return true;
		}
	};

	const progressPercentage = Math.round(
		((currentStep + 1) / STEPS.length) * 100,
	);

	if (!isHydrated) {
		return (
			<div className="flex min-h-dvh items-center justify-center bg-neutral-50">
				<Loader />
			</div>
		);
	}

	return (
		<div className="relative flex min-h-dvh flex-col bg-neutral-50">
			{currentStep > 0 && currentStep < STEPS.length - 1 && (
				<div className="fixed top-0 right-0 left-0 z-50 h-1 bg-neutral-200">
					<div
						className="h-full bg-[radial-gradient(100%_100%_at_50%_0%,#EFFF9B_0%,#D8FF76_60%,#C6F64D_100%)] transition-all duration-500 ease-out"
						style={{ width: `${progressPercentage}%` }}
					/>
				</div>
			)}

			{currentStep > 0 && (
				<header
					className={cn(
						isScrolled
							? "sticky top-0 border-border/50 border-b bg-white/70 backdrop-blur-md"
							: "border-transparent border-b",
					)}
				>
					<div className="container relative z-10 mx-auto px-4">
						<nav className="flex items-center justify-between py-5 md:grid-cols-5">
							<div className="col-span-3 items-center gap-3 md:flex">
								<Logo />
							</div>
							<div className="relative z-50 flex items-center justify-end gap-2">
								<LanguageSwitcher className="h-9 rounded-xl" />
								<Button
									variant="outline"
									size="icon"
									className="rounded-xl"
									onClick={() => {
										authClient.signOut({
											fetchOptions: {
												onSuccess: () => {
													navigate({
														to: "/",
													});
												},
											},
										});
									}}
								>
									<LogOut className="size-4" />
								</Button>
							</div>
						</nav>
					</div>
					{/* <div className="container mx-auto flex items-center justify-between px-4 py-4">
						<button
							type="button"
							onClick={prevStep}
							className="flex items-center gap-1 text-muted-foreground text-sm transition-colors hover:text-foreground"
						>
							<ChevronLeft className="size-4" />
							Back
						</button>
						{currentStep < STEPS.length - 1 && (
							<button
								type="button"
								onClick={handleSkip}
								className="text-muted-foreground text-sm transition-colors hover:text-foreground"
							>
								Skip
							</button>
						)}
					</div> */}
				</header>
			)}

			<main className="flex flex-1 flex-col">
				<div
					className={cn(
						"flex flex-1 flex-col transition-opacity duration-150",
						isAnimating ? "opacity-0" : "opacity-100",
					)}
				>
					{currentStep === 0 && <WelcomeStep onNext={nextStep} />}
					{currentStep === 1 && (
						<NativeLanguageStep
							selected={data.nativeLanguage}
							onSelect={(id) =>
								setData((prev) => ({ ...prev, nativeLanguage: id }))
							}
							onNext={nextStep}
							canProceed={canProceed()}
						/>
					)}
					{currentStep === 2 && (
						<SelectionStep
							title={t("level.title")}
							subtitle={t("level.subtitle")}
							options={LEVELS.map((l) => ({
								id: l.id,
								name: t(`level.options.${l.id}.name`),
								description: t(`level.options.${l.id}.description`),
								icon: l.icon,
							}))}
							selected={data.level}
							onSelect={(id) => setData((prev) => ({ ...prev, level: id }))}
							onNext={nextStep}
							canProceed={canProceed()}
						/>
					)}
					{currentStep === 3 && (
						<SelectionStep
							title={t("goal.title")}
							subtitle={t("goal.subtitle")}
							options={GOALS.map((g) => ({
								id: g.id,
								name: t(`goal.options.${g.id}.name`),
								description: t(`goal.options.${g.id}.description`),
								IconComponent: g.icon,
							}))}
							selected={data.goal}
							onSelect={(id) => setData((prev) => ({ ...prev, goal: id }))}
							onNext={nextStep}
							canProceed={canProceed()}
						/>
					)}
					{currentStep === 4 && (
						<SelectionStep
							title={t("time.title")}
							subtitle={t("time.subtitle")}
							options={TIME_OPTIONS.map((g) => ({
								id: g.id,
								name: t(`time.options.${g.id}.name`),
								description: t(`time.options.${g.id}.description`),
								icon: g.icon,
							}))}
							selected={data.time}
							onSelect={(id) => setData((prev) => ({ ...prev, time: id }))}
							onNext={nextStep}
							canProceed={canProceed()}
						/>
					)}
					{currentStep === 5 && (
						<FocusAreasStep
							selected={data.focus}
							onToggle={toggleFocus}
							onNext={nextStep}
							canProceed={canProceed()}
						/>
					)}
					{currentStep === 6 && (
						<InterestsStep
							selected={data.interests}
							onToggle={toggleInterest}
							onNext={nextStep}
							canProceed={canProceed()}
						/>
					)}
					{currentStep === 7 && (
						<PlanSummaryStep data={data} onNext={nextStep} />
					)}
					{currentStep === 8 && (
						<PaywallStep
							selectedPlan={selectedPlan}
							onSelectPlan={setSelectedPlan}
							onComplete={handleComplete}
							onSkip={handleSkip}
						/>
					)}
				</div>
			</main>
		</div>
	);
}

// Interests Step Component
function InterestsStep({
	selected,
	onToggle,
	onNext,
	canProceed,
}: {
	selected: string[];
	onToggle: (id: string) => void;
	onNext: () => void;
	canProceed: boolean;
}) {
	return (
		<div className="flex flex-1 flex-col px-4 py-8">
			<div className="mx-auto w-full max-w-lg">
				<div className="mb-8 text-center">
					<h1 className="mb-2 font-bold font-lyon text-4xl tracking-tight md:text-5xl">
						What are you interested in?
					</h1>
					<p className="text-muted-foreground md:text-lg">
						Pick topics you enjoy — we'll tailor conversations to your interests
					</p>
				</div>

				<div className="grid grid-cols-2 gap-3">
					{INTERESTS.map((interest) => {
						const isSelected = selected.includes(interest.id);
						return (
							<button
								key={interest.id}
								type="button"
								onClick={() => onToggle(interest.id)}
								className={cn(
									"relative flex flex-col items-center gap-3 rounded-2xl border-2 p-5 text-center transition-all",
									isSelected
										? "border-lime-500 bg-lime-50"
										: "border-transparent bg-white hover:bg-neutral-50",
								)}
								style={
									!isSelected
										? {
												boxShadow:
													"0 0 0 1px rgba(0,0,0,.05),0 2px 4px rgba(0,0,0,.04)",
											}
										: undefined
								}
							>
								{isSelected && (
									<div className="absolute top-3 right-3 flex size-5 items-center justify-center rounded-full bg-lime-500">
										<Check className="size-3 text-white" />
									</div>
								)}
								<div
									className={cn(
										"flex size-14 items-center justify-center rounded-xl",
										isSelected
											? "bg-radial from-[#EFFF9B] to-[#D8FF76]"
											: "bg-neutral-100",
									)}
								>
									<interest.icon
										className={cn(
											"size-7",
											isSelected ? "text-lime-700" : "text-neutral-600",
										)}
									/>
								</div>
								<span className="font-semibold">{interest.name}</span>
							</button>
						);
					})}
				</div>

				<div className="mx-auto mt-8 max-w-md">
					<Button
						size="lg"
						className="en-button-gradient h-14 w-full rounded-2xl text-base text-lime-900"
						disabled={!canProceed}
						onClick={onNext}
					>
						Continue
						<ArrowRight className="ml-2 size-5" />
					</Button>
				</div>
			</div>
		</div>
	);
}

// Focus Areas Step Component
function FocusAreasStep({
	selected,
	onToggle,
	onNext,
	canProceed,
}: {
	selected: string[];
	onToggle: (id: string) => void;
	onNext: () => void;
	canProceed: boolean;
}) {
	return (
		<div className="flex flex-1 flex-col px-4 py-8">
			<div className="mx-auto w-full max-w-lg">
				<div className="mb-8 text-center">
					<h1 className="mb-2 font-bold font-lyon text-4xl tracking-tight md:text-5xl">
						What do you want to focus on?
					</h1>
					<p className="text-muted-foreground md:text-lg">
						Select all that apply — you can change this later
					</p>
				</div>

				<div className="grid grid-cols-2 gap-3">
					{FOCUS_AREAS.map((area) => {
						const isSelected = selected.includes(area.id);
						return (
							<button
								key={area.id}
								type="button"
								onClick={() => onToggle(area.id)}
								className={cn(
									"relative flex flex-col items-center gap-3 rounded-2xl border-2 p-5 text-center transition-all",
									isSelected
										? "border-lime-500 bg-lime-50"
										: "border-transparent bg-white hover:bg-neutral-50",
								)}
								style={
									!isSelected
										? {
												boxShadow:
													"0 0 0 1px rgba(0,0,0,.05),0 2px 4px rgba(0,0,0,.04)",
											}
										: undefined
								}
							>
								{isSelected && (
									<div className="absolute top-3 right-3 flex size-5 items-center justify-center rounded-full bg-lime-500">
										<Check className="size-3 text-white" />
									</div>
								)}
								<div
									className={cn(
										"flex size-14 items-center justify-center rounded-xl",
										isSelected
											? "bg-radial from-[#EFFF9B] to-[#D8FF76]"
											: "bg-neutral-100",
									)}
								>
									<area.icon
										className={cn(
											"size-7",
											isSelected ? "text-lime-700" : "text-neutral-600",
										)}
									/>
								</div>
								<span className="font-semibold">{area.name}</span>
							</button>
						);
					})}
				</div>

				<div className="mx-auto mt-8 max-w-md">
					<Button
						size="lg"
						className="en-button-gradient h-14 w-full rounded-2xl text-base text-lime-900"
						disabled={!canProceed}
						onClick={onNext}
					>
						Continue
						<ArrowRight className="ml-2 size-5" />
					</Button>
				</div>
			</div>
		</div>
	);
}

// Plan Summary Step Component
function PlanSummaryStep({
	data,
	onNext,
}: {
	data: OnboardingData;
	onNext: () => void;
}) {
	const levelName = LEVELS.find((l) => l.id === data.level)?.name || "Beginner";
	const goalName = GOALS.find((g) => g.id === data.goal)?.name || "Learning";
	const timeMinutes = data.time || "15";
	const focusNames = data.focus
		.map((f) => FOCUS_AREAS.find((a) => a.id === f)?.name)
		.filter(Boolean);
	const interestNames = data.interests
		.map((i) => INTERESTS.find((a) => a.id === i)?.name)
		.filter(Boolean);

	return (
		<div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
			<div className="mx-auto w-full max-w-md text-center">
				<h1 className="mb-4 font-bold font-lyon text-4xl tracking-tight md:text-5xl">
					Your Personal Plan is Ready!
				</h1>
				<p className="text-muted-foreground md:text-lg">
					Based on your preferences, we've created a custom learning path
				</p>

				<div
					className="mt-8 mb-8 rounded-3xl bg-white p-6 text-left"
					style={{
						boxShadow:
							"0 0 0 1px rgba(0,0,0,.05),0 10px 10px -5px rgba(0,0,0,.04),0 20px 25px -5px rgba(0,0,0,.04)",
					}}
				>
					<h3 className="mb-4 font-bold font-lyon text-2xl tracking-tight">
						Your Learning Profile
					</h3>
					<div className="space-y-4">
						<div className="flex items-center justify-between border-b border-dashed pb-3">
							<span className="text-muted-foreground">Current Level</span>
							<span className="font-medium">{levelName}</span>
						</div>
						<div className="flex items-center justify-between border-b border-dashed pb-3">
							<span className="text-muted-foreground">Main Goal</span>
							<span className="font-medium">{goalName}</span>
						</div>
						<div className="flex items-center justify-between border-b border-dashed pb-3">
							<span className="text-muted-foreground">Daily Practice</span>
							<span className="font-medium">{timeMinutes} minutes</span>
						</div>
						<div className="flex items-center justify-between border-b border-dashed pb-3">
							<span className="text-muted-foreground">Focus Areas</span>
							<span className="font-medium">
								{focusNames.join(", ") || "All"}
							</span>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-muted-foreground">Interests</span>
							<span className="max-w-[60%] text-right font-medium">
								{interestNames.join(", ") || "—"}
							</span>
						</div>
					</div>
				</div>

				{/* Projection */}
				{/* <div className="mb-8 rounded-2xl bg-lime-50 p-4">
					<div className="flex items-center justify-center gap-2 text-lime-700">
						<Clock className="size-5" />
						<span className="font-medium">
							With {timeMinutes} min/day, you could reach the next level in ~8
							weeks
						</span>
					</div>
				</div> */}

				<Button
					size="lg"
					className="en-button-gradient h-14 w-full rounded-2xl text-base text-lime-900"
					onClick={onNext}
				>
					Start Learning
					<ArrowRight className="size-5" />
				</Button>
			</div>
		</div>
	);
}
