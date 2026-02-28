import type { CefrLevel } from "@english.now/db";

function profileLevelToCefr(level: string | null | undefined): CefrLevel {
	switch (level) {
		case "beginner":
			return "A1";
		case "elementary":
			return "A2";
		case "intermediate":
			return "B1";
		case "upper-intermediate":
			return "B2";
		case "advanced":
			return "C1";
		default:
			return "A1";
	}
}

interface CefrPronunciationConfig {
	wordRange: [number, number];
	styles: string[];
	topics: string[];
	genres: string[];
}

const CEFR_PRONUACIATION_CONFIG: Record<CefrLevel, CefrPronunciationConfig> = {
	A1: {
		wordRange: [60, 80],
		styles: [
			"Simple present tense, basic vocabulary (top 1000 words). Short declarative sentences. Clear pronunciation patterns.",
			"Basic past tense narration. Everyday words with simple linking (and, then, so). Repetitive rhythm for practice.",
			"Short dialogue-style sentences. Question-and-answer pairs. Common greetings and polite expressions.",
		],
		topics: [
			"A morning routine that goes hilariously wrong",
			"Describing your favourite meal and how to make it",
			"A visit to a colourful outdoor market",
			"Meeting a new neighbour and showing them around",
			"A child explaining their pet to a friend",
			"Packing a suitcase for a short holiday",
			"A rainy day spent indoors with family",
			"Ordering food at a quirky little café",
			"Getting lost on the way to school",
			"A birthday party with unexpected guests",
			"Describing what you see from your window",
			"A first day at a new job",
		],
		genres: [
			"a short personal story",
			"a simple diary entry",
			"a friendly letter or postcard",
			"a how-to explanation",
			"a description of a place",
		],
	},
	A2: {
		wordRange: [80, 100],
		styles: [
			"Simple narrative with past tense. Descriptive adjectives. Compound sentences with 'and', 'but', 'because'. Natural rhythm.",
			"Conversational tone. Mixed present and past tenses. Sequencing words (first, next, finally). Everyday collocations.",
			"Descriptive writing with sensory details. Comparisons (bigger, more interesting). Simple relative clauses (who, which).",
		],
		topics: [
			"An unexpected adventure during a weekend trip",
			"The story behind a treasured family photo",
			"Comparing two cities you have visited",
			"A funny misunderstanding while travelling abroad",
			"How a hobby changed someone's daily life",
			"Preparing for and surviving a job interview",
			"Describing a local festival or celebration",
			"A memorable encounter with a stranger",
			"The best and worst things about your neighbourhood",
			"Learning to cook a dish from another culture",
			"A day spent volunteering at an animal shelter",
			"Moving to a new house and settling in",
		],
		genres: [
			"a short travel blog post",
			"a mini-memoir or anecdote",
			"a comparison piece",
			"a review of a place or experience",
			"a 'day in the life' narrative",
		],
	},
	B1: {
		wordRange: [100, 130],
		styles: [
			"News article style. Relative clauses and conditionals. Mixed tenses including present perfect. Varied stress patterns.",
			"Opinion piece with supporting examples. Linking words (however, moreover, although). Formal-informal register mix.",
			"Informational tone. Passive voice for facts. Cause-and-effect structures. Technical terms explained simply.",
		],
		topics: [
			"How a small town is reinventing itself through technology",
			"The surprising psychology behind why we procrastinate",
			"Urban gardening and its impact on city communities",
			"The rise of remote work and what it means for social life",
			"A breakthrough in renewable energy that could change everything",
			"Why learning a musical instrument rewires the brain",
			"The hidden environmental cost of fast fashion",
			"How street art transforms neglected neighbourhoods",
			"The science of sleep and why teens need more of it",
			"A profile of an inventor who started in a garage",
			"Digital detox: what happens when you unplug for a week",
			"The cultural history behind a popular sport",
		],
		genres: [
			"a magazine feature article",
			"a short opinion column",
			"an explainer or FAQ-style piece",
			"a human-interest news story",
			"a podcast-style monologue transcript",
		],
	},
	B2: {
		wordRange: [120, 150],
		styles: [
			"Academic register. Passive voice, complex subordination, reported speech. Sophisticated vocabulary with idioms. Nuanced prosody.",
			"Analytical essay style. Hedging language (tends to, it appears that). Contrast and concession (nevertheless, despite). Abstract reasoning.",
			"Professional/journalistic style. Direct and indirect quotation. Data interpretation. Formal transitions and paragraph cohesion.",
		],
		topics: [
			"The ethical dilemma of AI-generated art",
			"How bilingualism reshapes cognitive abilities across a lifetime",
			"The economics of space tourism and its feasibility",
			"Redefining success: why GDP is an outdated measure",
			"The neuroscience behind decision fatigue",
			"Corporate whistleblowers: heroes or traitors?",
			"How architecture influences human behaviour and well-being",
			"The paradox of choice in the age of streaming services",
			"Water scarcity and geopolitical conflict in the 21st century",
			"The evolution of privacy in a data-driven society",
			"Why some scientific myths persist despite evidence",
			"The role of humour in cross-cultural communication",
		],
		genres: [
			"an analytical essay excerpt",
			"a TED-talk-style monologue",
			"an editorial or op-ed",
			"a case study summary",
			"a debate argument for one side of an issue",
		],
	},
	C1: {
		wordRange: [150, 200],
		styles: [
			"Literary style. Nested clauses, coordinate structures. Rich vocabulary with idioms and figurative language. Sophisticated prosody.",
			"Philosophical/reflective essay. Abstract reasoning, rhetorical questions. Formal and elevated register. Complex sentence variety.",
			"Long-form journalism. Vivid scene-setting, varied rhythm. Mixed registers for effect. Allusion and metaphor.",
		],
		topics: [
			"The tension between individual freedom and collective responsibility",
			"How language extinction mirrors biodiversity loss",
			"The illusion of objectivity in historical narratives",
			"Solitude as a creative force: lessons from artists and thinkers",
			"The philosophy of time: why we perceive it so differently",
			"Algorithmic curation and the narrowing of human curiosity",
			"What ancient stoicism can teach a hyper-connected generation",
			"The aesthetics of decay: finding beauty in abandoned places",
			"Memory, identity, and the stories we tell ourselves",
			"The moral weight of consumer choices in a globalised economy",
			"How satire has shaped political discourse through the centuries",
			"The boundary between authenticity and performance in social media",
		],
		genres: [
			"a literary essay or personal reflection",
			"a philosophical argument",
			"a long-form journalism excerpt",
			"a keynote speech transcript",
			"a critical review of a book or film",
		],
	},
};

function pickRandom<T>(arr: T[]): T {
	return arr[Math.floor(Math.random() * arr.length)] as T;
}

export { profileLevelToCefr, CEFR_PRONUACIATION_CONFIG, pickRandom };
