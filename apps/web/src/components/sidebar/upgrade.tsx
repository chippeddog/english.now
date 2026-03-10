"use client";

import { useQuery } from "@tanstack/react-query";
import { Check, Loader2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { openCheckout } from "@/lib/paddle";
import { useTRPC } from "@/utils/trpc";
import { Button } from "../ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "../ui/dialog";
import { Switch } from "../ui/switch";

const PADDLE_PRICE_IDS = {
	monthly: import.meta.env.VITE_PADDLE_PRICE_MONTHLY ?? "",
	yearly: import.meta.env.VITE_PADDLE_PRICE_YEARLY ?? "",
} as const;

export default function Upgrade() {
	const trpc = useTRPC();
	const [isAnnual, setIsAnnual] = useState(false);
	const [isOpen, setIsOpen] = useState(false);
	const { data: session } = authClient.useSession();
	const [isLoading, setIsLoading] = useState(false);
	const { data: profile, isPending } = useQuery(
		trpc.profile.get.queryOptions(),
	);

	if (isPending) return null;
	if (profile?.subscription?.isPro) return null;

	return (
		<div className="w-full">
			<div className="">
				<Dialog open={isOpen} onOpenChange={setIsOpen}>
					<DialogTrigger asChild>
						<button
							type="button"
							aria-label="Upgrade now"
							className="group flex h-9 w-full cursor-pointer items-center justify-center gap-1 whitespace-nowrap rounded-lg border-0 border-transparent bg-[radial-gradient(100%_100%_at_50%_0%,#EFFF9B_0%,#D8FF76_60%,#C6F64D_100%)] px-3 py-1 font-medium text-lime-900 text-sm shadow-none transition duration-150 ease-in-out will-change-transform hover:bg-slate-100 hover:brightness-95 focus:shadow-none focus:outline-none focus-visible:shadow-none focus-visible:shadow-outline-indigo active:scale-97 dark:text-slate-100 dark:hover:bg-white/10 dark:hover:text-white"
						>
							<svg
								width="16px"
								height="16px"
								viewBox="0 0 16 16"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
								className="relative"
								aria-label="Upgrade now"
								role="img"
							>
								<title>Upgrade now</title>
								<rect
									width="16"
									height="16"
									rx="8"
									fill="url(#paint0_linear_1_1999)"
								/>
								<path
									d="M8.66725 4.80043C8.66725 4.30571 8.02563 4.11145 7.75121 4.52307L5.0626 8.55599C4.84108 8.88827 5.07928 9.33335 5.47863 9.33335H7.3339V11.1996C7.3339 11.6943 7.97552 11.8886 8.24994 11.4769L10.9385 7.44401C11.1601 7.11173 10.9219 6.66665 10.5225 6.66665H8.66725V4.80043Z"
									fill="white"
								/>
								<defs>
									<linearGradient
										id="paint0_linear_1_1999"
										x1="8"
										y1="0"
										x2="8"
										y2="16"
										gradientUnits="userSpaceOnUse"
									>
										<stop stopColor="#C6F64D" />
										<stop offset="1" />
									</linearGradient>
								</defs>
							</svg>
							Upgrade
						</button>
					</DialogTrigger>
					<DialogContent showCloseButton={false} className="sm:max-w-[425px]">
						<DialogHeader>
							<DialogTitle>Upgrade Plan</DialogTitle>
							<DialogDescription>
								Choose the plan that works best for you.
							</DialogDescription>
						</DialogHeader>
						<button
							type="button"
							onClick={() => setIsOpen(false)}
							className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 transition-colors hover:bg-neutral-200"
						>
							<X className="size-4" />
						</button>
						<div className="grid gap-4 py-4">
							<div className="flex items-center justify-center gap-4">
								<span
									className={`text-sm ${!isAnnual ? "font-bold text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400"}`}
								>
									Monthly
								</span>
								<Switch checked={isAnnual} onCheckedChange={setIsAnnual} />
								<span
									className={`text-sm ${isAnnual ? "font-bold text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400"}`}
								>
									Annual{" "}
									<span className="font-medium text-green-600 text-xs dark:text-green-400">
										(Save 20%)
									</span>
								</span>
							</div>

							<div className="rounded-lg border p-4 text-center">
								<div className="font-bold text-3xl text-slate-900 dark:text-white">
									{isAnnual ? "$190" : "$19"}
									<span className="font-normal text-base text-slate-500 dark:text-slate-400">
										/{isAnnual ? "year" : "month"}
									</span>
								</div>
								{isAnnual && (
									<p className="mt-1 text-slate-500 text-sm dark:text-slate-400">
										Billed annually. Equivalent to $15.83/month.
									</p>
								)}
							</div>

							<div className="space-y-2">
								<div className="flex items-center gap-2">
									<Check className="h-4 w-4 text-green-500" />
									<span className="text-slate-700 text-sm dark:text-slate-300">
										Unlimited AI Conversations
									</span>
								</div>
								<div className="flex items-center gap-2">
									<Check className="h-4 w-4 text-green-500" />
									<span className="text-slate-700 text-sm dark:text-slate-300">
										Advanced Grammar Analysis
									</span>
								</div>
								<div className="flex items-center gap-2">
									<Check className="h-4 w-4 text-green-500" />
									<span className="text-slate-700 text-sm dark:text-slate-300">
										Personalized Learning Path
									</span>
								</div>
								<div className="flex items-center gap-2">
									<Check className="h-4 w-4 text-green-500" />
									<span className="text-slate-700 text-sm dark:text-slate-300">
										Priority Support
									</span>
								</div>
							</div>
						</div>
						<div className="flex justify-end">
							<Button
								className="w-full"
								disabled={isLoading}
								onClick={async () => {
									if (!session?.user) return;
									setIsLoading(true);
									await openCheckout({
										priceId: isAnnual
											? PADDLE_PRICE_IDS.yearly
											: PADDLE_PRICE_IDS.monthly,
										userId: session.user.id,
										email: session.user.email,
										onSuccess: (data) => {
											console.log(data);
											toast.success("Subscription successful");
										},
									}).finally(() => {
										setIsLoading(false);
									});
								}}
							>
								{isLoading ? (
									<Loader2 className="size-4 animate-spin" />
								) : (
									"Subscribe Now"
								)}
							</Button>
						</div>
					</DialogContent>
				</Dialog>
			</div>
		</div>
	);
}
