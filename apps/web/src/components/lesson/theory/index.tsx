import type { CurriculumLessonContent } from "@/types/lesson";
import GrammarTheory from "./grammar-theory";
import ListeningTheory from "./listening-theory";
import ReadingTheory from "./reading-theory";
import SpeakingTheory from "./speaking-theory";
import VocabularyTheory from "./vocabulary-theory";
import WritingTheory from "./writing-theory";

interface TheoryViewProps {
	content: CurriculumLessonContent;
	onContinue: () => void;
}

export default function TheoryView({ content, onContinue }: TheoryViewProps) {
	switch (content.type) {
		case "grammar":
			return <GrammarTheory content={content} onContinue={onContinue} />;
		case "vocabulary":
			return <VocabularyTheory content={content} onContinue={onContinue} />;
		case "reading":
			return <ReadingTheory content={content} onContinue={onContinue} />;
		case "listening":
			return <ListeningTheory content={content} onContinue={onContinue} />;
		case "speaking":
			return <SpeakingTheory content={content} onContinue={onContinue} />;
		case "writing":
			return <WritingTheory content={content} onContinue={onContinue} />;
		default:
			return null;
	}
}

export {
	GrammarTheory,
	VocabularyTheory,
	ReadingTheory,
	ListeningTheory,
	SpeakingTheory,
	WritingTheory,
};
