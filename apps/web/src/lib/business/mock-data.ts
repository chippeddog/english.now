export const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
export type CefrLevel = (typeof CEFR_LEVELS)[number];

export type MemberStatus = "active" | "invited" | "deactivated";
export type MemberRole = "learner" | "admin";
export type SessionKind =
	| "conversation"
	| "pronunciation"
	| "vocabulary"
	| "grammar";

export type TeamId = "sales" | "support" | "engineering" | "operations";

export type Team = {
	id: TeamId;
	name: string;
};

export type Workspace = {
	id: string;
	name: string;
	initials: string;
	domain: string;
	plan: "Pilot" | "Business" | "Enterprise";
	seatsTotal: number;
};

export type MemberSession = {
	id: string;
	kind: SessionKind;
	title: string;
	minutes: number;
	daysAgo: number;
	score: number | null;
};

export type Member = {
	id: string;
	name: string;
	email: string;
	title: string;
	teamId: TeamId;
	role: MemberRole;
	status: MemberStatus;
	level: CefrLevel | null;
	startLevel: CefrLevel | null;
	targetLevel: CefrLevel;
	minutesThisWeek: number;
	streakDays: number;
	joinedDaysAgo: number;
	lastActiveDaysAgo: number | null;
	weeklyMinutes: number[];
	recentSessions: MemberSession[];
};

export type DailyActivity = {
	daysAgo: number;
	minutes: number;
	activeLearners: number;
};

export type OverviewRange = "7d" | "30d" | "90d";

export type OverviewStats = {
	seatsUsed: number;
	seatsTotal: number;
	activeLearners: number;
	activeLearnersDelta: number;
	practiceMinutes: number;
	practiceMinutesDelta: number;
	averageLevelGain: number;
};

export const OVERVIEW_RANGES: ReadonlyArray<{
	value: OverviewRange;
	label: string;
	days: number;
}> = [
	{ value: "7d", label: "7 days", days: 7 },
	{ value: "30d", label: "30 days", days: 30 },
	{ value: "90d", label: "90 days", days: 90 },
];

export const WORKSPACES: readonly Workspace[] = [
	{
		id: "acme",
		name: "Acme Inc.",
		initials: "AC",
		domain: "acme.com",
		plan: "Business",
		seatsTotal: 20,
	},
	{
		id: "globex",
		name: "Globex Support",
		initials: "GS",
		domain: "globex.io",
		plan: "Pilot",
		seatsTotal: 10,
	},
];

export const CURRENT_WORKSPACE = WORKSPACES[0];

export const TEAMS: readonly Team[] = [
	{ id: "sales", name: "Sales" },
	{ id: "support", name: "Support" },
	{ id: "engineering", name: "Engineering" },
	{ id: "operations", name: "Operations" },
];

export const SESSION_KIND_META: Record<
	SessionKind,
	{ label: string; tint: string }
> = {
	conversation: { label: "Conversation", tint: "#C5E0FF" },
	pronunciation: { label: "Pronunciation", tint: "#FFD0B5" },
	vocabulary: { label: "Vocabulary", tint: "#FFE3A3" },
	grammar: { label: "Grammar", tint: "#E3D4FF" },
};

const SESSION_TITLES: Record<SessionKind, readonly string[]> = {
	conversation: [
		"Discovery call with a new lead",
		"Handling an angry customer",
		"Daily stand-up update",
		"Negotiating a renewal",
		"Small talk before a meeting",
	],
	pronunciation: [
		"TH sounds in business words",
		"Sentence stress in questions",
		"Linking words naturally",
		"Vowel length: ship vs sheep",
	],
	vocabulary: [
		"Customer support phrases",
		"Sales objections",
		"Project updates",
		"Polite requests",
	],
	grammar: [
		"Present perfect for updates",
		"Conditionals in negotiations",
		"Modal verbs for politeness",
	],
};

