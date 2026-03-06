import { useTranslation } from "@english.now/i18n";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";

const faqData = [
	{ key: "howDoesItHelp" },
	{ key: "doINeedToPay" },
	{ key: "canIPracticeSpeaking" },
	{ key: "isProgressSaved" },
	{ key: "howIsDifferent" },
	{ key: "canIUseOffline" },
];

export default function FAQ() {
	const { t } = useTranslation("home");

	return (
		<div className="group mx-auto my-16 md:my-32">
			<div className="flex flex-col gap-4 md:flex-row">
				<div className="md:w-1/4">
					<div className="mb-10 text-center md:mb-14">
						<h2 className="mb-4 text-center font-bold font-lyon text-4xl tracking-tight md:text-left md:text-5xl">
							{t("faq.title")}
						</h2>
						<div className="flex flex-col gap-0 text-center md:gap-3 md:text-left">
							<p className="text-balance text-muted-foreground text-sm md:mx-auto md:max-w-boundary-sm md:text-lg">
								{t("faq.subtitle")}
							</p>
							<a
								href="mailto:support@english.now"
								className="text-lime-700 text-sm underline transition-all duration-300 hover:text-lime-700/80 md:text-base"
							>
								{t("faq.contact")}
							</a>
						</div>
					</div>
				</div>
				<div className="md:w-3/4">
					<div className="overflow-hidden rounded-3xl bg-neutral-100 p-2">
						<Accordion
							type="single"
							collapsible
							className="w-full rounded-2xl"
							style={{
								boxShadow:
									"0 0 0 1px rgba(0,0,0,.05),0 10px 10px -5px rgba(0,0,0,.04),0 20px 25px -5px rgba(0,0,0,.04),0 20px 32px -12px rgba(0,0,0,.04)",
							}}
						>
							{faqData.map((item) => (
								<AccordionItem
									key={item.key}
									value={item.key}
									className="border-border/50 border-b bg-background px-6 transition-all duration-300 first:rounded-t-2xl last:rounded-b-2xl last:border-b-0"
								>
									<AccordionTrigger className="cursor-pointer text-left font-medium text-sm transition-all duration-300 hover:no-underline md:text-base">
										{t(`faq.items.${item.key}.question`)}
									</AccordionTrigger>
									<AccordionContent>
										<p className="text-muted-foreground text-xs leading-relaxed transition-all duration-300 md:text-base">
											{t(`faq.items.${item.key}.answer`)}
										</p>
									</AccordionContent>
								</AccordionItem>
							))}
						</Accordion>
					</div>
				</div>
			</div>
		</div>
	);
}
