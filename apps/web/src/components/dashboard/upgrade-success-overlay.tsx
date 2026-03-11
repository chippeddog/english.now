"use client";

import confetti from "canvas-confetti";
import { CheckCircle2, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import { Button } from "../ui/button";

const CONFETTI_COLORS = [
	"#C6F64D",
	"#D8FF76",
	"#0F172A",
	"#22C55E",
	"#EFFF9B",
	"#FACC15",
] as const;

export default function UpgradeSuccessOverlay({
	open,
	onClose,
}: {
	open: boolean;
	onClose: () => void;
}) {
	useEffect(() => {
		if (!open) return;

		const durationMs = 1800;
		const animationEnd = Date.now() + durationMs;

		const runBurst = () => {
			confetti({
				particleCount: 3,
				startVelocity: 30,
				spread: 360,
				ticks: 70,
				scalar: 0.9,
				colors: [...CONFETTI_COLORS],
				origin: {
					x: Math.random(),
					y: Math.random() * 0.3,
				},
			});

			if (Date.now() < animationEnd) {
				window.requestAnimationFrame(runBurst);
			}
		};

		runBurst();
	}, [open]);

	return (
		<AnimatePresence>
			{open ? (
				<motion.div
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
				>
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
