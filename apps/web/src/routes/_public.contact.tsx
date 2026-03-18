import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_public/contact")({
	component: Contact,
});

function Contact() {
	const [isSubmitting, setIsSubmitting] = useState(false);

	function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setIsSubmitting(true);

		const formData = new FormData(e.currentTarget);
		const name = formData.get("name") as string;
		const email = formData.get("email") as string;
		const message = formData.get("message") as string;

		if (!name || !email || !message) {
			toast.error("Please fill in all fields.");
			setIsSubmitting(false);
			return;
		}

		// TODO: wire up to a backend endpoint or email service
		setTimeout(() => {
			toast.success("Message sent. We'll get back to you soon.");
			setIsSubmitting(false);
			(e.target as HTMLFormElement).reset();
		}, 600);
	}

	return (
		<div className="container relative mx-auto max-w-3xl px-4 py-10 md:py-20">
			{/* Hero */}
			<header className="mx-auto mb-16 max-w-2xl text-center">
				<p className="mb-3 font-semibold text-lime-600 text-xs uppercase tracking-[0.2em] dark:text-lime-400">
					Contact
				</p>
				<h1 className="mb-5 font-bold font-lyon text-4xl text-neutral-900 tracking-tight md:text-5xl dark:text-white">
					Get in touch
				</h1>
				<p className="mx-auto max-w-lg text-balance text-muted-foreground md:text-lg">
					We're a small team. You'll probably talk to someone who builds the
					product. Reach out — we respond within hours, not days.
				</p>
			</header>

			{/* Form */}
			<section className="mb-20">
				<h2 className="mb-2 font-semibold text-2xl text-neutral-900 dark:text-white">
					Send us a message
				</h2>
				<p className="mb-8 text-muted-foreground">
					We're a small team. You'll probably talk to someone who writes code or
					designs the product.
				</p>

				<div className="relative">
					<div className="-inset-6 mask-b-from-50% absolute px-6 pt-4">
						<div className="size-full rounded-t-2xl border border-border bg-card/75 shadow-black/15 shadow-xl" />
					</div>

					<form onSubmit={handleSubmit} className="relative space-y-6 p-8">
						<div className="grid gap-6 sm:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor="name">Your name</Label>
								<Input
									id="name"
									name="name"
									type="text"
									autoComplete="name"
									placeholder="Jane Doe"
									required
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="email">Your email</Label>
								<Input
									id="email"
									name="email"
									type="email"
									autoComplete="email"
									placeholder="jane@example.com"
									required
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="message">Message</Label>
							<Textarea
								id="message"
								name="message"
								rows={5}
								className="min-h-32"
								placeholder="Tell us what's on your mind — feedback, questions, partnership ideas, anything."
								required
							/>
						</div>

						<div className="grid items-center gap-6 sm:grid-cols-[1fr_auto]">
							<p className="text-muted-foreground text-xs">
								We'll respond within 24 hours.
							</p>
							<Button type="submit" disabled={isSubmitting}>
								{isSubmitting ? "Sending..." : "Send message"}
							</Button>
						</div>
					</form>
				</div>
			</section>

			{/* Other ways */}
			<section className="mb-12 border-border border-t pt-12">
				<p className="mb-3 font-semibold text-lime-600 text-xs uppercase tracking-[0.2em] dark:text-lime-400">
					Direct
				</p>
				<h2 className="mb-8 font-bold font-lyon text-2xl text-neutral-900 tracking-tight md:text-3xl dark:text-white">
					Other ways to reach us
				</h2>
				<dl className="grid gap-6 sm:grid-cols-3">
					<div className="space-y-1">
						<dt className="font-medium text-neutral-900 dark:text-white">
							Support
						</dt>
						<dd className="text-muted-foreground text-sm">Technical help</dd>
						<dd>
							<a
								href="mailto:support@english.now"
								className="text-lime-700 text-sm transition-colors hover:text-lime-600 dark:text-lime-400 dark:hover:text-lime-300"
							>
								support@english.now
							</a>
						</dd>
					</div>
					<div className="space-y-1">
						<dt className="font-medium text-neutral-900 dark:text-white">
							Sales
						</dt>
						<dd className="text-muted-foreground text-sm">
							Teams & enterprise
						</dd>
						<dd>
							<a
								href="mailto:sales@english.now"
								className="text-lime-700 text-sm transition-colors hover:text-lime-600 dark:text-lime-400 dark:hover:text-lime-300"
							>
								sales@english.now
							</a>
						</dd>
					</div>
					<div className="space-y-1">
						<dt className="font-medium text-neutral-900 dark:text-white">
							General
						</dt>
						<dd className="text-muted-foreground text-sm">Other questions</dd>
						<dd>
							<a
								href="mailto:contact@english.now"
								className="text-lime-700 text-sm transition-colors hover:text-lime-600 dark:text-lime-400 dark:hover:text-lime-300"
							>
								contact@english.now
							</a>
						</dd>
					</div>
				</dl>
			</section>

			{/* Social */}
			<section className="border-border border-t pt-12">
				<p className="mb-3 font-semibold text-lime-600 text-xs uppercase tracking-[0.2em] dark:text-lime-400">
					Social
				</p>
				<h2 className="mb-4 font-medium text-neutral-900 dark:text-white">
					Follow us
				</h2>
				<div className="flex flex-wrap gap-x-6 gap-y-2">
					<a
						href="https://x.com/tihunov"
						target="_blank"
						rel="noopener noreferrer"
						className="text-muted-foreground text-sm transition-colors hover:text-neutral-900 dark:hover:text-white"
					>
						X / Twitter
					</a>
					<a
						href="https://github.com/Dmytro-Tihunov/english.now"
						target="_blank"
						rel="noopener noreferrer"
						className="text-muted-foreground text-sm transition-colors hover:text-neutral-900 dark:hover:text-white"
					>
						GitHub
					</a>
				</div>
			</section>
		</div>
	);
}
