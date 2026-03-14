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
						<Button variant="outline">Cancel</Button>
					</DialogClose>
					<Button onClick={onSubmit} disabled={!newWord.trim() || isPending}>
						{isPending ? (
							<Loader className="mr-2 size-4 animate-spin" />
						) : (
							<Plus className="mr-2 size-4" />
						)}
						Add Word
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
