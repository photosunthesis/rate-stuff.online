import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailParams {
	to: string;
	subject: string;
	html: string;
	text?: string;
}

const sendEmail = async ({ to, subject, html, text }: SendEmailParams) => {
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

interface SendResetPasswordParams {
	user: { email: string };
	token: string;
}

export const sendResetPasswordEmail = async ({
	user,
	token,
}: SendResetPasswordParams) => {
	const baseUrl = process.env.BETTER_AUTH_URL;
	const resetLink = `${baseUrl}/reset-password?token=${token}`;

	await sendEmail({
		to: user.email,
		subject: "Reset your password - Rate Stuff Online",
		html: `
		<p>It happens to the best of us. Click the link below to set a new password and get back to rating anything.</p>
		<a href="${resetLink}">${resetLink}</a>
		<p>If you didn't ask for this, you can safely ignore this email.</p>
		<div style="margin-top: 24px;">
			<a href="${baseUrl}">
				<img src="${baseUrl}/favicon-96x96.png" width="32" height="32" alt="Rate Stuff Online" />
			</a>
		</div>
	`,
	});
};
