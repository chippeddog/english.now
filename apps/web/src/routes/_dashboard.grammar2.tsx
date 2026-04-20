import { createFileRoute } from "@tanstack/react-router";

import {
	addEdge,
	Background,
	Controls,
	type Edge,
	MarkerType,
	type Node,
	type OnConnect,
	ReactFlow,
	ReactFlowProvider,
	useEdgesState,
	useNodesState,
	useReactFlow,
} from "@xyflow/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import "@xyflow/react/dist/style.css";
import {
	AlertCircle,
	Bookmark,
	BookOpen,
	CheckCircle2,
	Clock,
	Compass,
	Dumbbell,
	Globe,
	GraduationCap,
	LayoutGrid,
	List as ListIcon,
	Map as MapIcon,
	Play,
	Send,
	Sparkles,
	Timer,
	X,
	Zap,
} from "lucide-react";
import {
	CEFR_COLORS,
	GrammarNode,
	type GrammarNodeData,
	MASTERY_COLORS,
	type MasteryLevel,
} from "../components/grammar/grammar-node";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "../components/ui/accordion";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Progress } from "../components/ui/progress";
import { Switch } from "../components/ui/switch";
import { cn } from "../lib/utils";

// --- Types & Data ---

type GrammarLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

interface GrammarTopic {
	id: string;
	title: string;
	level: GrammarLevel;
	category: string;
	shortDescription: string;
	// Simple vs detailed explanations
	explanation: string;
	detailedExplanation: string;
	nativeExplanation: string;
	detailedNativeExplanation: string;
	usage: string[];
	usageNative: string[];
	mistakes: {
		mistake: string;
		correction: string;
		explanation: string;
		explanationNative: string;
	}[];
	examples: string[];
	examplesNative: string[];
	quiz: { q: string; options: string[]; a: number }[];
	// New fields
	estimatedMinutes: number;
	topicType: "core" | "advanced" | "optional";
	prerequisites: string[];
	// Graph props
	position: { x: number; y: number };
	type?: string;
	connections: string[];
}

// Mock user mastery data (will come from DB later)
const USER_MASTERY: Record<string, MasteryLevel> = {
	root: "mastered",
	"to-be": "mastered",
	pronouns: "learning",
	"present-simple": "learning",
	"present-continuous": "not_started",
};

const USER_BOOKMARKS = new Set(["present-simple"]);

