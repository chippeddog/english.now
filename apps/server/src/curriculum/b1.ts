import type { ExerciseType, GrammarPoint, WordToLearn } from "@english.now/db";

export interface CurriculumLesson {
	title: string;
	subtitle: string;
	type: string;
	content: {
		description: string;
		wordCount: number;
		grammarCount: number;
		exercises: ExerciseType[];
		grammarPoints: GrammarPoint[];
		wordsToLearn: WordToLearn[];
	};
}

export interface CurriculumUnit {
	title: string;
	description: string;
	lessons: CurriculumLesson[];
}

export interface Curriculum {
	level: string;
	units: CurriculumUnit[];
}

export const B1_CURRICULUM: Curriculum = {
	level: "B1",
	units: [
		{
			title: "Everyday Communication",
			description:
				"Essential grammar and vocabulary for navigating daily situations with confidence",
			lessons: [
				{
					title: "Present Perfect vs Past Simple",
					subtitle: "When to use each tense in conversation",
					type: "grammar",
					content: {
						description:
							"Master the difference between present perfect and past simple tenses. Learn to talk about experiences, recent events, and completed actions in the past.",
						wordCount: 8,
						grammarCount: 2,
						exercises: ["lecture", "practice", "quiz"],
						grammarPoints: [
							{
								title: "Present Perfect for life experiences",
								description:
									"Use 'have/has + past participle' to talk about experiences without specifying when: 'I have visited Paris.'",
							},
							{
								title: "Past Simple for finished actions",
								description:
									"Use past simple for actions completed at a specific time in the past: 'I visited Paris last summer.'",
							},
						],
						wordsToLearn: [
							{ word: "recently", translation: "" },
							{ word: "already", translation: "" },
							{ word: "yet", translation: "" },
							{ word: "just", translation: "" },
							{ word: "ever", translation: "" },
							{ word: "never", translation: "" },
							{ word: "since", translation: "" },
							{ word: "ago", translation: "" },
						],
					},
				},
				{
					title: "Making Plans & Arrangements",
					subtitle: "Future forms for different situations",
					type: "grammar",
					content: {
						description:
							"Learn to distinguish between 'will', 'going to', and present continuous for future plans. Express intentions, predictions, and scheduled events.",
						wordCount: 8,
						grammarCount: 3,
						exercises: ["lecture", "practice", "quiz"],
						grammarPoints: [
							{
								title: "'Going to' for plans and intentions",
								description:
									"Use 'be going to + infinitive' for decisions already made: 'I'm going to start a new course.'",
							},
							{
								title: "'Will' for spontaneous decisions & predictions",
								description:
									"Use 'will + infinitive' for decisions made at the moment of speaking: 'I'll help you with that.'",
							},
							{
								title: "Present Continuous for fixed arrangements",
								description:
									"Use present continuous for definite plans with a time/place: 'I'm meeting John at 3pm.'",
							},
						],
						wordsToLearn: [
							{ word: "appointment", translation: "" },
							{ word: "schedule", translation: "" },
							{ word: "arrange", translation: "" },
							{ word: "intend", translation: "" },
							{ word: "expect", translation: "" },
							{ word: "confirm", translation: "" },
							{ word: "postpone", translation: "" },
							{ word: "cancel", translation: "" },
						],
					},
				},
				{
					title: "Everyday Vocabulary",
					subtitle: "Words for daily routines and errands",
					type: "vocabulary",
					content: {
						description:
							"Build your vocabulary for talking about daily activities, household tasks, and running errands around town.",
						wordCount: 10,
						grammarCount: 0,
						exercises: ["practice", "quiz"],
						grammarPoints: [],
						wordsToLearn: [
							{ word: "commute", translation: "" },
							{ word: "groceries", translation: "" },
							{ word: "chores", translation: "" },
							{ word: "laundry", translation: "" },
							{ word: "appointment", translation: "" },
							{ word: "errand", translation: "" },
							{ word: "routine", translation: "" },
							{ word: "schedule", translation: "" },
							{ word: "deadline", translation: "" },
							{ word: "spare time", translation: "" },
						],
					},
				},
				{
					title: "Asking for & Giving Directions",
					subtitle: "Navigate conversations about places",
					type: "speaking",
					content: {
						description:
							"Practice phrases for asking directions, describing locations, and giving clear instructions to help someone find their way.",
						wordCount: 8,
						grammarCount: 1,
						exercises: ["lecture", "practice", "conversation"],
						grammarPoints: [
							{
								title: "Imperative for giving instructions",
								description:
									"Use the base form of the verb for clear directions: 'Turn left at the traffic lights, then go straight ahead.'",
							},
						],
						wordsToLearn: [
							{ word: "intersection", translation: "" },
							{ word: "roundabout", translation: "" },
							{ word: "pedestrian", translation: "" },
							{ word: "block", translation: "" },
							{ word: "opposite", translation: "" },
							{ word: "straight ahead", translation: "" },
							{ word: "landmark", translation: "" },
							{ word: "shortcut", translation: "" },
						],
					},
				},
			],
		},
		{
			title: "Describing & Comparing",
			description:
				"Express opinions, describe people and things, and make comparisons",
			lessons: [
				{
					title: "Comparatives & Superlatives",
					subtitle: "Comparing things and expressing preferences",
					type: "grammar",
					content: {
						description:
							"Learn to form and use comparatives and superlatives correctly. Compare people, places, and things using different adjective forms.",
						wordCount: 8,
						grammarCount: 2,
						exercises: ["lecture", "practice", "quiz"],
						grammarPoints: [
							{
								title: "Comparative adjectives",
								description:
									"Add '-er' for short adjectives or use 'more' for longer ones: 'bigger', 'more expensive'. Use 'than' to compare: 'This is cheaper than that one.'",
							},
							{
								title: "Superlative adjectives",
								description:
									"Add '-est' for short adjectives or 'most' for longer ones: 'the biggest', 'the most interesting'. Always use 'the' before superlatives.",
							},
						],
						wordsToLearn: [
							{ word: "efficient", translation: "" },
							{ word: "affordable", translation: "" },
							{ word: "convenient", translation: "" },
							{ word: "reliable", translation: "" },
							{ word: "comfortable", translation: "" },
							{ word: "crowded", translation: "" },
							{ word: "worth", translation: "" },
							{ word: "prefer", translation: "" },
						],
					},
				},
				{
					title: "Describing Personality & Appearance",
					subtitle: "Rich vocabulary for talking about people",
					type: "vocabulary",
					content: {
						description:
							"Expand your vocabulary for describing people's character traits, physical appearance, and first impressions.",
						wordCount: 10,
						grammarCount: 0,
						exercises: ["practice", "quiz"],
						grammarPoints: [],
						wordsToLearn: [
							{ word: "outgoing", translation: "" },
							{ word: "stubborn", translation: "" },
							{ word: "generous", translation: "" },
							{ word: "ambitious", translation: "" },
							{ word: "reliable", translation: "" },
							{ word: "sensitive", translation: "" },
							{ word: "confident", translation: "" },
							{ word: "easygoing", translation: "" },
							{ word: "appearance", translation: "" },
							{ word: "impression", translation: "" },
						],
					},
				},
				{
					title: "Relative Clauses",
					subtitle: "Adding detail with who, which, that, where",
					type: "grammar",
					content: {
						description:
							"Use relative clauses to combine information and add detail to your sentences. Distinguish between defining and non-defining relative clauses.",
						wordCount: 6,
						grammarCount: 2,
						exercises: ["lecture", "practice", "quiz"],
						grammarPoints: [
							{
								title: "Defining relative clauses",
								description:
									"Essential information about the noun — no commas: 'The woman who lives next door is a doctor.'",
							},
							{
								title: "Non-defining relative clauses",
								description:
									"Extra information — use commas: 'My sister, who lives in London, is visiting next week.'",
							},
						],
						wordsToLearn: [
							{ word: "although", translation: "" },
							{ word: "despite", translation: "" },
							{ word: "whereas", translation: "" },
							{ word: "however", translation: "" },
							{ word: "moreover", translation: "" },
							{ word: "therefore", translation: "" },
						],
					},
				},
				{
					title: "Expressing Opinions",
					subtitle: "Agreeing, disagreeing, and giving reasons",
					type: "speaking",
					content: {
						description:
							"Learn phrases for expressing your opinion politely, agreeing and disagreeing, and supporting your ideas with reasons.",
						wordCount: 8,
						grammarCount: 1,
						exercises: ["lecture", "practice", "conversation"],
						grammarPoints: [
							{
								title: "Opinion phrases with 'that' clauses",
								description:
									"Use 'I think/believe/feel that...' to introduce opinions: 'I believe that education is important.'",
							},
						],
						wordsToLearn: [
							{ word: "in my opinion", translation: "" },
							{ word: "I tend to think", translation: "" },
							{ word: "absolutely", translation: "" },
							{ word: "I'm not sure about that", translation: "" },
							{ word: "on the other hand", translation: "" },
							{ word: "the point is", translation: "" },
							{ word: "obviously", translation: "" },
							{ word: "to be honest", translation: "" },
						],
					},
				},
				{
					title: "Review: Describing Your World",
					subtitle: "Practice everything from this unit",
					type: "practice",
					content: {
						description:
							"Review comparatives, superlatives, relative clauses, and opinion phrases through practical exercises and scenarios.",
						wordCount: 0,
						grammarCount: 0,
						exercises: ["practice", "quiz"],
						grammarPoints: [],
						wordsToLearn: [],
					},
				},
			],
		},
		{
			title: "Telling Stories",
			description:
				"Narrate past events, tell anecdotes, and talk about experiences",
			lessons: [
				{
					title: "Past Continuous & Past Simple",
					subtitle: "Setting the scene for stories",
					type: "grammar",
					content: {
						description:
							"Learn to combine past continuous and past simple to narrate events. Set the background scene and describe interruptions.",
						wordCount: 8,
						grammarCount: 2,
						exercises: ["lecture", "practice", "quiz"],
						grammarPoints: [
							{
								title: "Past Continuous for background actions",
								description:
									"Use 'was/were + -ing' for ongoing actions in the past: 'I was walking home when it started raining.'",
							},
							{
								title: "When & While in narratives",
								description:
									"'When' + past simple for sudden events; 'While' + past continuous for ongoing actions: 'While I was cooking, the phone rang.'",
							},
						],
						wordsToLearn: [
							{ word: "suddenly", translation: "" },
							{ word: "meanwhile", translation: "" },
							{ word: "eventually", translation: "" },
							{ word: "immediately", translation: "" },
							{ word: "at that moment", translation: "" },
							{ word: "fortunately", translation: "" },
							{ word: "unfortunately", translation: "" },
							{ word: "afterwards", translation: "" },
						],
					},
				},
				{
					title: "Narrative Vocabulary",
					subtitle: "Words for storytelling and sequencing",
					type: "vocabulary",
					content: {
						description:
							"Learn linking words and expressions that make your stories flow naturally and keep your listener engaged.",
						wordCount: 10,
						grammarCount: 0,
						exercises: ["practice", "quiz"],
						grammarPoints: [],
						wordsToLearn: [
							{ word: "first of all", translation: "" },
							{ word: "after that", translation: "" },
							{ word: "in the end", translation: "" },
							{ word: "as soon as", translation: "" },
							{ word: "by the time", translation: "" },
							{ word: "to make matters worse", translation: "" },
							{ word: "it turned out that", translation: "" },
							{ word: "apparently", translation: "" },
							{ word: "to cut a long story short", translation: "" },
							{ word: "the thing is", translation: "" },
						],
					},
				},
				{
					title: "Used to & Would",
					subtitle: "Talking about past habits and routines",
					type: "grammar",
					content: {
						description:
							"Describe past habits, routines, and states that are no longer true. Distinguish between 'used to' and 'would' for past habits.",
						wordCount: 6,
						grammarCount: 2,
						exercises: ["lecture", "practice", "quiz"],
						grammarPoints: [
							{
								title: "'Used to' for past states and habits",
								description:
									"Use 'used to + infinitive' for things true in the past but not now: 'I used to live in the countryside.'",
							},
							{
								title: "'Would' for repeated past actions",
								description:
									"Use 'would + infinitive' for habitual past actions (not states): 'Every summer we would go to the beach.'",
							},
						],
						wordsToLearn: [
							{ word: "childhood", translation: "" },
							{ word: "memory", translation: "" },
							{ word: "habit", translation: "" },
							{ word: "nostalgic", translation: "" },
							{ word: "recall", translation: "" },
							{ word: "fond of", translation: "" },
						],
					},
				},
				{
					title: "Telling an Anecdote",
					subtitle: "Structure and deliver a personal story",
					type: "speaking",
					content: {
						description:
							"Practice telling personal anecdotes using narrative tenses, sequencing words, and engaging expressions.",
						wordCount: 6,
						grammarCount: 1,
						exercises: ["lecture", "practice", "conversation"],
						grammarPoints: [
							{
								title: "Story structure",
								description:
									"Set the scene (past continuous) → describe events (past simple) → conclude with a reaction or lesson learned.",
							},
						],
						wordsToLearn: [
							{ word: "guess what", translation: "" },
							{ word: "you won't believe this", translation: "" },
							{ word: "it was hilarious", translation: "" },
							{ word: "I couldn't believe it", translation: "" },
							{ word: "the funniest thing was", translation: "" },
							{ word: "it reminded me of", translation: "" },
						],
					},
				},
			],
		},
		{
			title: "Conditions & Possibilities",
			description:
				"Talk about hypothetical situations, make predictions, and express conditions",
			lessons: [
				{
					title: "First Conditional",
					subtitle: "Real possibilities and likely outcomes",
					type: "grammar",
					content: {
						description:
							"Use the first conditional to talk about real and possible situations in the future. Connect conditions with results using 'if' and 'when'.",
						wordCount: 8,
						grammarCount: 2,
						exercises: ["lecture", "practice", "quiz"],
						grammarPoints: [
							{
								title: "First Conditional structure",
								description:
									"If + present simple, will + infinitive: 'If it rains tomorrow, I'll take an umbrella.'",
							},
							{
								title: "Unless, as long as, provided that",
								description:
									"Alternative conditional connectors: 'I'll come unless it rains' = 'I'll come if it doesn't rain.'",
							},
						],
						wordsToLearn: [
							{ word: "likely", translation: "" },
							{ word: "unlikely", translation: "" },
							{ word: "probably", translation: "" },
							{ word: "definitely", translation: "" },
							{ word: "unless", translation: "" },
							{ word: "otherwise", translation: "" },
							{ word: "in case", translation: "" },
							{ word: "as long as", translation: "" },
						],
					},
				},
				{
					title: "Second Conditional",
					subtitle: "Imaginary situations and dreams",
					type: "grammar",
					content: {
						description:
							"Use the second conditional to talk about unreal or imaginary situations in the present or future. Express wishes and hypothetical scenarios.",
						wordCount: 8,
						grammarCount: 2,
						exercises: ["lecture", "practice", "quiz"],
						grammarPoints: [
							{
								title: "Second Conditional structure",
								description:
									"If + past simple, would + infinitive: 'If I had more money, I would travel the world.'",
							},
							{
								title: "If I were you (giving advice)",
								description:
									"Use 'If I were you, I would...' to give advice: 'If I were you, I'd apply for that job.'",
							},
						],
						wordsToLearn: [
							{ word: "imagine", translation: "" },
							{ word: "suppose", translation: "" },
							{ word: "what if", translation: "" },
							{ word: "in that case", translation: "" },
							{ word: "opportunity", translation: "" },
							{ word: "decision", translation: "" },
							{ word: "advantage", translation: "" },
							{ word: "consequence", translation: "" },
						],
					},
				},
				{
					title: "Possibility & Certainty",
					subtitle: "Modal verbs: might, could, must, can't",
					type: "grammar",
					content: {
						description:
							"Express different degrees of certainty and possibility using modal verbs. Speculate about present situations and future events.",
						wordCount: 8,
						grammarCount: 2,
						exercises: ["lecture", "practice", "quiz"],
						grammarPoints: [
							{
								title: "Modals of possibility: might, may, could",
								description:
									"Use 'might/may/could + infinitive' for possible situations: 'She might be at home.' (= it's possible)",
							},
							{
								title: "Modals of certainty: must, can't",
								description:
									"Use 'must' for logical conclusions and 'can't' for impossibility: 'He must be tired.' / 'That can't be true.'",
							},
						],
						wordsToLearn: [
							{ word: "perhaps", translation: "" },
							{ word: "certainly", translation: "" },
							{ word: "possibly", translation: "" },
							{ word: "doubtful", translation: "" },
							{ word: "obvious", translation: "" },
							{ word: "assume", translation: "" },
							{ word: "apparently", translation: "" },
							{ word: "seemingly", translation: "" },
						],
					},
				},
				{
					title: "Making Decisions",
					subtitle: "Discuss options and weigh consequences",
					type: "speaking",
					content: {
						description:
							"Practice discussing decisions, weighing pros and cons, and expressing conditions in natural conversation.",
						wordCount: 8,
						grammarCount: 1,
						exercises: ["lecture", "practice", "conversation"],
						grammarPoints: [
							{
								title: "Weighing options with conditionals",
								description:
									"Combine conditionals with opinion phrases: 'If we choose option A, we might save time, but on the other hand...'",
							},
						],
						wordsToLearn: [
							{ word: "pros and cons", translation: "" },
							{ word: "trade-off", translation: "" },
							{ word: "compromise", translation: "" },
							{ word: "factor", translation: "" },
							{ word: "priority", translation: "" },
							{ word: "drawback", translation: "" },
							{ word: "benefit", translation: "" },
							{ word: "weigh up", translation: "" },
						],
					},
				},
			],
		},
		{
			title: "The Passive & Formal English",
			description:
				"Use passive voice, formal expressions, and explain processes",
			lessons: [
				{
					title: "Passive Voice",
					subtitle: "When the action matters more than who did it",
					type: "grammar",
					content: {
						description:
							"Learn to form and use the passive voice. Understand when the passive is preferred over the active voice in English.",
						wordCount: 8,
						grammarCount: 2,
						exercises: ["lecture", "practice", "quiz"],
						grammarPoints: [
							{
								title: "Forming the passive",
								description:
									"Subject + be + past participle: 'The report was written by the team.' / 'English is spoken worldwide.'",
							},
							{
								title: "When to use the passive",
								description:
									"Use passive when the doer is unknown, obvious, or unimportant: 'My car was stolen.' / 'The building was designed in 1920.'",
							},
						],
						wordsToLearn: [
							{ word: "manufacture", translation: "" },
							{ word: "establish", translation: "" },
							{ word: "construct", translation: "" },
							{ word: "discover", translation: "" },
							{ word: "investigate", translation: "" },
							{ word: "publish", translation: "" },
							{ word: "organize", translation: "" },
							{ word: "process", translation: "" },
						],
					},
				},
				{
					title: "Describing Processes",
					subtitle: "How things are made and how systems work",
					type: "vocabulary",
					content: {
						description:
							"Learn vocabulary for describing processes, manufacturing, and systems. Practice explaining step-by-step procedures.",
						wordCount: 10,
						grammarCount: 0,
						exercises: ["practice", "quiz"],
						grammarPoints: [],
						wordsToLearn: [
							{ word: "stage", translation: "" },
							{ word: "step", translation: "" },
							{ word: "method", translation: "" },
							{ word: "procedure", translation: "" },
							{ word: "ingredient", translation: "" },
							{ word: "equipment", translation: "" },
							{ word: "raw material", translation: "" },
							{ word: "final product", translation: "" },
							{ word: "assembly", translation: "" },
							{ word: "quality control", translation: "" },
						],
					},
				},
				{
					title: "Reported Speech",
					subtitle: "Telling others what someone said",
					type: "grammar",
					content: {
						description:
							"Learn to report what people said without quoting them directly. Master tense changes and pronoun shifts in reported speech.",
						wordCount: 8,
						grammarCount: 2,
						exercises: ["lecture", "practice", "quiz"],
						grammarPoints: [
							{
								title: "Tense backshift in reported speech",
								description:
									"Present → past, past → past perfect: He said 'I am tired' → He said he was tired.",
							},
							{
								title: "Reporting questions and requests",
								description:
									"Questions: She asked if/whether... Requests: He asked me to... / He told me to...",
							},
						],
						wordsToLearn: [
							{ word: "claim", translation: "" },
							{ word: "mention", translation: "" },
							{ word: "explain", translation: "" },
							{ word: "suggest", translation: "" },
							{ word: "deny", translation: "" },
							{ word: "admit", translation: "" },
							{ word: "insist", translation: "" },
							{ word: "warn", translation: "" },
						],
					},
				},
				{
					title: "Formal vs Informal Register",
					subtitle: "Adjusting your language to the situation",
					type: "speaking",
					content: {
						description:
							"Understand the difference between formal and informal English. Learn when and how to adjust your language register.",
						wordCount: 8,
						grammarCount: 1,
						exercises: ["lecture", "practice", "conversation"],
						grammarPoints: [
							{
								title: "Formal alternatives to common phrases",
								description:
									"Informal → Formal: 'get' → 'obtain/receive', 'ask for' → 'request', 'help' → 'assist', 'find out' → 'discover'.",
							},
						],
						wordsToLearn: [
							{ word: "request", translation: "" },
							{ word: "require", translation: "" },
							{ word: "inform", translation: "" },
							{ word: "assist", translation: "" },
							{ word: "obtain", translation: "" },
							{ word: "enquire", translation: "" },
							{ word: "regarding", translation: "" },
							{ word: "therefore", translation: "" },
						],
					},
				},
			],
		},
		{
			title: "Real-World English",
			description:
				"Apply your English skills to practical real-world scenarios",
			lessons: [
				{
					title: "At Work: Emails & Meetings",
					subtitle: "Professional communication essentials",
					type: "vocabulary",
					content: {
						description:
							"Learn key vocabulary and phrases for professional communication in meetings, emails, and workplace discussions.",
						wordCount: 10,
						grammarCount: 0,
						exercises: ["practice", "quiz"],
						grammarPoints: [],
						wordsToLearn: [
							{ word: "agenda", translation: "" },
							{ word: "deadline", translation: "" },
							{ word: "colleague", translation: "" },
							{ word: "feedback", translation: "" },
							{ word: "proposal", translation: "" },
							{ word: "update", translation: "" },
							{ word: "follow up", translation: "" },
							{ word: "in charge of", translation: "" },
							{ word: "report to", translation: "" },
							{ word: "take responsibility", translation: "" },
						],
					},
				},
				{
					title: "Health & Wellbeing",
					subtitle: "Vocabulary for health topics and the doctor",
					type: "vocabulary",
					content: {
						description:
							"Build vocabulary for describing symptoms, visiting the doctor, and discussing health and lifestyle topics.",
						wordCount: 10,
						grammarCount: 0,
						exercises: ["practice", "quiz"],
						grammarPoints: [],
						wordsToLearn: [
							{ word: "symptom", translation: "" },
							{ word: "prescription", translation: "" },
							{ word: "appointment", translation: "" },
							{ word: "treatment", translation: "" },
							{ word: "recover", translation: "" },
							{ word: "diet", translation: "" },
							{ word: "exercise", translation: "" },
							{ word: "stress", translation: "" },
							{ word: "insurance", translation: "" },
							{ word: "emergency", translation: "" },
						],
					},
				},
				{
					title: "Travel & Accommodation",
					subtitle: "Essential phrases for travelling abroad",
					type: "speaking",
					content: {
						description:
							"Practice real-world conversations for booking accommodation, navigating airports, and handling travel situations.",
						wordCount: 8,
						grammarCount: 1,
						exercises: ["lecture", "practice", "conversation"],
						grammarPoints: [
							{
								title: "Polite requests with 'would' and 'could'",
								description:
									"Use 'Would you mind...?', 'Could I possibly...?', 'I'd like to...' for polite requests in travel situations.",
							},
						],
						wordsToLearn: [
							{ word: "boarding pass", translation: "" },
							{ word: "check in", translation: "" },
							{ word: "departure", translation: "" },
							{ word: "accommodation", translation: "" },
							{ word: "reservation", translation: "" },
							{ word: "customs", translation: "" },
							{ word: "delay", translation: "" },
							{ word: "luggage", translation: "" },
						],
					},
				},
				{
					title: "News & Current Events",
					subtitle: "Understand and discuss news stories",
					type: "reading",
					content: {
						description:
							"Develop skills for understanding news articles and discussing current events with confidence.",
						wordCount: 8,
						grammarCount: 1,
						exercises: ["lecture", "practice", "quiz"],
						grammarPoints: [
							{
								title: "Headlines and news language",
								description:
									"News headlines drop articles and use present simple for past events: 'PM visits hospital' = 'The Prime Minister visited a hospital.'",
							},
						],
						wordsToLearn: [
							{ word: "headline", translation: "" },
							{ word: "source", translation: "" },
							{ word: "report", translation: "" },
							{ word: "according to", translation: "" },
							{ word: "significant", translation: "" },
							{ word: "impact", translation: "" },
							{ word: "issue", translation: "" },
							{ word: "debate", translation: "" },
						],
					},
				},
				{
					title: "B1 Checkpoint",
					subtitle: "Review everything you've learned",
					type: "practice",
					content: {
						description:
							"Final review covering all major grammar and vocabulary from the B1 curriculum. Test your knowledge across all units.",
						wordCount: 0,
						grammarCount: 0,
						exercises: ["practice", "quiz"],
						grammarPoints: [],
						wordsToLearn: [],
					},
				},
			],
		},
	],
};
