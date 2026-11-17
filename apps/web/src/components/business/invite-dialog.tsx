import { Check, Link2 } from "lucide-react";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
	CURRENT_WORKSPACE,
	type MemberRole,
	TEAMS,
	type TeamId,
} from "@/lib/business/mock-data";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseEmails(value: string) {
	return value
		.split(/[\s,;]+/)
		.map((item) => item.trim())
		.filter(Boolean);
}

export function InviteDialog({
	open,
	onOpenChange,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const [emails, setEmails] = useState("");
	const [teamId, setTeamId] = useState<TeamId>("sales");
	const [role, setRole] = useState<MemberRole>("learner");
	const [copied, setCopied] = useState(false);

	const parsed = parseEmails(emails);
	const invalid = parsed.filter((email) => !EMAIL_PATTERN.test(email));
	const canSubmit = parsed.length > 0 && invalid.length === 0;

	function reset() {
		setEmails("");
		setTeamId("sales");
		setRole("learner");
		setCopied(false);
	}

	function handleOpenChange(next: boolean) {
		if (!next) reset();
		onOpenChange(next);
	}

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!canSubmit) return;
		toast.success(
			parsed.length === 1
				? `Invite sent to ${parsed[0]}`
				: `Invites sent to ${parsed.length} people`,
		);
		handleOpenChange(false);
	}

	async function handleCopyLink() {
		const link = `https://business.english.now/join/${CURRENT_WORKSPACE.id}`;
		try {
			await navigator.clipboard.writeText(link);
			setCopied(true);
			toast.success("Invite link copied");
		} catch {
			toast.error("Could not copy the link");
		}
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-md">
				<form onSubmit={handleSubmit} className="flex flex-col gap-5">
					<DialogHeader>
						<DialogTitle className="text-[#172033]">Invite members</DialogTitle>
						<DialogDescription>
							They will get an email to join {CURRENT_WORKSPACE.name} and start
							practicing English.
						</DialogDescription>
					</DialogHeader>

					<div className="flex flex-col gap-2">
						<Label htmlFor="invite-emails">Email addresses</Label>
						<Textarea
							id="invite-emails"
							value={emails}
							onChange={(event) => setEmails(event.target.value)}
							placeholder={`anna@${CURRENT_WORKSPACE.domain}, tom@${CURRENT_WORKSPACE.domain}`}
							className="min-h-24 resize-none"
							aria-invalid={invalid.length > 0}
						/>
						<p className="text-[#5B6478] text-xs">
							{invalid.length > 0
								? `Check ${invalid.length === 1 ? "this address" : "these addresses"}: ${invalid.join(", ")}`
								: "Separate addresses with commas or new lines."}
						</p>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div className="flex flex-col gap-2">
							<Label>Team</Label>
							<Select
								value={teamId}
								onValueChange={(value) => setTeamId(value as TeamId)}
							>
								<SelectTrigger className="w-full">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{TEAMS.map((team) => (
										<SelectItem key={team.id} value={team.id}>
											{team.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="flex flex-col gap-2">
							<Label>Role</Label>
							<Select
								value={role}
								onValueChange={(value) => setRole(value as MemberRole)}
							>
								<SelectTrigger className="w-full">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="learner">Learner</SelectItem>
									<SelectItem value="admin">Admin</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					<DialogFooter className="flex-row items-center justify-between gap-2 sm:justify-between">
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={handleCopyLink}
						>
							{copied ? <Check /> : <Link2 />}
							Copy invite link
						</Button>
						<Button
							type="submit"
							disabled={!canSubmit}
							className="bg-[#172033] text-white hover:bg-[#172033]/90"
						>
							{parsed.length > 1
								? `Send ${parsed.length} invites`
								: "Send invite"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
