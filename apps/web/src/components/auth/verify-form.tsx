import { useNavigate } from "@tanstack/react-router";
import { Loader } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { Button } from "../ui/button";

type VerifyFormProps = {
	email: string;
};

export default function VerifyForm({ email }: VerifyFormProps) {
	const navigate = useNavigate();
	const [isResending, setIsResending] = useState(false);

	const handleResend = async () => {
		setIsResending(true);

		try {
			await authClient.sendVerificationEmail(
				{
					email,
					callbackURL: `${window.location.origin}/home`,
				},
				{
					onSuccess: () => {
						toast.success("Verification email sent");
					},
					onError: (error) => {
						toast.error(error.error.message || error.error.statusText);
					},
				},
			);
		} finally {
			setIsResending(false);
		}
	};

	const handleChangeEmail = () => {
		if (window.history.length > 1) {
			window.history.back();
			return;
		}

		navigate({ to: "/login" });
	};

	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.2, ease: "easeInOut", delay: 0.1 }}
			className="mx-auto w-full max-w-sm rounded-3xl bg-white p-6"
			style={{
				boxShadow:
					"0 0 0 1px rgba(0,0,0,.05),0 10px 10px -5px rgba(0,0,0,.04),0 20px 25px -5px rgba(0,0,0,.04),0 20px 32px -12px rgba(0,0,0,.04)",
			}}
		>
			<div className="mt-2 mb-6 text-center">
				<div className="mx-auto mb-4 flex items-center justify-center">
					<div className="relative size-12 overflow-hidden rounded-2xl border border-[#C6F64D] bg-[radial-gradient(100%_100%_at_50%_0%,#EFFF9B_0%,#D8FF76_60%,#C6F64D_100%)]">
						<img
							className="absolute bottom-[-10px] h-full w-full object-contain"
							src="/logo-404.svg"
							alt="English Now Logo"
							width={62}
							height={62}
						/>
					</div>
				</div>
				<h1 className="mb-2 font-bold font-lyon text-3xl">
					Confirm your email
				</h1>
				<p className="text-neutral-500 text-sm">
					We sent a verification link to
				</p>
				<p className="mt-2 break-all font-medium text-neutral-900 text-sm italic">
					{email}
				</p>
			</div>

			<div className="flex flex-col gap-3">
				<Button
					type="button"
					onClick={handleResend}
					disabled={isResending}
					className="h-10 w-full cursor-pointer border border-[#C6F64D] bg-[radial-gradient(100%_100%_at_50%_0%,#EFFF9B_0%,#D8FF76_60%,#C6F64D_100%)] font-semibold text-lime-900 hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{isResending ? (
						<>
							<Loader className="size-4 animate-spin" />
							Sending...
						</>
					) : (
						"Resend verification email"
					)}
				</Button>
				<Button
					type="button"
					variant="outline"
					onClick={handleChangeEmail}
					className="h-10 w-full cursor-pointer"
				>
					Change Email
				</Button>
			</div>

			<p className="mt-4 text-center text-neutral-500 text-sm">
				Can't find the email? Check your spam folder or resend a new link.
			</p>
		</motion.div>
	);
}
