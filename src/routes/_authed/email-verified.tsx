import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthLayout } from "~/domains/users/components/auth-layout";
import { Button } from "~/components/ui/form/button";
import { m } from "~/paraglide/messages";

export const Route = createFileRoute("/_authed/email-verified")({
	component: EmailVerifiedPage,
});

function EmailVerifiedPage() {
	return (
		<AuthLayout
			title={m.email_verified_title()}
			description={m.email_verified_description()}
		>
			<div className="flex gap-2">
				<Link to="/set-up-profile" className="flex-1">
					<Button className="w-full">{m.email_verified_setup_profile()}</Button>
				</Link>
				<Link to="/" className="flex-1">
					<Button variant="secondary" className="w-full">
						{m.email_verified_go_home()}
					</Button>
				</Link>
			</div>
		</AuthLayout>
	);
}
