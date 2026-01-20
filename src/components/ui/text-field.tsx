import { useId, type InputHTMLAttributes } from "react";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
	label: string;
	error?: string;
}

export function TextField({ label, error, id, ...props }: TextFieldProps) {
	const generatedId = useId();
	const inputId = id || generatedId;
	const errorId = `${inputId}-error`;

	return (
		<div>
			<label
				htmlFor={inputId}
				className="block text-sm font-medium text-neutral-300 mb-2"
			>
				{label}
			</label>
			<input
				id={inputId}
				className={`w-full px-4 py-2 bg-neutral-950 border ${
					error ? "border-red-400" : "border-neutral-800"
				} rounded-xl text-white placeholder-neutral-500 focus:outline-none ${
					error
						? "focus:border-red-400 focus:ring-1 focus:ring-red-400/40"
						: "focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
				} transition-colors`}
				aria-invalid={!!error}
				aria-describedby={error ? errorId : undefined}
				{...props}
			/>
			{error && (
				<p id={errorId} className="text-red-400 text-sm mt-2">
					{error}
				</p>
			)}
		</div>
	);
}