const GRAMMAR_TOPICS: GrammarTopic[] = [
	{
		id: "root",
		title: "English Grammar",
		level: "A1",
		category: "General",
		shortDescription: "The foundation of the language",
		explanation:
			"Start your journey here. This is your gateway to mastering English grammar.",
		detailedExplanation:
			"English grammar forms the structural foundation of the language. Understanding grammar helps you communicate clearly and effectively. This learning path will take you from basic concepts to advanced structures, building your skills step by step.",
		nativeExplanation:
			"Comienza tu viaje aquí. Esta es tu puerta de entrada para dominar la gramática inglesa.",
		detailedNativeExplanation:
			"La gramática inglesa forma la base estructural del idioma. Comprender la gramática te ayuda a comunicarte de manera clara y efectiva.",
		usage: [],
		usageNative: [],
		mistakes: [],
		examples: [],
		examplesNative: [],
		quiz: [],
		estimatedMinutes: 2,
		topicType: "core",
		prerequisites: [],
		position: { x: 300, y: 0 },
		type: "input",
		connections: ["to-be", "present-simple", "pronouns"],
	},
	{
		id: "to-be",
		title: "Verb 'To Be'",
		level: "A1",
		category: "Verbs",
		shortDescription: "Am, Is, Are",
		explanation:
			"The verb 'to be' is the most important verb in English. It describes who we are, how we feel, and where we are.",
		detailedExplanation:
			"The verb 'to be' is the most fundamental and frequently used verb in English. It serves multiple purposes: describing identity (I am a student), states and feelings (She is happy), locations (They are at home), and it's essential for forming continuous tenses. The conjugation changes based on the subject: I am, you/we/they are, he/she/it is.",
		nativeExplanation:
			"El verbo 'to be' es el más importante en inglés. Se usa para describir quiénes somos, cómo nos sentimos y dónde estamos.",
		detailedNativeExplanation:
			"El verbo 'to be' es el verbo más fundamental y frecuentemente usado en inglés. Sirve para múltiples propósitos: describir identidad, estados y sentimientos, ubicaciones, y es esencial para formar tiempos continuos.",
		usage: [
			"To give personal information (name, age, origin)",
			"To describe feelings and states",
			"To describe location",
			"To form continuous tenses",
		],
		usageNative: [
			"Para dar información personal (nombre, edad, origen)",
			"Para describir sentimientos y estados",
			"Para describir ubicación",
			"Para formar tiempos continuos",
		],
		mistakes: [
			{
				mistake: "I is happy",
				correction: "I am happy",
				explanation: "Always use 'am' with 'I'.",
				explanationNative: "Siempre usa 'am' con 'I'.",
			},
			{
				mistake: "He are student",
				correction: "He is a student",
				explanation:
					"Use 'is' for singular (he/she/it) and don't forget articles.",
				explanationNative:
					"Usa 'is' para singular (he/she/it) y no olvides los artículos.",
			},
			{
				mistake: "They is here",
				correction: "They are here",
				explanation: "Use 'are' for plural subjects (they, we, you).",
				explanationNative: "Usa 'are' para sujetos plurales (they, we, you).",
			},
		],
		examples: [
			"I am a teacher.",
			"She is happy.",
			"They are at home.",
			"We are friends.",
			"It is cold today.",
		],
		examplesNative: [
			"Soy profesor.",
			"Ella está feliz.",
			"Ellos están en casa.",
			"Somos amigos.",
			"Hace frío hoy.",
		],
		quiz: [
			{ q: "She ___ my sister.", options: ["am", "is", "are"], a: 1 },
			{ q: "They ___ from Spain.", options: ["am", "is", "are"], a: 2 },
			{ q: "I ___ a student.", options: ["am", "is", "are"], a: 0 },
			{ q: "The cat ___ on the table.", options: ["am", "is", "are"], a: 1 },
			{ q: "We ___ happy today.", options: ["am", "is", "are"], a: 2 },
		],
		estimatedMinutes: 7,
		topicType: "core",
		prerequisites: ["root"],
		position: { x: 100, y: 150 },
		connections: ["present-continuous"],
	},
	{
		id: "present-simple",
		title: "Present Simple",
		level: "A1",
		category: "Tenses",
		shortDescription: "Habits and Facts",
		explanation:
			"The Present Simple is used for habits, general truths, and fixed arrangements.",
		detailedExplanation:
			"The Present Simple tense describes habitual actions, general truths, scientific facts, and scheduled events. For third person singular (he/she/it), add -s or -es to the verb. Questions use 'do/does' + base verb. Negatives use 'don't/doesn't' + base verb. Time expressions: always, usually, often, sometimes, never, every day/week/month.",
		nativeExplanation:
			"El Presente Simple se usa para hábitos, verdades generales y arreglos fijos.",
		detailedNativeExplanation:
			"El Presente Simple describe acciones habituales, verdades generales, hechos científicos y eventos programados. Para tercera persona singular, añade -s o -es al verbo.",
		usage: [
			"Habits and routines",
			"General truths and facts",
			"Fixed schedules (trains, flights)",
			"Instructions and directions",
		],
		usageNative: [
			"Hábitos y rutinas",
			"Verdades generales y hechos",
			"Horarios fijos (trenes, vuelos)",
			"Instrucciones y direcciones",
		],
		mistakes: [
			{
				mistake: "He work here",
				correction: "He works here",
				explanation:
					"Don't forget the 's' for he/she/it in affirmative sentences.",
				explanationNative:
					"No olvides la 's' para he/she/it en oraciones afirmativas.",
			},
			{
				mistake: "Does she plays?",
				correction: "Does she play?",
				explanation: "When using 'Does', the main verb goes back to base form.",
				explanationNative:
					"Cuando usas 'Does', el verbo principal vuelve a su forma base.",
			},
			{
				mistake: "I doesn't like coffee",
				correction: "I don't like coffee",
				explanation:
					"Use 'don't' with I/you/we/they, 'doesn't' with he/she/it.",
				explanationNative:
					"Usa 'don't' con I/you/we/they, 'doesn't' con he/she/it.",
			},
		],
		examples: [
			"I walk to school every day.",
			"The sun rises in the east.",
			"The train leaves at 8 PM.",
			"She speaks three languages.",
			"Water boils at 100°C.",
		],
		examplesNative: [
			"Camino a la escuela todos los días.",
			"El sol sale por el este.",
			"El tren sale a las 8 PM.",
			"Ella habla tres idiomas.",
			"El agua hierve a 100°C.",
		],
		quiz: [
			{
				q: "She ___ coffee every morning.",
				options: ["drink", "drinks", "drinking"],
				a: 1,
			},
			{ q: "___ you play tennis?", options: ["Do", "Does", "Is"], a: 0 },
			{ q: "He ___ to work by bus.", options: ["go", "goes", "going"], a: 1 },
			{
				q: "They ___ live in London.",
				options: ["don't", "doesn't", "isn't"],
				a: 0,
			},
			{
				q: "The shop ___ at 9 AM.",
				options: ["open", "opens", "opening"],
				a: 1,
			},
		],
		estimatedMinutes: 10,
		topicType: "core",
		prerequisites: ["root"],
		position: { x: 300, y: 150 },
		connections: ["present-continuous"],
	},
	{
		id: "pronouns",
		title: "Subject Pronouns",
		level: "A1",
		category: "Nouns & Pronouns",
		shortDescription: "I, You, He, She...",
		explanation:
			"Subject pronouns replace the name of the person or thing doing the action.",
		detailedExplanation:
			"Subject pronouns are words that replace nouns as the subject of a sentence. They help avoid repetition and make sentences flow better. The subject pronouns are: I (first person singular), you (second person), he/she/it (third person singular), we (first person plural), they (third person plural). Subject pronouns always come before the verb.",
		nativeExplanation:
			"Los pronombres de sujeto reemplazan el nombre de la persona o cosa que realiza la acción.",
		detailedNativeExplanation:
			"Los pronombres de sujeto son palabras que reemplazan sustantivos como sujeto de una oración. Ayudan a evitar repetición y hacen que las oraciones fluyan mejor.",
		usage: [
			"To replace names to avoid repetition",
			"Always placed before the verb",
			"To refer to people, animals, or things",
		],
		usageNative: [
			"Para reemplazar nombres y evitar repetición",
			"Siempre colocados antes del verbo",
			"Para referirse a personas, animales o cosas",
		],
		mistakes: [
			{
				mistake: "Me like pizza",
				correction: "I like pizza",
				explanation: "Use 'I' as the subject, 'me' is an object pronoun.",
				explanationNative:
					"Usa 'I' como sujeto, 'me' es un pronombre de objeto.",
			},
			{
				mistake: "Him is tall",
				correction: "He is tall",
				explanation: "'Him' is object form. Use 'He' for subject position.",
				explanationNative:
					"'Him' es forma de objeto. Usa 'He' para posición de sujeto.",
			},
		],
		examples: [
			"He is tall.",
			"We are friends.",
			"It is raining.",
			"She loves music.",
			"They work together.",
		],
		examplesNative: [
			"Él es alto.",
			"Somos amigos.",
			"Está lloviendo.",
			"A ella le encanta la música.",
			"Ellos trabajan juntos.",
		],
		quiz: [
			{ q: "___ is my brother.", options: ["He", "Him", "His"], a: 0 },
			{ q: "___ are students.", options: ["Them", "They", "Their"], a: 1 },
			{ q: "___ love chocolate.", options: ["Me", "I", "My"], a: 1 },
			{ q: "___ is a beautiful city.", options: ["It", "Its", "It's"], a: 0 },
			{ q: "___ are going to the park.", options: ["Us", "We", "Our"], a: 1 },
		],
		estimatedMinutes: 5,
		topicType: "core",
		prerequisites: ["root"],
		position: { x: 500, y: 150 },
		connections: ["present-continuous"],
	},
	{
		id: "present-continuous",
		title: "Present Continuous",
		level: "A2",
		category: "Tenses",
		shortDescription: "Now and Future plans",
		explanation:
			"Used for actions happening right now or around now, and for future arrangements.",
		detailedExplanation:
			"The Present Continuous (also called Present Progressive) describes actions happening at the moment of speaking, temporary situations, changing/developing situations, and future arrangements. Form: subject + am/is/are + verb-ing. Some verbs (stative verbs like know, believe, like, love) are not normally used in continuous form.",
		nativeExplanation:
			"Se usa para acciones que ocurren justo ahora o alrededor de ahora, y para planes futuros.",
		detailedNativeExplanation:
			"El Presente Continuo describe acciones que suceden en el momento de hablar, situaciones temporales, situaciones cambiantes y planes futuros. Forma: sujeto + am/is/are + verbo-ing.",
		usage: [
			"Actions happening now",
			"Temporary situations",
			"Future arrangements",
			"Changing situations",
		],
		usageNative: [
			"Acciones que suceden ahora",
			"Situaciones temporales",
			"Planes futuros",
			"Situaciones cambiantes",
		],
		mistakes: [
			{
				mistake: "I am knowing him",
				correction: "I know him",
				explanation:
					"Stative verbs (know, like, believe) aren't used in continuous forms.",
				explanationNative:
					"Los verbos de estado (know, like, believe) no se usan en formas continuas.",
			},
			{
				mistake: "She working now",
				correction: "She is working now",
				explanation:
					"Don't forget the auxiliary verb 'is/am/are' before the -ing form.",
				explanationNative:
					"No olvides el verbo auxiliar 'is/am/are' antes de la forma -ing.",
			},
		],
		examples: [
			"I am reading a book.",
			"She is working today.",
			"They are playing football.",
			"The weather is getting colder.",
			"We are meeting tomorrow at 5.",
		],
		examplesNative: [
			"Estoy leyendo un libro.",
			"Ella está trabajando hoy.",
			"Ellos están jugando fútbol.",
			"El clima se está poniendo más frío.",
			"Nos reunimos mañana a las 5.",
		],
		quiz: [
			{
				q: "Listen! The baby ___.",
				options: ["cry", "cries", "is crying"],
				a: 2,
			},
			{
				q: "She ___ dinner right now.",
				options: ["cooks", "is cooking", "cook"],
				a: 1,
			},
			{
				q: "They ___ to music at the moment.",
				options: ["listen", "are listening", "listens"],
				a: 1,
			},
			{
				q: "I ___ English this year.",
				options: ["study", "am studying", "studies"],
				a: 1,
			},
			{ q: "Look! It ___!", options: ["rains", "rain", "is raining"], a: 2 },
		],
		estimatedMinutes: 12,
		topicType: "core",
		prerequisites: ["to-be", "pronouns", "present-simple"],
		position: { x: 300, y: 320 },
		connections: [],
	},
];

