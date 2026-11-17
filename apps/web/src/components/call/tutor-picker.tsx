import {
	CALL_TOPIC_PRESETS,
	CALL_TUTORS,
	DEFAULT_CALL_TUTOR_ID,
	getCallMaxSeconds,
	getCallTutor,
} from "@english.now/api/services/call-tutors";
import { env } from "@english.now/env/client";
import { usePostHog } from "@posthog/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Headphones, Loader2, Phone } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useUpgradeDialog } from "@/components/dashboard/upgrade-dialog";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/utils/trpc";
import { TutorAvatar } from "./tutor-avatar";

const MAX_TOPICS = 10;

export function TutorPicker() {
	const { t } = useTranslation("app");
	const trpc = useTRPC();
	const navigate = useNavigate();
	const posthog = usePostHog();
	const queryClient = useQueryClient();
	const { openDialog: openUpgradeDialog } = useUpgradeDialog();
	const [tutorId, setTutorId] = useState(DEFAULT_CALL_TUTOR_ID);
	const [topic, setTopic] = useState<string | null>(null);
	const [isStarting, setIsStarting] = useState(false);

	const { data: planData } = useQuery(
		trpc.practice.getTodayPlan.queryOptions(),
	);
	const access = planData?.access ?? null;
	const isLocked = Boolean(
		access && !access.isPro && !access.conversation.hasAccess,
	);
	const maxMinutes = Math.round(getCallMaxSeconds(access?.isPro ?? false) / 60);
	const tutor = getCallTutor(tutorId);

	const topics = useMemo(() => {
		const planTopics = (planData?.activities ?? [])
			.filter((activity) => activity.type === "conversation")
			.map((activity) => activity.title);
		return Array.from(new Set([...planTopics, ...CALL_TOPIC_PRESETS])).slice(
			0,
			MAX_TOPICS,
		);
	}, [planData?.activities]);

	const handleCall = async () => {
		if (isLocked) {
			openUpgradeDialog();
			return;
		}

		setIsStarting(true);
		try {
			const response = await fetch(`${env.VITE_SERVER_URL}/api/call/session`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ tutorId, topic }),
			});

			if (response.status === 403) {
				openUpgradeDialog();
				return;
			}
			if (!response.ok) {
				throw new Error(`Failed to start call: ${response.status}`);
			}

			const { sessionId } = (await response.json()) as { sessionId: string };
			posthog.capture("tutor_call_started", {
				session_id: sessionId,
				tutor_id: tutorId,
				topic,
			});
			void queryClient.invalidateQueries({
				queryKey: trpc.practice.getTodayPlan.queryKey(),
			});
			navigate({ to: "/call/$sessionId", params: { sessionId } });
		} catch (error) {
			console.error(error);
			toast.error(t("call.startError"));
		} finally {
			setIsStarting(false);
		}
	};

	return (
		<div className="flex flex-col gap-8">
			<section className="flex flex-col gap-3">
				<h2 className="font-medium text-sm text-zinc-900">
					{t("call.chooseTutor")}
				</h2>
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
					{CALL_TUTORS.map((item) => {
						const selected = item.id === tutorId;
						return (
							<button
								key={item.id}
								type="button"
								aria-pressed={selected}
								onClick={() => setTutorId(item.id)}
								className={cn(
									"flex cursor-pointer items-center gap-3.5 rounded-2xl border bg-white p-3.5 text-left outline-none transition-colors focus-visible:ring-[#007AFF]/40 focus-visible:ring-[3px]",
									selected
										? "border-lime-500 bg-lime-50"
										: "border-[rgba(23,32,51,0.08)] hover:bg-neutral-50",
								)}
							>
								<TutorAvatar tone={item.tone} className="size-14" />
								<span className="flex min-w-0 flex-col gap-0.5">
									<span className="font-semibold text-[#172033]">
										{item.name}
									</span>
									<span className="font-medium text-[#172033] text-sm">
										{item.tagline}
									</span>
									<span className="text-[#5B6478] text-xs">
										{item.description}
									</span>
								</span>
							</button>
						);
					})}
				</div>
			</section>

			<section className="flex flex-col gap-3">
				<h2 className="font-medium text-sm text-zinc-900">
					{t("call.chooseTopic")}
				</h2>
				<div className="flex flex-wrap gap-2">
					{[null, ...topics].map((item) => {
						const selected = item === topic;
						return (
							<button
								key={item ?? "any"}
								type="button"
								aria-pressed={selected}
								onClick={() => setTopic(item)}
								className={cn(
									"h-9 cursor-pointer rounded-full border px-3.5 font-medium text-sm outline-none transition-colors focus-visible:ring-[#007AFF]/40 focus-visible:ring-[3px]",
									selected
										? "border-lime-500 bg-lime-100 text-lime-900"
										: "border-[rgba(23,32,51,0.08)] bg-white text-[#172033] hover:bg-neutral-50",
								)}
							>
								{item ?? t("call.anyTopic")}
							</button>
						);
					})}
				</div>
			</section>

			<section className="flex flex-col items-start gap-3">
				<button
					type="button"
					onClick={handleCall}
					disabled={isStarting}
					className="flex h-12 cursor-pointer items-center gap-2 rounded-2xl bg-[#34C759] px-6 font-medium text-white outline-none transition-colors hover:bg-[#34C759]/90 focus-visible:ring-[#34C759]/40 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-60"
				>
					{isStarting ? (
						<Loader2 className="size-5 animate-spin" />
					) : (
						<Phone className="size-5" />
					)}
					{isStarting
						? t("call.starting")
						: t("call.callTutor", { name: tutor.name })}
				</button>
				<div className="flex flex-col gap-1 text-[#5B6478] text-sm">
					<p>
						{access?.isPro
							? t("call.proLimitCaption", { minutes: maxMinutes })
							: t("call.freeLimitCaption", { minutes: maxMinutes })}
					</p>
					<p className="flex items-center gap-1.5">
						<Headphones className="size-4" />
						{t("call.headphonesTip")}
					</p>
				</div>
			</section>
		</div>
	);
}
