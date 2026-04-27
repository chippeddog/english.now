import { useTranslation } from "react-i18next";
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

export type DeleteSessionTarget = {
	id: string;
	type: "conversation" | "pronunciation" | "grammar";
	title: string;
};

type DeleteSessionDialogProps = {
	target: DeleteSessionTarget | null;
	isPending: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: (target: DeleteSessionTarget) => void;
};

export default function DeleteSessionDialog({
	target,
	isPending,
	onOpenChange,
	onConfirm,
}: DeleteSessionDialogProps) {
	const { t } = useTranslation("app");

	return (
		<AlertDialog open={target !== null} onOpenChange={onOpenChange}>
			<AlertDialogContent className="w-sm">
				<AlertDialogHeader>
					<AlertDialogTitle>{t("practice.deleteSession")}</AlertDialogTitle>
					<AlertDialogDescription>
						{t("practice.deleteConfirmation", {
							title: target?.title,
						})}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel
						variant="ghost"
						className="flex-1 rounded-xl text-sm italic sm:flex-none"
					>
						{t("practice.cancel")}
					</AlertDialogCancel>
					<AlertDialogAction
						className="rounded-xl text-sm italic"
						variant="gradientRed"
						disabled={isPending}
						onClick={() => {
							if (target) {
								onConfirm(target);
							}
						}}
					>
						{isPending ? t("practice.deleting") : t("practice.delete")}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
