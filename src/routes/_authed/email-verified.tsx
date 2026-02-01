import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthLayout } from "~/domains/users/components/auth-layout";
import { Button } from "~/components/ui/form/button";

export const Route = createFileRoute("/_authed/email-verified")({
	component: EmailVerifiedPage,
});

function EmailVerifiedPage() {
	return (
		<AuthLayout
			title="Verified. You're in."
			description="Your account is active. Everything is ready for your first rating."
		>
			<div className="space-y-6">
				<Link to="/" className="block w-full">
					<Button className="w-full">Go to Home</Button>
				</Link>
			</div>
		</AuthLayout>
	);
}
