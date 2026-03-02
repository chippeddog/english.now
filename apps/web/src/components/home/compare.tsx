import { Check, X } from "lucide-react";

const comparisons = [
	{
		feature: "Cost per month (USD)",
		us: "~$12",
		them: "~$400+",
	},
	{
		feature: "24/7 availability — learn any time, anywhere",
		us: true,
		them: false,
	},
	{
		feature: "Personalized feedback, instantly",
		us: true,
		them: true,
	},

	{
		feature: "Supports self-paced progression",
		us: true,
		them: false,
	},
	{
		feature: "Tracks your progress and adapts daily",
		us: true,
		them: false,
	},
	{
		feature: "No scheduling stress or cancellations",
		us: true,
		them: false,
	},
	{
		feature: "Built-in advanced AI language models",
		us: true,
		them: false,
	},
];
export function Compare() {
	return (
		<div className="mx-auto mt-24 max-w-4xl">
			<div className="mx-auto mb-10 max-w-xl text-center md:mb-14">
				<h2 className="mb-4 font-bold font-lyon text-4xl tracking-tight md:text-5xl">
					Private-tutor in your pocket for 50x cheaper than a real one
				</h2>
				<p className="text-balance text-center text-muted-foreground text-sm md:mx-auto md:max-w-boundary-sm md:text-lg">
					High-quality learning doesn't have to be costly.{" "}
					<br className="hidden md:block" />
					No more waiting for a lesson.
				</p>
			</div>
			<div className="overflow-hidden">
				<div className="mb-2 grid grid-cols-[1fr_90px_90px] items-center px-6 pb-4 md:grid-cols-[1fr_140px_140px]">
					<div />
					<div className="mx-auto">
						<div className="relative size-8 overflow-hidden rounded-[0.8rem] border border-[#C6F64D] bg-[radial-gradient(100%_100%_at_50%_0%,#EFFF9B_0%,#D8FF76_60%,#C6F64D_100%)]">
							<img
								className="absolute bottom-[-5px] h-full w-full object-contain"
								src="/logo.svg"
								alt="English Now Logo"
								width={62}
								height={62}
							/>
						</div>
					</div>
					<div className="text-center text-muted-foreground text-sm md:text-base">
						Real Tutors
					</div>
				</div>
				<div className="flex flex-col gap-1">
					{comparisons.map((row, i) => (
						<div
							key={row.feature}
							className={`grid grid-cols-[1fr_90px_90px] items-center rounded-xl px-4 py-3 md:grid-cols-[1fr_140px_140px] md:px-6 md:py-4 ${
								i % 2 === 0 ? "bg-neutral-100" : "bg-white"
							}`}
						>
							<span className="font-medium text-xs md:text-base">
								{row.feature}
							</span>
							<div className="flex justify-center">
								{typeof row.us === "string" ? (
									<span className="text-lime-600">{row.us}</span>
								) : row.us ? (
									<div className="flex items-center justify-center rounded-full border border-lime-300 bg-lime-200 p-1 text-lime-600">
										<Check className="size-3 md:size-3.5" strokeWidth={2} />
									</div>
								) : (
									<div className="flex items-center justify-center rounded-full border border-red-300 bg-red-200 p-1 text-red-600">
										<X className="size-3 md:size-3.5" strokeWidth={2} />
									</div>
								)}
							</div>
							<div className="flex justify-center">
								{typeof row.them === "string" ? (
									<span className="text-muted-foreground">{row.them}</span>
								) : row.them ? (
									<div className="flex items-center justify-center rounded-full border border-lime-300 bg-lime-200 p-1 text-lime-600">
										<Check className="size-3.5" strokeWidth={2} />
									</div>
								) : (
									<div className="flex items-center justify-center rounded-full border border-red-300 bg-red-200 p-1 text-red-600">
										<X className="size-3.5" strokeWidth={2} />
									</div>
								)}
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
