import { User as UserIcon } from "lucide-react";

interface AvatarProps {
	src: string | null;
	alt: string;
	size?: "sm" | "md" | "lg";
	className?: string;
}

export function Avatar({ src, alt, size = "md", className = "" }: AvatarProps) {
	const sizeClasses = {
		sm: "w-8 h-8",
		md: "w-10 h-10",
		lg: "w-16 h-16",
	} as const;

	const iconSizes = {
		sm: "w-4 h-4",
		md: "w-5 h-5",
		lg: "w-8 h-8",
	} as const;

	if (src) {
		return (
			<img
				src={src}
				alt={alt}
				className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
			/>
		);
	}

	return (
		<div
			className={`${sizeClasses[size]} rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-500 ${className}`}
		>
			<UserIcon className={iconSizes[size]} />
		</div>
	);
}
