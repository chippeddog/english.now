import { useNavigate } from "@tanstack/react-router";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function LeavePracticeDialog({
	leaveDialogOpen,
	setLeaveDialogOpen,
}: {
	leaveDialogOpen: boolean;
	setLeaveDialogOpen: (open: boolean) => void;
}) {
	const navigate = useNavigate();

	return (
		<AlertDialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
			<AlertDialogContent className="w-sm">
				<AlertDialogHeader>
					<AlertDialogTitle>Leave practice?</AlertDialogTitle>
					<AlertDialogDescription>
						You can leave this session now and continue it later from the
						practice page.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel className="rounded-xl bg-neutral-100 text-neutral-900 italic hover:bg-neutral-200">
						Continue
					</AlertDialogCancel>
					<AlertDialogAction
						className="relative flex cursor-pointer items-center justify-center gap-1.5 overflow-hidden whitespace-nowrap rounded-xl bg-linear-to-t from-[#202020] to-[#2F2F2F] font-base text-white italic shadow-[inset_0_1px_4px_0_rgba(255,255,255,0.4)] outline-none backdrop-blur transition-all hover:opacity-90 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-40 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:from-[rgb(192,192,192)] dark:to-[rgb(255,255,255)] dark:shadow-[inset_0_1px_4px_0_rgba(128,128,128,0.2)] dark:aria-invalid:ring-destructive/40"
						onClick={() => navigate({ to: "/practice" })}
					>
						Leave for now
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
