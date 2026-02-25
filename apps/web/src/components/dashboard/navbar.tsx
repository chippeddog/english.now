import {
	changeLanguage,
	getCurrentLanguage,
	languageNames,
	type SupportedLanguage,
	supportedLanguages,
	useTranslation,
} from "@english.now/i18n";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Headphones, Languages, LogOutIcon, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import Logo from "@/components/logo";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
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
import { Skeleton } from "../ui/skeleton";
import UpgradeDialog from "./upgrade-dialog";
import VoicesDialog from "./voices-dialog";

export default function Navbar() {
	const { t } = useTranslation("app");
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
					<div className="col-span-3 items-center gap-3 md:flex">
						<Logo link="/home" />
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
						<UpgradeDialog open={upgradeOpen} onOpenChange={setUpgradeOpen} />
						<VoicesDialog open={voicesOpen} onOpenChange={setVoicesOpen} />
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<div className="flex w-full cursor-pointer flex-col items-start transition-opacity hover:opacity-80">
									<div className="flex flex-row items-center gap-2">
										{isPending || !session ? (
											<Skeleton className="size-8.5 rounded-full" />
										) : (
											<div className="relative flex items-center gap-2">
												{!session.user.image ? (
													<div className="relative flex size-8.5 items-center justify-center space-x-0 overflow-hidden rounded-full border border-neutral-300 bg-neutral-200 font-bold font-lyon text-neutral-400 uppercase">
														<svg
															className="absolute bottom-[-5px] h-full w-full object-contain"
															width="147"
															height="182"
															viewBox="0 0 147 182"
															fill="currentColor"
															stroke="currentColor"
															strokeWidth={2.5}
															xmlns="http://www.w3.org/2000/svg"
															aria-hidden="true"
														>
															<path
																d="M67.334 5.42313C63.3714 11.1355 58.8324 16.7032 48.0974 28.7064C35.129 43.2404 29.7975 51.9897 28.2125 61.0282L27.3479 65.9452L25.4747 62.2575C24.466 60.1605 21.7282 56.5451 19.3507 54.1589C14.3074 48.8804 14.7397 48.5912 9.91253 60.0882C-1.25475 86.6977 -3.12797 114.97 5.01333 135.361C14.3794 158.861 33.1837 174.697 59.1927 181.06C61.6422 181.638 67.334 182 73.9623 182C83.4004 181.928 85.6339 181.711 91.974 179.975C119.496 172.383 139.669 151.269 145.793 123.575C147.018 117.79 147.162 115.187 146.874 104.269C146.297 85.2515 142.767 70.8621 134.121 53.2189C129.871 44.3973 120.649 29.791 115.894 24.3679L113.444 21.5479L110.274 23.6448C105.015 27.1156 98.8905 33.768 96.8012 38.2511L94.8559 42.445L94.4236 37.7449C93.8472 32.2495 92.9827 29.6464 89.6685 23.7171C87.363 19.6679 80.3745 10.557 73.8182 3.18157L71.0804 4.05312e-06L67.334 5.42313ZM43.0541 115.187C50.7632 119.67 57.0312 123.503 57.0312 123.792C57.0312 124.081 56.0946 125.6 54.9419 127.19C52.4202 130.733 48.8899 132.469 44.2789 132.469C37.8667 132.397 33.0396 129.07 29.5093 122.056C27.3479 117.79 26.6995 107.161 28.6447 107.161C28.9329 107.161 35.4172 110.776 43.0541 115.187ZM119.568 111.789C120.288 125.889 107.968 136.518 97.0173 131.312C94.7118 130.227 90.1728 125.238 90.1728 123.792C90.1728 123.069 117.839 107.161 118.631 107.378C119.064 107.522 119.424 109.475 119.568 111.789Z"
																fill="transparent"
															/>
														</svg>
													</div>
												) : (
													<img
														src={session.user.image ?? undefined}
														alt={session.user.name ?? ""}
														className="size-8.5 rounded-full"
													/>
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
