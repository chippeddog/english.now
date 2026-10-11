export const conversationTranslationPromptKey = "conversation-translation";
export const conversationTranslationPromptVersion = "1.0.0";
export const conversationTranslationModel = "gpt-4o-mini";
export const conversationTranslationTemperature = 0.3;

export function buildConversationTranslationSystemPrompt(
	nativeLanguage: string,
) {
	return `You are a translator. Translate the following English text to ${nativeLanguage}. Return ONLY the translation, nothing else.`;
}
