import { useTranslation } from "@english.now/i18n";
import { ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";

export default function SelectionStep({
	title,
	subtitle,
	options,
	selected,
	onSelect,
	onNext,
	canProceed,
}: {
	title: string;
	subtitle: string;
	options: Array<{
		id: string;
		name: string;
		description: string;
		icon?: string;
		IconComponent?: React.ComponentType<{ className?: string }>;
	}>;
	selected: string;
	onSelect: (id: string) => void;
	onNext: () => void;
	canProceed: boolean;
}) {
	const { t } = useTranslation("common");
	return (
		<div className="flex flex-1 flex-col px-4 py-8">
			<div className="mx-auto w-full max-w-lg">
				<div className="mb-8 text-center">
					<h1 className="mb-4 font-bold font-lyon text-4xl tracking-tight md:text-5xl">
						{title}
					</h1>
					<p className="text-muted-foreground md:text-lg">{subtitle}</p>
				</div>

				<div className="space-y-3">
					{options.map((option) => {
						const isSelected = selected === option.id;
						return (
							<button
								key={option.id}
								type="button"
								onClick={() => onSelect(option.id)}
								className={cn(
									"flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all",
									isSelected
										? "border-lime-400 bg-lime-50"
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
								<div
									className={cn(
										"flex size-12 shrink-0 items-center justify-center rounded-2xl text-2xl",
										isSelected
											? "bg-radial from-[#EFFF9B] to-[#D8FF76]"
											: "bg-neutral-100",
									)}
								>
									{option.icon ? (
										option.icon
									) : option.IconComponent ? (
										<option.IconComponent
											className={cn(
												"size-6",
												isSelected ? "text-lime-700" : "text-neutral-600",
											)}
										/>
									) : null}
								</div>
								<div className="flex-1">
									<h3 className="font-semibold">{option.name}</h3>
									<p className="text-muted-foreground text-sm">
										{option.description}
									</p>
								</div>
								<div
									className={cn(
										"flex size-6 items-center justify-center rounded-full border-2 transition-all",
										isSelected
											? "border-lime-500 bg-lime-500"
											: "border-neutral-300",
									)}
								>
									{isSelected && <Check className="size-4 text-white" />}
								</div>
							</button>
						);
					})}
				</div>
				<div className="mt-8">
					<Button
						size="lg"
						variant="progress"
						className="h-14 w-full rounded-2xl text-base"
						disabled={!canProceed}
						onClick={onNext}
					>
						{t("actions.continue")}
						<ArrowRight className="size-5" />
					</Button>
				</div>
			</div>
		</div>
	);
}
