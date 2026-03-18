import { BookOpenIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Pronunciation() {
	const { t } = useTranslation("app");
	return (
		<div
			className="overflow-hidden rounded-[1.2rem] bg-white"
			style={{
				boxShadow:
					"0 0 0 1px rgba(0,0,0,.05),0 10px 10px -5px rgba(0,0,0,.04),0 20px 25px -5px rgba(0,0,0,.04),0 20px 32px -12px rgba(0,0,0,.04)",
			}}
		>
			<button
				type="button"
				disabled
				className="group flex w-full cursor-not-allowed items-center justify-between p-3.5 transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-50"
			>
				<div className="flex items-center gap-2.5">
					<div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[#C6F64D] bg-radial from-[#EFFF9B] to-[#D8FF76]">
						<BookOpenIcon className="size-5 text-lime-700" />
					</div>
					<div className="text-left">
						<div className="flex items-center gap-1">
							<h2 className="font-medium text-slate-900">Grammar</h2>
							<span className="rounded-md bg-lime-200 px-1.5 py-0.5 font-semibold text-[10px] text-lime-950 uppercase tracking-wide">
								soon
							</span>
						</div>
						<p className="text-muted-foreground text-sm">
							Practice your grammar
						</p>
					</div>
				</div>
			</button>
		</div>
	);
}
