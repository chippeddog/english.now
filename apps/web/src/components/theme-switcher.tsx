import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

const themes = [
	{ value: "light" as const, icon: SunIcon, label: "Light" },
	{ value: "dark" as const, icon: MoonIcon, label: "Dark" },
	{ value: "system" as const, icon: MonitorIcon, label: "System" },
];

export function ThemeSwitcher() {
	const { theme, setTheme } = useTheme();

	return (
		<div className="flex h-8 items-center gap-0.5 rounded-lg border border-border/50 bg-muted/50 p-0.5">
			{themes.map(({ value, icon: Icon, label }) => (
				<button
					key={value}
					type="button"
					onClick={() => setTheme(value)}
					className={cn(
						"flex h-full cursor-pointer items-center justify-center rounded-md px-2 text-muted-foreground transition-all",
						theme === value && "bg-background text-foreground shadow-sm",
					)}
					title={label}
					aria-label={`Switch to ${label} theme`}
				>
					<Icon className="size-3.5" strokeWidth={2} />
				</button>
			))}
		</div>
	);
}
