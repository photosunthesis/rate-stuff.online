import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useId, useEffect } from "react";
import AppLogo from "./_components/app-logo";
import { useRegister } from "~/features/auth/hooks";
import type { RegisterInput } from "~/features/auth/types";
import { registerBaseSchema } from "~/features/auth/types";
import { useForm } from "@tanstack/react-form";

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

	const [hasSubmitted, setHasSubmitted] = useState(false);

	const form = useForm({
		defaultValues: {
			inviteCode: "",
			username: "",
			displayName: "",
			email: "",
			password: "",
			confirmPassword: "",
		} as RegisterInput,
		onSubmit: async ({ value }) => {
			setHasSubmitted(true);
			await register(value);
		},
	});

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
				<div className="text-left mb-8 mt-8 md:mt-0">
					<div className="flex justify-start mb-2">
						<AppLogo size={40} />
					</div>
					<h1 className="text-2xl font-semibold text-white mb-2">
						Join the community
					</h1>
					<p className="text-neutral-400">
						Your account. Your ratings. One to ten. Start here.
					</p>
				</div>

				{/* Global Error */}
				{isError &&
					errorMessage &&
					Object.keys(validationErrors).length === 0 && (
						<div className="mb-4 p-3 bg-red-950 border border-red-900 rounded-xl text-red-200 text-sm">
							{errorMessage}
						</div>
					)}

				{/* Form */}
				<form
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						form.handleSubmit();
					}}
					className="space-y-4"
					noValidate
				>
					{/* Invite Code */}
					<form.Field
						name="inviteCode"
						validators={{
							onChange: ({ value }) => {
								const result =
									registerBaseSchema.shape.inviteCode.safeParse(value);
								return result.success
									? undefined
									: result.error.issues[0].message;
							},
						}}
					>
						{(field) => (
							<div>
								<label
									htmlFor={field.name}
									className="block text-sm font-medium text-neutral-300 mb-2"
								>
									Invite Code
								</label>
								<input
									type="text"
									id={field.name}
									name={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder="e.g., NUS420"
									className={`w-full px-4 py-2 bg-neutral-900 border ${
										field.state.meta.errors.length > 0 ||
										validationErrors.inviteCode
											? "border-red-400"
											: "border-neutral-800"
									} rounded-xl text-white placeholder-neutral-500 focus:outline-none ${
										field.state.meta.errors.length > 0 ||
										validationErrors.inviteCode
											? "focus:border-red-400 focus:ring-1 focus:ring-red-400/40"
											: "focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
									} transition-colors`}
									aria-invalid={
										field.state.meta.errors.length > 0 ||
										!!validationErrors.inviteCode
									}
									aria-describedby={
										field.state.meta.errors.length > 0 ||
										validationErrors.inviteCode
											? `${idPrefix}-inviteCode-error`
											: undefined
									}
									required
								/>
								{(field.state.meta.errors.length > 0 ||
									validationErrors.inviteCode) && (
									<p
										id={`${idPrefix}-inviteCode-error`}
										className="text-red-400 text-sm mt-2"
									>
										{field.state.meta.errors[0]?.toString() ||
											validationErrors.inviteCode}
									</p>
								)}
								<p className="text-neutral-500 text-xs mt-2">
									We're invite-only for now while we build this platform out.
									Thank you for your interest!
								</p>
							</div>
						)}
					</form.Field>

					{/* Username */}
					<form.Field
						name="username"
						validators={{
							onChange: ({ value }) => {
								const result =
									registerBaseSchema.shape.username.safeParse(value);
								return result.success
									? undefined
									: result.error.issues[0].message;
							},
						}}
					>
						{(field) => (
							<div>
								<label
									htmlFor={field.name}
									className="block text-sm font-medium text-neutral-300 mb-2"
								>
									Username
								</label>
								<input
									type="text"
									id={field.name}
									name={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder="coolusername123"
									className={`w-full px-4 py-2 bg-neutral-900 border ${
										field.state.meta.errors.length > 0 ||
										validationErrors.username
											? "border-red-400"
											: "border-neutral-800"
									} rounded-xl text-white placeholder-neutral-500 focus:outline-none ${
										field.state.meta.errors.length > 0 ||
										validationErrors.username
											? "focus:border-red-400 focus:ring-1 focus:ring-red-400/40"
											: "focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
									} transition-colors`}
									aria-invalid={
										field.state.meta.errors.length > 0 ||
										!!validationErrors.username
									}
									aria-describedby={
										field.state.meta.errors.length > 0 ||
										validationErrors.username
											? `${idPrefix}-username-error`
											: undefined
									}
									required
								/>
								{(field.state.meta.errors.length > 0 ||
									validationErrors.username) && (
									<p
										id={`${idPrefix}-username-error`}
										className="text-red-400 text-sm mt-2"
									>
										{field.state.meta.errors[0]?.toString() ||
											validationErrors.username}
									</p>
								)}
							</div>
						)}
					</form.Field>

					{/* Display Name */}
					<form.Field
						name="displayName"
						validators={{
							onChange: ({ value }) => {
								const result =
									registerBaseSchema.shape.displayName.safeParse(value);
								return result.success
									? undefined
									: result.error.issues[0].message;
							},
						}}
					>
						{(field) => (
							<div>
								<label
									htmlFor={field.name}
									className="block text-sm font-medium text-neutral-300 mb-2"
								>
									Display Name
								</label>
								<input
									type="text"
									id={field.name}
									name={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder="Your Pretty Name"
									className={`w-full px-4 py-2 bg-neutral-900 border ${
										field.state.meta.errors.length > 0 ||
										validationErrors.displayName
											? "border-red-400"
											: "border-neutral-800"
									} rounded-xl text-white placeholder-neutral-500 focus:outline-none ${
										field.state.meta.errors.length > 0 ||
										validationErrors.displayName
											? "focus:border-red-400 focus:ring-1 focus:ring-red-400/40"
											: "focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
									} transition-colors`}
									aria-invalid={
										field.state.meta.errors.length > 0 ||
										!!validationErrors.displayName
									}
									aria-describedby={
										field.state.meta.errors.length > 0 ||
										validationErrors.displayName
											? `${idPrefix}-displayName-error`
											: undefined
									}
									required
								/>
								{(field.state.meta.errors.length > 0 ||
									validationErrors.displayName) && (
									<p
										id={`${idPrefix}-displayName-error`}
										className="text-red-400 text-sm mt-2"
									>
										{field.state.meta.errors[0]?.toString() ||
											validationErrors.displayName}
									</p>
								)}
							</div>
						)}
					</form.Field>

					{/* Email */}
					<form.Field
						name="email"
						validators={{
							onChange: ({ value }) => {
								const result = registerBaseSchema.shape.email.safeParse(value);
								return result.success
									? undefined
									: result.error.issues[0].message;
							},
						}}
					>
						{(field) => (
							<div>
								<label
									htmlFor={field.name}
									className="block text-sm font-medium text-neutral-300 mb-2"
								>
									Email
								</label>
								<input
									type="email"
									id={field.name}
									name={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder="your@email.com"
									className={`w-full px-4 py-2 bg-neutral-900 border ${
										field.state.meta.errors.length > 0 || validationErrors.email
											? "border-red-400"
											: "border-neutral-800"
									} rounded-xl text-white placeholder-neutral-500 focus:outline-none ${
										field.state.meta.errors.length > 0 || validationErrors.email
											? "focus:border-red-400 focus:ring-1 focus:ring-red-400/40"
											: "focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
									} transition-colors`}
									aria-invalid={
										field.state.meta.errors.length > 0 ||
										!!validationErrors.email
									}
									aria-describedby={
										field.state.meta.errors.length > 0 || validationErrors.email
											? `${idPrefix}-email-error`
											: undefined
									}
									required
								/>
								{(field.state.meta.errors.length > 0 ||
									validationErrors.email) && (
									<p
										id={`${idPrefix}-email-error`}
										className="text-red-400 text-sm mt-2"
									>
										{field.state.meta.errors[0]?.toString() ||
											validationErrors.email}
									</p>
								)}
							</div>
						)}
					</form.Field>

					{/* Password */}
					<form.Field
						name="password"
						validators={{
							onChange: ({ value }) => {
								const result =
									registerBaseSchema.shape.password.safeParse(value);
								return result.success
									? undefined
									: result.error.issues[0].message;
							},
						}}
					>
						{(field) => (
							<div>
								<label
									htmlFor={field.name}
									className="block text-sm font-medium text-neutral-300 mb-2"
								>
									Password
								</label>
								<input
									type="password"
									id={field.name}
									name={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder="Secret password"
									className={`w-full px-4 py-2 bg-neutral-900 border ${
										field.state.meta.errors.length > 0 ||
										validationErrors.password
											? "border-red-400"
											: "border-neutral-800"
									} rounded-xl text-white placeholder-neutral-500 focus:outline-none ${
										field.state.meta.errors.length > 0 ||
										validationErrors.password
											? "focus:border-red-400 focus:ring-1 focus:ring-red-400/40"
											: "focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
									} transition-colors`}
									aria-invalid={
										field.state.meta.errors.length > 0 ||
										!!validationErrors.password
									}
									aria-describedby={
										field.state.meta.errors.length > 0 ||
										validationErrors.password
											? `${idPrefix}-password-error`
											: undefined
									}
									required
								/>
								{(field.state.meta.errors.length > 0 ||
									validationErrors.password) && (
									<p
										id={`${idPrefix}-password-error`}
										className="text-red-400 text-sm mt-2"
									>
										{field.state.meta.errors[0]?.toString() ||
											validationErrors.password}
									</p>
								)}
							</div>
						)}
					</form.Field>

					{/* Confirm Password */}
					<form.Field
						name="confirmPassword"
						validators={{
							onChange: ({ value, fieldApi }) => {
								if (value !== fieldApi.form.getFieldValue("password")) {
									return "Passwords do not match";
								}
								return undefined;
							},
						}}
					>
						{(field) => (
							<div>
								<label
									htmlFor={field.name}
									className="block text-sm font-medium text-neutral-300 mb-2"
								>
									Confirm Password
								</label>
								<input
									type="password"
									id={field.name}
									name={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder="Confirm password"
									className={`w-full px-4 py-2 bg-neutral-900 border ${
										field.state.meta.errors.length > 0 ||
										validationErrors.confirmPassword
											? "border-red-400"
											: "border-neutral-800"
									} rounded-xl text-white placeholder-neutral-500 focus:outline-none ${
										field.state.meta.errors.length > 0 ||
										validationErrors.confirmPassword
											? "focus:border-red-400 focus:ring-1 focus:ring-red-400/40"
											: "focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
									} transition-colors`}
									aria-invalid={
										field.state.meta.errors.length > 0 ||
										!!validationErrors.confirmPassword
									}
									aria-describedby={
										field.state.meta.errors.length > 0 ||
										validationErrors.confirmPassword
											? `${idPrefix}-confirmPassword-error`
											: undefined
									}
									required
								/>
								{(field.state.meta.errors.length > 0 ||
									validationErrors.confirmPassword) && (
									<p
										id={`${idPrefix}-confirmPassword-error`}
										className="text-red-400 text-sm mt-2"
									>
										{field.state.meta.errors[0]?.toString() ||
											validationErrors.confirmPassword}
									</p>
								)}
							</div>
						)}
					</form.Field>

					{/* Submit Button */}
					<form.Subscribe
						selector={(state) => [state.canSubmit, state.isSubmitting]}
					>
						{([canSubmit, isSubmitting]) => (
							<button
								type="submit"
								disabled={!canSubmit || isPending || isSubmitting}
								className="w-full mt-6 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-neutral-950 cursor-pointer"
							>
								{isPending || isSubmitting
									? "Creating Account..."
									: "Create Account"}
							</button>
						)}
					</form.Subscribe>
				</form>

				{/* Footer */}
				<div className="mt-6 mb-8 md:mb-4 text-left">
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
