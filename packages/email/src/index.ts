import { capabilities, env } from "@english.now/env/server";

export interface SendEmailOptions {
	to: string;
	templateId: string | undefined;
	dynamicData?: Record<string, string>;
}

export interface SendTransactionalEmailOptions {
	to: string;
	subject: string;
	text: string;
	replyTo?: { email: string; name?: string };
}

export async function sendEmail(options: SendEmailOptions): Promise<void> {
	if (!capabilities.email || !options.templateId) {
		console.info(
			`[email] Email delivery is not configured. Would send template ${options.templateId ?? "(none)"} to ${options.to}:`,
			options.dynamicData,
		);
		return;
	}

	try {
		const response = await fetch("https://api.autosend.com/v1/mails/send", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${env.AUTOSEND_API_KEY}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				to: { email: options.to },
				from: {
					email: env.EMAIL_FROM,
					name: "English Now",
				},
				templateId: options.templateId,
				dynamicData: options.dynamicData,
			}),
		});

		if (!response.ok) {
			console.error("Failed to send email:", await response.text());
		}
	} catch (error) {
		console.error("Failed to send email:", error);
	}
}

export async function sendTransactionalEmail(
	options: SendTransactionalEmailOptions,
): Promise<void> {
	if (!capabilities.email) {
		console.info(
			`[email] Email delivery is not configured. Would send "${options.subject}" to ${options.to}:\n${options.text}`,
		);
		return;
	}

	const body: Record<string, unknown> = {
		to: { email: options.to },
		from: {
			email: env.EMAIL_FROM,
			name: "English Now",
		},
		subject: options.subject,
		text: options.text,
	};
	if (options.replyTo) {
		body.replyTo = {
			email: options.replyTo.email,
			...(options.replyTo.name ? { name: options.replyTo.name } : {}),
		};
	}

	const response = await fetch("https://api.autosend.com/v1/mails/send", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${env.AUTOSEND_API_KEY}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify(body),
	});

	if (!response.ok) {
		console.error("Failed to send transactional email:", await response.text());
		throw new Error(`AutoSend responded with ${response.status}`);
	}
}
