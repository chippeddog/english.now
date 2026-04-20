import { Loader, Plus } from "lucide-react";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

export default function AddWordDialog({
	addDialogOpen,
	setAddDialogOpen,
	newWord,
	setNewWord,
	onSubmit,
	isPending,
	helperText,
}: {
	addDialogOpen: boolean;
	setAddDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
	newWord: string;
	setNewWord: React.Dispatch<React.SetStateAction<string>>;
	onSubmit: () => void;
	isPending: boolean;
	helperText?: string;
}) {
	return (
		<Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="font-bold font-lyon text-xl">
						Add New Word
					</DialogTitle>
				</DialogHeader>
				<div className="space-y-4 py-2">
					<div className="space-y-2">
						<Label htmlFor="word">Word</Label>
						<Input
							id="word"
							placeholder="e.g., serendipity"
							value={newWord}
							onChange={(e) => setNewWord(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") onSubmit();
							}}
						/>
						<p className="text-muted-foreground text-xs">
							Definition, pronunciation, and translation will be added
							automatically.
						</p>
						{helperText ? (
							<p className="text-muted-foreground text-xs">{helperText}</p>
						) : null}
					</div>
				</div>
				<div className="flex justify-end gap-2">
					<DialogClose asChild>
						<Button
							variant="ghost"
							className="flex-1 rounded-xl italic sm:flex-none"
						>
							Cancel
						</Button>
					</DialogClose>
					<Button
						className="relative flex shrink-0 cursor-pointer items-center justify-center gap-1.5 overflow-hidden whitespace-nowrap rounded-xl bg-linear-to-t from-[#202020] to-[#2F2F2F] font-base text-white italic shadow-[inset_0_1px_4px_0_rgba(255,255,255,0.4)] outline-none backdrop-blur transition-all hover:opacity-90 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-40 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:from-[rgb(192,192,192)] dark:to-[rgb(255,255,255)] dark:shadow-[inset_0_1px_4px_0_rgba(128,128,128,0.2)] dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none"
						onClick={onSubmit}
						disabled={!newWord.trim() || isPending}
					>
						Add Word
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
