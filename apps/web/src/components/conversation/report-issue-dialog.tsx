import { Check, FlagIcon, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const ISSUE_CATEGORIES = [
	{ id: "audio", label: "Audio issues" },
	{ id: "response", label: "Incorrect AI response" },
	{ id: "translation", label: "Translation problem" },
	{ id: "ui", label: "UI / display bug" },
	{ id: "other", label: "Other" },
] as const;

export default function ReportIssueDialog() {
	const [flagOpen, setFlagOpen] = useState(false);
	const [selectedCategory, setSelectedCategory] = useState<string>("");

	const [feedbackText, setFeedbackText] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitted, setSubmitted] = useState(false);

	const handleSubmitFeedback = async () => {
		if (!selectedCategory) return;
		setIsSubmitting(true);
		try {
			await new Promise((resolve) => setTimeout(resolve, 600));
			setSubmitted(true);
			setTimeout(() => {
				setFlagOpen(false);
				setSelectedCategory("");
				setFeedbackText("");
				setSubmitted(false);
			}, 1500);
		} catch (err) {
			console.error("Failed to submit feedback:", err);
		} finally {
			setIsSubmitting(false);
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
				<Button variant="outline" size="icon" className="size-9 rounded-xl">
					<FlagIcon className="size-4" fill="currentColor" strokeWidth={2} />
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-md">
				{submitted ? (
					<div className="flex flex-col items-center gap-3 py-8">
						<div className="flex size-12 items-center justify-center rounded-full bg-lime-100">
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
								{ISSUE_CATEGORIES.map((cat) => (
									<button
										key={cat.id}
										type="button"
										onClick={() => setSelectedCategory(cat.id)}
										className={cn(
											"rounded-lg border px-3 py-1.5 text-sm transition-colors",
											selectedCategory === cat.id
												? "border-neutral-900 bg-neutral-900 text-white"
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
						<DialogFooter>
							<Button
								onClick={handleSubmitFeedback}
								disabled={!selectedCategory || isSubmitting}
								className="w-full rounded-xl"
							>
								{isSubmitting ? (
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
