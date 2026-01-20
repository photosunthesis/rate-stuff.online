import { PhotonImage, resize } from "@cf-wasm/photon";

export async function compressImage(
	file: File | Blob,
): Promise<{ buffer: Uint8Array; contentType: string }> {
	const arrayBuffer = await file.arrayBuffer();
	const inputBytes = new Uint8Array(arrayBuffer);

	try {
		const inputImage = PhotonImage.new_from_byteslice(inputBytes);
		const width = inputImage.get_width();
		const height = inputImage.get_height();
		const MAX_DIMENSION = 3840; // 4k

		if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
			let newWidth = width;
			let newHeight = height;

			if (width > height) {
				newWidth = MAX_DIMENSION;
				newHeight = Math.round((height * MAX_DIMENSION) / width);
			} else {
				newHeight = MAX_DIMENSION;
				newWidth = Math.round((width * MAX_DIMENSION) / height);
			}

			// 5 is the resizing sampling filter (Lanczos3 is usually good, or Nearest)
			// Photon uses a u8 for sampling filter.
			// 1: Nearest, 2: Triangle, 3: CatmullRom, 4: Gaussian, 5: Lanczos3
			const resizedImage = resize(inputImage, newWidth, newHeight, 5);
			// We can replace the inputImage with resized one for next steps,
			// but resize returns a new PhotonImage.
			// We need to make sure we free memory if possible, though JS GC should handle it
			// if the bindings are correct. However, rust-wasm bindings often have free().
			// For now, let's just use the result.

			// Note: resize returns a new image.
			inputImage.free(); // Free the original if possible/needed

			const outputBytes = resizedImage.get_bytes_webp();
			resizedImage.free();

			return {
				buffer: outputBytes,
				contentType: "image/webp",
			};
		}

		// If no resize needed, just convert to WebP
		const outputBytes = inputImage.get_bytes_webp();
		inputImage.free();

		return {
			buffer: outputBytes,
			contentType: "image/webp",
		};
	} catch (error) {
		console.error("Image compression failed, returning original:", error);
		// Fallback to original
		return {
			buffer: inputBytes,
			contentType: file.type || "application/octet-stream",
		};
	}
}
