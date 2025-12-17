import logoUrl from "~/assets/logo.svg";

interface AppLogoProps {
	className?: string;
	/** CSS pixels or any valid SVG dimension (number or string). Sets both width and height when provided. */
	size?: number | string;
}

export const AppLogo = ({ className = "", size }: AppLogoProps) => {
	const sizeProps = size ? { width: size, height: size } : {};
	const classes = [!size && "w-6 h-6", "text-emerald-400", className]
		.filter(Boolean)
		.join(" ");

	return (
		<img
			src={logoUrl}
			alt="Rate Stuff Online logo"
			{...sizeProps}
			className={classes}
		/>
	);
};

export default AppLogo;
