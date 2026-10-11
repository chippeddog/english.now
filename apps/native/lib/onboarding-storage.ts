import AsyncStorage from "@react-native-async-storage/async-storage";
import {
	defaultOnboardingData,
	type OnboardingData,
	STEPS,
} from "@/lib/onboarding-options";

const STORAGE_KEY = "onboarding-progress";

type OnboardingProgress = { data: OnboardingData; step: number };

export async function loadOnboardingProgress(): Promise<OnboardingProgress | null> {
	try {
		const saved = await AsyncStorage.getItem(STORAGE_KEY);
		if (!saved) {
			return null;
		}
		const parsed = JSON.parse(saved);
		const step = Number(parsed.step) || 0;
		return {
			data: { ...defaultOnboardingData, ...parsed.data },
			step: Math.min(Math.max(step, 0), STEPS.length - 1),
		};
	} catch {
		return null;
	}
}

export async function saveOnboardingProgress(progress: OnboardingProgress) {
	try {
		await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
	} catch {}
}

export async function clearOnboardingProgress() {
	try {
		await AsyncStorage.removeItem(STORAGE_KEY);
	} catch {}
}
