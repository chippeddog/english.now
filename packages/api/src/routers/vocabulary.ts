import {
	and,
	db,
	eq,
	phrase,
	phraseTranslation,
	userPhrase,
	userProfile,
	userWord,
	word,
	wordTranslation,
} from "@english.now/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../index";
import {
	ensurePhraseTranslation,
	ensureWordTranslation,
	getOrCreatePhrase,
	getOrCreateWord,
	validateEnglishPhrase,
	validateEnglishWord,
} from "../services/vocabulary-catalog";

async function getUserLanguage(userId: string): Promise<string> {
	const [profile] = await db
		.select({ nativeLanguage: userProfile.nativeLanguage })
		.from(userProfile)
		.where(eq(userProfile.userId, userId))
		.limit(1);
	return profile?.nativeLanguage ?? "uk";
}

export const vocabularyRouter = router({
	getWords: protectedProcedure
		.input(
			z.object({
				level: z.string().optional(),
				mastery: z.string().optional(),
				search: z.string().optional(),
				limit: z.number().min(1).max(200).default(50),
				offset: z.number().min(0).default(0),
			}),
		)
		.query(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;
			const language = await getUserLanguage(userId);

			const rows = await db
				.select({
					userWordId: userWord.id,
					mastery: userWord.mastery,
					source: userWord.source,
					notes: userWord.notes,
					addedAt: userWord.createdAt,
					wordId: word.id,
					lemma: word.lemma,
					ipa: word.ipa,
					audioUrl: word.audioUrl,
					partOfSpeech: word.partOfSpeech,
					definition: word.definition,
					exampleSentence: word.exampleSentence,
					level: word.level,
					frequencyRank: word.frequencyRank,
					translation: wordTranslation.translation,
				})
				.from(userWord)
				.innerJoin(word, eq(userWord.wordId, word.id))
				.leftJoin(
					wordTranslation,
					and(
						eq(wordTranslation.wordId, word.id),
						eq(wordTranslation.language, language),
					),
				)
				.where(eq(userWord.userId, userId))
				.limit(input.limit)
				.offset(input.offset);

			let filtered = rows;
			if (input.level) {
				filtered = filtered.filter((r) => r.level === input.level);
			}
			if (input.mastery) {
				filtered = filtered.filter((r) => r.mastery === input.mastery);
			}
			if (input.search) {
				const s = input.search.toLowerCase();
				filtered = filtered.filter(
					(r) =>
						r.lemma.toLowerCase().includes(s) ||
						r.definition.toLowerCase().includes(s),
				);
			}

			return filtered;
		}),

	addWord: protectedProcedure
		.input(
			z.object({
				word: z.string().min(1),
				source: z
					.enum(["manual", "lesson", "chat", "explore"])
					.default("manual"),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const isEnglish = await validateEnglishWord(input.word);
			if (!isEnglish) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Please enter a valid English word.",
				});
			}

			const userId = ctx.session.user.id;
			const language = await getUserLanguage(userId);

			const wordId = await getOrCreateWord(input.word);
			await ensureWordTranslation(wordId, language);

			const id = crypto.randomUUID();
			await db
				.insert(userWord)
				.values({
					id,
					userId,
					wordId,
					mastery: "new",
					source: input.source,
				})
				.onConflictDoNothing();

			return { id, wordId };
		}),

	removeWord: protectedProcedure
		.input(z.object({ userWordId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			await db
				.delete(userWord)
				.where(
					and(
						eq(userWord.id, input.userWordId),
						eq(userWord.userId, ctx.session.user.id),
					),
				);
			return { success: true };
		}),

	updateWordMastery: protectedProcedure
		.input(
			z.object({
				userWordId: z.string(),
				mastery: z.enum(["new", "learning", "reviewing", "mastered"]),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			await db
				.update(userWord)
				.set({ mastery: input.mastery })
				.where(
					and(
						eq(userWord.id, input.userWordId),
						eq(userWord.userId, ctx.session.user.id),
					),
				);
			return { success: true };
		}),

	getPhrases: protectedProcedure
		.input(
			z.object({
				level: z.string().optional(),
				mastery: z.string().optional(),
				limit: z.number().min(1).max(100).default(50),
				offset: z.number().min(0).default(0),
			}),
		)
		.query(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;
			const language = await getUserLanguage(userId);

			const rows = await db
				.select({
					userPhraseId: userPhrase.id,
					mastery: userPhrase.mastery,
					source: userPhrase.source,
					notes: userPhrase.notes,
					addedAt: userPhrase.createdAt,
					phraseId: phrase.id,
					text: phrase.text,
					ipa: phrase.ipa,
					audioUrl: phrase.audioUrl,
					level: phrase.level,
					meaning: phrase.meaning,
					exampleUsage: phrase.exampleUsage,
					translation: phraseTranslation.translation,
					literalTranslation: phraseTranslation.literalTranslation,
				})
				.from(userPhrase)
				.innerJoin(phrase, eq(userPhrase.phraseId, phrase.id))
				.leftJoin(
					phraseTranslation,
					and(
						eq(phraseTranslation.phraseId, phrase.id),
						eq(phraseTranslation.language, language),
					),
				)
				.where(eq(userPhrase.userId, userId))
				.limit(input.limit)
				.offset(input.offset);

			let filtered = rows;
			if (input.level) {
				filtered = filtered.filter((r) => r.level === input.level);
			}
			if (input.mastery) {
				filtered = filtered.filter((r) => r.mastery === input.mastery);
			}

			return filtered;
		}),

	addPhrase: protectedProcedure
		.input(
			z.object({
				phrase: z.string().min(1),
				source: z
					.enum(["manual", "lesson", "chat", "explore"])
					.default("manual"),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const isEnglish = await validateEnglishPhrase(input.phrase);
			if (!isEnglish) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Please enter a valid English phrase.",
				});
			}

			const userId = ctx.session.user.id;
			const language = await getUserLanguage(userId);

			const phraseId = await getOrCreatePhrase(input.phrase);
			await ensurePhraseTranslation(phraseId, language);

			const id = crypto.randomUUID();
			await db
				.insert(userPhrase)
				.values({
					id,
					userId,
					phraseId,
					mastery: "new",
					source: input.source,
				})
				.onConflictDoNothing();

			return { id, phraseId };
		}),

	removePhrase: protectedProcedure
		.input(z.object({ userPhraseId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			await db
				.delete(userPhrase)
				.where(
					and(
						eq(userPhrase.id, input.userPhraseId),
						eq(userPhrase.userId, ctx.session.user.id),
					),
				);
			return { success: true };
		}),

	updatePhraseMastery: protectedProcedure
		.input(
			z.object({
				userPhraseId: z.string(),
				mastery: z.enum(["new", "learning", "reviewing", "mastered"]),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			await db
				.update(userPhrase)
				.set({ mastery: input.mastery })
				.where(
					and(
						eq(userPhrase.id, input.userPhraseId),
						eq(userPhrase.userId, ctx.session.user.id),
					),
				);
			return { success: true };
		}),
});

export type VocabularyRouter = typeof vocabularyRouter;