// Node types for ReactFlow - cast to satisfy ReactFlow's strict typing
// biome-ignore lint/suspicious/noExplicitAny: ReactFlow nodeTypes requires flexible typing
const nodeTypes: Record<string, any> = {
	grammarNode: GrammarNode,
};

// --- Utilities ---
const getNodesAndEdges = (
	topics: GrammarTopic[],
	levelFilter: GrammarLevel | "All",
	viewMode: "guided" | "explore",
	onLearn: (id: string) => void,
	onQuiz: (id: string) => void,
	onAskAI: (id: string) => void,
	onBookmark: (id: string) => void,
	bookmarks: Set<string>,
) => {
	const filteredTopics =
		levelFilter === "All"
			? topics
			: topics.filter((t) => t.level === levelFilter);

	const activeTopicIds = new Set(filteredTopics.map((t) => t.id));

	// Calculate which topics are locked based on prerequisites
	const completedTopics = new Set(
		Object.entries(USER_MASTERY)
			.filter(
				([_, mastery]) => mastery === "mastered" || mastery === "learning",
			)
			.map(([id]) => id),
	);

	const isTopicLocked = (topic: GrammarTopic) => {
		if (topic.prerequisites.length === 0) return false;
		return !topic.prerequisites.every((prereq) => completedTopics.has(prereq));
	};

	const getLockedReason = (topic: GrammarTopic) => {
		const missing = topic.prerequisites.filter((p) => !completedTopics.has(p));
		const missingNames = missing
			.map((id) => topics.find((t) => t.id === id)?.title)
			.filter(Boolean);
		return missingNames.join(" + ");
	};

	// For guided path, add step numbers
	let stepNumber = 0;
	const orderedTopics =
		viewMode === "guided"
			? [...filteredTopics].sort((a, b) => {
					const levelOrder = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6 };
					return levelOrder[a.level] - levelOrder[b.level];
				})
			: filteredTopics;

	const nodes: Node<GrammarNodeData>[] = orderedTopics.map((topic) => {
		const isLocked = isTopicLocked(topic);
		if (viewMode === "guided" && !isLocked) stepNumber++;

		return {
			id: topic.id,
			type: "grammarNode",
			position: topic.position,
			data: {
				label: topic.title,
				level: topic.level,
				mastery: USER_MASTERY[topic.id] || "not_started",
				isLocked,
				lockedReason: isLocked ? getLockedReason(topic) : undefined,
				stepNumber: viewMode === "guided" && !isLocked ? stepNumber : undefined,
				onLearn: () => onLearn(topic.id),
				onQuiz: () => onQuiz(topic.id),
				onAskAI: () => onAskAI(topic.id),
				onBookmark: () => onBookmark(topic.id),
				isBookmarked: bookmarks.has(topic.id),
			},
		};
	});

	const edges: Edge[] = filteredTopics.flatMap((topic) =>
		topic.connections
			.filter((targetId) => activeTopicIds.has(targetId))
			.map((targetId, idx) => {
				const targetTopic = topics.find((t) => t.id === targetId);
				const isPrerequisite = targetTopic?.prerequisites.includes(topic.id);

				return {
					id: `e-${topic.id}-${targetId}-${idx}`,
					source: topic.id,
					target: targetId,
					animated: !isPrerequisite,
					style: {
						stroke: isPrerequisite ? "#f59e0b" : "#94a3b8",
						strokeWidth: isPrerequisite ? 2 : 1,
					},
					markerEnd: {
						type: MarkerType.ArrowClosed,
						color: isPrerequisite ? "#f59e0b" : "#94a3b8",
					},
					label: isPrerequisite ? "prerequisite" : undefined,
					labelStyle: { fontSize: 10, fill: "#94a3b8" },
				};
			}),
	);

	return { nodes, edges };
};