function createRandom(seed: number) {
	let state = seed;
	return () => {
		state = (state + 0x6d2b79f5) | 0;
		let t = Math.imul(state ^ (state >>> 15), 1 | state);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

type MemberSeed = {
	name: string;
	title: string;
	teamId: TeamId;
	role?: MemberRole;
	status?: MemberStatus;
	startLevel: CefrLevel;
	level: CefrLevel;
	targetLevel: CefrLevel;
	activity: number;
	joinedDaysAgo: number;
};

const MEMBER_SEEDS: readonly MemberSeed[] = [
	{
		name: "Olena Kovalenko",
		title: "Head of People",
		teamId: "operations",
		role: "admin",
		startLevel: "B2",
		level: "C1",
		targetLevel: "C1",
		activity: 0.7,
		joinedDaysAgo: 94,
	},
	{
		name: "Marco Rossi",
		title: "Account Executive",
		teamId: "sales",
		startLevel: "B1",
		level: "B2",
		targetLevel: "C1",
		activity: 1,
		joinedDaysAgo: 88,
	},
	{
		name: "Aiko Tanaka",
		title: "Support Specialist",
		teamId: "support",
		startLevel: "A2",
		level: "B1",
		targetLevel: "B2",
		activity: 0.95,
		joinedDaysAgo: 81,
	},
	{
		name: "Lucas Silva",
		title: "Backend Engineer",
		teamId: "engineering",
		startLevel: "B1",
		level: "B1",
		targetLevel: "B2",
		activity: 0.45,
		joinedDaysAgo: 77,
	},
	{
		name: "Fatima Zahra",
		title: "Customer Success Manager",
		teamId: "support",
		startLevel: "B2",
		level: "B2",
		targetLevel: "C1",
		activity: 0.8,
		joinedDaysAgo: 70,
	},
	{
		name: "Jonas Becker",
		title: "Sales Development Rep",
		teamId: "sales",
		startLevel: "A2",
		level: "B1",
		targetLevel: "B2",
		activity: 0.85,
		joinedDaysAgo: 66,
	},
	{
		name: "Priya Sharma",
		title: "Product Designer",
		teamId: "engineering",
		startLevel: "B2",
		level: "C1",
		targetLevel: "C2",
		activity: 0.6,
		joinedDaysAgo: 61,
	},
	{
		name: "Diego Hernández",
		title: "Support Team Lead",
		teamId: "support",
		startLevel: "B1",
		level: "B2",
		targetLevel: "B2",
		activity: 0.9,
		joinedDaysAgo: 58,
	},
	{
		name: "Anna Nowak",
		title: "Operations Analyst",
		teamId: "operations",
		startLevel: "A2",
		level: "A2",
		targetLevel: "B1",
		activity: 0.3,
		joinedDaysAgo: 45,
	},
	{
		name: "Mehmet Yilmaz",
		title: "Frontend Engineer",
		teamId: "engineering",
		startLevel: "A1",
		level: "A2",
		targetLevel: "B1",
		activity: 0.55,
		joinedDaysAgo: 40,
	},
	{
		name: "Sofia Petrova",
		title: "Account Manager",
		teamId: "sales",
		startLevel: "B2",
		level: "B2",
		targetLevel: "C1",
		activity: 0.75,
		joinedDaysAgo: 32,
	},
	{
		name: "Wei Chen",
		title: "QA Engineer",
		teamId: "engineering",
		status: "deactivated",
		startLevel: "B1",
		level: "B1",
		targetLevel: "B2",
		activity: 0,
		joinedDaysAgo: 85,
	},
	{
		name: "Camille Dubois",
		title: "Support Specialist",
		teamId: "support",
		status: "invited",
		startLevel: "B1",
		level: "B1",
		targetLevel: "B2",
		activity: 0,
		joinedDaysAgo: 3,
	},
	{
		name: "Ahmed Hassan",
		title: "Sales Engineer",
		teamId: "sales",
		status: "invited",
		startLevel: "B2",
		level: "B2",
		targetLevel: "C1",
		activity: 0,
		joinedDaysAgo: 2,
	},
	{
		name: "Nina Larsen",
		title: "Logistics Coordinator",
		teamId: "operations",
		status: "invited",
		startLevel: "A2",
		level: "A2",
		targetLevel: "B1",
		activity: 0,
		joinedDaysAgo: 1,
	},
	{
		name: "Tomás García",
		title: "Support Specialist",
		teamId: "support",
		startLevel: "A2",
		level: "B1",
		targetLevel: "B2",
		activity: 0.65,
		joinedDaysAgo: 21,
	},
];

function toEmail(name: string, domain: string) {
	return `${name
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.replace(/[^a-z]+/g, ".")}@${domain}`;
}

function buildMember(seed: MemberSeed, index: number): Member {
	const random = createRandom(index + 1);
	const status = seed.status ?? "active";
	const isActive = status === "active";
	const kinds = Object.keys(SESSION_KIND_META) as SessionKind[];

	const weeklyMinutes = Array.from({ length: 8 }, () =>
		isActive ? Math.round((40 + random() * 110) * seed.activity) : 0,
	);

	const recentSessions: MemberSession[] = isActive
		? Array.from({ length: 5 }, (_, sessionIndex) => {
				const kind = kinds[Math.floor(random() * kinds.length)];
				const titles = SESSION_TITLES[kind];
				return {
					id: `${index}-${sessionIndex}`,
					kind,
					title: titles[Math.floor(random() * titles.length)],
					minutes: Math.round(5 + random() * 20),
					daysAgo: sessionIndex + Math.floor(random() * 2),
					score: kind === "vocabulary" ? null : Math.round(62 + random() * 36),
				};
			})
		: [];

	return {
		id: `member-${index + 1}`,
		name: seed.name,
		email: toEmail(seed.name, CURRENT_WORKSPACE.domain),
		title: seed.title,
		teamId: seed.teamId,
		role: seed.role ?? "learner",
		status,
		level: status === "invited" ? null : seed.level,
		startLevel: status === "invited" ? null : seed.startLevel,
		targetLevel: seed.targetLevel,
		minutesThisWeek: weeklyMinutes[weeklyMinutes.length - 1] ?? 0,
		streakDays: isActive ? Math.round(seed.activity * 24 * random()) : 0,
		joinedDaysAgo: seed.joinedDaysAgo,
		lastActiveDaysAgo: isActive
			? Math.floor((1 - seed.activity) * 6)
			: status === "deactivated"
				? 34
				: null,
		weeklyMinutes,
		recentSessions,
	};
}

export const MEMBERS: readonly Member[] = MEMBER_SEEDS.map(buildMember);

export const DAILY_ACTIVITY: readonly DailyActivity[] = (() => {
	const random = createRandom(2026);
	return Array.from({ length: 90 }, (_, index) => {
		const daysAgo = 89 - index;
		const growth = 0.55 + (index / 90) * 0.6;
		const weekday = (index + 3) % 7;
		const weekendDip = weekday >= 5 ? 0.45 : 1;
		const minutes = Math.round((90 + random() * 80) * growth * weekendDip);
		const activeLearners = Math.max(
			2,
			Math.round((6 + random() * 5) * growth * weekendDip),
		);
		return { daysAgo, minutes, activeLearners };
	});
})();

function levelIndex(level: CefrLevel | null) {
	return level ? CEFR_LEVELS.indexOf(level) : -1;
}

export function getRangeDays(range: OverviewRange) {
	return OVERVIEW_RANGES.find((item) => item.value === range)?.days ?? 30;
}

export function getActivityForRange(range: OverviewRange) {
	return DAILY_ACTIVITY.slice(-getRangeDays(range));
}

export function getOverviewStats(range: OverviewRange): OverviewStats {
	const days = getRangeDays(range);
	const current = DAILY_ACTIVITY.slice(-days);
	const previous = DAILY_ACTIVITY.slice(-days * 2, -days);
	const sum = (items: readonly DailyActivity[]) =>
		items.reduce((total, item) => total + item.minutes, 0);
	const peak = (items: readonly DailyActivity[]) =>
		items.reduce((max, item) => Math.max(max, item.activeLearners), 0);

	const practiceMinutes = sum(current);
	const previousMinutes = sum(previous);
	const leveled = MEMBERS.filter((member) => member.status !== "invited");
	const gain =
		leveled.reduce(
			(total, member) =>
				total + (levelIndex(member.level) - levelIndex(member.startLevel)),
			0,
		) / Math.max(1, leveled.length);

	return {
		seatsUsed: MEMBERS.filter((member) => member.status !== "deactivated")
			.length,
		seatsTotal: CURRENT_WORKSPACE.seatsTotal,
		activeLearners: peak(current),
		activeLearnersDelta: previous.length ? peak(current) - peak(previous) : 0,
		practiceMinutes,
		practiceMinutesDelta: previousMinutes
			? Math.round(
					((practiceMinutes - previousMinutes) / previousMinutes) * 100,
				)
			: 0,
		averageLevelGain: Math.round(gain * 10) / 10,
	};
}

export function getLevelDistribution() {
	const counts = new Map<CefrLevel, number>();
	for (const member of MEMBERS) {
		if (member.status !== "active" || !member.level) continue;
		counts.set(member.level, (counts.get(member.level) ?? 0) + 1);
	}
	return CEFR_LEVELS.map((level) => ({ level, count: counts.get(level) ?? 0 }));
}

export function getTopLearners(limit = 5) {
	return [...MEMBERS]
		.filter((member) => member.status === "active")
		.sort((a, b) => b.minutesThisWeek - a.minutesThisWeek)
		.slice(0, limit);
}

export function getTeamName(teamId: TeamId) {
	return TEAMS.find((team) => team.id === teamId)?.name ?? teamId;
}

export function formatDaysAgo(daysAgo: number | null) {
	if (daysAgo === null) return "Never";
	if (daysAgo === 0) return "Today";
	if (daysAgo === 1) return "Yesterday";
	if (daysAgo < 7) return `${daysAgo} days ago`;
	const weeks = Math.floor(daysAgo / 7);
	if (weeks < 5) return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
	const months = Math.floor(daysAgo / 30);
	return months <= 1 ? "1 month ago" : `${months} months ago`;
}

export function compareLevels(a: CefrLevel | null, b: CefrLevel | null) {
	return levelIndex(a) - levelIndex(b);
}
