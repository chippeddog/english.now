import { useForm } from "@tanstack/react-form";
import { Link, useNavigate } from "@tanstack/react-router";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import z from "zod";
import { authClient } from "@/lib/auth-client";
import Logo from "../logo";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

export default function SignUpForm() {
	const navigate = useNavigate({
		from: "/",
	});
	const [showPassword, setShowPassword] = useState(false);
	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
			name: "",
		},
		onSubmit: async ({ value }) => {
			await authClient.signUp.email(
				{
					email: value.email,
					password: value.password,
					name: value.name,
				},
				{
					onSuccess: () => {
						navigate({
							to: "/verify",
							search: {
								email: value.email,
							},
						});
						toast.success("Sign up successful");
					},
					onError: (error) => {
						toast.error(error.error.message || error.error.statusText);
					},
				},
			);
		},
		validators: {
			onSubmit: z.object({
				name: z.string().min(2, "Name must be at least 2 characters"),
				email: z.email("Invalid email address"),
				password: z.string().min(8, "Password must be at least 8 characters"),
			}),
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
			<div className="mt-2 mb-6">
				<h1 className="mb-1 font-bold font-lyon text-3xl">
					Create your account
				</h1>
				<p className="text-neutral-500 text-sm">
					Already have an account?{" "}
					<Link
						to="/login"
						className="cursor-pointer text-lime-600 underline hover:text-lime-600/80"
					>
						Sign In
					</Link>
				</p>
			</div>

			<div className="flex flex-col gap-3">
				<Button
					className="w-full cursor-pointer text-black hover:brightness-95"
					style={{
						background:
							"linear-gradient(0deg, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0.75) 100%)",
						boxShadow:
							"0px 0px 0px 1px rgba(0, 0, 0, 0.1), 0px 1px 0px 0px rgb(255, 255, 255, 1) inset, 0px 1px 2px 1px rgba(0, 0, 0, 0.06)",
					}}
					onClick={() =>
						authClient.signIn.social({
							provider: "google",
							callbackURL: `${import.meta.env.MODE === "development" ? "http://localhost:3001/home" : "https://english.now/home"}`,
						})
					}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="16"
						height="16"
						viewBox="0 0 16 16"
						aria-hidden="true"
					>
						<g fill="none" fill-rule="evenodd" clip-rule="evenodd">
							<path
								fill="#f44336"
								d="M7.209 1.061c.725-.081 1.154-.081 1.933 0a6.57 6.57 0 0 1 3.65 1.82a100 100 0 0 0-1.986 1.93q-1.876-1.59-4.188-.734q-1.696.78-2.362 2.528a78 78 0 0 1-2.148-1.658a.26.26 0 0 0-.16-.027q1.683-3.245 5.26-3.86"
								opacity="0.987"
							/>
							<path
								fill="#ffc107"
								d="M1.946 4.92q.085-.013.161.027a78 78 0 0 0 2.148 1.658A7.6 7.6 0 0 0 4.04 7.99q.037.678.215 1.331L2 11.116Q.527 8.038 1.946 4.92"
								opacity="0.997"
							/>
							<path
								fill="#448aff"
								d="M12.685 13.29a26 26 0 0 0-2.202-1.74q1.15-.812 1.396-2.228H8.122V6.713q3.25-.027 6.497.055q.616 3.345-1.423 6.032a7 7 0 0 1-.51.49"
								opacity="0.999"
							/>
							<path
								fill="#43a047"
								d="M4.255 9.322q1.23 3.057 4.51 2.854a3.94 3.94 0 0 0 1.718-.626q1.148.812 2.202 1.74a6.62 6.62 0 0 1-4.027 1.684a6.4 6.4 0 0 1-1.02 0Q3.82 14.524 2 11.116z"
								opacity="0.993"
							/>
						</g>
					</svg>
					Continue with Google
				</Button>

				<Button
					className="w-full cursor-pointer text-black hover:brightness-95"
					style={{
						background:
							"linear-gradient(0deg, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0.75) 100%)",
						boxShadow:
							"0px 0px 0px 1px rgba(0, 0, 0, 0.1), 0px 1px 0px 0px rgb(255, 255, 255, 1) inset, 0px 1px 2px 1px rgba(0, 0, 0, 0.06)",
					}}
					onClick={() =>
						authClient.signIn.social(
							{
								provider: "google",
								callbackURL: `${import.meta.env.MODE === "development" ? "http://localhost:3001/home" : "https://english.now/home"}`,
							},
							{
								onError: (error) => {
									toast.error(error.error.message || error.error.statusText);
								},
							},
						)
					}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="256"
						height="315"
						viewBox="0 0 256 315"
						aria-hidden="true"
					>
						<path d="M213.803 167.03c.442 47.58 41.74 63.413 42.197 63.615c-.35 1.116-6.599 22.563-21.757 44.716c-13.104 19.153-26.705 38.235-48.13 38.63c-21.05.388-27.82-12.483-51.888-12.483c-24.061 0-31.582 12.088-51.51 12.871c-20.68.783-36.428-20.71-49.64-39.793c-27-39.033-47.633-110.3-19.928-158.406c13.763-23.89 38.36-39.017 65.056-39.405c20.307-.387 39.475 13.662 51.889 13.662c12.406 0 35.699-16.895 60.186-14.414c10.25.427 39.026 4.14 57.503 31.186c-1.49.923-34.335 20.044-33.978 59.822M174.24 50.199c10.98-13.29 18.369-31.79 16.353-50.199c-15.826.636-34.962 10.546-46.314 23.828c-10.173 11.763-19.082 30.589-16.678 48.633c17.64 1.365 35.66-8.964 46.64-22.262" />
					</svg>
					Continue with Apple
				</Button>
			</div>
			<div className="mt-4 mb-4">
				<div className="relative">
					<div
						className="absolute inset-0 flex items-center"
						aria-hidden="true"
					>
						<div className="w-full border-neutral-200 border-t" />
					</div>
					<div className="relative flex justify-center text-xs">
						<span className="bg-white px-2 text-neutral-500">
							or continue with
						</span>
					</div>
				</div>
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
					<form.Field name="name">
						{(field) => (
							<div className="space-y-2">
								<Label className="gap-0" htmlFor={field.name}>
									Name<span className="text-rose-500">&nbsp;*</span>
								</Label>
								<Input
									id={field.name}
									name={field.name}
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
					<form.Field name="email">
						{(field) => (
							<div className="space-y-2">
								<Label className="gap-0" htmlFor={field.name}>
									Email<span className="text-rose-500">&nbsp;*</span>
								</Label>
								<Input
									id={field.name}
									name={field.name}
									type="email"
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
					<form.Field name="password">
						{(field) => (
							<div className="space-y-2">
								<Label className="gap-0" htmlFor={field.name}>
									Password<span className="text-rose-500">&nbsp;*</span>
								</Label>
								<div className="relative">
									<button
										type="button"
										onClick={() => setShowPassword(!showPassword)}
										className="-translate-y-1/2 absolute top-1/2 right-0.5 inline-flex size-8 shrink-0 cursor-pointer items-center justify-center gap-3 overflow-hidden whitespace-nowrap rounded-sm font-medium text-muted-foreground outline-none transition-all hover:bg-accent hover:text-accent-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-40 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 dark:hover:bg-accent/50 [&_svg]:pointer-events-none"
									>
										{showPassword ? (
											<EyeIcon className="size-4" />
										) : (
											<EyeOffIcon className="size-4" />
										)}
									</button>
									<Input
										id={field.name}
										name={field.name}
										type={showPassword ? "text" : "password"}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
									/>
								</div>
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
							className="flex h-10 w-full cursor-pointer items-center justify-center rounded-lg border border-[#C6F64D] bg-[radial-gradient(100%_100%_at_50%_0%,#EFFF9B_0%,#D8FF76_60%,#C6F64D_100%)] px-3 py-1 font-semibold text-lime-900 text-sm transition-all duration-150 ease-in-out hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
							disabled={!state.canSubmit || state.isSubmitting}
						>
							{state.isSubmitting ? (
								<svg
									aria-hidden="true"
									className="size-5 animate-spin"
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 24 24"
								>
									<path
										fill="currentColor"
										d="M12 2a1 1 0 0 1 1 1v3a1 1 0 1 1-2 0V3a1 1 0 0 1 1-1m0 15a1 1 0 0 1 1 1v3a1 1 0 1 1-2 0v-3a1 1 0 0 1 1-1m8.66-10a1 1 0 0 1-.366 1.366l-2.598 1.5a1 1 0 1 1-1-1.732l2.598-1.5A1 1 0 0 1 20.66 7M7.67 14.5a1 1 0 0 1-.367 1.366l-2.598 1.5a1 1 0 1 1-1-1.732l2.598-1.5a1 1 0 0 1 1.366.366M20.66 17a1 1 0 0 1-1.366.366l-2.598-1.5a1 1 0 0 1 1-1.732l2.598 1.5A1 1 0 0 1 20.66 17M7.67 9.5a1 1 0 0 1-1.367.366l-2.598-1.5a1 1 0 1 1 1-1.732l2.598 1.5A1 1 0 0 1 7.67 9.5"
									/>
								</svg>
							) : (
								"Sign Up"
							)}
						</button>
					)}
				</form.Subscribe>
			</form>
			<p className="mt-4 text-center text-neutral-500 text-xs">
				By creating or entering an account, you agree to the <br />
				<Link
					to="/terms"
					target="_blank"
					className="cursor-pointer text-lime-600 underline hover:text-lime-600/80"
				>
					Terms of Service
				</Link>{" "}
				and{" "}
				<Link
					to="/privacy"
					target="_blank"
					className="cursor-pointer text-lime-600 underline hover:text-lime-600/80"
				>
					Privacy Policy
				</Link>
				.
			</p>
		</motion.div>
	);
}
