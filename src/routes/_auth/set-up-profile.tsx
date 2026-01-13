import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SetUpProfileForm } from "~/lib/features/auth/components/set-up-profile-form";
import { AuthLayout } from "~/lib/features/auth/components/auth-layout";
import type { PublicUser, SetUpProfileInput } from "~/lib/features/auth/types";
import {
	authQueryOptions,
	useUpdateProfileMutation,
	useUploadAvatarMutation,
} from "~/lib/features/auth/queries";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { extractValidationErrors, normalizeError } from "~/lib/utils/errors";

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
	const mutation = useUpdateProfileMutation();
	const uploadMutation = useUploadAvatarMutation();
	const queryClient = useQueryClient();
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [validationErrors, setValidationErrors] = useState<
		Record<string, string>
	>({});

	const update = async (data: SetUpProfileInput) => {
		setErrorMessage(null);
		setValidationErrors({});

		let uploadedUrl: string | undefined;

		const previousUser = queryClient.getQueryData<PublicUser | null>([
			"currentUser",
		]);

		if (data.avatar instanceof File) {
			try {
				const result = await uploadMutation.mutateAsync(data.avatar);

				if (!result.success) {
					const errors = extractValidationErrors(result);
					setValidationErrors(errors);
					const msg =
						(result as unknown as { errorMessage?: string }).errorMessage ??
						"Failed to upload avatar";
					setErrorMessage(msg);
					throw new Error(msg);
				}

				await queryClient.ensureQueryData({
					...authQueryOptions(),
					revalidateIfStale: true,
				});
			} catch (e) {
				const info = normalizeError(e);
				if (info.errors) setValidationErrors(info.errors);
				const msg = info.errorMessage ?? "Failed to upload avatar";
				setErrorMessage(msg);
				throw new Error(msg);
			}
		}

		const payload: { name?: string; image?: string } = {};

		if (data.name) payload.name = data.name;
		if (uploadedUrl) payload.image = uploadedUrl;
		else if (data.image !== undefined) payload.image = data.image ?? undefined;

		try {
			const result = await mutation.mutateAsync(payload);

			if (!result.success) {
				if (previousUser) {
					queryClient.removeQueries({
						queryKey: authQueryOptions().queryKey,
					});
				}

				const errors = extractValidationErrors(result);
				setValidationErrors(errors);
				const errMessage =
					(result as unknown as { errorMessage?: string }).errorMessage ??
					"Failed to update profile";
				setErrorMessage(errMessage);
				throw new Error(errMessage);
			}
			return result;
		} catch (e) {
			if (previousUser) {
				queryClient.removeQueries({
					queryKey: authQueryOptions().queryKey,
				});
			}

			const info = normalizeError(e);
			if (info.errors) setValidationErrors(info.errors);
			const msg =
				info.errorMessage ?? (e instanceof Error ? e.message : String(e));
			setErrorMessage(msg);
			throw new Error(msg);
		}
	};

	const isPending = mutation.isPending;

	const handleSubmit = async (data: SetUpProfileInput) => {
		await update(data).then(() => {
			navigate({ to: "/" });
		});
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
				errorMessage={
					errorMessage ??
					(mutation.data && !mutation.data.success
						? (mutation.data as unknown as { errorMessage?: string })
								.errorMessage
						: undefined)
				}
				validationErrors={
					(mutation.data && !mutation.data.success
						? extractValidationErrors(mutation.data)
						: validationErrors) || {}
				}
				initialDisplayName={user?.displayUsername}
				initialAvatarUrl={user?.image}
			/>
		</AuthLayout>
	);
}