export const Route = createFileRoute("/_dashboard/grammar2")({
	component: GrammarFlowPage,
});

function GrammarFlowPage() {
	const [displayMode, setDisplayMode] = useState<"graph" | "list">("graph");
	const [viewMode, setViewMode] = useState<"guided" | "explore">("explore");
	const [filterLevel, setFilterLevel] = useState<GrammarLevel | "All">("All");
	const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);
	const [drawerTab, setDrawerTab] = useState<"learn" | "practice" | "ask">(
		"learn",
	);
	const [bookmarks, setBookmarks] = useState<Set<string>>(
		new Set(USER_BOOKMARKS),
	);

	const handleTopicSelect = (
		id: string,
		tab: "learn" | "practice" | "ask" = "learn",
	) => {
		setSelectedTopicId(id);
		setDrawerTab(tab);
		setIsDrawerOpen(true);
	};

	const handleBookmark = (id: string) => {
		setBookmarks((prev) => {
			const newBookmarks = new Set(prev);
			if (newBookmarks.has(id)) {
				newBookmarks.delete(id);
			} else {
				newBookmarks.add(id);
			}
			return newBookmarks;
		});
	};

	return (
		<ReactFlowProvider>
			<div className="relative h-[calc(100vh)] w-full overflow-hidden bg-background text-foreground">
				{/* Top Controls */}
				<div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
					{/* Display Mode Toggle */}
					<div className="flex w-fit rounded-lg border bg-background/95 shadow-sm backdrop-blur">
						<Button
							variant={displayMode === "graph" ? "secondary" : "ghost"}
							size="sm"
							className="rounded-r-none"
							onClick={() => setDisplayMode("graph")}
						>
							<LayoutGrid className="mr-2 h-4 w-4" /> Graph
						</Button>
						<Button
							variant={displayMode === "list" ? "secondary" : "ghost"}
							size="sm"
							className="rounded-l-none"
							onClick={() => setDisplayMode("list")}
						>
							<ListIcon className="mr-2 h-4 w-4" /> List
						</Button>
					</div>

					{/* View Mode Toggle (Graph only) */}
					{displayMode === "graph" && (
						<div className="flex w-fit rounded-lg border bg-background/95 shadow-sm backdrop-blur">
							<Button
								variant={viewMode === "guided" ? "secondary" : "ghost"}
								size="sm"
								className="gap-2 rounded-r-none"
								onClick={() => setViewMode("guided")}
							>
								<MapIcon className="h-4 w-4" /> Guided Path
							</Button>
							<Button
								variant={viewMode === "explore" ? "secondary" : "ghost"}
								size="sm"
								className="gap-2 rounded-l-none"
								onClick={() => setViewMode("explore")}
							>
								<Compass className="h-4 w-4" /> Explore All
							</Button>
						</div>
					)}

					{/* Level Filter (Graph View) */}
					{displayMode === "graph" && (
						<div className="scrollbar-hide flex w-fit max-w-[calc(100vw-2rem)] gap-1 overflow-x-auto rounded-lg border bg-background/95 p-1 shadow-sm backdrop-blur">
							{(["All", "A1", "A2", "B1", "B2", "C1", "C2"] as const).map(
								(level) => (
									<Button
										key={level}
										variant={filterLevel === level ? "secondary" : "ghost"}
										size="sm"
										className={cn(
											"h-7 px-2 text-xs",
											level !== "All" && CEFR_COLORS[level]?.text,
										)}
										onClick={() => setFilterLevel(level)}
									>
										{level}
									</Button>
								),
							)}
						</div>
					)}
				</div>

				{/* Legend */}
				{displayMode === "graph" && (
					<div className="absolute top-4 right-4 z-10 rounded-lg border bg-background/95 p-3 shadow-sm backdrop-blur">
						<div className="mb-2 font-semibold text-muted-foreground text-xs">
							Mastery
						</div>
						<div className="flex flex-col gap-1.5">
							{Object.entries(MASTERY_COLORS).map(([key, value]) => (
								<div key={key} className="flex items-center gap-2 text-xs">
									<div className={cn("h-3 w-3 rounded border", value.fill)} />
									<span className={value.text}>{value.label}</span>
								</div>
							))}
						</div>
					</div>
				)}

				{displayMode === "graph" ? (
					<GrammarFlow
						onTopicSelect={handleTopicSelect}
						onBookmark={handleBookmark}
						bookmarks={bookmarks}
						filterLevel={filterLevel}
						viewMode={viewMode}
					/>
				) : (
					<GrammarList onTopicSelect={handleTopicSelect} />
				)}

				<GrammarDrawer
					isOpen={isDrawerOpen}
					onClose={() => setIsDrawerOpen(false)}
					topicId={selectedTopicId}
					initialTab={drawerTab}
					isBookmarked={
						selectedTopicId ? bookmarks.has(selectedTopicId) : false
					}
					onBookmark={() => selectedTopicId && handleBookmark(selectedTopicId)}
				/>
			</div>
		</ReactFlowProvider>
	);
}

