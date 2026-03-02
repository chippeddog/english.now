import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_public/refund")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="container relative mx-auto max-w-3xl px-4 py-8">
			<article className="prose prose-neutral dark:prose-invert max-w-none">
				<header className="mb-12 text-center">
					<h1 className="mb-4 font-bold font-lyon text-3xl tracking-tight md:text-4xl">
						Refund & Cancellation Policy
					</h1>
					<p className="text-muted-foreground">Last updated: March 2, 2026</p>
				</header>

				<section className="mb-10">
					<h2 className="mb-4 font-semibold text-2xl">Overview</h2>
					<p className="mb-4 text-muted-foreground">
						english.now is an open-source, self-study English learning platform.
						All payments for english.now are processed by{" "}
						<a
							href="https://paddle.com"
							target="_blank"
							rel="noopener noreferrer"
							className="underline"
						>
							Paddle.com
						</a>
						, which acts as our Merchant of Record. This means Paddle handles
						all billing, payment processing, invoicing, and sales tax compliance
						on our behalf. When you make a purchase, you are buying from Paddle
						and are subject to Paddle's{" "}
						<a
							href="https://paddle.com/legal/terms"
							target="_blank"
							rel="noopener noreferrer"
							className="underline"
						>
							Terms & Conditions
						</a>{" "}
						in addition to this policy.
					</p>
				</section>

				<section className="mb-8">
					<h2 className="mb-4 font-semibold text-xl">
						Subscription Cancellation
					</h2>
					<p className="mb-4 text-muted-foreground">
						You may cancel your subscription at any time from your account
						settings. Upon cancellation:
					</p>
					<ul className="mb-4 list-disc space-y-1 pl-6 text-muted-foreground">
						<li>
							Your subscription will remain active until the end of your current
							billing period.
						</li>
						<li>You will not be charged for any subsequent billing periods.</li>
						<li>
							You retain access to all paid features until your current billing
							period expires.
						</li>
						<li>
							After your billing period ends, your account will revert to the
							free plan. Your learning progress and data will be preserved.
						</li>
					</ul>
				</section>

				<section className="mb-8">
					<h2 className="mb-4 font-semibold text-xl">Refund Eligibility</h2>
					<p className="mb-4 text-muted-foreground">
						We want you to be satisfied with english.now. If you are unhappy
						with your purchase, you may request a refund under the following
						conditions:
					</p>
					<ul className="mb-4 list-disc space-y-1 pl-6 text-muted-foreground">
						<li>
							<strong>Monthly subscriptions:</strong> Refund requests must be
							made within 14 days of the initial purchase or the most recent
							renewal.
						</li>
						<li>
							<strong>Annual subscriptions:</strong> Refund requests must be
							made within 30 days of the initial purchase or the most recent
							renewal.
						</li>
						<li>
							<strong>Duplicate charges:</strong> If you were charged more than
							once for the same subscription, we will refund the duplicate
							charge in full regardless of the timeframe.
						</li>
					</ul>
					<p className="text-muted-foreground">
						Refunds are issued at our discretion and are generally provided as a
						full refund to your original payment method. Partial refunds may be
						offered on a case-by-case basis.
					</p>
				</section>

				<section className="mb-8">
					<h2 className="mb-4 font-semibold text-xl">
						When Refunds May Not Apply
					</h2>
					<p className="mb-2 text-muted-foreground">
						We reserve the right to decline refund requests in the following
						cases:
					</p>
					<ul className="list-disc space-y-1 pl-6 text-muted-foreground">
						<li>
							The request is made after the applicable refund window has
							expired.
						</li>
						<li>
							There is evidence of abuse, such as repeated subscription
							purchases followed by refund requests.
						</li>
						<li>
							The account has been suspended or terminated for violation of our
							Terms of Service.
						</li>
					</ul>
				</section>

				<section className="mb-8">
					<h2 className="mb-4 font-semibold text-xl">
						How to Request a Refund
					</h2>
					<p className="mb-4 text-muted-foreground">
						To request a refund, you can use any of the following methods:
					</p>
					<ul className="mb-4 list-disc space-y-1 pl-6 text-muted-foreground">
						<li>
							<strong>Via Paddle:</strong> Locate your payment receipt email
							from Paddle and use the cancellation or support link included in
							it, or visit your{" "}
							<a
								href="https://paddle.net"
								target="_blank"
								rel="noopener noreferrer"
								className="underline"
							>
								Paddle customer portal
							</a>
							.
						</li>
						<li>
							<strong>Contact us directly:</strong> Email us with your account
							email address and the reason for your refund request.
						</li>
					</ul>
					<p className="text-muted-foreground">
						Refunds are typically processed within 5–10 business days after
						approval. The exact timing depends on your payment provider and
						financial institution.
					</p>
				</section>

				<section className="mb-8">
					<h2 className="mb-4 font-semibold text-xl">Currency & Sales Tax</h2>
					<p className="text-muted-foreground">
						Because Paddle is the Merchant of Record, all transactions are
						processed in the currency displayed at checkout. Paddle calculates
						and remits any applicable sales tax, VAT, or GST on your behalf.
						Refunds will include any taxes that were charged on the original
						transaction.
					</p>
				</section>

				<section className="mb-8">
					<h2 className="mb-4 font-semibold text-xl">Changes to This Policy</h2>
					<p className="text-muted-foreground">
						We may update this Refund & Cancellation Policy from time to time.
						If we make significant changes, we will notify you via email or
						through a notice on our platform. The "Last updated" date at the top
						of this page indicates when this policy was last revised.
					</p>
				</section>

				<section>
					<h2 className="mb-4 font-semibold text-xl">Contact Us</h2>
					<p className="text-muted-foreground">
						If you have any questions about this policy, need help with a
						refund, or want to manage your subscription, please reach out to us
						through our community channels or open an issue on our GitHub
						repository.
					</p>
				</section>
			</article>
		</div>
	);
}
