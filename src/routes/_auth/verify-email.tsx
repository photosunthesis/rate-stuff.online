import { createFileRoute } from "@tanstack/react-router";
import { AuthLayout } from "~/domains/users/components/auth-layout";
import { Button } from "~/components/ui/form/button";
import authClient from "~/domains/users/auth/client";
import { useState, useEffect } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { authQueryOptions } from "~/domains/users/queries";
import { maskEmail } from "~/utils/strings";

export const Route = createFileRoute("/_auth/verify-email")({
	component: VerifyEmailPage,
	validateSearch: (search: Record<string, unknown>): { e?: string } => {
		return {
			e: search.e as string | undefined,
		};
	},
});

const RESEND_COOLDOWN_MS = 60 * 1000;
const STORAGE_KEY = "email_verification_last_sent";

function VerifyEmailPage() {
	const { data: user } = useSuspenseQuery(authQueryOptions());
	const search = Route.useSearch();
	const emailStr = search.e;

	let emailFromSearch: string | undefined;
	if (emailStr) {
		try {
			emailFromSearch = atob(emailStr);
		} catch {
			// If decoding fails, ignore the search param
		}
	}

	const email = user?.email || emailFromSearch;
	const [isLoading, setIsLoading] = useState(false);
	const [message, setMessage] = useState<string | null>(null);
	const [canResend, setCanResend] = useState(true);
	const [timeRemaining, setTimeRemaining] = useState(0);

	useEffect(() => {
		const checkCooldown = () => {
			const lastSent = localStorage.getItem(STORAGE_KEY);
			if (lastSent) {
				const timeSince = Date.now() - parseInt(lastSent, 10);
				if (timeSince < RESEND_COOLDOWN_MS) {
					setCanResend(false);
					setTimeRemaining(Math.ceil((RESEND_COOLDOWN_MS - timeSince) / 1000));
				} else {
					setCanResend(true);
					setTimeRemaining(0);
				}
			}
		};

		checkCooldown();
		const interval = setInterval(checkCooldown, 1000);
		return () => clearInterval(interval);
	}, []);

	const handleResendEmail = async () => {
		if (!email || !canResend) return;

		setIsLoading(true);
		setMessage(null);

		try {
			const { error } = await authClient.sendVerificationEmail({
				email: email,
				callbackURL: "/email-verified",
			});

			if (error) {
				setMessage(error.message || "Failed to resend email");
			} else {
				localStorage.setItem(STORAGE_KEY, Date.now().toString());
				setMessage("Verification email sent! Please check your inbox.");
				setCanResend(false);
				setTimeRemaining(60);
			}
		} catch {
			setMessage("An unexpected error occurred");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<AuthLayout
			title="Check your mail"
			description={`A link is on its way to ${email ? maskEmail(email) : "you"}. Please check your inbox.`}
		>
			<div className="space-y-6">
				<div className="bg-neutral-900/50 p-4 rounded-lg border border-neutral-800 text-sm text-neutral-400">
					<p>
						If you don't see the email, check your spam folder or click the
						button below to resend.
					</p>
				</div>

				{message && (
					<p
						className={`text-sm ${message.includes("sent") ? "text-emerald-400" : "text-red-500"}`}
					>
						{message}
					</p>
				)}

				<Button
					onClick={handleResendEmail}
					disabled={isLoading || !canResend}
					isLoading={isLoading}
					variant="secondary"
					className="w-full mb-2"
				>
					{canResend
						? "Resend Verification Email"
						: `Resend in ${timeRemaining}s`}
				</Button>

				<Button
					onClick={() => window.location.reload()}
					variant="secondary"
					className="w-full"
				>
					I've verified my email
				</Button>
			</div>
		</AuthLayout>
	);
}
