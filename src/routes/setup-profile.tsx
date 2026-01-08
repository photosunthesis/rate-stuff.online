import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { isAuthenticatedQueryOptions } from "~/features/session/queries";
import { ProfileSetupForm } from "~/features/profile-setup/components/ProfileSetupForm";
import { AuthLayout } from "~/components/layout/auth-layout";
import { useProfileSetup } from "~/features/profile-setup/hooks";
import { profileSummaryQueryOptions } from "~/features/profile-setup/queries";
import type { ProfileSetupInput } from "~/features/profile-setup/types";

export const Route = createFileRoute("/setup-profile")({
	beforeLoad: async ({ context }) => {
		const isAuthenticated = await context.queryClient.ensureQueryData(
			isAuthenticatedQueryOptions(),
		);

		// Prefetch profile summary so the form can hydrate immediately
		await context.queryClient.ensureQueryData(profileSummaryQueryOptions());

		if (!isAuthenticated) {
			throw redirect({
				to: "/sign-in",
				search: { redirect: "/setup-profile" },
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
		profileSummary,
	} = useProfileSetup();

	const handleSubmit = async (data: ProfileSetupInput) => {
		try {
			await update(data);
			navigate({ to: "/" });
		} catch {}
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
				initialDisplayName={profileSummary.data?.displayName}
				initialAvatarUrl={profileSummary.data?.avatarUrl}
			/>
		</AuthLayout>
	);
}
