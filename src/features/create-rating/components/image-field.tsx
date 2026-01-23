import { useRef, useId, useState } from "react";
import { X, Upload } from "lucide-react";

interface ImageFieldProps {
	images: (File | string)[];
	onChange: (images: (File | string)[]) => void;
	error?: string;
	maxFiles?: number;
	maxSizeInMB?: number;
}

export function ImageField({
	images,
	onChange,
	error,
	maxFiles = 3,
	maxSizeInMB = 10,
}: ImageFieldProps) {
	const inputId = useId();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [dragActive, setDragActive] = useState(false);

	const handleFiles = async (files: FileList | null) => {
		if (!files) return;

		const validTypes = [
			"image/jpeg",
			"image/png",
			"image/webp",
			"image/gif",
			"image/avif",
			"image/heic",
			"image/heif",
		];

		const newFiles: (File | string)[] = [];

		for (const file of Array.from(files)) {
			if (!validTypes.includes(file.type)) {
				continue;
			}

			if (file.size > maxSizeInMB * 1024 * 1024) {
				continue;
			}
			newFiles.push(file);
		}

		if (images.length + newFiles.length > maxFiles) {
			const spacesLeft = maxFiles - images.length;
			if (spacesLeft > 0) {
				onChange([...images, ...newFiles.slice(0, spacesLeft)]);
			}
		} else {
			onChange([...images, ...newFiles]);
		}
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		handleFiles(e.target.files);

		if (fileInputRef.current) fileInputRef.current.value = "";
	};

	const handleRemove = (index: number) => {
		const newImages = [...images];
		newImages.splice(index, 1);
		onChange(newImages);
	};

	const handleDrag = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (e.type === "dragenter" || e.type === "dragover") {
			setDragActive(true);
		} else if (e.type === "dragleave") {
			setDragActive(false);
		}
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setDragActive(false);
		if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
			handleFiles(e.dataTransfer.files);
		}
	};

	return (
		<div>
			<label
				htmlFor={inputId}
				className="block text-base font-medium text-neutral-300 mb-2"
			>
				Images
			</label>

			<div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
				{images.map((file, index) => (
					<div
						key={`${typeof file === "string" ? file : file.name}-${index}`}
						className="relative aspect-square rounded-lg overflow-hidden group border border-white/5 bg-neutral-900"
					>
						<img
							src={typeof file === "string" ? file : URL.createObjectURL(file)}
							alt="Preview"
							className="w-full h-full object-cover"
						/>
						<button
							type="button"
							onClick={() => handleRemove(index)}
							className="absolute top-2 right-2 p-1 bg-black/60 backdrop-blur-sm hover:bg-black/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
						>
							<X size={14} />
						</button>
					</div>
				))}

				{images.length < maxFiles && (
					<button
						type="button"
						className={`aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors ${
							dragActive
								? "border-emerald-500 bg-emerald-500/10"
								: "border-neutral-800 hover:border-emerald-500/50 hover:bg-neutral-800"
						}`}
						onDragEnter={handleDrag}
						onDragLeave={handleDrag}
						onDragOver={handleDrag}
						onDrop={handleDrop}
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();
							fileInputRef.current?.click();
						}}
					>
						<Upload
							size={20}
							className={dragActive ? "text-emerald-500" : "text-neutral-500"}
						/>
						<span className="text-xs text-neutral-500 mt-2">Add Image</span>
						<input
							ref={fileInputRef}
							type="file"
							id={inputId}
							className="hidden"
							multiple
							accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/heic,image/heif"
							onChange={handleChange}
							onClick={(e) => e.stopPropagation()}
						/>
					</button>
				)}
			</div>
			{error && <div className="mt-1 text-xs text-red-400">{error}</div>}
		</div>
	);
}
