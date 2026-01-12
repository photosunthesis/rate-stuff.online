import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SetUpProfileForm } from "~/features/set-up-profile/components/set-up-profile-form";
import { AuthLayout } from "~/components/layout/auth-layout";
import { useSetUpProfile } from "~/features/set-up-profile/hooks";
import type { SetUpProfileInput } from "~/features/set-up-profile/types";

export const Route = createFileRoute("/_auth/set-up-profile")({
	component: RouteComponent,
	head: () => ({
		meta: [
			{ title: "Setup Your Profile - Rate Stuff Online" },
			{ name: "robots", content: "noindex, follow" },
		],
	}),
});

function RouteComponent() {
	const { user } = Route.useRouteContext();
	const navigate = useNavigate();
	const {
		updateProfile: update,
		isPending,
		errorMessage,
		validationErrors,
	} = useSetUpProfile();

	const handleSubmit = async (data: SetUpProfileInput) => {
		try {
			const result = await update(data);
			if (result && (result as { success?: boolean }).success) {
				navigate({ to: "/" });
			}
		} catch {
			// no navigation; error will be shown in the form via props
		}
	};

	return (
		<AuthLayout
			title="Set up your profile"
			description="Personalize your account with a photo and display name."
		>
			<SetUpProfileForm
				onSubmit={handleSubmit}
				onSkip={() => navigate({ to: "/" })}
				isPending={isPending}
				errorMessage={errorMessage}
				validationErrors={validationErrors}
				initialDisplayName={user?.displayUsername}
				initialAvatarUrl={user?.image}
			/>
		</AuthLayout>
	);
}
