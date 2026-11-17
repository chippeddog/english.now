import {
	consumeVocabularyAdd,
	getVocabularyAccessSummary,
} from "@english.now/api/services/feature-gating";
import { releaseFeatureUsage } from "@english.now/api/services/feature-usage";
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

	let itemId: string;
	let resourceId: string;
	let insert: () => Promise<boolean>;

	if (input.mode === "word") {
		const normalizedWord = input.text.trim().toLowerCase();
		if (!(await validateEnglishWord(normalizedWord))) {
			return { status: "skipped_invalid", itemId: null };
		}

		const wordId = await getOrCreateWord(normalizedWord);
		await ensureWordTranslation(wordId, language);
		itemId = wordId;
		resourceId = `word:${wordId}`;
		insert = async () => {
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
			return inserted.length > 0;
		};
	} else {
		const normalizedPhrase = input.text.trim();
		if (!(await validateEnglishPhrase(normalizedPhrase))) {
			return { status: "skipped_invalid", itemId: null };
		}

		const phraseId = await getOrCreatePhrase(normalizedPhrase);
		await ensurePhraseTranslation(phraseId, language);
		itemId = phraseId;
		resourceId = `phrase:${phraseId}`;
		insert = async () => {
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
			return inserted.length > 0;
		};
	}

	const reservation = await consumeVocabularyAdd(input.userId, {
		resourceId,
		metadata: { [`${input.mode}Id`]: itemId, source: "chat" },
	});
	if (!reservation.consumed) {
		return { status: "skipped_limit", itemId: null };
	}

	const added = await insert();
	if (!added) {
		await releaseFeatureUsage({
			userId: input.userId,
			feature: "vocabulary_add",
			resourceId,
		});
	}

	return { status: added ? "added" : "already_exists", itemId };
}
