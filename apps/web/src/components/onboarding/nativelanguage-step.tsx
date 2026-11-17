import { useTranslation } from "@english.now/i18n";
import { ArrowRight, Check } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";

const LANGUAGES = [
	{ id: "uk", name: "Ukrainian", flag: "🇺🇦" },
	{ id: "en", name: "English", flag: "🇬🇧" },
	{ id: "fr", name: "French", flag: "🇫🇷" },
	{ id: "es", name: "Spanish", flag: "🇪🇸" },
	{ id: "de", name: "German", flag: "🇩🇪" },
	{ id: "pt", name: "Portuguese", flag: "🇵🇹" },
	{ id: "it", name: "Italian", flag: "🇮🇹" },
	{ id: "pl", name: "Polish", flag: "🇵🇱" },
	{ id: "ja", name: "Japanese", flag: "🇯🇵" },
	{ id: "ko", name: "Korean", flag: "🇰🇷" },
	{ id: "zh", name: "Chinese", flag: "🇨🇳" },
	{ id: "ar", name: "Arabic", flag: "🇸🇦" },
	{ id: "hi", name: "Hindi", flag: "🇮🇳" },
	{ id: "tr", name: "Turkish", flag: "🇹🇷" },
];

export default function NativeLanguageStep({
	selected,
	onSelect,
	onNext,
	canProceed,
}: {
	selected: string;
	onSelect: (id: string) => void;
	onNext: () => void;
	canProceed: boolean;
}) {
	const [search, setSearch] = useState("");
	const { t } = useTranslation("onboarding");
	const { t: tCommon } = useTranslation("common");
	const filtered = LANGUAGES.filter((lang) =>
		lang.name.toLowerCase().includes(search.toLowerCase()),
	);

	return (
		<div className="flex flex-1 flex-col px-4 py-8">
			<div className="mx-auto w-full max-w-lg">
				<div className="mb-8 text-center">
					<h1 className="mb-4 font-bold font-lyon text-4xl tracking-tight md:text-5xl">
						{t("nativeLanguage.title")}
					</h1>
					<p className="text-muted-foreground md:text-lg">
						{t("nativeLanguage.subtitle")}
					</p>
				</div>

				<div className="mb-4">
					<input
						type="text"
						placeholder={t("nativeLanguage.searchPlaceholder")}
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-lime-400 focus:ring-2 focus:ring-lime-100"
					/>
				</div>

				<div className="grid grid-cols-2 gap-3">
					{filtered.map((lang) => {
						const isSelected = selected === lang.id;
						return (
							<button
								key={lang.id}
								type="button"
								onClick={() => onSelect(lang.id)}
								className={cn(
									"relative flex items-center gap-2.5 rounded-2xl border-2 p-4 text-left transition-all",
									isSelected
										? "border-lime-500 bg-lime-50"
										: "border-transparent bg-white hover:bg-neutral-50",
								)}
								style={
									!isSelected
										? {
												boxShadow:
													"0 0 0 1px rgba(0,0,0,.05),0 2px 4px rgba(0,0,0,.04)",
											}
										: undefined
								}
							>
								{isSelected && (
									<div className="absolute top-3 right-3 flex size-5 items-center justify-center rounded-full bg-lime-500">
										<Check className="size-3 text-white" />
									</div>
								)}
								<span className="text-2xl">{lang.flag}</span>
								<span className="font-semibold">{lang.name}</span>
							</button>
						);
					})}
				</div>

				{filtered.length === 0 && (
					<p className="mt-4 text-center text-muted-foreground text-sm">
						{t("nativeLanguage.noLanguagesFound")}
					</p>
				)}

				<div className="mt-8">
					<Button
						size="lg"
						variant="progress"
						className="h-14 w-full rounded-2xl text-base"
						disabled={!canProceed}
						onClick={onNext}
					>
						{tCommon("actions.continue")}
						<ArrowRight className="size-5" />
					</Button>
				</div>
			</div>
		</div>
	);
}
