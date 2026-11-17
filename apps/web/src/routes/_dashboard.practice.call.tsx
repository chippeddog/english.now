import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { TutorPicker } from "@/components/call/tutor-picker";
import { createTitle } from "@/utils/title";

export const Route = createFileRoute("/_dashboard/practice/call")({
	component: CallTutorPage,
	head: () => ({
		meta: [
			{
				title: createTitle("Call a tutor"),
			},
		],
	}),
});

function CallTutorPage() {
	const { t } = useTranslation("app");

	return (
		<div className="min-h-screen">
			<div className="container relative z-10 mx-auto max-w-3xl px-4 py-6 pb-12">
				<Link
					to="/practice"
					className="mb-4 inline-flex items-center gap-1 text-muted-foreground text-sm transition-colors hover:text-foreground"
				>
					<ChevronLeft className="size-4" />
					{t("call.backToPractice")}
				</Link>
				<div className="mb-8 flex flex-col gap-2">
					<h1 className="font-bold font-lyon text-3xl tracking-tight">
						{t("call.pickerTitle")}
					</h1>
					<p className="max-w-[56ch] text-[#5B6478]">
						{t("call.pickerSubtitle")}
					</p>
				</div>
				<TutorPicker />
			</div>
		</div>
	);
}
