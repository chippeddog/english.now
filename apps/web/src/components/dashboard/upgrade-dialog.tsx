import { Link } from "@tanstack/react-router";
import { CheckIcon, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { openCheckout } from "@/lib/paddle";
import { cn } from "@/lib/utils";
import Loader from "../loader";
import { Button } from "../ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";

const PADDLE_PRICE_IDS = {
	monthly: import.meta.env.VITE_PADDLE_PRICE_MONTHLY ?? "",
	yearly: import.meta.env.VITE_PADDLE_PRICE_YEARLY ?? "",
} as const;

export default function UpgradeDialog({
	open,
	onOpenChange,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const [isLoading, setIsLoading] = useState(false);
	const [plan, setPlan] = useState<"monthly" | "yearly">("monthly");
	const { data: session } = authClient.useSession();

	const features = [
		"Unlimited AI conversations",
		"Advanced AI feedback",
		"Full vocabulary library",
		"Personalized learning path",
		"Progress tracking and analytics",
	];
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogTrigger asChild>
				<button
					type="button"
					aria-label="Upgrade now"
					//className="flex cursor-pointer items-center gap-0.5 whitespace-nowrap py-1.5 font-medium text-lime-700 text-sm italic shadow-none transition duration-150 ease-in-out will-change-transform hover:brightness-95 focus:shadow-none focus:outline-none focus-visible:shadow-none"
					className="flex cursor-pointer items-center gap-0.5 whitespace-nowrap rounded-xl border border-[#C6F64D] bg-[radial-gradient(100%_100%_at_50%_0%,#EFFF9B_0%,#D8FF76_60%,#C6F64D_100%)] px-2 py-1.5 font-medium text-lime-900 text-sm italic shadow-none transition duration-150 ease-in-out will-change-transform hover:bg-lime-700/10 hover:brightness-95 focus:shadow-none focus:outline-none focus-visible:shadow-none"
				>
					<Zap fill="currentColor" className="size-3.5" />
					PRO{" "}
				</button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle className="mb-2 font-bold font-lyon text-2xl leading-tight">
						Upgrade to Pro
					</DialogTitle>
					<DialogDescription className="text-md">
						Join{" "}
						<span className="rounded-lg bg-lime-100 px-2 py-0.5 font-medium text-lime-700">
							10,000+
						</span>{" "}
						learners and start your <br /> journey to fluency today.
					</DialogDescription>
				</DialogHeader>
				<div className="grid gap-4 py-4">
					<div className="space-y-2">
						{features.map((feature) => (
							<div className="flex items-center gap-2" key={feature}>
								<CheckIcon className="size-4 shrink-0 text-muted-foreground" />
								<span className="text-muted-foreground text-sm">{feature}</span>
							</div>
						))}
					</div>
				</div>
				<RadioGroup
					value={plan}
					onValueChange={(value) => setPlan(value as "monthly" | "yearly")}
					className="grid grid-cols-1 gap-3"
				>
					<Label
						htmlFor="yearly"
						className={cn(
							"relative flex cursor-pointer flex-col items-center rounded-2xl border p-4 transition-all",
							plan === "yearly"
								? "border-lime-600 dark:bg-lime-950/30"
								: "border-neutral-200 hover:border-neutral-300 dark:border-neutral-700 dark:hover:border-neutral-600",
						)}
					>
						<div className="flex w-full items-center justify-between">
							<div className="flex items-center gap-2">
								<RadioGroupItem value="yearly" id="yearly" />
								<span className="font-bold text-slate-900 dark:text-white">
									Yearly
								</span>
								<span className="rounded-md bg-lime-100 bg-radial px-2 py-1 font-medium text-lime-700 text-xs">
									Save 30%
								</span>
							</div>
							<div>
								<span className="font-bold text-lg text-slate-900 dark:text-white">
									$100
								</span>
								<span className="ml-1 font-light text-muted-foreground text-xs md:text-sm md:leading-7">
									/year
								</span>
							</div>
						</div>
					</Label>
					<Label
						htmlFor="monthly"
						className={cn(
							"relative flex cursor-pointer flex-col items-center rounded-2xl border p-4 transition-all",
							plan === "monthly"
								? "border-lime-600 dark:border-[#D8FF76] dark:bg-lime-950/30"
								: "border-neutral-200 hover:border-neutral-300 dark:border-neutral-700 dark:hover:border-neutral-600",
						)}
					>
						<div className="flex w-full items-center justify-between">
							<div className="flex items-center gap-2">
								<RadioGroupItem value="monthly" id="monthly" />
								<span className="font-bold text-slate-900 dark:text-white">
									Monthly
								</span>
							</div>
							<div>
								<span className="font-bold text-lg text-slate-900 dark:text-white">
									$12
								</span>
								<span className="ml-1 font-light text-muted-foreground text-xs md:text-sm md:leading-7">
									/month
								</span>
							</div>
						</div>
					</Label>
				</RadioGroup>

				<div className="mt-1 flex">
					<Button
						disabled={isLoading}
						size="xl"
						className="flex w-full cursor-pointer items-center gap-0.5 whitespace-nowrap rounded-xl border border-[#C6F64D] bg-[radial-gradient(100%_100%_at_50%_0%,#EFFF9B_0%,#D8FF76_60%,#C6F64D_100%)] px-2 py-1.5 font-medium text-lime-900 text-sm italic shadow-none transition duration-150 ease-in-out will-change-transform hover:bg-lime-700/10 hover:brightness-95 focus:shadow-none focus:outline-none focus-visible:shadow-none"
						onClick={async () => {
							if (!session?.user) return;
							setIsLoading(true);
							await openCheckout({
								priceId:
									plan === "yearly"
										? PADDLE_PRICE_IDS.yearly
										: PADDLE_PRICE_IDS.monthly,
								userId: session.user.id,
								email: session.user.email,
								onSuccess: (data) => {
									console.log(data);
									setIsLoading(false);
									toast.success("Subscription successful");
								},
							});
						}}
					>
						{isLoading ? <Loader /> : "Start 7-Day Free Trial"}
					</Button>
				</div>
				<div>
					<div className="text-center text-muted-foreground text-xs">
						By continuing, you agree to our{" "}
						<Link
							target="_blank"
							className="text-lime-700 hover:text-lime-700/80"
							to="/terms"
						>
							Terms of Service
						</Link>
						,{" "}
						<Link
							target="_blank"
							className="text-lime-700 hover:text-lime-700/80"
							to="/privacy"
						>
							Privacy
						</Link>{" "}
						and{" "}
						<Link
							target="_blank"
							className="text-lime-700 hover:text-lime-700/80"
							to="/refund"
						>
							Refund & Cancellation Policy
						</Link>
						.
					</div>
					{/* 
					<div className="flex items-center justify-center gap-1.5 font-medium text-sm">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width={16}
							height={17}
							fill="none"
							className="shrink-0"
							aria-label="Shield checkmark"
							role="img"
							viewBox="0 0 16 17"
						>
							<title>Safe &amp; secure payment</title>
							<path
								fill="#278C49"
								d="M.895 4.654c0-.62.37-1.186.939-1.437L7.36.776c.403-.181.869-.181 1.28 0l5.526 2.441c.568.251.94.817.94 1.437v3.69a9.9 9.9 0 0 1-1.25 4.773c-2.435 4.417-8.488 4.417-11.713 0A9.9 9.9 0 0 1 .895 8.344z"
							/>
							<g clipPath="url(#a)">
								<path
									stroke="#fff"
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={1.184}
									d="M10.632 6.562 7.014 10.18 5.369 8.536"
								/>
							</g>
							<defs>
								<clipPath id="a">
									<rect
										x={4.053}
										y={4.585}
										width={7.895}
										height={7.895}
										fill="#fff"
									/>
								</clipPath>
							</defs>
						</svg>
						Pay safe &amp; Secure
					</div> */}
				</div>
			</DialogContent>
		</Dialog>
	);
}
