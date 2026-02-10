import { createFileRoute, Link } from "@tanstack/react-router";
import { Avatar } from "~/components/ui/misc/avatar";
import { useSuspenseQuery } from "@tanstack/react-query";
import { authQueryOptions } from "~/domains/users/queries";
import { mapToCurrentUser } from "~/domains/users/utils/user-mapping";
import { useSignOut } from "~/domains/users/hooks";
import { LogOut, ArrowUpRight, UserPen, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { ConfirmModal } from "~/components/ui/modal/confirm-modal";
import { MainLayout } from "~/components/layout/main-layout";
import { useUmami } from "@danielgtmn/umami-react";
import { Button } from "~/components/ui/form/button";

export const Route = createFileRoute("/_authed/settings")({
	component: RouteComponent,
	head: () => ({
		meta: [
			{ title: "Settings - Rate Stuff Online" },
			{ name: "robots", content: "noindex, follow" },
		],
	}),
});

function RouteComponent() {
	const { data: user } = useSuspenseQuery(authQueryOptions());
	const [isSignOutOpen, setIsSignOutOpen] = useState(false);
	const [signOut] = useSignOut();
	const umami = useUmami();

	if (!user) return null;

	const currentUser = mapToCurrentUser(user);

	return (
		<MainLayout user={currentUser}>
			<ConfirmModal
				destructive
				isOpen={isSignOutOpen}
				onClose={() => setIsSignOutOpen(false)}
				title="Ready to sign out?"
				description="After signing out, you can sign back in anytime."
				confirmLabel="Sign out"
				onConfirm={() => {
					signOut();
					if (umami) umami.track("sign_out");
				}}
			/>

			<div className="w-full flex flex-col min-h-full">
				<div className="px-4 py-8 flex flex-col flex-1 max-w-3xl mx-auto w-full gap-8">
					{/* User Profile Section */}
					<div className="flex items-center justify-between gap-4 px-2">
						<Link
							to="/user/$username"
							params={{
								username: user.username as string,
							}}
							className="flex items-center gap-4 min-w-0 group"
						>
							<Avatar
								src={user.image ?? null}
								alt={user.name || "User"}
								size="lg"
								className="group-hover:opacity-80 transition-opacity"
							/>
							<div className="flex flex-col min-w-0">
								<h3 className="text-lg font-semibold text-white truncate">
									{user.name || "User"}
								</h3>
								<p className="text-base text-neutral-400 truncate">
									@{user.username}
								</p>
							</div>
						</Link>
						<Link to="/set-up-profile" search={{ redirect: "/settings" }}>
							<Button
								variant="secondary"
								size="sm"
								className="w-auto! shrink-0 shadow-lg flex items-center gap-1.5"
							>
								<UserPen className="w-4 h-4" />
								Edit Profile
							</Button>
						</Link>
					</div>

					{/* Main Settings Card */}
					<div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
						<SettingsRow
							label="Terms of Service"
							description="Read our terms and conditions"
							to="/terms"
							icon={ArrowUpRight}
							isFirst
						/>

						<SettingsRow
							label="Privacy Policy"
							description="How we handle your data"
							to="/privacy"
							icon={ArrowUpRight}
						/>

						<SettingsRow
							label="Contact"
							description="Reach out to us for support"
							href="mailto:hello@rate-stuff.online"
							icon={ArrowUpRight}
						/>

						<SettingsRow
							label="GitHub"
							description="View the source code"
							href="https://github.com/photosunthesis/rate-stuff.online"
							icon={ArrowUpRight}
							external
						/>
					</div>

					{/* Sign Out Card */}
					<div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
						<SettingsRow
							label="Sign Out"
							description="Sign out of your account"
							onClick={() => setIsSignOutOpen(true)}
							icon={LogOut}
							isFirst
						/>
					</div>

					<div className="flex-1" />

					<div className="flex flex-col items-center justify-center pt-4 pb-2 space-y-2">
						<span className="text-xs font-medium text-neutral-500">
							{`© 2025-${new Date().getFullYear()} Rate Stuff Online`}
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
					<span className="text-sm text-neutral-400">{description}</span>
				</div>
			</div>
			<Icon className="w-5 h-5 text-neutral-500" />
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
