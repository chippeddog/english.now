import { createFileRoute, Link } from "@tanstack/react-router";
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

		setTimeout(() => {
			toast.success("Message sent. We'll get back to you soon.");
			setIsSubmitting(false);
			(e.target as HTMLFormElement).reset();
		}, 600);
	}

	return (
		<div className="container relative mx-auto max-w-3xl px-4 py-10 md:py-20">
			<header className="mx-auto mb-16 flex flex-col items-center gap-4 text-center">
				<h1 className="font-bold font-lyon text-4xl text-neutral-900 tracking-tight md:text-5xl dark:text-white">
					Get in touch
				</h1>
				<p className="mx-auto text-balance text-muted-foreground md:text-lg">
					Reach out - we respond within hours, not days.
				</p>
			</header>

			<section className="mb-20">
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
									placeholder="Your name"
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
									placeholder="your@email.com"
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
								placeholder="What would you like to discuss? (e.g., feedback, questions, partnership ideas, anything.)"
								required
							/>
						</div>

						<div className="flex items-center justify-between gap-6">
							<p className="text-neutral-500 text-xs">
								By sending the form, you agree to our{" "}
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
							</p>
							<Button
								variant="gradientblack"
								className="rounded-xl text-sm italic"
								type="submit"
								disabled={isSubmitting}
							>
								{isSubmitting ? "Sending..." : "Send message"}
							</Button>
						</div>
					</form>
				</div>
			</section>
		</div>
	);
}
