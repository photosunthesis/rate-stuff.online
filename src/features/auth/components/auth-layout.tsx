import type { ReactNode } from "react";
import AppLogo from "~/components/app-logo";
import { Link } from "@tanstack/react-router";

interface AuthLayoutProps {
	title: string;
	description: string;
	children: ReactNode;
	footerText?: string;
	footerLinkText?: string;
	footerLinkTo?: string;
}

export function AuthLayout({
	title,
	description,
	children,
	footerText,
	footerLinkText,
	footerLinkTo,
}: AuthLayoutProps) {
	return (
		<div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4">
			<div className="w-full max-w-md">
				<div className="text-left mb-8 mt-8 md:mt-0">
					<div className="flex justify-start mb-4">
						<AppLogo size={30} />
					</div>
					<h1 className="text-2xl font-semibold text-white mb-2">{title}</h1>
					<p className="text-neutral-400">{description}</p>
				</div>

				{children}

				{footerText && footerLinkText && footerLinkTo && (
					<div className="mt-6 mb-8 md:mb-4 text-left">
						<p className="text-neutral-400 text-sm">
							{footerText}{" "}
							<Link
								to={footerLinkTo}
								className="text-emerald-500 hover:text-emerald-400 font-semibold transition-colors hover:underline"
							>
								{footerLinkText}
							</Link>
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
