"use client";

import { CheckCircle2, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "../ui/button";

const CONFETTI_COLORS = [
	"#C6F64D",
	"#D8FF76",
	"#0F172A",
	"#22C55E",
	"#EFFF9B",
	"#FACC15",
] as const;

const CONFETTI_PIECES = Array.from({ length: 24 }, (_, index) => ({
	id: index,
	left: `${(index * 97) % 100}%`,
	delay: (index % 8) * 0.12,
	duration: 2.4 + (index % 5) * 0.18,
	rotate: index % 2 === 0 ? 180 : -180,
	color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
}));

export default function UpgradeSuccessOverlay({
	open,
	onClose,
}: {
	open: boolean;
	onClose: () => void;
}) {
	return (
		<AnimatePresence>
			{open ? (
				<motion.div
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
				>
					<div className="pointer-events-none absolute inset-0 overflow-hidden">
						{CONFETTI_PIECES.map((piece) => (
							<motion.span
								key={piece.id}
								className="absolute top-[-10%] h-3 w-2 rounded-full"
								style={{
									left: piece.left,
									backgroundColor: piece.color,
								}}
								initial={{ opacity: 0, y: -40, rotate: 0, scale: 0.8 }}
								animate={{
									opacity: [0, 1, 1, 0],
									y: ["0vh", "25vh", "55vh", "90vh"],
									rotate: [0, piece.rotate, piece.rotate * 2],
									x: [0, piece.id % 2 === 0 ? 18 : -18, 0],
								}}
								transition={{
									duration: piece.duration,
									delay: piece.delay,
									ease: "easeOut",
								}}
							/>
						))}
					</div>

					<motion.div
						className="relative w-full max-w-md overflow-hidden rounded-4xl border border-lime-200 bg-white p-8 text-center shadow-2xl"
						initial={{ opacity: 0, y: 24, scale: 0.96 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: 20, scale: 0.98 }}
						transition={{ duration: 0.25, ease: "easeOut" }}
					>
						<div className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top,rgba(198,246,77,0.35),transparent_70%)]" />
						<motion.div
							className="relative mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-lime-100 text-lime-700"
							initial={{ scale: 0.85 }}
							animate={{ scale: [0.9, 1.06, 1] }}
							transition={{ duration: 0.4, ease: "easeOut" }}
						>
							<CheckCircle2 className="size-8" />
						</motion.div>
						<div className="relative">
							<div className="mb-2 inline-flex items-center gap-1 rounded-full bg-lime-100 px-3 py-1 font-medium text-lime-700 text-xs uppercase tracking-[0.2em]">
								<Sparkles className="size-3.5" />
								Upgrade Complete
							</div>
							<h2 className="font-bold font-lyon text-3xl text-slate-900">
								Welcome to Pro
							</h2>
							<p className="mt-3 text-balance text-slate-600">
								Your account now has access to the full Pro experience.
							</p>
						</div>
						<div className="relative mt-6 flex justify-center">
							<Button
								type="button"
								className="rounded-xl bg-slate-900 px-5 text-white hover:bg-slate-800"
								onClick={onClose}
							>
								Start learning
							</Button>
						</div>
					</motion.div>
				</motion.div>
			) : null}
		</AnimatePresence>
	);
}
