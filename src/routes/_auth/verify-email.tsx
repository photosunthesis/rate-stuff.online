import { createFileRoute } from "@tanstack/react-router";
import { AuthLayout } from "~/features/auth/components/auth-layout";
import { Button } from "~/shared/components/ui/button";
import authClient from "~/features/auth/client";
import { useState, useEffect } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { authQueryOptions } from "~/features/auth/hooks";
import { maskEmail } from "~/features/auth/lib/email";
import { useUmami } from "@danielgtmn/umami-react";
import { m } from "~/paraglide/messages";

export const Route = createFileRoute("/_auth/verify-email")({
	component: VerifyEmailPage,
	head: () => ({
		meta: [
			{ title: "Verify Email - Rate Stuff Online" },
			{ name: "robots", content: "noindex, nofollow" },
		],
	}),
	validateSearch: (search: Record<string, unknown>): { e?: string } => {
		return {
			e: search.e as string | undefined,
		};
	},
});

const RESEND_COOLDOWN_MS = 60 * 1000;
const STORAGE_KEY = "email_verification_last_sent";

function VerifyEmailPage() {
	const umami = useUmami();
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

		if (umami) {
			umami.track("resend_verification");
		}

		setIsLoading(true);
		setMessage(null);

		try {
			const { error } = await authClient.sendVerificationEmail({
				email: email,
				callbackURL: "/email-verified",
			});

			if (error) {
				setMessage(error.message || m.verify_email_resend_failure());
			} else {
				localStorage.setItem(STORAGE_KEY, Date.now().toString());
				setMessage(m.verify_email_resent_success());
				setCanResend(false);
				setTimeRemaining(60);
			}
		} catch {
			setMessage(m.verify_email_unexpected_error());
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<AuthLayout
			title={m.verify_email_page_title()}
			description={m.verify_email_description({
				recipient: email ? maskEmail(email) : "you",
			})}
		>
			<div className="space-y-6">
				<div className="bg-neutral-900/50 p-4 rounded-lg border border-neutral-800 text-sm text-neutral-400">
					<p>{m.verify_email_help()}</p>
				</div>

				{message && (
					<p
						className={`text-sm ${message.includes("sent") ? "text-emerald-400" : "text-red-500"}`}
					>
						{message}
					</p>
				)}

				<div className="flex gap-2">
					<Button
						onClick={handleResendEmail}
						disabled={isLoading || !canResend}
						isLoading={isLoading}
						variant="secondary"
						className="flex-1"
					>
						{canResend
							? m.verify_email_resend_button()
							: m.verify_email_resend_cooldown({ seconds: timeRemaining })}
					</Button>

					<Button
						onClick={() => window.location.reload()}
						variant="secondary"
						className="flex-1"
					>
						{m.verify_email_verified_button()}
					</Button>
				</div>
			</div>
		</AuthLayout>
	);
}
