import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: "primary" | "secondary" | "destructive";
	isLoading?: boolean;
	loadingLabel?: string;
	size?: "sm" | "md";
}

export function Button({
	variant = "primary",
	loadingLabel = "Loading...",
	isLoading,
	children,
	disabled,
	className,
	size = "md",
	...props
}: ButtonProps) {
	const baseStyles =
		"w-full font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-950";

	const sizeStyles = {
		sm: "px-2.5 py-1.5 text-sm rounded-xl",
		md: "px-4 py-2 text-base rounded-xl",
	};

	const variantStyles = {
		primary:
			"bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 text-white focus:ring-emerald-500",
		secondary:
			"bg-neutral-800 hover:bg-neutral-800/60 disabled:bg-neutral-800 text-white focus:ring-neutral-500",
		destructive:
			"bg-red-500/40 hover:bg-red-500/30 text-white focus:ring-red-500 disabled:bg-red-500/20",
	};

	return (
		<button
			disabled={disabled || isLoading}
			className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${
				disabled || isLoading ? "cursor-not-allowed" : "cursor-pointer"
			} ${className || ""}`}
			{...props}
		>
			{isLoading ? loadingLabel : children}
		</button>
	);
}
