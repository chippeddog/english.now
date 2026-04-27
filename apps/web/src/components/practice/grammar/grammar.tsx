import { BookOpenIcon, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { GrammarPickerDialog } from "@/components/practice/grammar/grammar-picker-dialog";

export default function Grammar() {
	const { t } = useTranslation("app");
	const [dialogOpen, setDialogOpen] = useState(false);

	return (
		<div
			className="overflow-hidden rounded-[1.2rem] bg-white transition-all hover:scale-[1.02]"
			style={{
				boxShadow:
					"0 0 0 1px rgba(0,0,0,.05),0 10px 10px -5px rgba(0,0,0,.04),0 20px 25px -5px rgba(0,0,0,.04),0 20px 32px -12px rgba(0,0,0,.04)",
			}}
		>
			<GrammarPickerDialog open={dialogOpen} setOpen={setDialogOpen} />
			<button
				type="button"
				onClick={() => {
					setDialogOpen(true);
				}}
				className="group flex w-full cursor-pointer items-center justify-between p-2.5 sm:items-start sm:p-3 md:items-center"
			>
				<div className="flex items-center gap-2.5 sm:flex-col sm:items-start md:flex-row md:items-center md:gap-3">
					<div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-[#C6F64D] bg-radial from-[#EFFF9B] to-[#D8FF76] sm:size-8 md:size-10">
						<BookOpenIcon className="size-4.5 text-lime-700 sm:size-4 md:size-5" />
					</div>
					<div className="min-w-0 flex-1 text-left">
						<h2 className="font-medium text-zinc-900">
							{t("practice.grammar")}
						</h2>
						<p className="text-muted-foreground text-sm">
							{t("practice.practiceYourGrammar")}
						</p>
					</div>
				</div>
				<ChevronRight
					strokeWidth={2}
					className="size-4.5 text-muted-foreground transition-all duration-300 group-hover:text-zinc-700"
				/>
			</button>
		</div>
	);
}

export { GrammarPickerDialog } from "@/components/practice/grammar/grammar-picker-dialog";
