import { createFileRoute, Link } from "@tanstack/react-router";
import { useSignOut } from "~/features/auth/hooks";
import { LogOut, ArrowUpRight, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { ConfirmModal } from "~/shared/components/ui/confirm-modal";
import { MainLayout } from "~/shared/components/layout/main-layout";
import { useUmami } from "@danielgtmn/umami-react";
import { m } from "~/paraglide/messages";

export const Route = createFileRoute("/_authed/menu")({
	component: RouteComponent,
	head: () => ({
		meta: [
			{ title: "Menu - Rate Stuff Online" },
			{ name: "robots", content: "noindex, follow" },
		],
	}),
});

function RouteComponent() {
	const [isSignOutOpen, setIsSignOutOpen] = useState(false);
	const [signOut] = useSignOut();
	const umami = useUmami();

	return (
		<MainLayout>
			<ConfirmModal
				destructive
				isOpen={isSignOutOpen}
				onClose={() => setIsSignOutOpen(false)}
				title={m.sign_out_modal_title()}
				description={m.sign_out_modal_description()}
				confirmLabel={m.sign_out_modal_confirm()}
				onConfirm={() => {
					signOut();
					if (umami) umami.track("sign_out");
				}}
			/>

			<div className="w-full flex flex-col min-h-full">
				<div className="px-4 py-8 flex flex-col flex-1 max-w-3xl mx-auto w-full gap-8">
					{/* Main Settings Card */}
					<div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
						<SettingsRow
							label={m.terms_of_service()}
							description={m.menu_terms_description()}
							to="/terms"
							icon={ArrowUpRight}
							isFirst
						/>

						<SettingsRow
							label={m.privacy_policy()}
							description={m.menu_privacy_description()}
							to="/privacy"
							icon={ArrowUpRight}
						/>

						<SettingsRow
							label={m.menu_contact_label()}
							description={m.menu_contact_description()}
							href="mailto:hello@rate-stuff.online"
							icon={ArrowUpRight}
						/>

						<SettingsRow
							label={m.menu_github_label()}
							description={m.menu_github_description()}
							href="https://github.com/photosunthesis/rate-stuff.online"
							icon={ArrowUpRight}
							external
						/>
					</div>

					{/* Sign Out Card */}
					<div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
						<SettingsRow
							label={m.menu_sign_out_label()}
							description={m.menu_sign_out_description()}
							onClick={() => setIsSignOutOpen(true)}
							icon={LogOut}
							isFirst
						/>
					</div>

					<div className="flex-1" />

					<div className="flex flex-col items-center justify-center pt-4 pb-2 space-y-2">
						<span className="text-xs font-medium text-neutral-400">
							{m.copyright({ year: new Date().getFullYear() })}
						</span>
					</div>
				</div>
			</div>
		</MainLayout>
	);
}

const SettingsRow = ({
	label,
	description,
	icon: Icon,
	to,
	href,
	onClick,
	external,
	isFirst,
}: {
	label: string;
	description: string;
	icon: LucideIcon;
	to?: string;
	href?: string;
	onClick?: () => void;
	external?: boolean;
	isFirst?: boolean;
}) => {
	const content = (
		<>
			<div className="flex items-center gap-3">
				<div className="flex flex-col">
					<span className="text-md font-medium text-white">{label}</span>
					<span className="text-sm text-neutral-300">{description}</span>
				</div>
			</div>
			<Icon className="w-5 h-5 text-neutral-400" />
		</>
	);

	const className = `w-full flex items-center justify-between p-4 hover:bg-neutral-800/50 transition-colors text-left cursor-pointer ${
		!isFirst ? "border-t border-neutral-800" : ""
	}`;

	if (to) {
		return (
			<Link to={to} className={className}>
				{content}
			</Link>
		);
	}

	if (href) {
		return (
			<a
				href={href}
				className={className}
				target={external ? "_blank" : undefined}
				rel={external ? "noopener noreferrer" : undefined}
			>
				{content}
			</a>
		);
	}

	return (
		<button type="button" onClick={onClick} className={className}>
			{content}
		</button>
	);
};
