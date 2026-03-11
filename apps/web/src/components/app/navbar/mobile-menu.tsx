import { useTranslation } from "@english.now/i18n";
import { Link, useLocation } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export default function MobileMenu({
	links,
}: {
	links: { to: string; label: string }[];
}) {
	const [menuOpen, setMenuOpen] = useState(false);
	const { t } = useTranslation("app");
	const location = useLocation();

	useEffect(() => {
		setMenuOpen(false);
	}, [location.pathname]);

	return (
		<Popover open={menuOpen} onOpenChange={setMenuOpen}>
			<PopoverTrigger asChild>
				<button
					type="button"
					className="flex size-9 items-center justify-center rounded-lg transition-colors md:hidden"
					aria-label={menuOpen ? t("nav.close") : t("nav.menu")}
				>
					{menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
				</button>
			</PopoverTrigger>
			<PopoverContent
				align="start"
				className="w-48 rounded-xl p-2"
				side="bottom"
				sideOffset={8}
			>
				<nav className="flex flex-col gap-0.5">
					{links.map((link) => (
						<Link
							key={link.to}
							to={link.to}
							className={cn(
								"rounded-lg px-3 py-2 font-medium text-sm transition-colors",
								location.pathname === link.to
									? "bg-neutral-100 text-neutral-900"
									: "text-neutral-900 hover:bg-neutral-100 hover:text-neutral-900",
							)}
						>
							{link.label}
						</Link>
					))}
				</nav>
			</PopoverContent>
		</Popover>
	);
}
