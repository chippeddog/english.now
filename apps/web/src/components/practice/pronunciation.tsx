import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, MicIcon, RefreshCwIcon } from "lucide-react";
import { useEffect, useState } from "react";
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

type ParagraphPreview = {
	text: string;
	topic: string;
	cefrLevel: string;
	wordCount: number;
	focusAreas: string[];
	tips: string;
};

function SkeletonText() {
	return (
		<div className="flex flex-col gap-2 pt-3">
			<div className="h-3.5 w-full animate-pulse rounded bg-neutral-100" />
			<div className="h-3.5 w-full animate-pulse rounded bg-neutral-100" />
			<div className="h-3.5 w-[90%] animate-pulse rounded bg-neutral-100" />
			<div className="h-3.5 w-[75%] animate-pulse rounded bg-neutral-100" />
			<div className="h-3.5 w-full animate-pulse rounded bg-neutral-100" />
			<div className="h-3.5 w-[90%] animate-pulse rounded bg-neutral-100" />
		</div>
	);
}

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
	const [preview, setPreview] = useState<ParagraphPreview | null>(null);

	const generatePreview = useMutation(
		trpc.pronunciation.generatePreview.mutationOptions({
			onSuccess: (data) => {
				setPreview(data.paragraph);
			},
		}),
	);

	useEffect(() => {
		if (open && !preview && !generatePreview.isPending) {
			generatePreview.mutate();
		}
	}, [open]);

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
		if (!preview) return;
		startSession.mutate({ paragraph: preview });
	};

	const handleRefresh = () => {
		generatePreview.mutate();
	};

	const isGenerating = generatePreview.isPending;

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent showCloseButton={false}>
				<div className="mb-3 flex flex-col gap-2 text-center">
					<h1 className="font-bold font-lyon text-3xl tracking-tight">
						{t("practice.pronunciation")}
					</h1>
					<p className="text-muted-foreground text-sm">
						{t("practice.selectMode")}
					</p>
				</div>
				<div className="relative overflow-hidden border-neutral-200 border-b border-dashed p-4 pt-0.5 pb-0">
					<div
						className="min-h-48 rounded-t-2xl border-neutral-200 border-b-0 p-4"
						style={{
							boxShadow:
								"0 0 0 1px rgba(0,0,0,.05),0 10px 10px -5px rgba(0,0,0,.04),0 20px 25px -5px rgba(0,0,0,.04),0 20px 32px -12px rgba(0,0,0,.04)",
						}}
					>
						<div className="flex items-center justify-between">
							<h3 className="font-semibold text-sm italic">Read Aloud</h3>
							<button
								type="button"
								onClick={handleRefresh}
								disabled={isGenerating}
								className="relative flex size-6 shrink-0 cursor-pointer items-center justify-center gap-1.5 overflow-hidden whitespace-nowrap rounded-lg bg-linear-to-t from-[#202020] to-[#2F2F2F] font-base text-white shadow-[inset_0_1px_4px_0_rgba(255,255,255,0.4)] outline-none backdrop-blur transition-all hover:opacity-90 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-40 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:from-[rgb(192,192,192)] dark:to-[rgb(255,255,255)] dark:shadow-[inset_0_1px_4px_0_rgba(128,128,128,0.2)] dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none"
							>
								<RefreshCwIcon
									className={cn("size-3.5", isGenerating && "animate-spin")}
								/>
							</button>
						</div>
						{isGenerating && !preview ? (
							<SkeletonText />
						) : preview ? (
							<div className={cn("pt-3", isGenerating && "opacity-50")}>
								<p className="text-sm leading-relaxed">{preview.text}</p>
								<div className="mt-3 flex items-center gap-2">
									<span className="rounded-md bg-lime-100 px-1.5 py-0.5 font-medium text-lime-700 text-xs">
										{preview.cefrLevel}
									</span>
									<span className="text-muted-foreground text-xs">
										{preview.topic}
									</span>
								</div>
							</div>
						) : null}
					</div>
				</div>

				<DialogFooter>
					<DialogClose asChild>
						<Button
							variant="ghost"
							className="flex-1 rounded-xl italic sm:flex-none"
						>
							{t("practice.cancel")}
						</Button>
					</DialogClose>
					<Button
						onClick={handleStart}
						disabled={!preview || isGenerating || startSession.isPending}
						className="relative flex shrink-0 cursor-pointer items-center justify-center gap-1.5 overflow-hidden whitespace-nowrap rounded-xl bg-linear-to-t from-[#202020] to-[#2F2F2F] font-base text-white italic shadow-[inset_0_1px_4px_0_rgba(255,255,255,0.4)] outline-none backdrop-blur transition-all hover:opacity-90 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-40 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:from-[rgb(192,192,192)] dark:to-[rgb(255,255,255)] dark:shadow-[inset_0_1px_4px_0_rgba(128,128,128,0.2)] dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none"
					>
						{startSession.isPending && (
							<Loader2 className="size-5 animate-spin" />
						)}
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