function GrammarFlow({
	onTopicSelect,
	onBookmark,
	bookmarks,
	filterLevel,
	viewMode,
}: {
	onTopicSelect: (id: string, tab?: "learn" | "practice" | "ask") => void;
	onBookmark: (id: string) => void;
	bookmarks: Set<string>;
	filterLevel: GrammarLevel | "All";
	viewMode: "guided" | "explore";
}) {
	const { nodes: initialNodes, edges: initialEdges } = useMemo(
		() =>
			getNodesAndEdges(
				GRAMMAR_TOPICS,
				filterLevel,
				viewMode,
				(id) => onTopicSelect(id, "learn"),
				(id) => onTopicSelect(id, "practice"),
				(id) => onTopicSelect(id, "ask"),
				onBookmark,
				bookmarks,
			),
		[filterLevel, viewMode, onTopicSelect, onBookmark, bookmarks],
	);

	const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
	const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
	const { setCenter } = useReactFlow();

	useEffect(() => {
		const { nodes: newNodes, edges: newEdges } = getNodesAndEdges(
			GRAMMAR_TOPICS,
			filterLevel,
			viewMode,
			(id) => onTopicSelect(id, "learn"),
			(id) => onTopicSelect(id, "practice"),
			(id) => onTopicSelect(id, "ask"),
			onBookmark,
			bookmarks,
		);
		setNodes(newNodes);
		setEdges(newEdges);
	}, [
		filterLevel,
		viewMode,
		setNodes,
		setEdges,
		onTopicSelect,
		onBookmark,
		bookmarks,
	]);

	const onConnect: OnConnect = useCallback(
		(params) => setEdges((eds) => addEdge(params, eds)),
		[setEdges],
	);

	const onNodeClick = (_: React.MouseEvent, node: Node) => {
		const topic = GRAMMAR_TOPICS.find((t) => t.id === node.id);
		if (topic) {
			const isLocked =
				topic.prerequisites.length > 0 &&
				!topic.prerequisites.every((p) =>
					["mastered", "learning"].includes(USER_MASTERY[p] || ""),
				);
			if (!isLocked) {
				onTopicSelect(node.id, "learn");
				setCenter(node.position.x + 70, node.position.y + 50, {
					zoom: 1.2,
					duration: 800,
				});
			}
		}
	};

	return (
		<ReactFlow
			nodes={nodes}
			edges={edges}
			nodeTypes={nodeTypes}
			onNodesChange={onNodesChange}
			onEdgesChange={onEdgesChange}
			onConnect={onConnect}
			onNodeClick={onNodeClick}
			fitView
			attributionPosition="bottom-left"
			proOptions={{ hideAttribution: true }}
		>
			<Background />
			<Controls />
		</ReactFlow>
	);
}

function GrammarList({
	onTopicSelect,
}: {
	onTopicSelect: (id: string) => void;
}) {
	const groupedTopics = useMemo(() => {
		const groups: Record<string, Record<string, GrammarTopic[]>> = {};

		GRAMMAR_TOPICS.forEach((topic) => {
			if (topic.id === "root") return;
			if (!groups[topic.level]) groups[topic.level] = {};
			if (!groups[topic.level][topic.category])
				groups[topic.level][topic.category] = [];
			groups[topic.level][topic.category].push(topic);
		});

		return groups;
	}, []);

	const levels = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

	return (
		<div className="h-full w-full overflow-y-auto p-4 pt-16 md:p-8 md:pt-20">
			<div className="mx-auto max-w-3xl space-y-8">
				<div className="space-y-2">
					<h1 className="font-bold text-3xl tracking-tight">
						Grammar Curriculum
					</h1>
					<p className="text-muted-foreground">
						Master English grammar one concept at a time, from A1 to C2.
					</p>
				</div>

				{levels.map((level) => {
					if (!groupedTopics[level]) return null;

					return (
						<div key={level} className="space-y-4">
							<div className="flex items-center gap-2">
								<div
									className={cn(
										"flex h-8 w-8 items-center justify-center rounded-full font-bold text-sm text-white",
										CEFR_COLORS[level].bg,
									)}
								>
									{level}
								</div>
								<h2 className="font-semibold text-xl">Level {level}</h2>
							</div>

							<Accordion type="multiple" className="w-full">
								{Object.entries(groupedTopics[level]).map(
									([category, topics]) => (
										<AccordionItem
											value={`${level}-${category}`}
											key={category}
										>
											<AccordionTrigger className="hover:no-underline">
												<span className="font-medium">{category}</span>
												<span className="ml-2 font-normal text-muted-foreground text-sm">
													({topics.length} topics)
												</span>
											</AccordionTrigger>
											<AccordionContent>
												<div className="grid gap-2 p-2">
													{topics.map((topic) => {
														const mastery =
															USER_MASTERY[topic.id] || "not_started";
														const masteryColors = MASTERY_COLORS[mastery];

														return (
															<Card
																key={topic.id}
																className={cn(
																	"cursor-pointer transition-colors hover:bg-muted/50",
																	masteryColors.fill,
																)}
																onClick={() => onTopicSelect(topic.id)}
															>
																<CardContent className="flex items-center justify-between p-4">
																	<div>
																		<div className="flex items-center gap-2">
																			<h3 className="font-semibold">
																				{topic.title}
																			</h3>
																			<Badge
																				variant={
																					mastery === "not_started"
																						? "notStarted"
																						: mastery
																				}
																			>
																				{masteryColors.label}
																			</Badge>
																		</div>
																		<p className="text-muted-foreground text-sm">
																			{topic.shortDescription}
																		</p>
																		<div className="mt-1 flex items-center gap-2 text-muted-foreground text-xs">
																			<Clock className="h-3 w-3" />~
																			{topic.estimatedMinutes} min
																		</div>
																	</div>
																	<Button size="icon" variant="ghost">
																		<Play className="h-4 w-4" />
																	</Button>
																</CardContent>
															</Card>
														);
													})}
												</div>
											</AccordionContent>
										</AccordionItem>
									),
								)}
							</Accordion>
						</div>
					);
				})}
			</div>
		</div>
	);
}

