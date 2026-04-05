import { useRouterState } from "@tanstack/react-router";
import * as React from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextValue {
	theme: Theme;
	setTheme: (theme: Theme) => void;
	resolvedTheme: "light" | "dark";
}

const ThemeContext = React.createContext<ThemeContextValue | undefined>(
	undefined,
);

function applyTheme(resolved: "light" | "dark") {
	const root = document.documentElement;
	root.classList.remove("light", "dark");
	root.classList.add(resolved);
	root.style.colorScheme = resolved;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	});
	const resolvedTheme: "light" | "dark" = pathname.startsWith("/b2b")
		? "dark"
		: "light";
	const theme: Theme = resolvedTheme;
	const setTheme = React.useCallback((_theme: Theme) => {}, []);

	React.useEffect(() => {
		applyTheme(resolvedTheme);
	}, [resolvedTheme]);

	const value = React.useMemo(
		() => ({ theme, setTheme, resolvedTheme }),
		[theme, setTheme, resolvedTheme],
	);

	return (
		<ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
	);
}

export function useTheme() {
	const context = React.useContext(ThemeContext);
	if (!context) {
		throw new Error("useTheme must be used within a ThemeProvider");
	}
	return context;
}
