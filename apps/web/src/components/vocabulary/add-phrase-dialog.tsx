import { Loader, Plus } from "lucide-react";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "../ui/button";

export default function AddPhraseDialogContent({
	newPhrase,
	setNewPhrase,
	onSubmit,
	addDialogOpen,
	setAddDialogOpen,
	isPending,
}: {
	newPhrase: string;
	setNewPhrase: React.Dispatch<React.SetStateAction<string>>;
	onSubmit: () => void;
	isPending: boolean;
	addDialogOpen: boolean;
	setAddDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
	return (
		<Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="font-bold font-lyon text-xl">
						Add New Phrase
					</DialogTitle>
				</DialogHeader>
				<div className="space-y-4 py-2">
					<div className="space-y-2">
						<Label htmlFor="phrase">Phrase</Label>
						<Input
							id="phrase"
							placeholder='e.g., "Break a leg"'
							value={newPhrase}
							onChange={(e) => setNewPhrase(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") onSubmit();
							}}
						/>
						<p className="text-muted-foreground text-xs">
							Meaning, pronunciation, and translation will be added
							automatically.
						</p>
					</div>
				</div>
				<div className="flex justify-end gap-2">
					<DialogClose asChild>
						<Button variant="outline">Cancel</Button>
					</DialogClose>
					<Button onClick={onSubmit} disabled={!newPhrase.trim() || isPending}>
						{isPending ? (
							<Loader className="mr-2 size-4 animate-spin" />
						) : (
							<Plus className="mr-2 size-4" />
						)}
						Add Phrase
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
