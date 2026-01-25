import { useForm } from "@tanstack/react-form";
import { useState, useRef, useEffect, useId } from "react";
import { useLocalStorage } from "~/hooks/use-local-storage";
import { TextField } from "~/components/ui/form/text-field";
import { Button } from "~/components/ui/form/button";
import { FormError } from "~/components/ui/form/form-error";
import { createRatingSchema } from "~/domains/ratings/types/create";
import { StuffSelector } from "~/domains/ratings/components/stuff-selector";
import { TagSelector } from "~/domains/ratings/components/tag-selector";
import { ImageField } from "~/domains/ratings/components/image-field";
import type { z } from "zod";
import { useUmami } from "@danielgtmn/umami-react";
import { CompactMarkdownEditor } from "~/components/ui/content/compact-markdown-editor";

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
	const [selectedStuff, setSelectedStuff] = useLocalStorage<{
		id?: string;
		name: string;
	} | null>("create-rating-stuff", null);
	const [selectedTags, setSelectedTags] = useLocalStorage<string[]>(
		"create-rating-tags",
		[],
	);
	const [selectedImages, setSelectedImages] = useState<File[]>([]);
	const [storedScore, setStoredScore] = useLocalStorage<string>(
		"create-rating-score",
		"",
	);
	const [storedContent, setStoredContent] = useLocalStorage<string>(
		"create-rating-content",
		"",
	);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isSuccess, setIsSuccess] = useState(false);
	const [showCacheNotification, setShowCacheNotification] = useState(false);
	const scrollableRef = useRef<HTMLDivElement>(null);
	const contentEditorId = useId();
	const umami = useUmami();

	const form = useForm({
		defaultValues: {
			score: storedScore,
			content: storedContent,
		},
		onSubmit: async ({ value }) => {
			if (isSubmitting || isPending) return;

			setIsSubmitting(true);
			setIsSuccess(false);

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

				if (umami) {
					umami.track("create_rating", {
						hasImages: selectedImages.length > 0,
						hasTags: selectedTags.length > 0,
					});
				}

				setIsSuccess(true);

				form.reset();
				setStoredScore("");
				setStoredContent("");
				setSelectedStuff(null);
				setSelectedTags([]);
				setSelectedImages([]);
				onSuccess?.();
			} catch {
				// Error is handled by parent, we just need to reset submitting state
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

	const hasCachedData = useRef(
		Boolean(
			storedScore || storedContent || selectedStuff || selectedTags.length > 0,
		),
	).current;

	useEffect(() => {
		if (hasCachedData) {
			setShowCacheNotification(true);
			const timer = setTimeout(() => {
				setShowCacheNotification(false);
			}, 5000); // 5 seconds
			return () => clearTimeout(timer);
		}
	}, [hasCachedData]);

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
			<form.Subscribe
				selector={(state) => [state.values.score, state.values.content]}
			>
				{([score, content]) => (
					<LocalStorageSyncer
						score={String(score)}
						content={content}
						setScore={setStoredScore}
						setContent={setStoredContent}
					/>
				)}
			</form.Subscribe>
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
						{showCacheNotification && (
							<div className="text-xs text-neutral-500 animate-in fade-in slide-in-from-bottom-1 duration-300 mb-3">
								Data loaded from cache (・_・)ノ
							</div>
						)}
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
										className="block text-base font-medium text-neutral-300 mb-2"
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
							onChange={(images) => setSelectedImages(images as File[])}
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
								className="w-auto! px-4 py-1.5 text-base"
								variant="secondary"
							>
								Cancel
							</Button>
							<Button
								type="submit"
								loadingLabel="Creating..."
								disabled={!canSubmit || isPending || isSubmitting || isSuccess}
								isLoading={isPending || isSubmitting || isSuccess}
								className="w-auto! px-6 py-1.5 text-base"
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

const LocalStorageSyncer = ({
	score,
	content,
	setScore,
	setContent,
}: {
	score: string;
	content: string;
	setScore: (v: string) => void;
	setContent: (v: string) => void;
}) => {
	useEffect(() => {
		setScore(score);
	}, [score, setScore]);

	useEffect(() => {
		setContent(content);
	}, [content, setContent]);

	return null;
};
