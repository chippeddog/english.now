import { Link, useNavigate } from "@tanstack/react-router";
import {
	ArrowLeft,
	BarChart3,
	CreditCard,
	GraduationCap,
	LayoutGrid,
	LifeBuoy,
	LogOut,
	type LucideIcon,
	Menu,
	Plug,
	Settings,
	Users,
	UsersRound,
	Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import Logo from "@/components/logo";
import {
	Drawer,
	DrawerContent,
	DrawerTitle,
	DrawerTrigger,
} from "@/components/ui/drawer";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { AdminMenu } from "./admin-menu";
import { WorkspaceSwitcher } from "./workspace-switcher";

const NAV_LINK_CLASS =
	"flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-[#5B6478] text-sm transition-colors hover:bg-[#F5F7FA] hover:text-[#172033]";
const NAV_LINK_ACTIVE_CLASS = "bg-[#F5F7FA] font-medium text-[#172033]";

const SOON_ITEMS: ReadonlyArray<{ label: string; icon: LucideIcon }> = [
	{ label: "Teams", icon: UsersRound },
	{ label: "Programs", icon: GraduationCap },
	{ label: "Reports", icon: BarChart3 },
	{ label: "Integrations", icon: Plug },
	{ label: "Seats and billing", icon: CreditCard },
	{ label: "Workspace settings", icon: Settings },
];

function BusinessBrand() {
	return (
		<Link to="/business" className="flex items-center gap-2">
			<Logo className="size-8" />
			<span className="rounded-md border border-[rgba(23,32,51,0.14)] px-1.5 py-0.5 font-medium text-[#5B6478] text-[11px] leading-none">
				Business
			</span>
		</Link>
	);
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
	const navigate = useNavigate();

	return (
		<div className="flex h-full flex-col gap-6 px-3 py-5">
			<div className="px-1.5">
				<BusinessBrand />
			</div>

			<WorkspaceSwitcher />

			<nav className="flex flex-col gap-0.5">
				<Link
					to="/business"
					activeOptions={{ exact: true }}
					onClick={onNavigate}
					className={NAV_LINK_CLASS}
					activeProps={{ className: NAV_LINK_ACTIVE_CLASS }}
				>
					<LayoutGrid className="size-4" />
					Overview
				</Link>
				<Link
					to="/business/members"
					onClick={onNavigate}
					className={NAV_LINK_CLASS}
					activeProps={{ className: NAV_LINK_ACTIVE_CLASS }}
				>
					<Users className="size-4" />
					Members
				</Link>
			</nav>

			<div className="flex flex-col gap-0.5">
				<div className="px-2.5 pb-1.5 text-[#5B6478]/80 text-xs">
					Coming soon
				</div>
				{SOON_ITEMS.map((item) => (
					<div
						key={item.label}
						aria-disabled="true"
						className="flex h-9 cursor-default items-center gap-2.5 rounded-lg px-2.5 text-[#5B6478]/60 text-sm"
					>
						<item.icon className="size-4" />
						<span className="flex-1">{item.label}</span>
						<span className="rounded-md bg-[#F5F7FA] px-1.5 py-0.5 text-[#5B6478] text-[10px] leading-none">
							Soon
						</span>
					</div>
				))}
			</div>

			<div className="mt-auto flex flex-col gap-0.5">
				<button
					type="button"
					className={cn(NAV_LINK_CLASS, "cursor-pointer")}
					onClick={() => toast.info("Seat upgrades are coming soon")}
				>
					<Zap className="size-4" />
					Upgrade seats
				</button>
				<a
					href="mailto:business@english.now"
					className={NAV_LINK_CLASS}
					onClick={onNavigate}
				>
					<LifeBuoy className="size-4" />
					Help center
				</a>
				<Link to="/home" className={NAV_LINK_CLASS} onClick={onNavigate}>
					<ArrowLeft className="size-4" />
					Back to English Now
				</Link>
				<button
					type="button"
					className={cn(NAV_LINK_CLASS, "cursor-pointer")}
					onClick={() =>
						authClient.signOut({
							fetchOptions: {
								onSuccess: () => navigate({ to: "/login" }),
							},
						})
					}
				>
					<LogOut className="size-4" />
					Log out
				</button>
			</div>
		</div>
	);
}

export function BusinessSidebar() {
	return (
		<aside className="sticky top-0 hidden h-screen w-60 shrink-0 overflow-y-auto border-[rgba(23,32,51,0.08)] border-r bg-white lg:block">
			<SidebarContent />
		</aside>
	);
}

export function BusinessMobileBar() {
	const [open, setOpen] = useState(false);

	return (
		<div className="sticky top-0 z-30 flex h-14 items-center justify-between border-[rgba(23,32,51,0.08)] border-b bg-white/90 px-4 backdrop-blur lg:hidden">
			<BusinessBrand />
			<div className="flex items-center gap-2">
				<AdminMenu />
				<Drawer direction="right" open={open} onOpenChange={setOpen}>
					<DrawerTrigger asChild>
						<button
							type="button"
							aria-label="Open navigation"
							className="flex size-9 cursor-pointer items-center justify-center rounded-lg text-[#172033] hover:bg-[#F5F7FA]"
						>
							<Menu className="size-5" />
						</button>
					</DrawerTrigger>
					<DrawerContent className="w-72 overflow-y-auto">
						<DrawerTitle className="sr-only">Navigation</DrawerTitle>
						<SidebarContent onNavigate={() => setOpen(false)} />
					</DrawerContent>
				</Drawer>
			</div>
		</div>
	);
}
