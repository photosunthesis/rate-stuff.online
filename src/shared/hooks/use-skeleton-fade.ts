import { useEffect, useRef, useState } from "react";

export function useSkeletonFade(isLoading: boolean) {
	const [showSkeleton, setShowSkeleton] = useState(isLoading);
	const [skeletonFading, setSkeletonFading] = useState(false);
	const [contentKey, setContentKey] = useState(0);
	const seenLoading = useRef(isLoading);

	useEffect(() => {
		if (isLoading) {
			seenLoading.current = true;
			setShowSkeleton(true);
			setSkeletonFading(false);
		}
	}, [isLoading]);

	useEffect(() => {
		if (!isLoading && showSkeleton && seenLoading.current) {
			setSkeletonFading(true);
			const t = setTimeout(() => {
				setShowSkeleton(false);
				setSkeletonFading(false);
				setContentKey((k) => k + 1);
			}, 150);
			return () => clearTimeout(t);
		}
	}, [isLoading, showSkeleton]);

	const skeletonClass = `transition-opacity duration-150 ${skeletonFading ? "opacity-0" : "opacity-100"}`;

	return { showSkeleton, skeletonClass, contentKey };
}
