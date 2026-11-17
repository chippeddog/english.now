import type { AppRouter } from "@english.now/api/routers/index";
import { useMutation } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { inferRouterInputs } from "@trpc/server";
import { CheckCircle2, ChevronDownIcon } from "lucide-react";
import { type FormEvent, type ReactNode, useId, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/utils/trpc";

type BusinessInquiry =
	inferRouterInputs<AppRouter>["contact"]["submitBusinessInquiry"];
type TeamSize = BusinessInquiry["teamSize"];
type RequiredField = "name" | "email" | "company" | "teamSize";
type FieldErrors = Partial<Record<RequiredField, string>>;

const TEAM_SIZE_OPTIONS: ReadonlyArray<{ value: TeamSize; label: string }> = [
	{ value: "1-19", label: "1–19 people" },
	{ value: "20-99", label: "20–99 people" },
	{ value: "100-499", label: "100–499 people" },
	{ value: "500-1999", label: "500–1,999 people" },
	{ value: "2000+", label: "2,000+ people" },
];

const FIELD_ORDER: readonly RequiredField[] = [
	"name",
	"email",
	"company",
	"teamSize",
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const FIELD_CLASS =
	" shadow-none placeholder:text-[#5B6478]/70 focus-visible:border-[#007AFF] focus-visible:bg-white focus-visible:ring-[#007AFF]/40";

function isTeamSize(value: string): value is TeamSize {
	return TEAM_SIZE_OPTIONS.some((option) => option.value === value);
}

function readForm(form: HTMLFormElement) {
	const data = new FormData(form);
	const read = (key: string) => String(data.get(key) ?? "").trim();
	return {
		name: read("name"),
		email: read("email"),
		company: read("company"),
		jobTitle: read("jobTitle"),
		teamSize: read("teamSize"),
		message: read("message"),
	};
}

function validate(values: ReturnType<typeof readForm>): FieldErrors {
	const errors: FieldErrors = {};
	if (!values.name) errors.name = "Enter your name.";
	if (!values.email) {
		errors.email = "Enter your work email.";
	} else if (!EMAIL_PATTERN.test(values.email)) {
		errors.email = "Enter an email like name@company.com.";
	}
	if (!values.company) errors.company = "Enter your company name.";
	if (!isTeamSize(values.teamSize)) {
		errors.teamSize = "Choose a team size.";
	}
	return errors;
}

export function DemoRequestForm({ className }: { className?: string }) {
	const trpc = useTRPC();
	const formId = useId();
	const [errors, setErrors] = useState<FieldErrors>({});
	const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

	const submitInquiry = useMutation(
		trpc.contact.submitBusinessInquiry.mutationOptions({
			onError: (error) => {
				toast.error(
					error.data?.code === "TOO_MANY_REQUESTS"
						? "You've sent a few requests already. Try again in 10 minutes."
						: error.message,
				);
			},
		}),
	);

	const fieldId = (name: string) => `${formId}-${name}`;
	const errorId = (name: RequiredField) => `${formId}-${name}-error`;

	function clearError(name: string) {
		if (!(name in errors)) return;
		setErrors((current) => {
			const next = { ...current };
			delete next[name as RequiredField];
			return next;
		});
	}

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const form = event.currentTarget;
		const values = readForm(form);
		const nextErrors = validate(values);
		setErrors(nextErrors);

		const firstInvalid = FIELD_ORDER.find((name) => nextErrors[name]);
		if (firstInvalid || !isTeamSize(values.teamSize)) {
			if (firstInvalid) {
				const element = form.elements.namedItem(firstInvalid);
				if (element instanceof HTMLElement) element.focus();
			}
			return;
		}

		try {
			await submitInquiry.mutateAsync({
				name: values.name,
				email: values.email,
				company: values.company,
				teamSize: values.teamSize,
				jobTitle: values.jobTitle || undefined,
				message: values.message || undefined,
			});
			setSubmittedEmail(values.email);
			form.reset();
		} catch {
			// toast handled in onError
		}
	}

	function fieldProps(name: RequiredField) {
		const error = errors[name];
		return {
			id: fieldId(name),
			name,
			"aria-invalid": error ? true : undefined,
			"aria-describedby": error ? errorId(name) : undefined,
		};
	}

	return (
		<div
			className={cn(
				"rounded-2xl bg-white p-6 md:p-7",
				"shadow-[0_0_0_1px_rgba(0,0,0,.05),0_10px_10px_-5px_rgba(0,0,0,.04),0_20px_25px_-5px_rgba(0,0,0,.04),0_20px_32px_-12px_rgba(0,0,0,.04)]",
				className,
			)}
		>
			{submittedEmail ? (
				<div className="flex flex-col items-start py-6" aria-live="polite">
					<span className="flex size-10 items-center justify-center rounded-md bg-now-gradient text-now-deep">
						<CheckCircle2 className="size-5" />
					</span>
					<h2 className="mt-5 font-semibold text-[#172033] text-[1.3125rem] leading-[1.3] tracking-[-0.012em]">
						Contact Sales
					</h2>
					<p className="mt-2 text-[#5B6478] leading-[1.6]">
						We'll email{" "}
						<span className="font-medium text-[#172033]">{submittedEmail}</span>{" "}
						to find a time for an intro call.
					</p>
					<Button
						type="button"
						variant="ghost"
						className="-ml-3 mt-6 rounded-[10px] text-[#172033] hover:bg-[#F5F7FA]"
						onClick={() => setSubmittedEmail(null)}
					>
						Send another request
					</Button>
				</div>
			) : (
				<form
					noValidate
					onSubmit={handleSubmit}
					onInput={(event) => {
						const target = event.target as HTMLInputElement;
						clearError(target.name);
					}}
					aria-labelledby={`${formId}-title`}
				>
					<h2
						id={`${formId}-title`}
						className="font-semibold text-[#172033] text-[1.3125rem] leading-[1.3] tracking-[-0.012em]"
					>
						Request a demo
					</h2>
					<p className="mt-1.5 text-[#5B6478] text-sm leading-[1.45]">
						Tell us about your team and we'll set up an intro call. Or{" "}
						<Link
							to="/book-a-demo"
							className="font-medium text-[#172033] underline underline-offset-2 hover:text-[#172033]/80"
						>
							pick a time
						</Link>
						.
					</p>

					<div className="mt-6 grid gap-4 sm:grid-cols-2">
						<Field
							label="Full name"
							htmlFor={fieldId("name")}
							error={errors.name}
							errorId={errorId("name")}
						>
							<Input
								{...fieldProps("name")}
								type="text"
								autoComplete="name"
								placeholder="Alex Morgan"
								maxLength={200}
								className={FIELD_CLASS}
							/>
						</Field>
						<Field label="Job title" htmlFor={fieldId("jobTitle")} optional>
							<Input
								id={fieldId("jobTitle")}
								name="jobTitle"
								type="text"
								autoComplete="organization-title"
								placeholder="Head of L&D"
								maxLength={200}
								className={FIELD_CLASS}
							/>
						</Field>
						<Field
							label="Work email"
							htmlFor={fieldId("email")}
							error={errors.email}
							errorId={errorId("email")}
							className="sm:col-span-2"
						>
							<Input
								{...fieldProps("email")}
								type="email"
								inputMode="email"
								autoComplete="email"
								placeholder="alex@company.com"
								maxLength={320}
								className={FIELD_CLASS}
							/>
						</Field>
						<Field
							label="Company"
							htmlFor={fieldId("company")}
							error={errors.company}
							errorId={errorId("company")}
						>
							<Input
								{...fieldProps("company")}
								type="text"
								autoComplete="organization"
								placeholder="Acme Inc."
								maxLength={200}
								className={FIELD_CLASS}
							/>
						</Field>
						<Field
							label="Team size"
							htmlFor={fieldId("teamSize")}
							error={errors.teamSize}
							errorId={errorId("teamSize")}
						>
							<div className="relative">
								<select
									{...fieldProps("teamSize")}
									defaultValue=""
									onChange={() => clearError("teamSize")}
									className={cn(
										FIELD_CLASS,
										"w-full appearance-none border px-3 pr-9 text-sm outline-none transition-[color,box-shadow] invalid:text-[#5B6478]/70 focus-visible:ring-[3px]",
										"aria-invalid:border-destructive aria-invalid:ring-destructive/20",
									)}
									required
								>
									<option value="" disabled>
										Select
									</option>
									{TEAM_SIZE_OPTIONS.map((option) => (
										<option key={option.value} value={option.value}>
											{option.label}
										</option>
									))}
								</select>
								<ChevronDownIcon
									aria-hidden="true"
									className="-translate-y-1/2 pointer-events-none absolute top-1/2 right-3 size-4 text-[#5B6478]"
								/>
							</div>
						</Field>
						<Field
							label="What should your team get better at?"
							htmlFor={fieldId("message")}
							optional
							className="sm:col-span-2"
						>
							<Textarea
								id={fieldId("message")}
								name="message"
								rows={3}
								maxLength={5000}
								placeholder="For example: support agents handling calls with US customers."
								className={cn(
									FIELD_CLASS,
									"field-sizing-fixed h-auto min-h-24 resize-none py-2.5",
								)}
							/>
						</Field>
					</div>

					<Button
						type="submit"
						disabled={submitInquiry.isPending}
						className="mt-6 h-10 w-full rounded-[10px] bg-[#172033] text-white hover:bg-[#172033]/90 focus-visible:ring-[#007AFF]/40"
					>
						{submitInquiry.isPending ? "Sending request…" : "Request a demo"}
					</Button>
					<p className="mt-3 text-[#5B6478] text-xs leading-[1.4]">
						We only use these details to reply to your request. Read our{" "}
						<Link
							to="/privacy"
							className="text-[#172033] underline underline-offset-2 hover:text-[#172033]/80"
						>
							privacy policy
						</Link>
						.
					</p>
				</form>
			)}
		</div>
	);
}

function Field({
	label,
	htmlFor,
	optional,
	error,
	errorId,
	className,
	children,
}: {
	label: string;
	htmlFor: string;
	optional?: boolean;
	error?: string;
	errorId?: string;
	className?: string;
	children: ReactNode;
}) {
	return (
		<div className={cn("space-y-1.5", className)}>
			<Label htmlFor={htmlFor} className="text-[#172033]">
				{label}
				{optional ? (
					<span className="font-normal text-[#5B6478]">Optional</span>
				) : null}
			</Label>
			{children}
			{error ? (
				<p id={errorId} className="text-destructive text-xs">
					{error}
				</p>
			) : null}
		</div>
	);
}
