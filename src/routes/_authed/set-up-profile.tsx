import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SetUpProfileForm } from "~/lib/features/auth/components/set-up-profile-form";
import { AuthLayout } from "~/lib/features/auth/components/auth-layout";
import type { SetUpProfileInput } from "~/lib/features/auth/types";
import { useState } from "react";
import { extractValidationErrors } from "~/lib/utils/errors";
import authClient from "~/lib/core/auth-client";
import { useServerFn } from "@tanstack/react-start";
import { uploadAvatarFn } from "~/lib/features/auth/api";

export const Route = createFileRoute("/_authed/set-up-profile")({
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
	const uploadAvatarMutationFn = useServerFn(uploadAvatarFn);
	const [isPending, setIsPending] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | undefined>(
		undefined,
	);
	const [validationErrors, setValidationErrors] = useState<
		Record<string, string>
	>({});

	const handleSubmit = async (data: SetUpProfileInput) => {
		setIsPending(true);
		setValidationErrors({});

		let uploadedUrl: string | undefined;

		try {
			if (data.avatar instanceof File) {
				const formData = new FormData();
				formData.append("file", data.avatar);
				const result = await uploadAvatarMutationFn({ data: formData });

				if (!result.success) {
					const errors = extractValidationErrors(result);
					setValidationErrors(errors);
					setIsPending(false);
					return;
				}

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

			await authClient.updateUser(payload, {
				onSuccess: () => {
					navigate({ to: "/" });
				},
				onError: (err) => {
					setErrorMessage(err.error.message);
				},
			});
		} catch (error) {
			setErrorMessage(
				error instanceof Error ? error.message : "Failed to set up profile",
			);
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
				onSkip={() => navigate({ to: "/" })}
				isPending={isPending}
				errorMessage={errorMessage}
				validationErrors={validationErrors}
				initialDisplayName={user?.name === user?.username ? "" : user?.name}
				initialAvatarUrl={user?.image}
			/>
		</AuthLayout>
	);
}
