import { Modal, ModalContent } from "~/components/ui/modal";
import { CreateRatingForm } from "~/features/create-rating/components/create-rating-form";
import { useState } from "react";
import { useCreateRatingMutation, useUploadImageMutation } from "../queries";
import { extractValidationErrors, normalizeError } from "~/utils/errors";
import type { createRatingSchema } from "../types";
import type { z } from "zod";
import { v7 as uuidv7 } from "uuid";

const normalizeParagraphBreaks = (md: string) => {
	if (!md) return "";
	let s = md.replace(/\r\n/g, "\n");
	s = s.replace(/\n{3,}/g, "\n\n");
	s = s.replace(/([^\n])\n([^\n])/g, "$1\n\n$2");
	return s;
};

const useCreateRating = () => {
	const createMutation = useCreateRatingMutation();
	const uploadMutation = useUploadImageMutation();

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

			const ratingId = uuidv7();
			const ratingInput = {
				...input,
				content: normalizeParagraphBreaks(input.content),
				images: [],
				id: ratingId,
			};

			const imageUrls: string[] = [];

			try {
				if (input.images && input.images.length > 0) {
					const uploads = input.images.map((file) =>
						uploadMutation.mutateAsync({ file, ratingId }).then(
							(result) => result.url,
							(e) => {
								const info = normalizeError(e);
								if (info.errors)
									setLocalValidationErrors((prev) => ({
										...prev,
										...info.errors,
									}));
								const msg =
									info.errorMessage ??
									(e instanceof Error ? e.message : String(e));
								setLocalErrorMessage(msg);
								throw e;
							},
						),
					);

					const urls = await Promise.all(uploads);
					imageUrls.push(...urls);
				}

				const finalInput = { ...ratingInput, images: imageUrls };
				const result = (await createMutation.mutateAsync(finalInput)) as {
					success?: boolean;
					data?: { id: string } | null;
					errorMessage?: string;
					errors?: Record<string, string>;
				};

				if (!result.success || !result.data) {
					const validationErrors = extractValidationErrors(result);
					setLocalValidationErrors(validationErrors);
					const msg = result.errorMessage ?? "Failed to create rating";
					setLocalErrorMessage(msg);
					throw new Error(msg);
				}
			} catch (e) {
				const info = normalizeError(e);
				if (info.errors) setLocalValidationErrors(info.errors);
				const msg =
					info.errorMessage ?? (e instanceof Error ? e.message : String(e));
				setLocalErrorMessage(msg);
				throw new Error(msg);
			}
		},
		isPending: createMutation.isPending || uploadMutation.isPending,
		errorMessage:
			localErrorMessage ??
			(createMutation.data &&
			!(createMutation.data as { success?: boolean }).success
				? (createMutation.data as unknown as { errorMessage?: string })
						.errorMessage
				: undefined),
		validationErrors:
			(createMutation.data
				? extractValidationErrors(createMutation.data)
				: localValidationErrors) || {},
		reset: () => {
			createMutation.reset();
			uploadMutation.reset();
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
