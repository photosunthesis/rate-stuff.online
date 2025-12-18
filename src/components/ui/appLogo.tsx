import logoUrl from "~/assets/logo.svg";
import logoWhiteUrl from "~/assets/logo-white.svg";

interface AppLogoProps {
	isWhite?: boolean;
	size?: number | string;
}

export const AppLogo = ({ isWhite = false, size }: AppLogoProps) => {
	const sizeProps = size ? { width: size, height: size } : {};

	return (
		<img
			src={isWhite ? logoWhiteUrl : logoUrl}
			alt="Rate Stuff Online logo"
			{...sizeProps}
		/>
	);
};

export default AppLogo;
