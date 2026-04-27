// ─── Lesson Types ────────────────────────────────────────────────────────────
// These mirror the types defined in @english.now/db but are kept local to the
// web app so it doesn't need a direct dependency on the DB package.

export type LessonTypeValue =
	| "grammar"
	| "vocabulary"
	| "reading"
	| "listening"
	| "speaking"
	| "writing";

export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

// ─── Shared UI Types for the lessons tree ────────────────────────────────────

export type LessonStatus = "completed" | "current" | "available" | "locked";

export type UnitStatus = "completed" | "active" | "locked";

export interface LessonTreeLesson {
	id: string;
	title: string;
	subtitle: string;
	type: LessonTypeValue;
	status: LessonStatus;
	progress?: number;
	lockReason?: string | null;
	replayAllowed?: boolean;
	detail: LessonDetail;
}

export interface LessonTreeUnit {
	id: string;
	title: string;
	status: UnitStatus;
	progress: number;
	lessons: LessonTreeLesson[];
	lockReason?: string | null;
	unlockMessage?: string;
}

export interface LessonDetail {
	description: string;
	type?: string;
	objectives?: string[];
	grammarPoints?: { title: string; description: string; examples?: string[] }[];
	vocabulary?: VocabularyItem[];
	rules?: { title: string; description: string; examples?: string[] }[];
	words?: VocabularyItem[];
}

// ─── Vocabulary Item ─────────────────────────────────────────────────────────

export interface VocabularyItem {
	word: string;
	pos?: string;
	definition?: string;
	pronunciation?: string;
	examples?: string[];
	collocations?: string[];
	synonyms?: string[];
	antonyms?: string[];
}

// ─── Type-Specific Lesson Content ────────────────────────────────────────────

interface BaseLessonContent {
	description: string;
	objectives: string[];
}

export interface GrammarLessonContent extends BaseLessonContent {
	type: "grammar";
	rules: {
		title: string;
		explanation: string;
		formula?: string;
		ruleShort?: string;
		signal?: string;
		examples: { sentence: string; highlight: string; note?: string }[];
		commonMistakes?: { wrong: string; correct: string; why: string }[];
	}[];
	vocabulary: VocabularyItem[];
}

export interface VocabularyLessonContent extends BaseLessonContent {
	type: "vocabulary";
	words: VocabularyItem[];
	thematicGroup?: string;
}

export interface ReadingLessonContent extends BaseLessonContent {
	type: "reading";
	passage: { title: string; text: string; source?: string };
	glossary: { word: string; definition: string }[];
	comprehensionFocus: string;
}

export interface ListeningLessonContent extends BaseLessonContent {
	type: "listening";
	audioScript: string;
	listeningFocus: string;
	preTasks?: string[];
}

export interface SpeakingLessonContent extends BaseLessonContent {
	type: "speaking";
	dialogueExamples: { speaker: string; text: string }[];
	usefulPhrases: { phrase: string; usage: string }[];
	pronunciationFocus?: { sound: string; examples: string[] }[];
}

export interface WritingLessonContent extends BaseLessonContent {
	type: "writing";
	writingType: string;
	modelText: string;
	structureGuide: { section: string; description: string }[];
	usefulExpressions: string[];
}

export type CurriculumLessonContent =
	| GrammarLessonContent
	| VocabularyLessonContent
	| ReadingLessonContent
	| ListeningLessonContent
	| SpeakingLessonContent
	| WritingLessonContent;

// ─── Exercise Types ──────────────────────────────────────────────────────────

export type LessonExerciseType =
	| "multiple_choice"
	| "fill_in_the_blank"
	| "sentence_correction"
	| "sentence_transformation"
	| "reorder_words"
	| "error_identification"
	| "word_matching"
	| "synonym_antonym"
	| "categorization"
	| "true_false"
	| "comprehension"
	| "dictation"
	| "dialogue_completion"
	| "sentence_building"
	| "error_correction";

export type ExercisePhase = "guided" | "free";
export type ExerciseDifficulty = "easy" | "medium" | "hard";

export interface ExerciseItem {
	id: string;
	type: LessonExerciseType;
	phase: ExercisePhase;
	prompt: string;
	instruction?: string;
	options?: string[];
	pairs?: { left: string; right: string }[];
	items?: string[];
	categories?: { name: string; items: string[] }[];
	correctAnswer: string | string[];
	explanation: string;
	hint?: string;
	difficulty: ExerciseDifficulty;
	userAnswer?: string | string[];
	isCorrect?: boolean;
}
