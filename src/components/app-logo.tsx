import { Link } from "@tanstack/react-router";
import logoUrl from "~/assets/logo.svg";
import logoWhiteUrl from "~/assets/logo-white.svg";

interface AppLogoProps {
	isWhite?: boolean;
	size?: number | string;
}

export const AppLogo = ({ isWhite = false, size }: AppLogoProps) => {
	const sizeProps = size ? { width: size, height: size } : {};

	return (
		<Link to="/">
			<img
				src={isWhite ? logoWhiteUrl : logoUrl}
				alt="Rate Stuff Online logo"
				{...sizeProps}
			/>
		</Link>
	);
};

export default AppLogo;
