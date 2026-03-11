import {
	changeLanguage,
	getCurrentLanguage,
	languageNames,
	type SupportedLanguage,
	supportedLanguages,
	useTranslation,
} from "@english.now/i18n";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Headphones, Languages, LogOutIcon, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import MobileMenu from "@/components/app/navbar/mobile-menu";
import Streak from "@/components/app/navbar/streak";
import UpgradeDialog from "@/components/dashboard/upgrade-dialog";
import VoicesDialog from "@/components/dashboard/voices-dialog";
import Logo from "@/components/logo";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/utils/trpc";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export default function Navbar() {
	const { t } = useTranslation("app");
	const trpc = useTRPC();
	const [upgradeOpen, setUpgradeOpen] = useState(false);
	const [voicesOpen, setVoicesOpen] = useState(false);

	const [isScrolled, setIsScrolled] = useState(false);
	const [language, setLanguage] = useState<SupportedLanguage>(
		getCurrentLanguage(),
	);
	const { i18n } = useTranslation();
	const navigate = useNavigate();
	const location = useLocation();
	const { data: session, isPending } = authClient.useSession();
	const { data: profile, isPending: isProfilePending } = useQuery(
		trpc.profile.get.queryOptions(),
	);
	const timezone =
		profile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
	const { data: practiceTimeData, isLoading: isPracticeTimeLoading } = useQuery(
		trpc.profile.getDailyPracticeTime.queryOptions({ timezone }),
	);

	useEffect(() => {
		const handleLanguageChanged = (lng: string) => {
			setLanguage(lng as SupportedLanguage);
		};
		i18n.on("languageChanged", handleLanguageChanged);
		return () => i18n.off("languageChanged", handleLanguageChanged);
	}, [i18n]);

	const links = [
		{
			to: "/home",
			label: t("nav.home"),
		},
		{
			to: "/lessons",
			label: t("nav.lessons"),
		},
		{
			to: "/practice",
			label: t("nav.practice"),
		},
		{
			to: "/vocabulary",
			label: t("nav.vocabulary"),
		},
	];

	useEffect(() => {
		const handleScroll = () => {
			setIsScrolled(window.scrollY > 0);
		};
		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	return (
		<div
			className={`sticky border-border/50 border-b ${
				isScrolled ? "border-b" : ""
			}`}
		>
			<div className="container relative z-10 mx-auto max-w-5xl px-4">
				<nav className="flex grid-cols-2 items-center justify-between py-5 md:grid-cols-5">
					<div className="col-span-3 flex items-center gap-3">
						<Logo link="/home" />
						<MobileMenu links={links} />
						<div className="hidden gap-1.5 md:flex">
							{links.map((link) => (
								<Link
									key={link.to}
									to={link.to}
									className={cn(
										"w-auto rounded-xl px-2.5 py-2 font-medium transition-all duration-300 hover:bg-neutral-200/60 md:inline-flex md:items-center md:justify-center md:text-sm",
										location.pathname === link.to ? "" : "bg-transparent",
									)}
								>
									{link.label}
								</Link>
							))}
						</div>
					</div>

					<div className="relative flex items-center justify-end gap-3">
						<Streak
							currentStreak={profile?.currentStreak ?? 0}
							longestStreak={profile?.longestStreak ?? 0}
							timezone={profile?.timezone ?? null}
							activityDates={practiceTimeData?.map((time) => time.date) ?? []}
							isLoading={isPracticeTimeLoading}
						/>
						<UpgradeDialog open={upgradeOpen} onOpenChange={setUpgradeOpen} />
						<VoicesDialog open={voicesOpen} onOpenChange={setVoicesOpen} />
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<div className="flex w-full cursor-pointer flex-col items-start transition-opacity hover:opacity-80">
									<div className="flex flex-row items-center gap-2">
										{isPending || !session ? (
											<Skeleton className="size-9 rounded-full" />
										) : (
											<div className="relative flex items-center gap-2">
												{!session.user.image ? (
													<div className="relative flex size-8.5 shrink-0 items-center justify-center space-x-0 overflow-hidden rounded-full border border-neutral-200 font-semibold text-neutral-400 uppercase">
														<span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-100">
															<span className="pointer-events-none flex aspect-square size-6 select-none items-center justify-center rounded-full object-cover object-center italic">
																{session.user.name?.charAt(0) ?? "?"}
															</span>
														</span>
													</div>
												) : (
													<div
														className={cn(
															"relative flex size-9 shrink-0 items-center justify-center space-x-0 rounded-full border uppercase",
															profile?.subscription.isPro
																? "border-black"
																: "border-neutral-200",
														)}
													>
														{profile?.subscription.isPro && (
															<span className="-bottom-0.5 absolute mx-auto rounded-full border border-black bg-linear-to-t from-[#202020] to-[#2F2F2F] px-1 font-semibold text-[9px] text-sm text-white italic">
																PRO
															</span>
														)}
														<img
															src={session.user.image ?? undefined}
															alt={session.user.name ?? ""}
															className="size-8 rounded-full"
														/>
													</div>
												)}
											</div>
										)}
									</div>
								</div>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								align="end"
								className="w-[180px] rounded-xl shadow-sm"
								sideOffset={8}
								side="bottom"
							>
								<DropdownMenuLabel>
									<div className="flex flex-col text-xs">
										{session?.user.name}
										<span className="font-medium text-gray-500">
											{session?.user.email}
										</span>
									</div>
								</DropdownMenuLabel>
								<DropdownMenuSeparator />
								<DropdownMenuItem>
									<Link
										to="/settings"
										className="flex w-full items-center gap-2"
									>
										<Settings className="size-4" />
										{t("nav.settings")}
									</Link>
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuLabel>
									<div className="flex flex-col text-xs">
										<span className="font-medium text-gray-500">
											{t("nav.preferences")}
										</span>
									</div>
								</DropdownMenuLabel>
								<DropdownMenuSub>
									<DropdownMenuSubTrigger className="flex items-center gap-2">
										<Languages className="size-4" />
										{languageNames[language]}
									</DropdownMenuSubTrigger>
									<DropdownMenuSubContent>
										{supportedLanguages.map((code) => (
											<DropdownMenuItem
												key={code}
												onSelect={() => {
													const lang = code as SupportedLanguage;
													changeLanguage(lang);
													setLanguage(lang);
												}}
												className={cn(code === language && "font-medium")}
											>
												{languageNames[code]}
											</DropdownMenuItem>
										))}
									</DropdownMenuSubContent>
								</DropdownMenuSub>
								<DropdownMenuItem
									onSelect={() => setVoicesOpen(true)}
									className="flex cursor-pointer items-center gap-2"
								>
									<Headphones className="size-4" />
									{t("nav.voices")}
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem>
									<button
										type="button"
										className="flex w-full items-center gap-2"
										onClick={() => {
											authClient.signOut({
												fetchOptions: {
													onSuccess: () => {
														navigate({
															to: "/",
														});
													},
												},
											});
										}}
									>
										<LogOutIcon className="size-4" />
										{t("nav.signOut")}
									</button>
								</DropdownMenuItem>
							</DropdownMenuContent>
							<VoicesDialog open={voicesOpen} onOpenChange={setVoicesOpen} />
						</DropdownMenu>
					</div>
				</nav>
			</div>
		</div>
	);
}
