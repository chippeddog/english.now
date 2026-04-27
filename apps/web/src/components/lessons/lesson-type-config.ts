import {
	BookOpen,
	FileText,
	GraduationCap,
	type LucideIcon,
	PenTool,
	Play,
	Volume2,
} from "lucide-react";
import type { LessonTypeValue } from "@/types/lesson";

export type LessonTypeIconConfig = {
	label: string;
	icon: LucideIcon;
	color: string;
	bgColor: string;
};

export const lessonTypeConfig: Record<LessonTypeValue, LessonTypeIconConfig> = {
	grammar: {
		label: "Grammar",
		icon: PenTool,
		color: "text-violet-600",
		bgColor: "bg-violet-100",
	},
	vocabulary: {
		label: "Vocabulary",
		icon: BookOpen,
		color: "text-sky-600",
		bgColor: "bg-sky-100",
	},
	reading: {
		label: "Reading",
		icon: FileText,
		color: "text-emerald-600",
		bgColor: "bg-emerald-100",
	},
	listening: {
		label: "Listening",
		icon: Volume2,
		color: "text-amber-600",
		bgColor: "bg-amber-100",
	},
	speaking: {
		label: "Speaking",
		icon: Play,
		color: "text-rose-600",
		bgColor: "bg-rose-100",
	},
	writing: {
		label: "Writing",
		icon: GraduationCap,
		color: "text-indigo-600",
		bgColor: "bg-indigo-100",
	},
};

const BLOCK_TYPE_TO_LESSON_TYPE: Record<string, LessonTypeValue> = {
	teach: "grammar",
	input: "reading",
	practice: "vocabulary",
	review: "grammar",
	assessment: "grammar",
};

// Some legacy curriculum rows only carry a block_type. Map it to a real
// LessonTypeValue so the UI can still render a sensible icon. New seed content
// always ships with lessonType, so this is only a fallback.
export function resolveLessonType(
	lessonType: string | null | undefined,
	blockType: string,
): LessonTypeValue {
	if (lessonType && lessonType in lessonTypeConfig) {
		return lessonType as LessonTypeValue;
	}
	return BLOCK_TYPE_TO_LESSON_TYPE[blockType] ?? "grammar";
}
