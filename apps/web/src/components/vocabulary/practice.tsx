import {
	BookOpen,
	CheckCircle2,
	Clock,
	Mic,
	Sparkles,
	Zap,
} from "lucide-react";
import { useState } from "react";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";

type PracticeContent = "words" | "phrases" | "idioms";
type ExerciseType =
	| "multiple-choice"
	| "flashcards"
	| "fill-blank"
	| "matching";
type Duration = "5" | "10" | "15" | "20";

const contentOptions: {
	id: PracticeContent;
	label: string;
	icon: React.ReactNode;
	count: number;
}[] = [
	{
		id: "words",
		label: "Words",
		icon: <BookOpen className="size-4" />,
		count: 42,
	},
	{
		id: "phrases",
		label: "Phrases",
		icon: <Sparkles className="size-4" />,
		count: 18,
	},
];

const exerciseOptions: {
	id: ExerciseType;
	label: string;
	description: string;
}[] = [
	{
		id: "multiple-choice",
		label: "Multiple Choice",
		description: "Choose the correct answer",
	},
	{
		id: "flashcards",
		label: "Flashcards",
		description: "Review with flip cards",
	},
	{
		id: "fill-blank",
		label: "Fill in the Blank",
		description: "Complete the sentence",
	},
	{
		id: "matching",
		label: "Matching",
		description: "Match words with meanings",
	},
];

const durationOptions: { value: Duration; label: string }[] = [
	{ value: "5", label: "5 min" },
	{ value: "10", label: "10 min" },
	{ value: "15", label: "15 min" },
	{ value: "20", label: "20 min" },
];

export default function Practice() {
	const [selectedContent, setSelectedContent] = useState<PracticeContent[]>([
		"words",
	]);
	const [selectedExercises, setSelectedExercises] = useState<ExerciseType[]>([
		"multiple-choice",
	]);
	const [duration, setDuration] = useState<Duration>("10");
	const [open, setOpen] = useState(false);

	const toggleContent = (id: PracticeContent) => {
		setSelectedContent((prev) =>
			prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
		);
	};

	const toggleExercise = (id: ExerciseType) => {
		setSelectedExercises((prev) =>
			prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id],
		);
	};

	const canStart = selectedContent.length > 0 && selectedExercises.length > 0;

	const handleStart = () => {
		// Client-side only - just log the selections for now
		console.log("Starting practice:", {
			content: selectedContent,
			exercises: selectedExercises,
			duration,
		});
		setOpen(false);
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button
					type="button"
					variant="outline"
					className="group flex cursor-pointer items-center gap-1 whitespace-nowrap rounded-xl border border-[#C6F64D] bg-[radial-gradient(100%_100%_at_50%_0%,#EFFF9B_0%,#D8FF76_60%,#C6F64D_100%)] px-2.5 py-1.5 font-medium text-lime-900 text-sm italic shadow-none transition duration-150 ease-in-out will-change-transform hover:bg-lime-700/10 hover:brightness-95 focus:shadow-none focus:outline-none focus-visible:shadow-none"
				>
					<Mic className="size-4" />
					Practice
					{/* <span className="-top-px relative font-lyon text-lg text-lime-900/80 italic group-hover:text-lime-900">
						now
					</span> */}
				</Button>
			</DialogTrigger>
			<DialogContent className="max-w-md" showCloseButton={false}>
				{/* <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full bg-linear-to-br from-lime-400 to-lime-500 shadow-lg shadow-lime-200">
						<CheckCircle2 className="size-7 text-white" />
					</div> */}
				<DialogHeader>
					<DialogTitle className="font-bold font-lyon text-2xl tracking-tight">
						Practice Session
					</DialogTitle>
					<DialogDescription className="text-neutral-500">
						Customize your practice to fit your goals
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-5 pb-6">
					{/* What to Practice */}
					<div className="space-y-3">
						<h3 className="font-semibold text-neutral-700 text-sm uppercase tracking-wide">
							What to Practice
						</h3>
						<div className="flex flex-row space-y-2">
							{contentOptions.map((option) => (
								<div
									key={option.id}
									onClick={() => toggleContent(option.id)}
									onKeyDown={(e) =>
										e.key === "Enter" && toggleContent(option.id)
									}
									role="checkbox"
									aria-checked={selectedContent.includes(option.id)}
									tabIndex={0}
									className={cn(
										"flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all",
										selectedContent.includes(option.id)
											? "border-lime-400 bg-lime-50"
											: "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50",
									)}
								>
									<Checkbox
										checked={selectedContent.includes(option.id)}
										onCheckedChange={() => toggleContent(option.id)}
										tabIndex={-1}
										className="data-[state=checked]:border-lime-500 data-[state=checked]:bg-lime-500"
									/>
									<span className="flex items-center gap-2 text-neutral-700">
										{option.icon}
										{option.label}
									</span>
									<span className="ml-auto font-medium text-neutral-400 text-xs">
										{option.count} items
									</span>
								</div>
							))}
						</div>
					</div>

					{/* Exercise Types */}
					<div className="space-y-3">
						<h3 className="font-semibold text-neutral-700 text-sm uppercase tracking-wide">
							Exercise Types
						</h3>
						<div className="grid grid-cols-2 gap-2">
							{exerciseOptions.map((option) => (
								<div
									key={option.id}
									onClick={() => toggleExercise(option.id)}
									onKeyDown={(e) =>
										e.key === "Enter" && toggleExercise(option.id)
									}
									role="checkbox"
									aria-checked={selectedExercises.includes(option.id)}
									tabIndex={0}
									className={cn(
										"flex cursor-pointer flex-col rounded-xl border p-3 transition-all",
										selectedExercises.includes(option.id)
											? "border-lime-400 bg-lime-50"
											: "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50",
									)}
								>
									<div className="flex items-center gap-2">
										<Checkbox
											checked={selectedExercises.includes(option.id)}
											onCheckedChange={() => toggleExercise(option.id)}
											tabIndex={-1}
											className="data-[state=checked]:border-lime-500 data-[state=checked]:bg-lime-500"
										/>
										<span className="font-medium text-neutral-700 text-sm">
											{option.label}
										</span>
									</div>
									<span className="mt-1 ml-6 text-neutral-400 text-xs">
										{option.description}
									</span>
								</div>
							))}
						</div>
					</div>

					{/* Duration */}
					<div className="space-y-3">
						<h3 className="flex items-center gap-2 font-semibold text-neutral-700 text-sm uppercase tracking-wide">
							Duration
						</h3>
						<RadioGroup
							value={duration}
							onValueChange={(v) => setDuration(v as Duration)}
							className="flex gap-2"
						>
							{durationOptions.map((option) => (
								<div
									key={option.value}
									onClick={() => setDuration(option.value)}
									onKeyDown={(e) =>
										e.key === "Enter" && setDuration(option.value)
									}
									role="radio"
									aria-checked={duration === option.value}
									tabIndex={0}
									className={cn(
										"flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-2.5 font-medium text-sm transition-all",
										duration === option.value
											? "border-lime-400 bg-lime-50 text-lime-700"
											: "border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50",
									)}
								>
									<RadioGroupItem value={option.value} className="sr-only" />
									{option.label}
								</div>
							))}
						</RadioGroup>
					</div>
				</div>

				{/* Footer */}
				<DialogFooter>
					<DialogClose asChild>
						<Button variant="ghost" className="flex-1 sm:flex-none">
							Cancel
						</Button>
					</DialogClose>
					<Button
						onClick={handleStart}
						disabled={!canStart}
						className="flex-1 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 sm:flex-none"
					>
						Start Practice
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
