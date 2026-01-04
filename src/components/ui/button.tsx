import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: "primary" | "secondary";
	isLoading?: boolean;
}

export function Button({
	variant = "primary",
	isLoading,
	children,
	disabled,
	className,
	...props
}: ButtonProps) {
	const baseStyles =
		"w-full px-4 py-2 font-semibold rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-950";

	const variantStyles = {
		primary:
			"bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 text-white focus:ring-emerald-500",
		secondary:
			"bg-neutral-800 hover:bg-neutral-700 disabled:bg-neutral-800/50 text-white focus:ring-neutral-500",
	};

	return (
		<button
			disabled={disabled || isLoading}
			className={`${baseStyles} ${variantStyles[variant]} ${
				disabled || isLoading ? "cursor-not-allowed" : "cursor-pointer"
			} ${className || ""}`}
			{...props}
		>
			{isLoading ? "Loading..." : children}
		</button>
	);
}
