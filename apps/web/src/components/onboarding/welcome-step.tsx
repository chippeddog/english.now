import { useTranslation } from "@english.now/i18n";
import { ArrowRight, MessageCircle, Target, Trophy } from "lucide-react";
import { Button } from "../ui/button";

export default function WelcomeStep({ onNext }: { onNext: () => void }) {
	const { t } = useTranslation("onboarding");
	const { t: tCommon } = useTranslation("common");
	return (
		<div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
			<div className="mx-auto w-full max-w-md text-center">
				<div className="mb-6 flex items-center justify-center">
					<div className="relative size-20 overflow-hidden rounded-4xl border border-[#C6F64D] bg-[radial-gradient(100%_100%_at_50%_0%,#EFFF9B_0%,#D8FF76_60%,#C6F64D_100%)]">
						<img
							className="absolute bottom-[-15px] h-full w-full object-contain"
							src="/logo-404.svg"
							alt="English Now Logo"
							width={62}
							height={62}
						/>
					</div>
				</div>

				<h1 className="mb-4 font-bold font-lyon text-4xl tracking-tight md:text-5xl">
					{t("welcome.title")}
				</h1>

				<p className="mb-8 text-muted-foreground md:text-lg">
					{t("welcome.subtitle")}
				</p>

				<div className="mb-8 space-y-3 text-left">
					{[
						{ icon: MessageCircle, text: t("welcome.features.conversations") },
						{ icon: Target, text: t("welcome.features.personalizedPath") },
						{ icon: Trophy, text: t("welcome.features.trackProgress") },
					].map((feature) => (
						<div
							key={feature.text}
							className="group flex items-center gap-3 rounded-2xl bg-white p-3 transition-all duration-300 hover:bg-neutral-50"
							style={{
								boxShadow:
									"0 0 0 1px rgba(0,0,0,.05),0 10px 10px -5px rgba(0,0,0,.04),0 20px 25px -5px rgba(0,0,0,.04),0 20px 32px -12px rgba(0,0,0,.04)",
							}}
						>
							<div className="flex size-10 items-center justify-center rounded-xl border border-[#C6F64D] bg-radial from-[#EFFF9B] to-[#D8FF76]">
								<feature.icon className="size-5 text-lime-700" />
							</div>
							<span className="font-medium">{feature.text}</span>
						</div>
					))}
				</div>
				<Button
					size="lg"
					variant="progress"
					className="h-14 w-full rounded-2xl text-base"
					onClick={onNext}
				>
					{tCommon("actions.getStarted")}
					<ArrowRight className="size-5" />
				</Button>
			</div>
		</div>
	);
}
