import { Trans, useTranslation } from "@english.now/i18n";
import { Link } from "@tanstack/react-router";
import { Button } from "../ui/button";

export function Start() {
	const { t } = useTranslation("home");
	const { t: tCommon } = useTranslation("common");

	return (
		<section className="mt-16 mb-10 md:mt-32 md:mb-16">
			<div className="relative isolate overflow-hidden rounded-3xl bg-[#F5F7FA] ring-1 ring-[rgba(23,32,51,0.08)]">
				<div
					aria-hidden="true"
					className="-z-10 absolute inset-0 bg-[radial-gradient(95%_62%_at_50%_52%,rgba(255,255,255,0.88)_0%,rgba(255,255,255,0.55)_60%,rgba(255,255,255,0)_100%)] md:bg-[radial-gradient(52%_58%_at_50%_50%,rgba(255,255,255,0.82)_0%,rgba(255,255,255,0.45)_55%,rgba(255,255,255,0)_100%)]"
				/>

				<div className="flex flex-col items-center justify-center px-6 py-10 text-center md:px-10 md:py-16">
					<h2 className="mt-5 max-w-[18ch] font-geist-serif font-normal text-[#172033] text-[clamp(2.25rem,4.8vw,3.75rem)] leading-[1.05] tracking-[-0.035em]">
						<Trans components={{ br: <br className="hidden sm:inline" /> }}>
							{t("start.title")}
						</Trans>
					</h2>

					<div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
						<Button
							size="lg"
							asChild
							className="rounded-[10px] px-5 focus-visible:ring-[#007AFF]/40"
						>
							<Link to="/login">{tCommon("actions.getStarted")}</Link>
						</Button>
						<Button
							size="lg"
							variant="outline"
							asChild
							className="rounded-[10px] border-[rgba(23,32,51,0.14)] bg-white/90 px-5 text-[#172033] shadow-none backdrop-blur-sm hover:bg-white focus-visible:ring-[#007AFF]/40 dark:border-[rgba(23,32,51,0.14)] dark:bg-white/90 dark:hover:bg-white"
						>
							<Link to="/book-a-demo">Book a demo</Link>
						</Button>
					</div>

					<p className="mt-4 font-medium text-[#5B6478] text-[13px]">
						{t("start.subtitle")}
					</p>
				</div>
			</div>
		</section>
	);
}
