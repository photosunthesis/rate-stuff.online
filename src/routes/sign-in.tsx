import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import AppLogo from "~/components/ui/app-logo";
import { useState, useId, useEffect } from "react";
import { useLogin } from "~/features/auth/hooks";
import type { LoginInput } from "~/features/auth/types";

export const Route = createFileRoute("/sign-in")({
	component: RouteComponent,
	head: () => ({
		meta: [
			{
				title: "Sign In - Rate Stuff Online",
			},
			{
				name: "description",
				content: "Sign in to your Rate Stuff Online account.",
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
	const { login, isPending, isError, errorMessage, validationErrors } =
		useLogin();
	const idPrefix = useId();

	const [formData, setFormData] = useState<LoginInput>({
		identifier: "",
		password: "",
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
			await login(formData);
		} catch {
			// ignore
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
				<div className="text-left mb-8 mt-8 md:mt-0">
					<div className="flex justify-start mb-2">
						<AppLogo size={40} />
					</div>
					<h1 className="text-2xl font-semibold text-white mb-2">
						Welcome back
					</h1>
					<p className="text-neutral-400">
						The universe is peer-reviewed. Jump back in.
					</p>
				</div>

				{isError &&
					errorMessage &&
					Object.keys(validationErrors).length === 0 && (
						<div className="mb-4 p-3 bg-red-950 border border-red-900 rounded-xl text-red-200 text-sm">
							{errorMessage}
						</div>
					)}

				<form onSubmit={handleSubmit} className="space-y-4" noValidate>
					<div>
						<label
							htmlFor={`${idPrefix}-identifier`}
							className="block text-sm font-medium text-neutral-300 mb-2"
						>
							Email or Username
						</label>
						<input
							type="text"
							id={`${idPrefix}-identifier`}
							name="identifier"
							value={formData.identifier}
							onChange={handleChange}
							placeholder="you@example.com or your-username"
							className={`w-full px-4 py-2 bg-neutral-900 border ${
								validationErrors.identifier
									? "border-red-400"
									: "border-neutral-800"
							} rounded-xl text-white placeholder-neutral-500 focus:outline-none ${
								validationErrors.identifier
									? "focus:border-red-400 focus:ring-1 focus:ring-red-400/40"
									: "focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
							} transition-colors`}
							aria-invalid={!!validationErrors.identifier}
							aria-describedby={
								validationErrors.identifier
									? `${idPrefix}-identifier-error`
									: undefined
							}
							required
						/>
						{validationErrors.identifier && (
							<p
								id={`${idPrefix}-identifier-error`}
								className="text-red-400 text-sm mt-2"
							>
								{validationErrors.identifier}
							</p>
						)}
					</div>

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
							placeholder="Your password"
							className={`w-full px-4 py-2 bg-neutral-900 border ${
								validationErrors.password
									? "border-red-400"
									: "border-neutral-800"
							} rounded-xl text-white placeholder-neutral-500 focus:outline-none ${
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

					<button
						type="submit"
						disabled={isPending}
						className="w-full mt-6 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-neutral-950 cursor-pointer"
					>
						{isPending ? "Signing In..." : "Sign In"}
					</button>
				</form>

				<div className="mt-6 mb-8 md:mb-4 text-left">
					<p className="text-neutral-400 text-sm">
						New here?{" "}
						<Link
							to="/create-account"
							className="text-emerald-600 hover:text-emerald-500 font-semibold transition-colors"
						>
							Create an account
						</Link>
					</p>
				</div>
			</div>
		</div>
	);
}
