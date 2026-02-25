import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { MicIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/utils/trpc";

const MODES = [
	{
		id: "read-aloud" as const,
		name: "Read Aloud",
		icon: "📖",
		description: "Read text and get instant feedback",
	},
	// {
	// 	id: "tongue-twisters" as const,
	// 	name: "Tongue Twisters",
	// 	icon: "👅",
	// 	description: "Challenge yourself with tricky phrases",
	// },
	// {
	// 	id: "minimal-pairs" as const,
	// 	name: "Minimal Pairs",
	// 	icon: "👂",
	// 	description: "Master similar sounding words",
	// },
	// {
	// 	id: "shadowing" as const,
	// 	name: "Shadowing",
	// 	icon: "🎧",
	// 	description: "Listen and repeat immediately",
	// },
];

function DialogTopicsPronunciation({
	open,
	setOpen,
}: {
	open: boolean;
	setOpen: (open: boolean) => void;
}) {
	const trpc = useTRPC();
	const navigate = useNavigate();
	const { t } = useTranslation("app");
	const [selectedMode, setSelectedMode] = useState<string>("");

	const startSession = useMutation(
		trpc.pronunciation.startSession.mutationOptions({
			onSuccess: (data) => {
				navigate({
					to: "/pronunciation/$sessionId",
					params: { sessionId: data.sessionId },
				});
			},
		}),
	);

	const handleStart = () => {
		if (selectedMode) {
			startSession.mutate({});
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent showCloseButton={false}>
				<div className="mb-3 flex flex-col gap-2 text-center">
					<h1 className="mt-1 font-bold font-lyon text-3xl tracking-tight">
						{t("practice.pronunciation")}
					</h1>
					<p className="text-muted-foreground text-sm">
						{t("practice.selectMode")}
					</p>
				</div>

				<div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
					{MODES.map((mode) => (
						<button
							key={mode.id}
							type="button"
							onClick={() => setSelectedMode(mode.id)}
							className={cn(
								"flex flex-col gap-2 rounded-xl border p-4 text-left transition-all hover:border-border/50 hover:bg-neutral-100",
								selectedMode === mode.id
									? "border-lime-500 bg-lime-100 hover:border-lime-500 hover:bg-lime-100"
									: "border-transparent bg-neutral-50",
							)}
						>
							<span className="text-2xl">{mode.icon}</span>
							<span className="font-semibold">{mode.name}</span>
							<span className="text-muted-foreground text-sm">
								{mode.description}
							</span>
						</button>
					))}
				</div>

				<DialogFooter className="mt-3">
					<DialogClose asChild>
						<Button
							variant="ghost"
							className="flex-1 rounded-xl italic sm:flex-none"
						>
							Cancel
						</Button>
					</DialogClose>
					<Button
						onClick={handleStart}
						disabled={!selectedMode}
						className="relative flex shrink-0 cursor-pointer items-center justify-center gap-1.5 overflow-hidden whitespace-nowrap rounded-xl bg-linear-to-t from-[#202020] to-[#2F2F2F] font-base text-white italic shadow-[inset_0_1px_4px_0_rgba(255,255,255,0.4)] outline-none backdrop-blur transition-all hover:opacity-90 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-40 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:from-[rgb(192,192,192)] dark:to-[rgb(255,255,255)] dark:shadow-[inset_0_1px_4px_0_rgba(128,128,128,0.2)] dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none"
					>
						Start Practice
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export default function Pronunciation() {
	const { t } = useTranslation("app");
	const [dialogOpen, setDialogOpen] = useState(false);
	return (
		<div
			className="overflow-hidden rounded-[1.2rem] bg-white"
			style={{
				boxShadow:
					"0 0 0 1px rgba(0,0,0,.05),0 10px 10px -5px rgba(0,0,0,.04),0 20px 25px -5px rgba(0,0,0,.04),0 20px 32px -12px rgba(0,0,0,.04)",
			}}
		>
			<DialogTopicsPronunciation open={dialogOpen} setOpen={setDialogOpen} />
			<button
				onClick={() => setDialogOpen(true)}
				type="button"
				className="group flex w-full cursor-pointer items-center justify-between p-3.5 transition-colors duration-300 hover:bg-neutral-100"
			>
				<div className="flex items-center gap-2.5">
					<div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[#C6F64D] bg-radial from-[#EFFF9B] to-[#D8FF76]">
						<MicIcon className="size-5 text-lime-700" />
					</div>
					<div className="text-left">
						<h2 className="font-medium text-slate-900">
							{t("practice.pronunciation")}
						</h2>
						<p className="text-muted-foreground text-sm">
							{t("practice.practiceYourPronunciation")}
						</p>
					</div>
				</div>
				<svg
					className="relative size-5 text-gray-400 transition-all duration-300 group-hover:text-gray-500"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					aria-hidden="true"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M9 5l7 7-7 7"
					/>
				</svg>
			</button>
		</div>
	);
}
