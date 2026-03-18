import { getVocabularyAccessSummary } from "@english.now/api/services/feature-gating";
import { recordDailyFeatureUsage } from "@english.now/api/services/feature-usage";
import {
	ensurePhraseTranslation,
	ensureWordTranslation,
	getOrCreatePhrase,
	getOrCreateWord,
	validateEnglishPhrase,
	validateEnglishWord,
} from "@english.now/api/services/vocabulary-catalog";
import { db, eq, userPhrase, userProfile, userWord } from "@english.now/db";

export type ConversationVocabularyMode = "word" | "phrase";

export type ConversationVocabularyResult =
	| { status: "added"; itemId: string }
	| { status: "already_exists"; itemId: string }
	| { status: "skipped_invalid" | "skipped_limit"; itemId: null };

async function getUserLanguage(userId: string): Promise<string> {
	const [profile] = await db
		.select({ nativeLanguage: userProfile.nativeLanguage })
		.from(userProfile)
		.where(eq(userProfile.userId, userId))
		.limit(1);

	return profile?.nativeLanguage ?? "uk";
}

export async function addConversationVocabularyItem(input: {
	userId: string;
	mode: ConversationVocabularyMode;
	text: string;
}): Promise<ConversationVocabularyResult> {
	const access = await getVocabularyAccessSummary(input.userId);

	if (!access.isPro && !access.adds.hasAccess) {
		return { status: "skipped_limit", itemId: null };
	}

	const language = await getUserLanguage(input.userId);

	if (input.mode === "word") {
		const normalizedWord = input.text.trim().toLowerCase();
		const isEnglish = await validateEnglishWord(normalizedWord);

		if (!isEnglish) {
			return { status: "skipped_invalid", itemId: null };
		}

		const wordId = await getOrCreateWord(normalizedWord);
		await ensureWordTranslation(wordId, language);

		const inserted = await db
			.insert(userWord)
			.values({
				id: crypto.randomUUID(),
				userId: input.userId,
				wordId,
				mastery: "new",
				source: "chat",
			})
			.onConflictDoNothing()
			.returning({ id: userWord.id });

		if (inserted[0]) {
			await recordDailyFeatureUsage({
				userId: input.userId,
				feature: "vocabulary_add",
				resourceId: `word:${wordId}`,
				metadata: {
					wordId,
					source: "chat",
				},
			});
		}

		return {
			status: inserted[0] ? "added" : "already_exists",
			itemId: wordId,
		};
	}

	const normalizedPhrase = input.text.trim();
	const isEnglish = await validateEnglishPhrase(normalizedPhrase);

	if (!isEnglish) {
		return { status: "skipped_invalid", itemId: null };
	}

	const phraseId = await getOrCreatePhrase(normalizedPhrase);
	await ensurePhraseTranslation(phraseId, language);

	const inserted = await db
		.insert(userPhrase)
		.values({
			id: crypto.randomUUID(),
			userId: input.userId,
			phraseId,
			mastery: "new",
			source: "chat",
		})
		.onConflictDoNothing()
		.returning({ id: userPhrase.id });

	if (inserted[0]) {
		await recordDailyFeatureUsage({
			userId: input.userId,
			feature: "vocabulary_add",
			resourceId: `phrase:${phraseId}`,
			metadata: {
				phraseId,
				source: "chat",
			},
		});
	}

	return {
		status: inserted[0] ? "added" : "already_exists",
		itemId: phraseId,
	};
}
