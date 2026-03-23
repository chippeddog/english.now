import { Trans, useTranslation } from "@english.now/i18n";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_public/contact")({
	component: Contact,
});

function Contact() {
	const { t } = useTranslation("common");
	const trpc = useTRPC();

	const submitContact = useMutation(
		trpc.contact.submit.mutationOptions({
			onError: (err) => {
				toast.error(err.message);
			},
		}),
	);

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();

		const form = e.currentTarget;
		const formData = new FormData(form);
		const name = (formData.get("name") as string)?.trim() ?? "";
		const email = (formData.get("email") as string)?.trim() ?? "";
		const message = (formData.get("message") as string)?.trim() ?? "";

		if (!name || !email || !message) {
			toast.error(t("contact.toastFillAll"));
			return;
		}

		try {
			await submitContact.mutateAsync({ name, email, message });
			toast.success(t("contact.toastSuccess"));
			form.reset();
		} catch {
			// toast handled in onError
		}
	}

	return (
		<div className="container relative mx-auto max-w-3xl px-4 py-10 md:py-20">
			<header className="mx-auto mb-16 flex flex-col items-center gap-4 text-center">
				<h1 className="font-bold font-lyon text-4xl text-neutral-900 tracking-tight md:text-5xl dark:text-white">
					{t("contact.title")}
				</h1>
				<p className="mx-auto text-balance text-muted-foreground md:text-lg">
					{t("contact.subtitle")}
				</p>
			</header>

			<section className="mb-20">
				<div className="relative">
					<div className="-inset-6 mask-b-from-50% absolute px-6 pt-4">
						<div className="size-full rounded-t-3xl border border-border bg-card/75 shadow-black/15 shadow-xl" />
					</div>

					<form onSubmit={handleSubmit} className="relative space-y-6 p-8">
						<div className="grid gap-6 sm:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor="name">{t("contact.nameLabel")}</Label>
								<Input
									id="name"
									className="rounded-xl"
									name="name"
									type="text"
									autoComplete="name"
									placeholder={t("contact.namePlaceholder")}
									required
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="email">{t("contact.emailLabel")}</Label>
								<Input
									id="email"
									className="rounded-xl"
									name="email"
									type="email"
									autoComplete="email"
									placeholder={t("contact.emailPlaceholder")}
									required
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="message">{t("contact.messageLabel")}</Label>
							<Textarea
								id="message"
								name="message"
								rows={5}
								className="min-h-32 resize-none rounded-xl"
								placeholder={t("contact.messagePlaceholder")}
								required
							/>
						</div>

						<div className="flex items-center justify-between gap-6">
							<p className="text-neutral-500 text-xs">
								<Trans
									i18nKey="contact.legal"
									ns="common"
									components={{
										terms: (
											<Link
												to="/terms"
												target="_blank"
												className="cursor-pointer text-lime-600 underline hover:text-lime-600/80"
											/>
										),
										privacy: (
											<Link
												to="/privacy"
												target="_blank"
												className="cursor-pointer text-lime-600 underline hover:text-lime-600/80"
											/>
										),
									}}
								/>
							</p>
							<Button
								variant="gradientblack"
								className="rounded-xl text-sm italic"
								type="submit"
								disabled={submitContact.isPending}
							>
								{submitContact.isPending
									? t("contact.sending")
									: t("contact.sendMessage")}
							</Button>
						</div>
					</form>
				</div>
			</section>
		</div>
	);
}
