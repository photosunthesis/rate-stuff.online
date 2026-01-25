import { User as UserIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Image } from "../content/image";

interface AvatarProps {
	src: string | null;
	alt: string;
	size?: "xs" | "sm" | "md" | "lg" | "xl";
	className?: string;
	username?: string;
}

export function Avatar({
	src,
	alt,
	size = "md",
	className = "",
	username,
}: AvatarProps) {
	const sizeClasses = {
		xs: "w-6 h-6",
		sm: "w-8 h-8",
		md: "w-10 h-10",
		lg: "w-16 h-16",
		xl: "w-24 h-24",
	} as const;

	const iconSizes = {
		xs: "w-3 h-3",
		sm: "w-4 h-4",
		md: "w-5 h-5",
		lg: "w-8 h-8",
		xl: "w-12 h-12",
	} as const;

	const content = src ? (
		<Image
			src={src}
			alt={alt}
			variant="avatar"
			className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
		/>
	) : (
		<div
			className={`${sizeClasses[size]} rounded-full bg-neutral-900 border border-white/5 flex items-center justify-center text-neutral-500 ${className}`}
		>
			<UserIcon className={iconSizes[size]} />
		</div>
	);

	if (username) {
		return (
			<Link
				to="/user/$username"
				params={{ username }}
				className="block shrink-0"
				onClick={(e) => e.stopPropagation()}
			>
				{content}
			</Link>
		);
	}

	return content;
}
