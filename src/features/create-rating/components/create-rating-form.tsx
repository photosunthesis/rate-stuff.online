import { useForm } from "@tanstack/react-form";
import { useState, useRef, useEffect } from "react";
import { TextField } from "~/components/ui/text-field";
import { Button } from "~/components/ui/button";
import { FormError } from "~/components/ui/form-error";
import {
	createRatingSchema,
	type CreateRatingInput,
} from "~/features/create-rating/types";
import { StuffSelector } from "~/features/create-rating/components/stuff-selector";
import { TagSelector } from "~/features/create-rating/components/tag-selector";
import { CompactMarkdownEditor } from "~/features/create-rating/components/compact-markdown-editor";
import { ImageField } from "~/features/create-rating/components/image-field";
import { getErrorMessage } from "~/utils/errors";

interface CreateRatingFormProps {
	onSubmit: (
		data: Omit<CreateRatingInput, "images"> & { images?: File[] },
	) => Promise<void>;
	isPending: boolean;
	errorMessage?: string | null;
	validationErrors: Record<string, string>;
	onSuccess?: () => void;
	onCancel?: () => void;
}

export function CreateRatingForm({
	onSubmit,
	isPending,
	errorMessage,
	validationErrors,
	onSuccess,
	onCancel,
}: CreateRatingFormProps) {
	const [selectedStuff, setSelectedStuff] = useState<{
		id?: string;
		name: string;
	} | null>(null);
	const [selectedTags, setSelectedTags] = useState<string[]>([]);
	const [selectedImages, setSelectedImages] = useState<File[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const scrollableRef = useRef<HTMLDivElement>(null);

	const form = useForm({
		defaultValues: {
			title: "",
			score: "",
			content: "",
		},
		onSubmit: async ({ value }) => {
			if (isSubmitting || isPending) return;

			setIsSubmitting(true);

			try {
				const inputData = {
					title: value.title,
					score: Number(value.score),
					content: value.content,
					tags: selectedTags,
					stuffId: selectedStuff?.id,
					stuffName: selectedStuff?.id ? undefined : selectedStuff?.name,
					images: selectedImages,
				};

				await onSubmit(inputData);

				// If the submit promise resolves without throwing, treat it as success.
				form.reset();
				setSelectedStuff(null);
				setSelectedTags([]);
				setSelectedImages([]);
				onSuccess?.();
			} catch {
				// Submission failed; errors are surfaced via props from the hook.
			} finally {
				setIsSubmitting(false);
			}
		},
	});

	const inferredFieldErrors: Record<string, string> = {};
	if (errorMessage) {
		const msg = errorMessage.toLowerCase();
		if (msg.includes("title") && !validationErrors.title)
			inferredFieldErrors.title = errorMessage;
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
		if (
			(msg.includes("stuff") ||
				msg.includes("item") ||
				msg.includes("not found") ||
				msg.includes("name")) &&
			!validationErrors.stuffId
		)
			inferredFieldErrors.stuffId = errorMessage;
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
			<div
				className="flex-1 overflow-y-auto px-6 pt-14 pb-6 md:pt-6"
				ref={scrollableRef}
			>
				{hasGlobalError && (
					<div className="mb-6">
						<FormError message={getErrorMessage(errorMessage)} />
					</div>
				)}

				<div className="space-y-6">
					<div>
						<StuffSelector
							value={selectedStuff || undefined}
							onChange={setSelectedStuff}
							error={mergedValidationErrors.stuffId}
						/>
					</div>

					<div>
						<form.Field
							name="title"
							validators={{
								onChange: ({ value }) => {
									const result =
										createRatingSchema.shape.title.safeParse(value);
									return result.success
										? undefined
										: result.error.issues[0].message;
								},
							}}
						>
							{(field) => (
								<TextField
									label="Title"
									name={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder="Brief description of your experience"
									error={
										field.state.meta.errors[0] || mergedValidationErrors.title
									}
									required
								/>
							)}
						</form.Field>
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
									placeholder="Your rating, 1 to 10 (e.g., 7.5)"
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
								<CompactMarkdownEditor
									label="Your thoughts"
									value={field.state.value}
									onChange={(value) => field.handleChange(value)}
									error={
										field.state.meta.errors[0] || mergedValidationErrors.content
									}
									charLimit={5000}
									placeholder="Elaborate on your rating..."
								/>
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
							maxFiles={4}
						/>
					</div>
				</div>
			</div>

			<div className="shrink-0 sticky bottom-0 z-20 bg-neutral-900/80 backdrop-blur-md border-t border-neutral-800/50 px-6 py-4">
				<form.Subscribe selector={(state) => [state.canSubmit]}>
					{([canSubmit]) => (
						<div className="flex justify-end gap-3">
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
								loadingLabel="Creating..."
								disabled={!canSubmit || isPending || isSubmitting}
								isLoading={isPending || isSubmitting}
								className="w-auto! px-6 py-1.5 text-sm"
							>
								Create Rating
							</Button>
						</div>
					)}
				</form.Subscribe>
			</div>
		</form>
	);
}
