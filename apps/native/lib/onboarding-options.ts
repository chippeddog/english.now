import type { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";

export type IconName = ComponentProps<typeof Ionicons>["name"];

export type OnboardingData = {
	nativeLanguage: string;
	level: string;
	goal: string;
	time: string;
	focus: string[];
	interests: string[];
};

export const defaultOnboardingData: OnboardingData = {
	nativeLanguage: "",
	level: "",
	goal: "",
	time: "",
	focus: [],
	interests: [],
};

export const STEPS = [
	"welcome",
	"native-language",
	"level",
	"goal",
	"time",
	"focus",
	"interests",
	"plan",
] as const;

export type StepId = (typeof STEPS)[number];

export const LANGUAGES = [
	{ id: "uk", name: "Ukrainian", flag: "🇺🇦" },
	{ id: "en", name: "English", flag: "🇬🇧" },
	{ id: "fr", name: "French", flag: "🇫🇷" },
	{ id: "es", name: "Spanish", flag: "🇪🇸" },
	{ id: "de", name: "German", flag: "🇩🇪" },
	{ id: "pt", name: "Portuguese", flag: "🇵🇹" },
	{ id: "it", name: "Italian", flag: "🇮🇹" },
	{ id: "pl", name: "Polish", flag: "🇵🇱" },
	{ id: "ja", name: "Japanese", flag: "🇯🇵" },
	{ id: "ko", name: "Korean", flag: "🇰🇷" },
	{ id: "zh", name: "Chinese", flag: "🇨🇳" },
	{ id: "ar", name: "Arabic", flag: "🇸🇦" },
	{ id: "hi", name: "Hindi", flag: "🇮🇳" },
	{ id: "tr", name: "Turkish", flag: "🇹🇷" },
];

export const LEVELS = [
	{
		id: "beginner",
		name: "Beginner",
		description: "I know some basic words and phrases",
		emoji: "🌱",
	},
	{
		id: "elementary",
		name: "Elementary",
		description: "I can have simple conversations",
		emoji: "🌿",
	},
	{
		id: "intermediate",
		name: "Intermediate",
		description: "I can discuss various topics",
		emoji: "🌳",
	},
	{
		id: "upper-intermediate",
		name: "Upper Intermediate",
		description: "I'm comfortable in most situations",
		emoji: "🌲",
	},
	{
		id: "advanced",
		name: "Advanced",
		description: "I want to perfect my English",
		emoji: "🏔️",
	},
];

export const GOALS: {
	id: string;
	name: string;
	description: string;
	icon: IconName;
}[] = [
	{
		id: "career",
		name: "Career Growth",
		description: "Get better job opportunities",
		icon: "briefcase-outline",
	},
	{
		id: "travel",
		name: "Travel",
		description: "Communicate while traveling",
		icon: "airplane-outline",
	},
	{
		id: "education",
		name: "Education",
		description: "Study abroad or pass exams",
		icon: "school-outline",
	},
	{
		id: "social",
		name: "Social",
		description: "Make friends and connect",
		icon: "people-outline",
	},
	{
		id: "personal",
		name: "Personal Growth",
		description: "Challenge myself to learn",
		icon: "locate-outline",
	},
	{
		id: "content",
		name: "Entertainment",
		description: "Enjoy movies, books & music",
		icon: "book-outline",
	},
];

export const TIME_OPTIONS = [
	{
		id: "5",
		name: "5 minutes",
		description: "Quick daily practice",
		emoji: "⚡",
	},
	{
		id: "10",
		name: "10 minutes",
		description: "Steady progress",
		emoji: "🚶",
	},
	{
		id: "15",
		name: "15 minutes",
		description: "Serious learning",
		emoji: "🏃",
	},
	{
		id: "20",
		name: "20+ minutes",
		description: "Intensive study",
		emoji: "🚀",
	},
];

export const DAILY_GOALS = [
	{ minutes: 5, label: "Casual" },
	{ minutes: 10, label: "Steady" },
	{ minutes: 15, label: "Serious" },
	{ minutes: 20, label: "Intensive" },
];

export const FOCUS_AREAS: { id: string; name: string; icon: IconName }[] = [
	{ id: "speaking", name: "Speaking", icon: "chatbubble-outline" },
	{ id: "vocabulary", name: "Vocabulary", icon: "book-outline" },
	{ id: "grammar", name: "Grammar", icon: "school-outline" },
	{ id: "pronunciation", name: "Pronunciation", icon: "flash-outline" },
];

export const INTERESTS: { id: string; name: string; icon: IconName }[] = [
	{ id: "technology", name: "Technology", icon: "hardware-chip-outline" },
	{ id: "travel", name: "Travel", icon: "airplane-outline" },
	{ id: "music", name: "Music", icon: "musical-notes-outline" },
	{ id: "movies", name: "Movies & TV", icon: "film-outline" },
	{ id: "food", name: "Food & Cooking", icon: "restaurant-outline" },
	{ id: "fitness", name: "Health & Fitness", icon: "barbell-outline" },
	{ id: "business", name: "Business", icon: "briefcase-outline" },
	{ id: "art", name: "Art & Design", icon: "color-palette-outline" },
	{ id: "gaming", name: "Gaming", icon: "game-controller-outline" },
	{ id: "books", name: "Books & Literature", icon: "library-outline" },
];
