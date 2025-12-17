import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useId, useEffect } from "react";
import AppLogo from "~/components/ui/appLogo";
import { useRegister } from "~/features/auth/hooks";
import type { RegisterInput } from "~/features/auth/types";

export const Route = createFileRoute("/create-account")({
	component: RouteComponent,
	head: () => ({
		meta: [
			{
				title: "Create Account - Rate Stuff Online",
			},
			{
				name: "description",
				content:
					"Create a new account on Rate Stuff Online. Join our community and start rating stuff today.",
			},
			{
				name: "og:title",
				property: "og:title",
				content: "Create Account - Rate Stuff Online",
			},
			{
				name: "og:description",
				property: "og:description",
				content: "Join Rate Stuff Online and start rating",
			},
			{
				name: "robots",
				content: "noindex, follow",
			},
		],
	}),
});

function RouteComponent() {
	const navigate = useNavigate();
	const { register, isPending, isError, errorMessage, validationErrors } =
		useRegister();
	const idPrefix = useId();

	const [formData, setFormData] = useState<RegisterInput>({
		inviteCode: "",
		username: "",
		displayName: "",
		email: "",
		password: "",
		confirmPassword: "",
	});
	const [hasSubmitted, setHasSubmitted] = useState(false);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setHasSubmitted(true);
		try {
			await register(formData);
		} catch (error) {
			console.error("Registration error:", error);
		}
	};

	useEffect(() => {
		if (
			hasSubmitted &&
			!isPending &&
			!isError &&
			Object.keys(validationErrors).length === 0
		) {
			navigate({ to: "/" });
		}
	}, [hasSubmitted, isPending, isError, validationErrors, navigate]);

	return (
		<div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4">
			<div className="w-full max-w-md">
				{/* Header */}
				<div className="text-center mb-8 mt-8 md:mt-0">
					<div className="flex justify-center mb-2">
						<AppLogo size={40} />
					</div>
					<h1 className="text-2xl font-bold text-white mb-2">
						Join the community
					</h1>
					<p className="text-neutral-400">
						Step inside, rate, discover and delight in the unexpected.
					</p>
				</div>

				{/* Global Error */}
				{isError && errorMessage && (
					<div className="mb-4 p-3 bg-red-950 border border-red-900 rounded-lg text-red-200 text-sm">
						{errorMessage}
					</div>
				)}

				{/* Form */}
				<form onSubmit={handleSubmit} className="space-y-4" noValidate>
					{/* Invite Code */}
					<div>
						<label
							htmlFor={`${idPrefix}-inviteCode`}
							className="block text-sm font-medium text-neutral-300 mb-2"
						>
							Invite Code
						</label>
						<input
							type="text"
							id={`${idPrefix}-inviteCode`}
							name="inviteCode"
							value={formData.inviteCode}
							onChange={handleChange}
							placeholder="Enter your invite code"
							className={`w-full px-4 py-2 bg-neutral-900 border ${
								validationErrors.inviteCode
									? "border-red-400"
									: "border-neutral-800"
							} rounded-lg text-white placeholder-neutral-500 focus:outline-none ${
								validationErrors.inviteCode
									? "focus:border-red-400 focus:ring-1 focus:ring-red-400/40"
									: "focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
							} transition-colors`}
							aria-invalid={!!validationErrors.inviteCode}
							aria-describedby={
								validationErrors.inviteCode
									? `${idPrefix}-inviteCode-error`
									: undefined
							}
							required
						/>
						{validationErrors.inviteCode && (
							<p
								id={`${idPrefix}-inviteCode-error`}
								className="text-red-400 text-sm mt-2"
							>
								{validationErrors.inviteCode}
							</p>
						)}
						<p className="text-neutral-500 text-xs mt-2">
							We're keeping this invite-only while we build it out. Thank you
							for your interest!
						</p>
					</div>

					{/* Username */}
					<div>
						<label
							htmlFor={`${idPrefix}-username`}
							className="block text-sm font-medium text-neutral-300 mb-2"
						>
							Username
						</label>
						<input
							type="text"
							id={`${idPrefix}-username`}
							name="username"
							value={formData.username}
							onChange={handleChange}
							placeholder="Choose a unique username"
							className={`w-full px-4 py-2 bg-neutral-900 border ${
								validationErrors.username
									? "border-red-400"
									: "border-neutral-800"
							} rounded-lg text-white placeholder-neutral-500 focus:outline-none ${
								validationErrors.username
									? "focus:border-red-400 focus:ring-1 focus:ring-red-400/40"
									: "focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
							} transition-colors`}
							aria-invalid={!!validationErrors.username}
							aria-describedby={
								validationErrors.username
									? `${idPrefix}-username-error`
									: undefined
							}
							required
						/>
						{validationErrors.username && (
							<p
								id={`${idPrefix}-username-error`}
								className="text-red-400 text-sm mt-2"
							>
								{validationErrors.username}
							</p>
						)}
					</div>

					{/* Display Name */}
					<div>
						<label
							htmlFor={`${idPrefix}-displayName`}
							className="block text-sm font-medium text-neutral-300 mb-2"
						>
							Display Name
						</label>
						<input
							type="text"
							id={`${idPrefix}-displayName`}
							name="displayName"
							value={formData.displayName}
							onChange={handleChange}
							placeholder="Your display name"
							className={`w-full px-4 py-2 bg-neutral-900 border ${
								validationErrors.displayName
									? "border-red-400"
									: "border-neutral-800"
							} rounded-lg text-white placeholder-neutral-500 focus:outline-none ${
								validationErrors.displayName
									? "focus:border-red-400 focus:ring-1 focus:ring-red-400/40"
									: "focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
							} transition-colors`}
							aria-invalid={!!validationErrors.displayName}
							aria-describedby={
								validationErrors.displayName
									? `${idPrefix}-displayName-error`
									: undefined
							}
							required
						/>
						{validationErrors.displayName && (
							<p
								id={`${idPrefix}-displayName-error`}
								className="text-red-400 text-sm mt-2"
							>
								{validationErrors.displayName}
							</p>
						)}
					</div>

					{/* Email */}
					<div>
						<label
							htmlFor={`${idPrefix}-email`}
							className="block text-sm font-medium text-neutral-300 mb-2"
						>
							Email
						</label>
						<input
							type="email"
							id={`${idPrefix}-email`}
							name="email"
							value={formData.email}
							onChange={handleChange}
							placeholder="your@email.com"
							className={`w-full px-4 py-2 bg-neutral-900 border ${
								validationErrors.email ? "border-red-400" : "border-neutral-800"
							} rounded-lg text-white placeholder-neutral-500 focus:outline-none ${
								validationErrors.email
									? "focus:border-red-400 focus:ring-1 focus:ring-red-400/40"
									: "focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
							} transition-colors`}
							aria-invalid={!!validationErrors.email}
							aria-describedby={
								validationErrors.email ? `${idPrefix}-email-error` : undefined
							}
							required
						/>
						{validationErrors.email && (
							<p
								id={`${idPrefix}-email-error`}
								className="text-red-400 text-sm mt-2"
							>
								{validationErrors.email}
							</p>
						)}
					</div>

					{/* Password */}
					<div>
						<label
							htmlFor={`${idPrefix}-password`}
							className="block text-sm font-medium text-neutral-300 mb-2"
						>
							Password
						</label>
						<input
							type="password"
							id={`${idPrefix}-password`}
							name="password"
							value={formData.password}
							onChange={handleChange}
							placeholder="At least 8 characters"
							className={`w-full px-4 py-2 bg-neutral-900 border ${
								validationErrors.password
									? "border-red-400"
									: "border-neutral-800"
							} rounded-lg text-white placeholder-neutral-500 focus:outline-none ${
								validationErrors.password
									? "focus:border-red-400 focus:ring-1 focus:ring-red-400/40"
									: "focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
							} transition-colors`}
							aria-invalid={!!validationErrors.password}
							aria-describedby={
								validationErrors.password
									? `${idPrefix}-password-error`
									: undefined
							}
							required
						/>
						{validationErrors.password && (
							<p
								id={`${idPrefix}-password-error`}
								className="text-red-400 text-sm mt-2"
							>
								{validationErrors.password}
							</p>
						)}
					</div>

					{/* Confirm Password */}
					<div>
						<label
							htmlFor={`${idPrefix}-confirmPassword`}
							className="block text-sm font-medium text-neutral-300 mb-2"
						>
							Confirm Password
						</label>
						<input
							type="password"
							id={`${idPrefix}-confirmPassword`}
							name="confirmPassword"
							value={formData.confirmPassword}
							onChange={handleChange}
							placeholder="Confirm your password"
							className={`w-full px-4 py-2 bg-neutral-900 border ${
								validationErrors.confirmPassword
									? "border-red-400"
									: "border-neutral-800"
							} rounded-lg text-white placeholder-neutral-500 focus:outline-none ${
								validationErrors.confirmPassword
									? "focus:border-red-400 focus:ring-1 focus:ring-red-400/40"
									: "focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
							} transition-colors`}
							aria-invalid={!!validationErrors.confirmPassword}
							aria-describedby={
								validationErrors.confirmPassword
									? `${idPrefix}-confirmPassword-error`
									: undefined
							}
							required
						/>
						{validationErrors.confirmPassword && (
							<p
								id={`${idPrefix}-confirmPassword-error`}
								className="text-red-400 text-sm mt-2"
							>
								{validationErrors.confirmPassword}
							</p>
						)}
					</div>

					{/* Submit Button */}
					<button
						type="submit"
						disabled={isPending}
						className="w-full mt-6 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-neutral-950"
					>
						{isPending ? "Creating Account..." : "Create Account"}
					</button>
				</form>

				{/* Footer */}
				<div className="mt-6 mb-8 md:mb-4 text-center">
					<p className="text-neutral-400 text-sm">
						Already have an account?{" "}
						<Link
							to="/sign-in"
							className="text-emerald-600 hover:text-emerald-500 font-semibold transition-colors"
						>
							Sign in
						</Link>
					</p>
				</div>
			</div>
		</div>
	);
}
