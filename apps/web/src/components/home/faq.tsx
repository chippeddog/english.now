import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";

interface FAQItem {
	question: string;
	answer: string;
}

const faqData: FAQItem[] = [
	{
		question: "How does English Now help me learn English?",
		answer:
			"English Now is an all-in-one English learning app that combines conversation practice, vocabulary building, grammar lessons, and personalized feedback. Our AI-powered system adapts to your learning style and provides real-time corrections and suggestions to help you improve faster.",
	},
	{
		question: "Do I need to pay to use English Now?",
		answer:
			"We offer both free and premium plans. The free plan includes basic features like limited conversation practice and vocabulary exercises. Our premium plan unlocks unlimited practice sessions, advanced AI feedback, personalized learning paths, and priority support.",
	},
	{
		question: "Can I practice speaking English with the app?",
		answer:
			"Yes! English Now includes conversation practice features where you can have real-time conversations with our AI tutor. The AI will help you practice pronunciation, correct your mistakes, and guide you through natural conversations on various topics.",
	},
	{
		question: "Is my progress saved across devices?",
		answer:
			"Absolutely! Your progress, vocabulary, and learning history are automatically synced across all your devices when you sign in with your account. You can seamlessly continue learning on your phone, tablet, or computer.",
	},
	{
		question: "How is this different from other English learning apps?",
		answer:
			"English Now combines multiple learning methods in one app - conversation practice, vocabulary, grammar, and personalized feedback - all powered by advanced AI. Instead of switching between different apps, you get everything you need in one place, with a learning experience that adapts to your needs.",
	},
	{
		question: "Can I use English Now offline?",
		answer:
			"Some features are available offline, such as reviewing your saved vocabulary and completed lessons. However, conversation practice and AI feedback require an internet connection. We're working on expanding offline capabilities in future updates.",
	},
];

export default function FAQ() {
	return (
		<div className="group mx-auto my-20 md:my-32">
			<div className="flex flex-col gap-4 md:flex-row">
				<div className="md:w-1/4">
					<div className="mb-14 text-center">
						<h2 className="mb-4 text-center font-bold font-lyon text-4xl tracking-tight md:text-left md:text-5xl">
							FAQs
						</h2>
						<div className="flex flex-col gap-0 text-center md:gap-3 md:text-left">
							<p className="text-balance text-muted-foreground text-sm md:mx-auto md:max-w-boundary-sm md:text-lg">
								Can't find the answer you are looking for?
							</p>
							<a
								href="mailto:support@english.now"
								className="text-lime-700 text-sm underline transition-all duration-300 hover:text-lime-700/80 md:text-base"
							>
								support@english.now
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
							{faqData.map((item, index) => (
								<AccordionItem
									key={`faq-${item.question.slice(0, 20)}`}
									value={`item-${index}`}
									className="border-border/50 border-b bg-background px-6 transition-all duration-300 first:rounded-t-2xl last:rounded-b-2xl last:border-b-0"
								>
									<AccordionTrigger className="cursor-pointer text-left font-medium text-sm transition-all duration-300 hover:no-underline md:text-base">
										{item.question}
									</AccordionTrigger>
									<AccordionContent>
										<p className="text-muted-foreground text-xs leading-relaxed transition-all duration-300 md:text-base">
											{item.answer}
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
