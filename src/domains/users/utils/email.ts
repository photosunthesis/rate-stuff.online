import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const baseUrl = process.env.BETTER_AUTH_URL;

interface SendEmailParams {
	from: string;
	to: string;
	subject: string;
	html: string;
	text?: string;
}

const sendEmail = async ({
	from,
	to,
	subject,
	html,
	text,
}: SendEmailParams) => {
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
		return { success: false, error };
	}
};

export const sendResetPasswordEmail = async ({
	user,
	token,
}: {
	user: { email: string };
	token: string;
}) => {
	const resetLink = `${baseUrl}/reset-password?token=${token}`;

	await sendEmail({
		from: "Rate Stuff Online <no-reply@rate-stuff.online>",
		to: user.email,
		subject: "Reset your password - Rate Stuff Online",
		html: `
		<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
			<p style="color: #404040; font-size: 16px; line-height: 24px; margin-bottom: 24px;">
				It happens to the best of us. Click the link below to set a new password and get back to rating anything.
			</p>
			
			<div style="margin-bottom: 32px;">
				<a href="${resetLink}" style="background-color: #171717; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
					Reset Password
				</a>
			</div>
			
			<p style="color: #737373; font-size: 14px; margin-bottom: 8px;">
				Or copy and paste this link into your browser:
			</p>
			<p style="margin-top: 0;">
				<code style="display: block; padding: 12px; background-color: #f5f5f5; border-radius: 6px; font-family: monospace; font-size: 13px; color: #404040; word-break: break-all; border: 1px solid #e5e5e5;">${resetLink}</code>
			</p>
			
			<p style="color: #737373; font-size: 14px; margin-top: 24px;">
				If you didn't ask for this, you can safely ignore this email.
			</p>
			
			<div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #e5e5e5;">
				<a href="${baseUrl}" style="display: inline-block;">
					<img src="${baseUrl}/favicon-96x96.png" width="32" height="32" alt="Rate Stuff Online" style="display: block;" />
				</a>
			</div>
		</div>
	`,
	});
};

export const sendVerificationEmail = async ({
	user,
	url,
}: {
	user: { email: string };
	url: string;
}) => {
	// The url is provided by better-auth directly
	const verifyLink = url;

	await sendEmail({
		from: "Rate Stuff Online <no-reply@rate-stuff.online>",
		to: user.email,
		subject: "Verify your email - Rate Stuff Online",
		html: `
		<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
			<h2 style="color: #171717; margin-bottom: 16px;">Welcome to Rate Stuff Online</h2>
			<p style="color: #404040; font-size: 16px; line-height: 24px; margin-bottom: 24px;">
				Thanks for signing up! Please verify your email address to get started rating stuff.
			</p>
			
			<div style="margin-bottom: 32px;">
				<a href="${verifyLink}" style="background-color: #171717; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
					Verify Email Address
				</a>
			</div>

			<p style="color: #737373; font-size: 14px; margin-bottom: 8px;">
				Or copy and paste this link into your browser:
			</p>
			<p style="margin-top: 0;">
				<code style="display: block; padding: 12px; background-color: #f5f5f5; border-radius: 6px; font-family: monospace; font-size: 13px; color: #404040; word-break: break-all; border: 1px solid #e5e5e5;">${verifyLink}</code>
			</p>

			<div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #e5e5e5;">
				<a href="${baseUrl}" style="display: inline-block;">
					<img src="${baseUrl}/favicon-96x96.png" width="32" height="32" alt="Rate Stuff Online" style="display: block;" />
				</a>
			</div>
		</div>
	`,
		text: `Welcome to Rate Stuff Online! Please verify your email by visiting: ${verifyLink}`,
	});
};
