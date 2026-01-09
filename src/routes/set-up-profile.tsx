import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { isAuthenticatedQueryOptions } from "~/features/session/queries";
import { ProfileSetupForm } from "~/features/set-up-profile/components/profile-setup-form";
import { AuthLayout } from "~/components/layout/auth-layout";
import { useSetUpProfile } from "~/features/set-up-profile/hooks";
import type { ProfileSetupInput } from "~/features/set-up-profile/types";
import { currentUserQueryOptions } from "~/features/session/queries";

export const Route = createFileRoute("/set-up-profile")({
	beforeLoad: async ({ context }) => {
		const isAuthenticated = await context.queryClient.ensureQueryData(
			isAuthenticatedQueryOptions(),
		);

		await context.queryClient.ensureQueryData(currentUserQueryOptions());

		if (!isAuthenticated) {
			throw redirect({
				to: "/sign-in",
				search: { redirect: "/set-up-profile" },
			});
		}
	},
	component: RouteComponent,
	head: () => ({
		meta: [
			{ title: "Setup Your Profile - Rate Stuff Online" },
			{ name: "robots", content: "noindex, follow" },
		],
	}),
});

function RouteComponent() {
	const navigate = useNavigate();
	const {
		updateProfile: update,
		isPending,
		error,
		validationErrors,
		user,
	} = useSetUpProfile();

	const handleSubmit = async (data: ProfileSetupInput) => {
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
			<ProfileSetupForm
				onSubmit={handleSubmit}
				onSkip={() => navigate({ to: "/" })}
				isPending={isPending}
				error={error}
				validationErrors={validationErrors}
				initialDisplayName={user?.displayName}
				initialAvatarUrl={user?.avatarUrl}
			/>
		</AuthLayout>
	);
}
