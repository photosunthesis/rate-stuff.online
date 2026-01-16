import { useForm } from "@tanstack/react-form";
import { useState, useRef, useEffect, lazy, Suspense, useId } from "react";
import { TextField } from "~/components/ui/text-field";
import { Button } from "~/components/ui/button";
import { FormError } from "~/components/ui/form-error";
import { Bold, Italic, Strikethrough, Underline } from "lucide-react";
import { createRatingSchema } from "~/features/create-rating/types";
import { StuffSelector } from "~/features/create-rating/components/stuff-selector";
import { TagSelector } from "~/features/create-rating/components/tag-selector";
import { ImageField } from "~/features/create-rating/components/image-field";
import { getErrorMessage } from "~/utils/errors";
import type { z } from "zod";
import { useUmami } from "@danielgtmn/umami-react";

const CompactMarkdownEditor = lazy(() =>
	import("~/features/create-rating/components/compact-markdown-editor").then(
		(module) => ({ default: module.CompactMarkdownEditor }),
	),
);

interface CreateRatingFormProps {
	onSubmit: (
		data: Omit<z.infer<typeof createRatingSchema>, "images"> & {
			images?: File[];
		},
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
	const [isSuccess, setIsSuccess] = useState(false);
	const scrollableRef = useRef<HTMLDivElement>(null);
	const contentEditorId = useId();
	const umami = useUmami();

	const form = useForm({
		defaultValues: {
			score: "",
			content: "",
		},
		onSubmit: async ({ value }) => {
			if (isSubmitting || isPending) return;

			setIsSubmitting(true);

			try {
				const inputData = {
					score: Number(value.score),
					content: value.content,
					tags: selectedTags,
					stuffId: selectedStuff?.id,
					stuffName: selectedStuff?.id ? undefined : selectedStuff?.name,
					images: selectedImages,
				};

				await onSubmit(inputData);

				// Track successful rating creation
				if (umami) {
					umami.track("create_rating", {
						hasImages: selectedImages.length > 0,
						hasTags: selectedTags.length > 0,
					});
				}

				setIsSuccess(true);
				// If the submit promise resolves without throwing, treat it as success.
				form.reset();
				setSelectedStuff(null);
				setSelectedTags([]);
				setSelectedImages([]);
				onSuccess?.();
			} catch {
				// Submission failed; errors are surfaced via props from the hook.
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
				className="flex-1 overflow-y-auto pt-14 pb-6 md:pt-6"
				ref={scrollableRef}
			>
				<fieldset
					disabled={isPending || isSubmitting || isSuccess}
					className="px-6 space-y-6 border-none p-0 m-0"
				>
					{hasGlobalError && (
						<div className="mb-6">
							<FormError message={getErrorMessage(errorMessage)} />
						</div>
					)}

					<div>
						<StuffSelector
							value={selectedStuff || undefined}
							onChange={setSelectedStuff}
							error={mergedValidationErrors.stuffId}
						/>
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
								<>
									<label
										htmlFor={contentEditorId}
										className="block text-sm font-medium text-neutral-300 mb-2"
									>
										Your thoughts
									</label>
									<Suspense fallback={<CompactMarkdownEditorSkeleton />}>
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
										/>
									</Suspense>
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
							maxFiles={4}
						/>
					</div>
				</fieldset>
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
								disabled={!canSubmit || isPending || isSubmitting || isSuccess}
								isLoading={isPending || isSubmitting || isSuccess}
								className="w-auto! px-6 py-1.5 text-sm"
							>
								{isSuccess ? "Created!" : "Create Rating"}
							</Button>
						</div>
					)}
				</form.Subscribe>
			</div>
		</form>
	);
}

function CompactMarkdownEditorSkeleton() {
	return (
		<div className="animate-pulse">
			<div className="border border-neutral-800 rounded-xl overflow-hidden">
				{/* Toolbar Skeleton */}
				<div className="flex items-center gap-1 px-3 py-2 bg-neutral-800 border-b border-neutral-800">
					<div className="p-1.5 text-neutral-600">
						<Bold className="w-4 h-4" />
					</div>
					<div className="p-1.5 text-neutral-600">
						<Italic className="w-4 h-4" />
					</div>
					<div className="p-1.5 text-neutral-600">
						<Strikethrough className="w-4 h-4" />
					</div>
					<div className="p-1.5 text-neutral-600">
						<Underline className="w-4 h-4" />
					</div>
				</div>

				{/* Content Skeleton */}
				<div className="h-[150px] bg-neutral-900 w-full" />
			</div>
		</div>
	);
}
