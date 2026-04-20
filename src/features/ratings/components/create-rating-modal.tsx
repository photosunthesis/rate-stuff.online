import { Modal, ModalContent } from "~/shared/components/ui/modal";
import { CreateRatingForm } from "~/features/ratings/components/create-rating-form";
import { useState } from "react";
import {
	useCreateRatingMutation,
	useUploadImageMutation,
	useUpdateRatingImagesMutation,
} from "~/features/ratings/hooks/create";
import { deleteRatingFn } from "~/features/ratings/api/create";
import type { createRatingSchema } from "~/features/ratings/types/create";
import type { z } from "zod";
import { withTimeout } from "~/infrastructure/http/timeout";

const normalizeParagraphBreaks = (md: string) => {
	if (!md) return "";
	let s = md.replace(/\r\n/g, "\n");
	s = s.replace(/\n{3,}/g, "\n\n");
	s = s.replace(/([^\n])\n([^\n])/g, "$1\n\n$2");
	return s;
};

const parseZodError = (msg: string): Record<string, string> | null => {
	try {
		const parsed = JSON.parse(msg);
		if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].code) {
			const formattedErrors: Record<string, string> = {};
			for (const issue of parsed) {
				const key = issue.path?.length ? String(issue.path[0]) : "form";
				if (!formattedErrors[key]) formattedErrors[key] = issue.message;
			}
			return formattedErrors;
		}
	} catch {
		// Not a JSON string
	}
	return null;
};

const useCreateRating = () => {
	const createMutation = useCreateRatingMutation();
	const uploadMutation = useUploadImageMutation();
	const updateImagesMutation = useUpdateRatingImagesMutation();

	const [localErrorMessage, setLocalErrorMessage] = useState<string | null>(
		null,
	);
	const [localValidationErrors, setLocalValidationErrors] = useState<
		Record<string, string>
	>({});

	return {
		createRating: async (
			input: Omit<z.infer<typeof createRatingSchema>, "images"> & {
				images?: File[];
			},
		) => {
			setLocalErrorMessage(null);
			setLocalValidationErrors({});

			const ratingInput = {
				...input,
				content: normalizeParagraphBreaks(input.content),
				images: [],
			};

			try {
				const result = (await withTimeout(
					createMutation.mutateAsync(ratingInput),
					{ context: "create-rating" },
				)) as {
					success?: boolean;
					data?: { id: string } | null;
					errorMessage?: string;
					errors?: Record<string, string>;
				};

				if (!result.success || !result.data) {
					if (result.errors) {
						setLocalValidationErrors(result.errors);
					}
					const msg = result.errorMessage ?? "Failed to create rating";
					setLocalErrorMessage(msg);
					throw new Error(msg);
				}

				const ratingId = result.data.id;
				const files = input.images ?? [];

				if (files.length === 0) return;

				try {
					const uploads = files.map((file) =>
						withTimeout(uploadMutation.mutateAsync({ file, ratingId }), {
							context: "create-rating-upload-image",
							timeoutMs: 60_000,
						}).then((r) => r.url),
					);

					const imageUrls = await Promise.all(uploads);

					const attachResult = await withTimeout(
						updateImagesMutation.mutateAsync({
							ratingId,
							images: imageUrls,
						}),
						{ context: "create-rating-attach-images" },
					);

					if (!attachResult.success) {
						throw new Error(
							attachResult.errorMessage ?? "Failed to attach images",
						);
					}
				} catch (imageError) {
					try {
						await deleteRatingFn({ data: { ratingId } });
					} catch {
						// best-effort rollback; orphan row will be visible if delete fails
					}
					throw imageError;
				}
			} catch (error) {
				const msg =
					error instanceof Error
						? error.message
						: `An unexpected error occurred: ${error}`;

				const zodErrors = parseZodError(msg);
				if (zodErrors) {
					setLocalValidationErrors(zodErrors);
					setLocalErrorMessage(null);
				} else {
					setLocalErrorMessage(msg);
				}
				throw new Error(msg);
			}
		},
		isPending:
			createMutation.isPending ||
			uploadMutation.isPending ||
			updateImagesMutation.isPending,
		errorMessage:
			localErrorMessage ??
			(createMutation.data && !createMutation.data.success
				? createMutation.data.errorMessage
				: undefined),
		validationErrors:
			(createMutation.data && !createMutation.data.success
				? createMutation.data.errors
				: localValidationErrors) || {},
		reset: () => {
			createMutation.reset();
			uploadMutation.reset();
			updateImagesMutation.reset();
			setLocalErrorMessage(null);
			setLocalValidationErrors({});
		},
	};
};

interface CreateRatingModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export function CreateRatingModal({ isOpen, onClose }: CreateRatingModalProps) {
	const { createRating, isPending, errorMessage, validationErrors } =
		useCreateRating();

	const handleFormSuccess = () => {
		onClose();
	};

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			preventClose={isPending}
			mobileVariant="bottom-sheet"
		>
			<ModalContent>
				<div className="relative flex-1 flex flex-col min-h-0">
					<CreateRatingForm
						onSubmit={createRating}
						isPending={isPending}
						errorMessage={errorMessage}
						validationErrors={validationErrors}
						onSuccess={handleFormSuccess}
						onCancel={onClose}
					/>
				</div>
			</ModalContent>
		</Modal>
	);
}
