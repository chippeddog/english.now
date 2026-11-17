import { createFileRoute } from "@tanstack/react-router";
import { PUBLIC_PAGES, seo } from "@/utils/seo";

export const Route = createFileRoute("/_public/refund")({
	head: () => seo(PUBLIC_PAGES.refund),
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="container relative mx-auto max-w-6xl px-4 py-16 pb-24">
			<article className="typeset typeset-docs mx-auto max-w-[40em]">
				<header className="text-center">
					<h1 className="mb-2 font-bold font-geist-serif text-4xl tracking-tight md:text-5xl">
						Refund Policy
					</h1>
					<p className="text-muted-foreground">
						Last updated: <time dateTime="2026-03-02">March 2, 2026</time>
					</p>
				</header>

				<section>
					<h2>Overview</h2>
					<p>
						english.now is an open-source, self-study English learning platform.
						All payments for english.now are processed by{" "}
						<a
							href="https://paddle.com"
							target="_blank"
							rel="noopener noreferrer"
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
						>
							Terms & Conditions
						</a>{" "}
						in addition to this policy.
					</p>
				</section>

				<section>
					<h2>Subscription Cancellation</h2>
					<p>
						You may cancel your subscription at any time from your account
						settings. Upon cancellation:
					</p>
					<ul>
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

				<section>
					<h2>Refund Eligibility</h2>
					<p>
						We want you to be satisfied with english.now. If you are unhappy
						with your purchase, you may request a refund under the following
						conditions:
					</p>
					<ul>
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
					<p>
						Refunds are issued at our discretion and are generally provided as a
						full refund to your original payment method. Partial refunds may be
						offered on a case-by-case basis.
					</p>
				</section>

				<section>
					<h2>When Refunds May Not Apply</h2>
					<p>
						We reserve the right to decline refund requests in the following
						cases:
					</p>
					<ul>
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

				<section>
					<h2>How to Request a Refund</h2>
					<p>To request a refund, you can use any of the following methods:</p>
					<ul>
						<li>
							<strong>Via Paddle:</strong> Locate your payment receipt email
							from Paddle and use the cancellation or support link included in
							it, or visit your{" "}
							<a
								href="https://paddle.net"
								target="_blank"
								rel="noopener noreferrer"
							>
								Paddle customer portal
							</a>
							.
						</li>
						<li>
							<strong>Contact us directly:</strong> Email us at{" "}
							<a href="mailto:support@english.now">support@english.now</a> with
							your account email address and the reason for your refund request.
						</li>
					</ul>
					<p>
						Refunds are typically processed within 5–10 business days after
						approval. The exact timing depends on your payment provider and
						financial institution.
					</p>
				</section>

				<section>
					<h2>Currency & Sales Tax</h2>
					<p>
						Because Paddle is the Merchant of Record, all transactions are
						processed in the currency displayed at checkout. Paddle calculates
						and remits any applicable sales tax, VAT, or GST on your behalf.
						Refunds will include any taxes that were charged on the original
						transaction.
					</p>
				</section>

				<section>
					<h2>Changes to This Policy</h2>
					<p>
						We may update this Refund & Cancellation Policy from time to time.
						If we make significant changes, we will notify you via email or
						through a notice on our platform. The "Last updated" date at the top
						of this page indicates when this policy was last revised.
					</p>
				</section>

				<section>
					<h2>Contact Us</h2>
					<p>
						If you have any questions about this Refund Policy, please contact
						us:
					</p>
					<ul>
						<li>
							<strong>GitHub:</strong>{" "}
							<a
								href="https://github.com/chippeddog/english.now"
								target="_blank"
								rel="noopener noreferrer"
							>
								github.com/chippeddog/english.now
							</a>
						</li>
						<li>
							<strong>Email:</strong>{" "}
							<a href="mailto:support@english.now">support@english.now</a>
						</li>
					</ul>
				</section>
			</article>
		</div>
	);
}