function GrammarDrawer({
	isOpen,
	onClose,
	topicId,
	initialTab,
	isBookmarked,
	onBookmark,
}: {
	isOpen: boolean;
	onClose: () => void;
	topicId: string | null;
	initialTab: "learn" | "practice" | "ask";
	isBookmarked: boolean;
	onBookmark: () => void;
}) {
	const [activeTab, setActiveTab] = useState<"learn" | "practice" | "ask">(
		initialTab,
	);
	const [showDetailed, setShowDetailed] = useState(false);
	const [nativeToggles, setNativeToggles] = useState<Record<string, boolean>>(
		{},
	);

	// Quiz state
	const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
	const [quizAnswers, setQuizAnswers] = useState<(number | null)[]>([]);
	const [quizStartTime, setQuizStartTime] = useState<number | null>(null);
	const [timeRemaining, setTimeRemaining] = useState(90); // 1.5 minutes
	const [quizComplete, setQuizComplete] = useState(false);

	// Chat state
	const [chatMessages, setChatMessages] = useState<
		{ role: "user" | "ai"; content: string }[]
	>([]);
	const [chatInput, setChatInput] = useState("");

	const topic = useMemo(
		() => GRAMMAR_TOPICS.find((t) => t.id === topicId) || GRAMMAR_TOPICS[0],
		[topicId],
	);

	const mastery = USER_MASTERY[topic.id] || "not_started";
	const masteryColors = MASTERY_COLORS[mastery];
	const cefrColors = CEFR_COLORS[topic.level];

	// Reset state when topic changes
	useEffect(() => {
		setActiveTab(initialTab);
		setShowDetailed(false);
		setNativeToggles({});
		setCurrentQuizIndex(0);
		setQuizAnswers(new Array(5).fill(null));
		setQuizStartTime(null);
		setTimeRemaining(90);
		setQuizComplete(false);
		setChatMessages([
			{
				role: "ai",
				content: `Hi! I'm here to help you master "${topic.title}". Ask me anything about this topic!`,
			},
		]);
	}, [topic, initialTab]);

	// Timer for quiz
	useEffect(() => {
		if (activeTab !== "practice" || !quizStartTime || quizComplete) return;

		const interval = setInterval(() => {
			const elapsed = Math.floor((Date.now() - quizStartTime) / 1000);
			const remaining = Math.max(0, 90 - elapsed);
			setTimeRemaining(remaining);

			if (remaining === 0) {
				setQuizComplete(true);
			}
		}, 1000);

		return () => clearInterval(interval);
	}, [activeTab, quizStartTime, quizComplete]);

	const toggleNative = (section: string) => {
		setNativeToggles((prev) => ({ ...prev, [section]: !prev[section] }));
	};

	const startQuiz = () => {
		setQuizStartTime(Date.now());
		setCurrentQuizIndex(0);
		setQuizAnswers(new Array(5).fill(null));
		setQuizComplete(false);
		setTimeRemaining(90);
	};

	const handleQuizAnswer = (answerIndex: number) => {
		const newAnswers = [...quizAnswers];
		newAnswers[currentQuizIndex] = answerIndex;
		setQuizAnswers(newAnswers);

		// Auto-advance after a short delay
		setTimeout(() => {
			if (currentQuizIndex < 4) {
				setCurrentQuizIndex((prev) => prev + 1);
			} else {
				setQuizComplete(true);
			}
		}, 500);
	};

	const getQuizScore = () => {
		return quizAnswers.filter((a, i) => a === topic.quiz[i]?.a).length;
	};

	const handleSendMessage = () => {
		if (!chatInput.trim()) return;
		const userMsg = chatInput;
		setChatMessages((prev) => [...prev, { role: "user", content: userMsg }]);
		setChatInput("");

		// Mock AI response based on context
		setTimeout(() => {
			let response = `Great question about ${topic.title}! `;

			if (
				userMsg.toLowerCase().includes("a2") ||
				userMsg.toLowerCase().includes("simple")
			) {
				response = `Let me explain "${topic.title}" simply: ${topic.explanation} For example: "${topic.examples[0]}"`;
			} else if (userMsg.toLowerCase().includes("example")) {
				response = `Here are some examples:\n${topic.examples
					.slice(0, 3)
					.map((e, i) => `${i + 1}. ${e}`)
					.join("\n")}`;
			} else if (
				userMsg.toLowerCase().includes("fill") ||
				userMsg.toLowerCase().includes("exercise")
			) {
				response = `Here are 5 fill-in-the-blank exercises:\n${topic.quiz
					.slice(0, 5)
					.map((q, i) => `${i + 1}. ${q.q}`)
					.join("\n")}`;
			} else if (userMsg.toLowerCase().includes("mistake")) {
				response = `Common mistakes to avoid:\n${topic.mistakes.map((m) => `❌ "${m.mistake}" → ✅ "${m.correction}"`).join("\n")}`;
			} else if (userMsg.toLowerCase().includes("travel")) {
				response = `Here are examples about travel using ${topic.title}:\n1. I am traveling to Spain next week.\n2. She visits Paris every summer.\n3. They are planning a trip to Japan.`;
			} else {
				response += `${showDetailed ? topic.detailedExplanation : topic.explanation}`;
			}

			setChatMessages((prev) => [...prev, { role: "ai", content: response }]);
		}, 800);
	};

	const aiPrompts = [
		{
			label: `Explain like I'm ${topic.level === "A1" ? "A1" : "A2"}`,
			icon: GraduationCap,
		},
		{ label: "3 examples about travel", icon: Globe },
		{ label: "5 fill-in exercises", icon: Dumbbell },
		{ label: "Common mistakes", icon: AlertCircle },
		{ label: "Quick tips", icon: Zap },
	];

	return (
		<div
			className={cn(
				"absolute top-0 right-0 z-20 flex h-full w-full transform flex-col border-l bg-background shadow-2xl transition-transform duration-300 ease-in-out md:w-[560px]",
				isOpen ? "translate-x-0" : "translate-x-full",
			)}
		>
			{/* Header with badges */}
			<div className="shrink-0 border-b bg-muted/20 p-4">
				<div className="flex items-start justify-between">
					<div className="space-y-2">
						{/* Badges row */}
						<div className="flex flex-wrap items-center gap-2">
							<Badge variant={topic.level} className="font-bold">
								{topic.level}
							</Badge>
							<Badge variant="outline" className="gap-1">
								<Clock className="h-3 w-3" />~{topic.estimatedMinutes} min
							</Badge>
							<Badge
								variant={topic.topicType === "core" ? "default" : "secondary"}
							>
								{topic.topicType === "core" ? "Core topic" : topic.topicType}
							</Badge>
							<Badge
								variant={mastery === "not_started" ? "notStarted" : mastery}
							>
								{masteryColors.label}
							</Badge>
						</div>
						{/* Title */}
						<h2 className="font-bold text-xl">{topic.title}</h2>
						<p className="text-muted-foreground text-sm">{topic.category}</p>
					</div>
					<div className="flex items-center gap-1">
						<Button
							variant={isBookmarked ? "secondary" : "ghost"}
							size="icon"
							onClick={onBookmark}
						>
							<Bookmark
								className={cn("h-5 w-5", isBookmarked && "fill-current")}
							/>
						</Button>
						<Button variant="ghost" size="icon" onClick={onClose}>
							<X className="h-5 w-5" />
						</Button>
					</div>
				</div>

				{/* Difficulty toggle */}
				<div className="mt-3 flex items-center justify-between rounded-lg bg-muted/50 p-2">
					<span className="font-medium text-sm">Explanation depth</span>
					<div className="flex items-center gap-2">
						<span
							className={cn(
								"text-xs",
								!showDetailed && "font-semibold text-foreground",
							)}
						>
							Simple
						</span>
						<Switch checked={showDetailed} onCheckedChange={setShowDetailed} />
						<span
							className={cn(
								"text-xs",
								showDetailed && "font-semibold text-foreground",
							)}
						>
							Detailed
						</span>
					</div>
				</div>
			</div>

			{/* Tabs */}
			<div className="flex shrink-0 border-b">
				{[
					{ id: "learn" as const, label: "Learn", icon: BookOpen },
					{ id: "practice" as const, label: "Practice", icon: Dumbbell },
					{ id: "ask" as const, label: "Ask AI", icon: Sparkles },
				].map((tab) => (
					<button
						key={tab.id}
						type="button"
						onClick={() => setActiveTab(tab.id)}
						className={cn(
							"flex-1 border-b-2 py-3 font-medium text-sm transition-colors",
							activeTab === tab.id
								? `border-current ${cefrColors.text}`
								: "border-transparent text-muted-foreground hover:text-foreground",
						)}
					>
						<tab.icon className="mr-2 inline h-4 w-4" /> {tab.label}
					</button>
				))}
			</div>

			{/* Content */}
			<div className="flex-1 overflow-y-auto">
				{activeTab === "learn" && (
					<div className="space-y-4 p-4">
						{/* Explanation */}
						<Card>
							<CardHeader className="pb-2">
								<div className="flex items-center justify-between">
									<CardTitle className="text-base">Rule & Usage</CardTitle>
									<Button
										variant="ghost"
										size="sm"
										className="h-7 gap-1 text-xs"
										onClick={() => toggleNative("explanation")}
									>
										<Globe className="h-3 w-3" />
										{nativeToggles.explanation ? "English" : "Native"}
									</Button>
								</div>
							</CardHeader>
							<CardContent className="space-y-3">
								<p className="text-sm leading-relaxed">
									{nativeToggles.explanation
										? showDetailed
											? topic.detailedNativeExplanation
											: topic.nativeExplanation
										: showDetailed
											? topic.detailedExplanation
											: topic.explanation}
								</p>
								<ul className="list-disc space-y-1 pl-5 text-muted-foreground text-sm">
									{(nativeToggles.explanation
										? topic.usageNative
										: topic.usage
									).map((u) => (
										<li key={u}>{u}</li>
									))}
								</ul>
							</CardContent>
						</Card>

						{/* Examples */}
						<Card>
							<CardHeader className="pb-2">
								<div className="flex items-center justify-between">
									<CardTitle className="flex items-center gap-2 text-base">
										<Play className="h-4 w-4" /> Examples
									</CardTitle>
									<Button
										variant="ghost"
										size="sm"
										className="h-7 gap-1 text-xs"
										onClick={() => toggleNative("examples")}
									>
										<Globe className="h-3 w-3" />
										{nativeToggles.examples ? "English" : "Native"}
									</Button>
								</div>
							</CardHeader>
							<CardContent>
								<ul className="space-y-2">
									{topic.examples.map((ex, i) => (
										<li key={ex} className="flex items-start gap-2 text-sm">
											<span
												className={cn("font-mono text-xs", cefrColors.text)}
											>
												{i + 1}.
											</span>
											<span>
												{nativeToggles.examples ? topic.examplesNative[i] : ex}
											</span>
										</li>
									))}
								</ul>
							</CardContent>
						</Card>

						{/* Common Mistakes */}
						{topic.mistakes.length > 0 && (
							<Card className="border-destructive/20">
								<CardHeader className="pb-2">
									<div className="flex items-center justify-between">
										<CardTitle className="flex items-center gap-2 text-base text-destructive">
											<AlertCircle className="h-4 w-4" /> Common Mistakes
										</CardTitle>
										<Button
											variant="ghost"
											size="sm"
											className="h-7 gap-1 text-xs"
											onClick={() => toggleNative("mistakes")}
										>
											<Globe className="h-3 w-3" />
											{nativeToggles.mistakes ? "English" : "Native"}
										</Button>
									</div>
								</CardHeader>
								<CardContent className="space-y-3">
									{topic.mistakes.map((m) => (
										<div
											key={m.mistake}
											className="rounded-lg bg-destructive/5 p-3 text-sm"
										>
											<div className="mb-1 flex items-center gap-2 text-destructive line-through">
												<X className="h-3 w-3 shrink-0" /> {m.mistake}
											</div>
											<div className="mb-1 flex items-center gap-2 font-medium text-green-600">
												<CheckCircle2 className="h-3 w-3 shrink-0" />
												{m.correction}
											</div>
											<p className="ml-5 text-muted-foreground text-xs">
												{nativeToggles.mistakes
													? m.explanationNative
													: m.explanation}
											</p>
										</div>
									))}
								</CardContent>
							</Card>
						)}
					</div>
				)}

				{activeTab === "practice" && (
					<div className="p-4">
						{!quizStartTime ? (
							// Quiz start screen
							<Card>
								<CardContent className="py-8 text-center">
									<Dumbbell className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
									<h3 className="mb-2 font-semibold text-lg">Quick Practice</h3>
									<p className="mb-4 text-muted-foreground text-sm">
										5 questions · 1-2 minutes · Test your knowledge!
									</p>
									<Button onClick={startQuiz} className="gap-2">
										<Play className="h-4 w-4" /> Start Quiz
									</Button>
								</CardContent>
							</Card>
						) : quizComplete ? (
							// Quiz results
							<Card>
								<CardContent className="py-6">
									<div className="mb-4 text-center">
										<div className="mb-2 font-bold text-4xl">
											{getQuizScore()}/5
										</div>
										<p className="text-muted-foreground">
											{getQuizScore() >= 4
												? "Excellent! You've mastered this!"
												: getQuizScore() >= 3
													? "Good job! Keep practicing."
													: "Keep learning, you'll get there!"}
										</p>
									</div>
									<div className="mb-4 space-y-2">
										{topic.quiz.slice(0, 5).map((q, i) => (
											<div
												key={q.q}
												className={cn(
													"flex items-center gap-2 rounded-lg p-2 text-sm",
													quizAnswers[i] === q.a
														? "bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-400"
														: "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400",
												)}
											>
												{quizAnswers[i] === q.a ? (
													<CheckCircle2 className="h-4 w-4 shrink-0" />
												) : (
													<X className="h-4 w-4 shrink-0" />
												)}
												<span className="truncate">{q.q}</span>
											</div>
										))}
									</div>
									<Button onClick={startQuiz} className="w-full gap-2">
										<Play className="h-4 w-4" /> Try Again
									</Button>
								</CardContent>
							</Card>
						) : (
							// Active quiz
							<Card>
								<CardHeader className="pb-2">
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											{[0, 1, 2, 3, 4].map((i) => (
												<div
													key={i}
													className={cn(
														"h-2 w-2 rounded-full transition-colors",
														i === currentQuizIndex
															? cefrColors.bg
															: quizAnswers[i] !== null
																? quizAnswers[i] === topic.quiz[i]?.a
																	? "bg-green-500"
																	: "bg-red-500"
																: "bg-muted",
													)}
												/>
											))}
										</div>
										<Badge variant="outline" className="gap-1">
											<Timer className="h-3 w-3" />
											{Math.floor(timeRemaining / 60)}:
											{String(timeRemaining % 60).padStart(2, "0")}
										</Badge>
									</div>
									<Progress
										value={((currentQuizIndex + 1) / 5) * 100}
										className="mt-2"
									/>
								</CardHeader>
								<CardContent className="space-y-4">
									<p className="font-medium text-lg">
										{topic.quiz[currentQuizIndex]?.q}
									</p>
									<div className="space-y-2">
										{topic.quiz[currentQuizIndex]?.options.map((opt, idx) => {
											const isSelected = quizAnswers[currentQuizIndex] === idx;
											const isCorrect = topic.quiz[currentQuizIndex]?.a === idx;
											const showResult = isSelected;

											return (
												<Button
													key={opt}
													variant={isSelected ? "default" : "outline"}
													className={cn(
														"w-full justify-start transition-all",
														showResult &&
															isCorrect &&
															"bg-green-600 hover:bg-green-700",
														showResult &&
															!isCorrect &&
															"bg-red-600 hover:bg-red-700",
													)}
													onClick={() => handleQuizAnswer(idx)}
													disabled={quizAnswers[currentQuizIndex] !== null}
												>
													{opt}
													{showResult && isCorrect && (
														<CheckCircle2 className="ml-auto h-4 w-4" />
													)}
													{showResult && !isCorrect && (
														<X className="ml-auto h-4 w-4" />
													)}
												</Button>
											);
										})}
									</div>
								</CardContent>
							</Card>
						)}
					</div>
				)}

				{activeTab === "ask" && (
					<div className="flex h-full flex-col p-4">
						{/* Messages */}
						<div className="mb-4 flex-1 space-y-3 overflow-y-auto">
							{chatMessages.map((msg, i) => (
								<div
									key={`${msg.role}-${i}`}
									className={cn(
										"flex",
										msg.role === "user" ? "justify-end" : "justify-start",
									)}
								>
									<div
										className={cn(
											"max-w-[85%] whitespace-pre-line rounded-lg p-3 text-sm",
											msg.role === "user"
												? `${cefrColors.bg} text-white`
												: "bg-muted",
										)}
									>
										{msg.content}
									</div>
								</div>
							))}
						</div>

						{/* Pre-suggested prompts */}
						<div className="mb-3 flex flex-wrap gap-2">
							{aiPrompts.map((prompt) => (
								<Button
									key={prompt.label}
									variant="outline"
									size="sm"
									className="h-8 gap-1.5 text-xs"
									onClick={() => {
										setChatInput(prompt.label);
										// Auto-send
										setTimeout(() => {
											setChatMessages((prev) => [
												...prev,
												{ role: "user", content: prompt.label },
											]);
											setChatInput("");
											// Mock response
											setTimeout(() => {
												let response = "";
												if (prompt.label.includes("Explain")) {
													response = `Let me explain "${topic.title}" simply:\n\n${topic.explanation}\n\nExample: "${topic.examples[0]}"`;
												} else if (prompt.label.includes("travel")) {
													response = `Here are 3 examples about travel using ${topic.title}:\n\n1. I am traveling to Spain next week.\n2. She visits Paris every summer.\n3. They are planning a trip to Japan.`;
												} else if (prompt.label.includes("fill")) {
													response = `Here are 5 fill-in-the-blank exercises:\n\n${topic.quiz
														.slice(0, 5)
														.map((q, i) => `${i + 1}. ${q.q}`)
														.join("\n")}`;
												} else if (prompt.label.includes("mistakes")) {
													response = `Common mistakes with ${topic.title}:\n\n${topic.mistakes.map((m) => `❌ "${m.mistake}"\n✅ "${m.correction}"\n💡 ${m.explanation}`).join("\n\n")}`;
												} else if (prompt.label.includes("tips")) {
													response = `Quick tips for ${topic.title}:\n\n1. ${topic.usage[0] || "Practice regularly"}\n2. ${topic.usage[1] || "Use in daily conversation"}\n3. Watch for common mistakes like "${topic.mistakes[0]?.mistake || "spelling errors"}"`;
												}
												setChatMessages((prev) => [
													...prev,
													{ role: "ai", content: response },
												]);
											}, 600);
										}, 100);
									}}
								>
									<prompt.icon className="h-3 w-3" />
									{prompt.label}
								</Button>
							))}
						</div>

						{/* Input */}
						<div className="flex gap-2">
							<Input
								placeholder="Ask anything about this topic..."
								value={chatInput}
								onChange={(e) => setChatInput(e.target.value)}
								onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
							/>
							<Button size="icon" onClick={handleSendMessage}>
								<Send className="h-4 w-4" />
							</Button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
