import { useForm } from "@tanstack/react-form";
import { useState, useRef, useEffect, useId } from "react";
import { TextField } from "~/components/ui/text-field";
import { Button } from "~/components/ui/button";
import { FormError } from "~/components/ui/form-error";
import { createRatingSchema } from "~/features/create-rating/types";
import { TagSelector } from "~/features/create-rating/components/tag-selector";
import { ImageField } from "~/features/create-rating/components/image-field";
import type { z } from "zod";
import { useUmami } from "@danielgtmn/umami-react";
import { CompactMarkdownEditor } from "~/components/ui/compact-markdown-editor";

interface EditRatingFormProps {
	initialData: {
		score: number;
		content: string;
		tags: string[];
		images: string[];
		stuffName: string;
	};
	onSubmit: (
		data: Omit<
			z.infer<typeof createRatingSchema>,
			"images" | "stuffId" | "stuffName"
		> & {
			images?: File[];
			finalImages?: string[];
		},
	) => Promise<void>;
	isPending: boolean;
	errorMessage?: string | null;
	validationErrors: Record<string, string>;
	onSuccess?: () => void;
	onCancel?: () => void;
}

export function EditRatingForm({
	initialData,
	onSubmit,
	isPending,
	errorMessage,
	validationErrors,
	onSuccess,
	onCancel,
}: EditRatingFormProps) {
	const [selectedTags, setSelectedTags] = useState<string[]>(initialData.tags);
	const [selectedImages, setSelectedImages] = useState<(File | string)[]>(
		initialData.images,
	);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isSuccess, setIsSuccess] = useState(false);
	const scrollableRef = useRef<HTMLDivElement>(null);
	const contentEditorId = useId();
	const umami = useUmami();

	const form = useForm({
		defaultValues: {
			score: String(initialData.score),
			content: initialData.content,
		},
		onSubmit: async ({ value }) => {
			if (isSubmitting || isPending) return;

			setIsSubmitting(true);

			try {
				const newFiles = selectedImages.filter(
					(img) => img instanceof File,
				) as File[];
				const existingImages = selectedImages.filter(
					(img) => typeof img === "string",
				) as string[];

				const inputData = {
					score: Number(value.score),
					content: value.content,
					tags: selectedTags,
					images: newFiles,
					finalImages: existingImages,
				};

				await onSubmit(inputData);

				if (umami) {
					umami.track("edit_rating", {
						hasImages: selectedImages.length > 0,
						hasTags: selectedTags.length > 0,
					});
				}

				setIsSuccess(true);
				onSuccess?.();
			} catch {
				// Error handled by parent via errorMessage prop or caught here
			} finally {
				setIsSubmitting(false);
			}
		},
	});

	const inferredFieldErrors: Record<string, string> = {};
	if (errorMessage) {
		const msg = errorMessage.toLowerCase();
		if (
			(msg.includes("score") || msg.includes("rating")) &&
			!validationErrors.score
		)
			inferredFieldErrors.score = errorMessage;
		if (
			(msg.includes("content") ||
				msg.includes("thought") ||
				msg.includes("review")) &&
			!validationErrors.content
		)
			inferredFieldErrors.content = errorMessage;

		if (msg.includes("tag") && !validationErrors.tags)
			inferredFieldErrors.tags = errorMessage;
		if (
			(msg.includes("image") || msg.includes("upload")) &&
			!validationErrors.images
		)
			inferredFieldErrors.images = errorMessage;
	}

	const mergedValidationErrors = {
		...validationErrors,
		...inferredFieldErrors,
	};

	const hasGlobalError =
		Boolean(errorMessage) && Object.keys(mergedValidationErrors).length === 0;

	useEffect(() => {
		if (hasGlobalError && scrollableRef.current) {
			scrollableRef.current.scrollTo({ top: 0, behavior: "smooth" });
		}
	}, [hasGlobalError]);

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
				form.handleSubmit();
			}}
			className="flex flex-col h-full min-h-0"
			noValidate
		>
			<div className="flex-1 overflow-y-auto py-6" ref={scrollableRef}>
				<fieldset
					disabled={isPending || isSubmitting || isSuccess}
					className="px-6 space-y-6 border-none p-0 m-0"
				>
					{hasGlobalError && (
						<div className="mb-6">
							<FormError message={errorMessage ?? "Something went wrong"} />
						</div>
					)}

					<div>
						<h3 className="text-lg font-medium text-white">
							{initialData.stuffName}
						</h3>
						<div className="text-xs text-neutral-500">
							You can't change the stuff being rated.
						</div>
					</div>

					<div>
						<form.Field
							name="score"
							validators={{
								onChange: ({ value }) => {
									const result = createRatingSchema.shape.score.safeParse(
										Number(value),
									);
									return result.success
										? undefined
										: result.error.issues[0].message;
								},
							}}
						>
							{(field) => (
								<TextField
									label="Rating"
									name={field.name}
									type="number"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder="1 to 10"
									min="1"
									max="10"
									step="0.1"
									error={
										field.state.meta.errors[0] || mergedValidationErrors.score
									}
									required
								/>
							)}
						</form.Field>
					</div>

					<div>
						<form.Field
							name="content"
							validators={{
								onChange: ({ value }) => {
									const result =
										createRatingSchema.shape.content.safeParse(value);
									return result.success
										? undefined
										: result.error.issues[0].message;
								},
							}}
						>
							{(field) => (
								<>
									<label
										htmlFor={contentEditorId}
										className="block text-sm font-medium text-neutral-300 mb-2"
									>
										Your thoughts
									</label>
									<CompactMarkdownEditor
										id={contentEditorId}
										value={field.state.value}
										onChange={(value) => field.handleChange(value)}
										error={
											field.state.meta.errors[0] ||
											mergedValidationErrors.content
										}
										charLimit={5000}
										placeholder="Elaborate on your rating..."
										minHeightClass="min-h-[160px]"
									/>
								</>
							)}
						</form.Field>
					</div>

					<div>
						<TagSelector
							selectedTags={selectedTags}
							onChange={setSelectedTags}
							error={mergedValidationErrors.tags}
							maxTags={5}
						/>
					</div>

					<div>
						<ImageField
							images={selectedImages}
							onChange={setSelectedImages}
							error={mergedValidationErrors.images}
							maxFiles={3}
						/>
					</div>
				</fieldset>
			</div>

			<div className="shrink-0 sticky bottom-0 z-20 bg-neutral-950/80 backdrop-blur-md border-t border-neutral-800/50 px-6 py-4">
				<form.Subscribe selector={(state) => [state.canSubmit]}>
					{([canSubmit]) => (
						<div className="flex justify-end gap-3 items-center">
							<Button
								type="button"
								onClick={onCancel}
								disabled={isPending || isSubmitting}
								className="w-auto! px-4 py-1.5 text-sm"
								variant="secondary"
							>
								Cancel
							</Button>
							<Button
								type="submit"
								loadingLabel="Updating..."
								disabled={!canSubmit || isPending || isSubmitting || isSuccess}
								isLoading={isPending || isSubmitting || isSuccess}
								className="w-auto! px-6 py-1.5 text-sm"
							>
								{isSuccess ? "Updated!" : "Update Rating"}
							</Button>
						</div>
					)}
				</form.Subscribe>
			</div>
		</form>
	);
}
