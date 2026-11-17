import { CALL_TUTORS } from "@english.now/api/services/call-tutors";
import { Link } from "@tanstack/react-router";
import { Phone } from "lucide-react";
import { useTranslation } from "react-i18next";
import { TutorAvatar } from "@/components/call/tutor-avatar";

export default function CallTutorCard() {
	const { t } = useTranslation("app");

	return (
		<Link
			to="/practice/call"
			className="group flex w-full items-center justify-between gap-4 rounded-[1.2rem] bg-white p-3 outline-none transition-all hover:scale-[1.01] focus-visible:ring-[#007AFF]/40 focus-visible:ring-[3px] sm:p-4"
			style={{
				boxShadow:
					"0 0 0 1px rgba(0,0,0,.05),0 10px 10px -5px rgba(0,0,0,.04),0 20px 25px -5px rgba(0,0,0,.04),0 20px 32px -12px rgba(0,0,0,.04)",
			}}
		>
			<div className="flex min-w-0 items-center gap-3">
				<span className="-space-x-2 flex shrink-0">
					{CALL_TUTORS.slice(0, 3).map((tutor) => (
						<TutorAvatar
							key={tutor.id}
							tone={tutor.tone}
							className="size-9 ring-2 ring-white md:size-10"
						/>
					))}
				</span>
				<div className="min-w-0 text-left">
					<h2 className="font-medium text-zinc-900">{t("call.entryTitle")}</h2>
					<p className="text-muted-foreground text-sm">
						{t("call.entryDescription")}
					</p>
				</div>
			</div>
			<span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#34C759] text-white transition-colors group-hover:bg-[#34C759]/90">
				<Phone className="size-4.5" />
			</span>
		</Link>
	);
}
