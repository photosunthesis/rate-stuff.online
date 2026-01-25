import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { z } from "zod";
import authClient from "~/domains/users/auth/client";
import { AuthLayout } from "~/domains/users/components/auth-layout";
import { SetUpProfileForm } from "~/domains/users/components/set-up-profile-form";
import { uploadAvatarFn } from "~/domains/users/functions";
import { authQueryOptions } from "~/domains/users/queries";
import { withTimeout } from "~/utils/timeout";
import { useUmami } from "@danielgtmn/umami-react";

export const Route = createFileRoute("/_authed/set-up-profile")({
	component: RouteComponent,
	validateSearch: (search) =>
		z
			.object({
				redirect: z.string().optional(),
			})
			.parse(search),
	head: () => ({
		meta: [
			{ title: "Setup Your Profile - Rate Stuff Online" },
			{ name: "robots", content: "noindex, follow" },
		],
	}),
});

function RouteComponent() {
	const { data: user } = useSuspenseQuery(authQueryOptions());
	const { redirect } = Route.useSearch();
	const { refetch } = authClient.useSession();
	const umami = useUmami();

	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const uploadAvatarMutationFn = useServerFn(uploadAvatarFn);

	const [isPending, setIsPending] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | undefined>(
		undefined,
	);
	const [validationErrors, setValidationErrors] = useState<
		Record<string, string>
	>({});

	const handleSubmit = async (data: {
		avatar?: File | string;
		name?: string;
		image?: string | null;
	}) => {
		setIsPending(true);
		setValidationErrors({});
		setErrorMessage(undefined);

		let uploadedUrl: string | undefined;

		try {
			if (data.avatar instanceof File) {
				const formData = new FormData();
				formData.append("file", data.avatar);
				const result = await withTimeout(
					uploadAvatarMutationFn({ data: formData }),
					{ context: "profile-upload-avatar" },
				);

				if (!result.success) throw result;

				uploadedUrl = result.url;
			}

			const payload: { name?: string; image?: string | null } = {};

			if (data.name) payload.name = data.name;
			if (uploadedUrl) payload.image = uploadedUrl;
			else if (data.image !== undefined) {
				// The form uses an empty string to indicate the user removed
				// their avatar. The server expects `null` to remove the image,
				// and `undefined` to leave it unchanged.
				payload.image = data.image === "" ? null : (data.image ?? undefined);
			}

			const { error } = await withTimeout(authClient.updateUser(payload), {
				context: "profile-update-user",
			});

			if (error) throw error;

			if (umami)
				umami.track("profile_update", {
					hasAvatar: !!(uploadedUrl || payload.image),
					hasName: !!payload.name,
				});

			await queryClient.invalidateQueries({
				queryKey: authQueryOptions().queryKey,
			});

			await refetch();

			navigate({ to: redirect || "/" });
		} catch (error) {
			setErrorMessage(
				error instanceof Error
					? error.message
					: `An error occured while setting up your profile: ${error}`,
			);
			throw error;
		} finally {
			setIsPending(false);
		}
	};

	return (
		<AuthLayout
			title="Set up your profile"
			description="Personalize your account with a photo and display name."
		>
			<SetUpProfileForm
				onSubmit={handleSubmit}
				onSkip={() => navigate({ to: redirect || "/" })}
				isPending={isPending}
				errorMessage={errorMessage}
				validationErrors={validationErrors}
				initialDisplayName={user?.name === user?.username ? "" : user?.name}
				initialAvatarUrl={user?.image}
			/>
		</AuthLayout>
	);
}
