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

type DeleteItemDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
};

export default function DeleteItemDialog({
	open,
	onOpenChange,
	onConfirm,
}: DeleteItemDialogProps) {
	const { t } = useTranslation("app");

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent className="w-sm">
				<AlertDialogHeader>
					<AlertDialogTitle>
						{t("vocabulary.itemRow.deleteTitle")}
					</AlertDialogTitle>
					<AlertDialogDescription>
						{t("vocabulary.itemRow.deleteDescription")}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel
						variant="ghost"
						className="rounded-xl text-sm italic"
					>
						{t("vocabulary.itemRow.cancel")}
					</AlertDialogCancel>
					<AlertDialogAction
						className="rounded-xl text-sm italic"
						variant="gradientRed"
						onClick={onConfirm}
					>
						{t("vocabulary.itemRow.delete")}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
