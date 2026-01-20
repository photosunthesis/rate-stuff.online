import { useState, useId, useEffect, useRef } from "react";

import { useForm } from "@tanstack/react-form";
import { TextField } from "~/components/ui/text-field";
import { Button } from "~/components/ui/button";
import { FormError } from "~/components/ui/form-error";
import { User as UserIcon, Camera, X } from "lucide-react";

interface Props {
	onSubmit: (data: { avatar?: File | string; name?: string }) => Promise<void>;
	onSkip: () => void;
	isPending?: boolean;
	errorMessage?: string;
	validationErrors?: Record<string, string>;
	initialDisplayName?: string | null;
	initialAvatarUrl?: string | null;
}

export function SetUpProfileForm({
	onSubmit,
	onSkip,
	isPending,
	errorMessage,
	validationErrors,
	initialDisplayName,
	initialAvatarUrl,
}: Props) {
	const avatarId = useId();
	const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
	const [avatarFile, setAvatarFile] = useState<File | null>(null);

	const [fileError, setFileError] = useState<string | null>(null);
	const [nameValue, setDisplayNameValue] = useState<string>("");
	const [hasValues, setHasValues] = useState<boolean>(false);
	const [avatarRemoved, setAvatarRemoved] = useState<boolean>(false);
	const [isSuccess, setIsSuccess] = useState(false);
	const previewRef = useRef<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement | null>(null);

	useEffect(() => {
		setHasValues(Boolean(avatarFile) || Boolean(nameValue?.trim()));
	}, [avatarFile, nameValue]);

	function clearAvatar() {
		if (previewRef.current) URL.revokeObjectURL(previewRef.current);
		previewRef.current = null;
		setAvatarFile(null);
		setAvatarPreview(null);
		setFileError(null);
		setAvatarRemoved(true);
		if (fileInputRef.current) fileInputRef.current.value = "";
	}

	useEffect(() => {
		return () => {
			if (previewRef.current) URL.revokeObjectURL(previewRef.current);
		};
	}, []);

	const form = useForm({
		defaultValues: {
			name: initialDisplayName ?? "",
		},
		onSubmit: async ({ value }) => {
			if (!hasValues || isPending || isSuccess) return;

			const payload: Parameters<typeof onSubmit>[0] = {
				...value,
				avatar: avatarFile ?? undefined,
			};

			if (avatarRemoved && !avatarFile) {
				payload.avatar = "";
			}

			try {
				await onSubmit(payload);
				setIsSuccess(true);
			} catch {
				// Error handled by parent
			}
		},
	});

	useEffect(() => {
		if (initialAvatarUrl) {
			setAvatarPreview(initialAvatarUrl);
		}
	}, [initialAvatarUrl]);

	useEffect(() => {
		setDisplayNameValue(initialDisplayName ?? "");

		if (initialDisplayName !== undefined) {
			form.reset({ name: initialDisplayName ?? "" });
		}
	}, [initialDisplayName, form.reset]);

	return (
		<>
			{errorMessage && <FormError message={errorMessage} />}
			<form
				onSubmit={async (e) => {
					e.preventDefault();
					e.stopPropagation();
					await form.handleSubmit();
				}}
				className="space-y-6 w-full"
				noValidate
			>
				<fieldset
					disabled={isPending || isSuccess}
					className="space-y-6 w-full border-none p-0 m-0"
				>
					{/* Avatar Upload Section */}
					<div className="flex flex-col items-start">
						<label
							htmlFor={avatarId}
							className="relative cursor-pointer group"
							aria-label="Upload avatar"
						>
							<input
								id={avatarId}
								type="file"
								accept="image/*"
								className="sr-only"
								ref={fileInputRef}
								onChange={async (e) => {
									setFileError(null);
									const file = e.target.files?.[0] ?? null;
									if (!file) {
										setAvatarFile(null);
										setAvatarPreview(null);
										setAvatarRemoved(false);
										return;
									}

									if (!file.type?.startsWith("image/")) {
										setFileError("Please select an image file.");
										return;
									}
									const maxClientSize = 10 * 1024 * 1024;
									if (file.size > maxClientSize) {
										setFileError(
											"Selected file is too large. Maximum allowed is 10MB.",
										);
										return;
									}

									if (previewRef.current) {
										URL.revokeObjectURL(previewRef.current);
									}

									const url = URL.createObjectURL(file);
									previewRef.current = url;
									setAvatarFile(file);
									setAvatarPreview(url);
								}}
							/>
							<div className="w-32 h-32 rounded-full bg-neutral-800 flex items-center justify-center overflow-hidden border-2 border-neutral-700 group-hover:border-neutral-600 transition-colors">
								{avatarPreview ? (
									<img
										src={avatarPreview}
										alt="Avatar preview"
										className="w-full h-full object-cover"
									/>
								) : (
									<UserIcon
										className="w-12 h-12 text-neutral-400"
										aria-hidden="true"
									/>
								)}
							</div>{" "}
							<button
								type="button"
								aria-label="Remove avatar"
								onClick={(e) => {
									e.stopPropagation();
									e.preventDefault();
									clearAvatar();
								}}
								className={`absolute top-1 right-1 bg-black/60 rounded-full p-1 text-white hover:bg-black/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-neutral-500 transition-opacity duration-200 ease-in-out ${avatarPreview ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
							>
								<X className="w-4 h-4" aria-hidden="true" />
							</button>
							{/* Camera overlay */}
							<div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/60 transition-all flex items-center justify-center">
								<Camera className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
							</div>
						</label>
					</div>

					{/* Display name field */}
					<form.Field
						name="name"
						validators={{
							onChange: ({ value }) => {
								if (value && value.length > 50)
									return "Display name must be at most 50 characters";
								return undefined;
							},
						}}
					>
						{(field) => (
							<div className="w-full">
								<TextField
									label="Display Name"
									name={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => {
										field.handleChange(e.target.value);
										setDisplayNameValue(e.target.value ?? "");
									}}
									placeholder="How should we call you?"
									error={
										field.state.meta.errors[0]?.toString() ||
										validationErrors?.name
									}
								/>
								<p className="text-neutral-500 text-xs mt-1.5">
									{field.state.value?.length || 0}/50 characters
								</p>
							</div>
						)}
					</form.Field>
				</fieldset>

				{/* Errors & status */}
				{fileError && (
					<div className="bg-red-950/50 border border-red-800 rounded-lg p-3">
						<p className="text-red-400 text-sm">{fileError}</p>
					</div>
				)}
				{validationErrors?.avatar && (
					<div className="bg-red-950/50 border border-red-800 rounded-lg p-3">
						<p className="text-red-400 text-sm">{validationErrors.avatar}</p>
					</div>
				)}

				{/* Actions */}
				<div className="flex justify-start gap-3 pt-2">
					<Button
						type="button"
						variant="secondary"
						onClick={() => onSkip()}
						disabled={isPending || isSuccess}
					>
						Skip for now
					</Button>
					<form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
						{([canSubmit, isSubmitting]) => (
							<Button
								type="submit"
								loadingLabel="Setting up..."
								disabled={
									!hasValues ||
									!canSubmit ||
									isPending ||
									isSubmitting ||
									isSuccess ||
									!!fileError
								}
								isLoading={isPending || isSubmitting || isSuccess}
							>
								{isSuccess ? "Profile Ready!" : "Set Up Profile"}
							</Button>
						)}
					</form.Subscribe>
				</div>
			</form>
		</>
	);
}
