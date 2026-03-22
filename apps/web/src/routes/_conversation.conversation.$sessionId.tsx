import {
	getConversationModeLabel,
	getConversationSessionMeta,
} from "@english.now/api/services/conversation-mode";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
	ArrowLeft,
	ChevronLeft,
	InfoIcon,
	Loader,
	MessageCircleQuestionIcon,
	Settings,
} from "lucide-react";
import { type MouseEvent, useEffect, useMemo, useState } from "react";
import LeavePracticeDialog from "@/components/conversation/practice/leave-practice-dialog";
import PracticeView from "@/components/conversation/practice-view";
import ReportIssueDialog from "@/components/conversation/report-issue-dialog";
import { ConversationReviewScreen } from "@/components/conversation/review/conversation-review-screen";
import { LoadingState } from "@/components/conversation/review-view";
import Logo from "@/components/logo";
import SessionLoader from "@/components/session/loader";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_conversation/conversation/$sessionId")({
	component: ConversationPage,
});

function ConversationPage() {
	const { sessionId } = Route.useParams();
	const navigate = useNavigate();
	const trpc = useTRPC();
	const [settingsOpen, setSettingsOpen] = useState(false);
	const [instructionsOpen, setInstructionsOpen] = useState(false);
	const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);

	const {
		data: sessionData,
		isLoading: isSessionLoading,
		error: sessionError,
	} = useQuery({
		...trpc.conversation.getSession.queryOptions({ sessionId }),
		retry: (failureCount, err) => {
			if (err.message.includes("NOT_FOUND")) return false;
			return failureCount < 2;
		},
	});

	const isCompleted = sessionData?.session.status === "completed";
	const sessionMeta = useMemo(
		() =>
			sessionData?.session
				? getConversationSessionMeta(sessionData.session)
				: null,
		[sessionData?.session],
	);
	const instructions = useMemo(() => {
		if (!sessionMeta?.subtitle) return null;

		return {
			badge: getConversationModeLabel(sessionMeta.mode),
			title: sessionMeta.title,
			subtitle: sessionMeta.subtitle,
			goals: sessionMeta.goals.slice(0, 3),
			aiRole: sessionMeta.participants.aiRole,
			mode: sessionMeta.mode,
		};
	}, [sessionMeta]);

	const { data: feedbackData, isLoading: isFeedbackLoading } = useQuery({
		...trpc.conversation.getReview.queryOptions({ sessionId }),
		enabled: isCompleted,
		refetchInterval: (query) => {
			const d = query.state.data;
			if (!d) return 2000;
			if (d.reviewStatus === "completed" || d.reviewStatus === "failed") {
				return false;
			}
			return 2000;
		},
		retry: (failureCount, err) => {
			if (err.message.includes("NOT_FOUND")) return false;
			return failureCount < 2;
		},
	});

	useEffect(() => {
		if (sessionError) {
			navigate({ to: "/practice" });
		}
	}, [sessionError, navigate]);

	const handleLogoClick = (event: MouseEvent<HTMLAnchorElement>) => {
		event.preventDefault();
		setLeaveDialogOpen(true);
	};

	if (isSessionLoading) {
		return <SessionLoader />;
	}

	if (isCompleted) {
		if (isFeedbackLoading) {
			return (
				<div className="container mx-auto flex min-h-dvh max-w-3xl flex-col items-center justify-center px-4 py-8">
					<div className="flex flex-col items-center gap-4">
						<Loader className="size-7 animate-spin text-lime-600" />
						<p className="font-medium text-foreground-muted">
							Loading feedback...
						</p>
					</div>
				</div>
			);
		}

		if (
			!feedbackData ||
			(feedbackData.reviewStatus !== "completed" &&
				feedbackData.reviewStatus !== "failed")
		) {
			return <LoadingState />;
		}

		return (
			<>
				<div className="sticky border-black/5 border-b bg-white">
					<div className="container relative z-10 mx-auto max-w-5xl px-4">
						<nav className="flex grid-cols-2 items-center justify-between py-5 md:grid-cols-5">
							<div className="items-center gap-2 md:flex">
								<Logo link="/practice" />
							</div>
							<Button
								variant="outline"
								size="icon"
								className="size-9 cursor-pointer rounded-xl shadow-none md:hidden"
								onClick={() => navigate({ to: "/practice" })}
							>
								<ArrowLeft className="size-4" strokeWidth={2} />
							</Button>
							<Link
								to="/conversation"
								className="hidden items-center gap-1 text-muted-foreground text-sm transition-colors hover:text-foreground md:flex"
							>
								<ChevronLeft className="size-4" />
								Back to practice
							</Link>
						</nav>
					</div>
				</div>
				<ConversationReviewScreen
					attempts={feedbackData.attempts}
					messages={feedbackData.messages}
					practiceProgress={feedbackData.practiceProgress}
					reportAccess={feedbackData.reportAccess}
					review={feedbackData.review}
					reviewStatus={feedbackData.reviewStatus}
					session={feedbackData.session}
				/>
			</>
		);
	}

	return (
		<div className="flex min-h-full flex-col">
			<div className="sticky top-0 z-20 shrink-0 border-black/5 border-b bg-white/95 backdrop-blur">
				<div className="container relative z-10 mx-auto max-w-3xl px-4">
					<nav className="flex grid-cols-2 items-center justify-between py-5 md:grid-cols-5">
						<div className="flex items-center gap-1">
							<div className="relative inline-flex">
								<Logo link="/practice" onClick={handleLogoClick} />
								{instructions ? (
									<Popover
										open={instructionsOpen}
										onOpenChange={setInstructionsOpen}
									>
										<PopoverTrigger asChild>
											<button
												type="button"
												className="-top-1.5 absolute right-0 z-10 cursor-pointer text-lime-900 text-sm italic"
											>
												{/* <svg
													className="size-4"
													aria-hidden="true"
													focusable="false"
													data-prefix="far"
													data-icon="thought-bubble"
													role="img"
													xmlns="http://www.w3.org/2000/svg"
													viewBox="0 0 512 512"
												>
													<path
														fill="currentColor"
														d="M256 0c-48.7 0-91.4 25.6-115.4 64C62.6 65.9 0 129.6 0 208c0 79.5 64.5 144 144 144c9.4 0 18.7-.9 27.6-2.7C193.3 370.7 223.1 384 256 384s62.7-13.3 84.4-34.7c9 1.7 18.2 2.7 27.6 2.7c79.5 0 144-64.5 144-144c0-78.4-62.6-142.1-140.6-144C347.4 25.6 304.7 0 256 0zM176.3 98.7C190.4 68.7 220.8 48 256 48s65.6 20.7 79.7 50.7c4.3 9.1 13.8 14.6 23.8 13.7c2.8-.2 5.6-.4 8.5-.4c53 0 96 43 96 96s-43 96-96 96c-10 0-19.7-1.5-28.7-4.4c-9.6-3-20 .3-26.2 8.3C299.9 325 279.2 336 256 336s-43.9-11-57.1-28.1c-6.1-8-16.6-11.3-26.2-8.3c-9 2.8-18.7 4.4-28.7 4.4c-53 0-96-43-96-96s43-96 96-96c2.9 0 5.7 .1 8.5 .4c10 .9 19.5-4.6 23.8-13.7zM192 432a48 48 0 1 0 -96 0 48 48 0 1 0 96 0zM64 480A32 32 0 1 0 0 480a32 32 0 1 0 64 0z"
													/>
												</svg> */}
												?
											</button>
										</PopoverTrigger>
										<PopoverContent
											align="start"
											sideOffset={8}
											className="w-80 rounded-xl border-0 bg-black p-4 text-white shadow-[0_12px_32px_rgba(0,0,0,0.22)]"
										>
											<div className="space-y-3">
												<div className="flex items-center justify-between gap-2">
													<span className="font-medium text-sm">
														{instructions.title}
													</span>
													<span className="rounded-md bg-lime-300 px-1.5 py-0.5 font-semibold text-[10px] text-lime-950 uppercase tracking-wide">
														{instructions.badge}
													</span>
												</div>
												<div className="space-y-3 text-xs">
													<div className="space-y-1">
														<p className="text-white/80">
															{instructions.subtitle}
														</p>
													</div>
													{instructions.mode === "roleplay" ? (
														<p className="text-white/70">
															You are speaking with{" "}
															<span className="font-medium text-white">
																{instructions.aiRole}
															</span>
															.
														</p>
													) : null}
												</div>
											</div>
										</PopoverContent>
									</Popover>
								) : null}
							</div>
						</div>
						<div className="flex items-center gap-2">
							<ReportIssueDialog
								sessionId={sessionId}
								sessionType="conversation"
							/>
							<Button
								variant="outline"
								size="icon"
								className={cn(
									"size-9 cursor-pointer rounded-xl shadow-none",
									settingsOpen && "bg-neutral-100",
								)}
								onClick={() => setSettingsOpen(true)}
							>
								<Settings className="size-4" strokeWidth={2} />
							</Button>
						</div>
					</nav>
				</div>
			</div>
			<div className="container relative mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pt-6">
				<PracticeView
					sessionId={sessionId}
					settingsOpen={settingsOpen}
					onSettingsOpenChange={setSettingsOpen}
				/>
			</div>
			<LeavePracticeDialog
				leaveDialogOpen={leaveDialogOpen}
				setLeaveDialogOpen={setLeaveDialogOpen}
			/>
		</div>
	);
}
