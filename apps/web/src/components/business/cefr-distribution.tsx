import type { CefrLevel } from "@/lib/business/mock-data";

const LEVEL_BAR_CLASS: Record<CefrLevel, string> = {
	A1: "bg-emerald-400",
	A2: "bg-teal-400",
	B1: "bg-blue-400",
	B2: "bg-indigo-400",
	C1: "bg-purple-400",
	C2: "bg-rose-400",
};

const LEVEL_TEXT_CLASS: Record<CefrLevel, string> = {
	A1: "text-emerald-700",
	A2: "text-teal-700",
	B1: "text-blue-700",
	B2: "text-indigo-700",
	C1: "text-purple-700",
	C2: "text-rose-700",
};

export function CefrDistribution({
	data,
}: {
	data: ReadonlyArray<{ level: CefrLevel; count: number }>;
}) {
	const max = Math.max(1, ...data.map((item) => item.count));
	const total = data.reduce((sum, item) => sum + item.count, 0);

	return (
		<div className="rounded-2xl border border-[rgba(23,32,51,0.08)] bg-white p-5">
			<h2 className="font-semibold text-[#172033] text-[15px]">
				Level distribution
			</h2>
			<p className="mt-0.5 text-[#5B6478] text-[13px]">
				Current CEFR level of {total} active learners
			</p>
			<div className="mt-5 flex flex-col gap-3">
				{data.map((item) => (
					<div key={item.level} className="flex items-center gap-3">
						<span
							className={`w-6 font-semibold text-xs ${LEVEL_TEXT_CLASS[item.level]}`}
						>
							{item.level}
						</span>
						<div className="h-2 flex-1 overflow-hidden rounded-full bg-[#F5F7FA]">
							<div
								className={`h-full rounded-full ${LEVEL_BAR_CLASS[item.level]}`}
								style={{ width: `${(item.count / max) * 100}%` }}
							/>
						</div>
						<span className="w-5 text-right text-[#5B6478] text-xs tabular-nums">
							{item.count}
						</span>
					</div>
				))}
			</div>
		</div>
	);
}
