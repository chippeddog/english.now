import { useTranslation } from "@english.now/i18n";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useMemo } from "react";
import { toast } from "sonner";
import z from "zod";
import { authClient } from "@/lib/auth-client";
import Logo from "../logo";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

type ResetPassFormProps = {
	token: string;
};

export default function ResetPassForm({ token }: ResetPassFormProps) {
	const { t } = useTranslation("common");
	const navigate = useNavigate();
	const resetSchema = useMemo(
		() =>
			z.object({
				password: z.string().min(8, t("auth.validation.passwordMin")),
				confirmPassword: z.string().min(8, t("auth.validation.passwordMin")),
			}),
		[t],
	);
	const form = useForm({
		defaultValues: {
			password: "",
			confirmPassword: "",
		},
		onSubmit: async ({ value }) => {
			await authClient.resetPassword(
				{
					newPassword: value.password,
					token: token,
				},
				{
					onSuccess: () => {
						toast.success(t("auth.toast.passwordUpdated"));
						navigate({
							to: "/login",
						});
					},
					onError: (error) => {
						toast.error(error.error.message || error.error.statusText);
					},
				},
			);
		},
		validators: {
			onSubmit: resetSchema,
		},
	});

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
			<Logo />
			<div className="mt-3 mb-6">
				<h1 className="mb-1 font-bold font-lyon text-3xl">
					{t("auth.reset.title")}
				</h1>
				<p className="text-neutral-500 text-sm">
					{t("auth.reset.description")}
				</p>
			</div>

			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
				className="space-y-4"
			>
				<div>
					<form.Field name="password">
						{(field) => (
							<div className="space-y-2">
								<Label className="gap-0" htmlFor={field.name}>
									{t("auth.fields.password")}
									<span className="text-rose-500">&nbsp;*</span>
								</Label>
								<Input
									id={field.name}
									name={field.name}
									type="password"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
								/>
								{field.state.meta.errors.map((error) => (
									<p key={error?.message} className="text-red-500 text-sm">
										{error?.message}
									</p>
								))}
							</div>
						)}
					</form.Field>
				</div>

				<div>
					<form.Field name="confirmPassword">
						{(field) => (
							<div className="space-y-2">
								<Label className="gap-0" htmlFor={field.name}>
									{t("auth.fields.confirmPassword")}
									<span className="text-rose-500">&nbsp;*</span>
								</Label>
								<Input
									id={field.name}
									name={field.name}
									type="password"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
								/>
								{field.state.meta.errors.map((error) => (
									<p key={error?.message} className="text-red-500 text-sm">
										{error?.message}
									</p>
								))}
							</div>
						)}
					</form.Field>
				</div>
				<form.Subscribe>
					{(state) => (
						<button
							type="submit"
							className="flex h-10 w-full cursor-pointer items-center justify-center rounded-lg border border-[#C6F64D] bg-[radial-gradient(100%_100%_at_50%_0%,#EFFF9B_0%,#D8FF76_60%,#C6F64D_100%)] px-3 py-1 font-semibold text-lime-900 text-sm transition-all duration-150 ease-in-out hover:brightness-95"
							disabled={!state.canSubmit || state.isSubmitting}
						>
							{state.isSubmitting
								? t("auth.reset.submitting")
								: t("auth.reset.updatePassword")}
						</button>
					)}
				</form.Subscribe>
			</form>
		</motion.div>
	);
}
