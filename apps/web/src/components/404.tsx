import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";

function formatCurrentDateTime(date: Date) {
	const datePart = new Intl.DateTimeFormat("en-US", {
		weekday: "long",
		year: "numeric",
		month: "long",
		day: "numeric",
	}).format(date);
	const timePart = new Intl.DateTimeFormat("en-US", {
		hour: "numeric",
		minute: "2-digit",
		second: "2-digit",
		hour12: true,
	}).format(date);
	return `${datePart} ${timePart}`;
}

export default function NotFound() {
	const [now, setNow] = useState<Date | null>(null);

	useEffect(() => {
		setNow(new Date());
		const id = setInterval(() => setNow(new Date()), 1000);
		return () => clearInterval(id);
	}, []);

	return (
		<div className="container mx-auto flex h-dvh flex-col items-center justify-center">
			<div className="mb-4">
				<Link to="/" className="flex items-center gap-3">
					<div className="relative size-14 overflow-hidden rounded-3xl border border-[#C6F64D] bg-[radial-gradient(100%_100%_at_50%_0%,#EFFF9B_0%,#D8FF76_60%,#C6F64D_100%)]">
						<img
							className="absolute bottom-[-10px] h-full w-full object-contain"
							src="/logo-404.svg"
							alt="English Now Logo"
							width={62}
							height={62}
						/>
					</div>
				</Link>
			</div>
			<div className="text-center">
				<div className="mb-2 font-bold font-geist-serif text-3xl">
					Page Not Found
				</div>
				<p className="mb-3 text-muted-foreground text-sm italic tabular-nums">
					{now ? formatCurrentDateTime(now) : "\u00a0"}
				</p>
				<div className="text-muted-foreground">
					The page you're looking for cannot be found. <br />
					If this keeps happening, please{" "}
					<a
						className="text-blue-600 underline"
						href="mailto:support@english.now"
					>
						contact us
					</a>
					.
				</div>
				<Button variant="link" size="lg" asChild>
					<Link to="/">Back to home</Link>
				</Button>
			</div>
		</div>
	);
}
