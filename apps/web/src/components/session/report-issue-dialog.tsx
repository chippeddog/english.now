import { useMutation } from "@tanstack/react-query";
import { Check, FlagIcon, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/utils/trpc";

const ISSUE_CATEGORIES_CONVERSATION = [
	{ id: "audio", label: "Audio issues" },
	{ id: "response", label: "Incorrect AI response" },
	{ id: "translation", label: "Translation problem" },
	{ id: "ui", label: "UI / display bug" },
	{ id: "other", label: "Other" },
] as const;

const ISSUE_CATEGORIES_PRONUNCIATION = [
	{ id: "audio", label: "Audio issues" },
	{ id: "translation", label: "Translation problem" },
	{ id: "ui", label: "UI / display bug" },
	{ id: "other", label: "Other" },
] as const;

export default function ReportIssueDialog({
	sessionId,
	sessionType,
}: {
	sessionId: string;
	sessionType: "conversation" | "pronunciation";
}) {
	const trpc = useTRPC();
	const [flagOpen, setFlagOpen] = useState(false);
	const [selectedCategory, setSelectedCategory] = useState<string>("");
	const [feedbackText, setFeedbackText] = useState("");
	const [submitted, setSubmitted] = useState(false);

	const submitReport = useMutation(
		trpc.issueReport.submit.mutationOptions({
			onError: (err) => {
				toast.error(err.message);
			},
		}),
	);

	const handleSubmitFeedback = async () => {
		if (!selectedCategory) return;
		try {
			await submitReport.mutateAsync({
				sessionId,
				sessionType,
				category: selectedCategory,
				description: feedbackText || undefined,
			});
			setSubmitted(true);
			// setTimeout(() => {
			// 	setFlagOpen(false);
			// 	setSelectedCategory("");
			// 	setFeedbackText("");
			// 	setSubmitted(false);
			// }, 1500);
		} catch (err) {
			console.error("Failed to submit feedback:", err);
		}
	};
	return (
		<Dialog
			open={flagOpen}
			onOpenChange={(open) => {
				setFlagOpen(open);
				if (!open) {
					setSelectedCategory("");
					setFeedbackText("");
					setSubmitted(false);
				}
			}}
		>
			<DialogTrigger asChild>
				<Button
					variant="outline"
					size="icon"
					className="size-9 cursor-pointer rounded-xl shadow-none"
				>
					<FlagIcon className="size-4" fill="currentColor" strokeWidth={2} />
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-md">
				{submitted ? (
					<div className="flex flex-col items-center gap-3 py-8">
						<div className="flex size-12 items-center justify-center rounded-full border border-lime-400 bg-radial from-lime-50 to-lime-400">
							<Check className="size-6 text-lime-600" />
						</div>
						<p className="font-medium">Thanks for your feedback!</p>
					</div>
				) : (
					<>
						<DialogHeader>
							<DialogTitle>Report an issue</DialogTitle>
							<DialogDescription>
								Let us know what went wrong so we can improve your practice
								experience.
							</DialogDescription>
						</DialogHeader>
						<div className="flex flex-col gap-4 py-2">
							<div className="flex flex-wrap gap-2">
								{sessionType === "conversation"
									? ISSUE_CATEGORIES_CONVERSATION.map((cat) => (
											<button
												key={cat.id}
												type="button"
												onClick={() => setSelectedCategory(cat.id)}
												className={cn(
													"rounded-xl border px-3 py-1.5 text-sm transition-colors",
													selectedCategory === cat.id
														? "bg-linear-to-t from-[#202020] to-[#2F2F2F] text-white"
														: "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50",
												)}
											>
												{cat.label}
											</button>
										))
									: ISSUE_CATEGORIES_PRONUNCIATION.map((cat) => (
											<button
												key={cat.id}
												type="button"
												onClick={() => setSelectedCategory(cat.id)}
												className={cn(
													"rounded-xl border px-3 py-1.5 text-sm transition-colors",
													selectedCategory === cat.id
														? "bg-linear-to-t from-[#202020] to-[#2F2F2F] text-white"
														: "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50",
												)}
											>
												{cat.label}
											</button>
										))}
							</div>
							<Textarea
								placeholder="Describe the issue (optional)..."
								value={feedbackText}
								onChange={(e) => setFeedbackText(e.target.value)}
								className="min-h-24 resize-none rounded-xl"
							/>
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
								onClick={handleSubmitFeedback}
								disabled={!selectedCategory || submitReport.isPending}
								className="relative flex shrink-0 cursor-pointer items-center justify-center gap-1.5 overflow-hidden whitespace-nowrap rounded-xl bg-linear-to-t from-[#202020] to-[#2F2F2F] font-base text-white italic shadow-[inset_0_1px_4px_0_rgba(255,255,255,0.4)] outline-none backdrop-blur transition-all hover:opacity-90 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-40 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:from-[rgb(192,192,192)] dark:to-[rgb(255,255,255)] dark:shadow-[inset_0_1px_4px_0_rgba(128,128,128,0.2)] dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none"
							>
								{submitReport.isPending ? (
									<Loader2 className="size-4 animate-spin" />
								) : (
									"Submit"
								)}
							</Button>
						</DialogFooter>
					</>
				)}
			</DialogContent>
		</Dialog>
	);
}
