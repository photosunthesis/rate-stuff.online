import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailParams {
	to: string;
	subject: string;
	html: string;
	text?: string;
}

export const sendEmail = async ({
	to,
	subject,
	html,
	text,
}: SendEmailParams) => {
	const from = "Rate Stuff Online <no-reply@rate-stuff.online>";

	if (!process.env.RESEND_API_KEY) {
		return { success: false, error: "Missing API Key" };
	}

	try {
		const data = await resend.emails.send({
			from,
			to,
			subject,
			html,
			text,
		});

		return { success: true, data };
	} catch (error) {
		console.error("Failed to send email:", error);
		return { success: false, error };
	}
};
