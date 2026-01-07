import { useForm } from "@tanstack/react-form";
import { useState, useRef, useEffect } from "react";
import { TextField } from "~/components/ui/text-field";
import { Button } from "~/components/ui/button";
import { FormError } from "~/components/ui/form-error";
import { createRatingSchema, type CreateRatingInput } from "../types";
import { StuffSelector } from "./stuff-selector";
import { TagSelector } from "./tag-selector";
import { CompactMarkdownEditor } from "./compact-markdown-editor";
import { ImageField } from "./image-field";

interface CreateRatingFormProps {
	onSubmit: (
		data: Omit<CreateRatingInput, "images"> & { images?: File[] },
	) => Promise<void>;
	isPending: boolean;
	error?: Error | null;
	validationErrors: Record<string, string>;
	onSuccess?: () => void;
	onCancel?: () => void;
}

export function CreateRatingForm({
	onSubmit,
	isPending,
	error,
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
	const scrollableRef = useRef<HTMLDivElement>(null);

	const form = useForm({
		defaultValues: {
			title: "",
			score: "",
			content: "",
		},
		onSubmit: async ({ value }) => {
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

			if (!error) {
				form.reset();
				setSelectedStuff(null);
				setSelectedTags([]);
				setSelectedImages([]);
				onSuccess?.();
			}
		},
	});

	const hasGlobalError = error && Object.keys(validationErrors).length === 0;

	const getErrorMessage = (err: Error | null | undefined): string => {
		if (!err) return "";
		try {
			const parsed = JSON.parse(err.message);
			// Handle array of errors
			if (Array.isArray(parsed)) {
				return parsed[0]?.message || err.message;
			}
			// Handle object with message property
			return parsed.message || err.message;
		} catch {
			return err.message;
		}
	};

	// Scroll to top when global error appears
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
			{/* Scrollable Form Content */}
			<div className="flex-1 overflow-y-auto px-6 py-6" ref={scrollableRef}>
				{hasGlobalError && (
					<div className="mb-6">
						<FormError message={getErrorMessage(error)} />
					</div>
				)}

				<div className="space-y-6">
					<div>
						<StuffSelector
							value={selectedStuff || undefined}
							onChange={setSelectedStuff}
							error={validationErrors.stuffId}
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
									error={field.state.meta.errors[0] || validationErrors.title}
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
									error={field.state.meta.errors[0] || validationErrors.score}
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
									error={field.state.meta.errors[0] || validationErrors.content}
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
							error={validationErrors.tags}
						/>
					</div>

					<div>
						<ImageField
							images={selectedImages}
							onChange={setSelectedImages}
							error={validationErrors.images}
						/>
					</div>
				</div>
			</div>

			{/* Sticky Button Section */}
			<div className="shrink-0 sticky bottom-0 z-20 bg-neutral-900/80 backdrop-blur-md border-t border-neutral-800/50 px-6 py-4">
				<form.Subscribe
					selector={(state) => [state.canSubmit, state.isSubmitting]}
				>
					{([canSubmit, isSubmitting]) => (
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
