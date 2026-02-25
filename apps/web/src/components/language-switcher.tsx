import {
	changeLanguage,
	getCurrentLanguage,
	languageNames,
	type SupportedLanguage,
	supportedLanguages,
	useTranslation,
} from "@english.now/i18n";
import { Check, ChevronDown, Search } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const interfaceLanguages = supportedLanguages.map((code) => ({
	value: code,
	label: languageNames[code],
}));

export function LanguageSwitcher({ className }: { className?: string }) {
	const { i18n } = useTranslation();
	const [interfaceLang, setInterfaceLang] = React.useState<SupportedLanguage>(
		getCurrentLanguage(),
	);
	const [open, setOpen] = React.useState(false);
	const [search, setSearch] = React.useState("");
	const inputRef = React.useRef<HTMLInputElement>(null);

	// Sync with i18n when language changes externally
	React.useEffect(() => {
		const handleLanguageChanged = (lng: string) => {
			setInterfaceLang(lng as SupportedLanguage);
		};
		i18n.on("languageChanged", handleLanguageChanged);
		return () => {
			i18n.off("languageChanged", handleLanguageChanged);
		};
	}, [i18n]);

	// Focus input when popover opens
	React.useEffect(() => {
		if (open) {
			setTimeout(() => inputRef.current?.focus(), 0);
		} else {
			setSearch("");
		}
	}, [open]);

	const filteredLanguages = interfaceLanguages.filter((lang) =>
		lang.label.toLowerCase().includes(search.toLowerCase()),
	);

	const interfaceLabel = interfaceLanguages.find(
		(l) => l.value === interfaceLang,
	)?.label;

	const handleSelectLanguage = async (value: string) => {
		const lang = value as SupportedLanguage;
		await changeLanguage(lang);
		setInterfaceLang(lang);
		setOpen(false);
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					size="sm"
					aria-expanded={open}
					className={cn(
						"flex h-9 items-center gap-[4px] rounded-lg px-2.5 shadow-none",
						className,
					)}
				>
					<div className="flex items-center gap-1.5">
						{" "}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 20 20"
							width="1em"
							aria-hidden="true"
						>
							<path
								d="m6.25 6.013.675 1.8h-1.35zm1.86 1.443c.777-1.022 1.896-1.762 3.28-2.147C10.576 3.534 8.76 2.5 6.25 2.5 2.778 2.5.625 4.475.625 7.656c0 1.622.563 2.928 1.572 3.819L.625 13.047l.469.703a5.6 5.6 0 0 0 3.378-1.134 7.8 7.8 0 0 0 1.778.197c.256 0 .503-.016.747-.035a7.7 7.7 0 0 1-.122-1.372c0-.853.134-1.634.381-2.344h-2.15l-.35.938H3.437l1.876-5h1.875zm5.64 4.206c.31-.28.575-.621.75-1.037h-1.497c.175.416.44.756.75 1.037zm4.053 3.563 1.572 1.572-.469.703a5.6 5.6 0 0 1-3.378-1.134 7.8 7.8 0 0 1-1.778.197c-3.472 0-5.625-1.975-5.625-5.157S10.278 6.25 13.75 6.25s5.625 1.975 5.625 5.156c0 1.622-.562 2.928-1.572 3.819m-1.24-5.85h-2.188v-.937h-1.25v.937h-2.187v1.25h.778a4.4 4.4 0 0 0 1.006 1.725c-.863.425-1.681.544-1.681.544l.437 1.172a6.3 6.3 0 0 0 2.269-.87 6.3 6.3 0 0 0 2.269.87l.437-1.172s-.819-.119-1.681-.544a4.3 4.3 0 0 0 1.006-1.725h.778v-1.25z"
								fill="currentColor"
							/>
						</svg>
						<span>{interfaceLabel}</span>
					</div>

					<ChevronDown
						className={cn(
							"size-3",
							open && "rotate-180",
							"transition-transform duration-200",
						)}
						strokeWidth={3}
					/>
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-48 rounded-xl p-0 shadow-none" align="start">
				<div className="flex flex-col">
					<div className="border-b p-2">
						<div className="relative">
							<Search className="-translate-y-1/2 absolute top-1/2 left-2.5 size-4 text-muted-foreground" />
							<Input
								ref={inputRef}
								placeholder="Search language..."
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								className="h-8 pl-8 text-sm"
							/>
						</div>
					</div>
					<div className="flex-1 overflow-auto p-1">
						{filteredLanguages.length === 0 ? (
							<div className="py-6 text-center text-muted-foreground text-sm">
								No language found.
							</div>
						) : (
							filteredLanguages.map((lang) => (
								<button
									type="button"
									key={lang.value}
									onClick={() => handleSelectLanguage(lang.value)}
									className={cn(
										"flex w-full cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
										interfaceLang === lang.value &&
											"bg-accent text-accent-foreground",
									)}
								>
									<Check
										className={cn(
											"mr-2 size-4",
											interfaceLang === lang.value
												? "opacity-100"
												: "opacity-0",
										)}
									/>
									{lang.label}
								</button>
							))
						)}
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}
