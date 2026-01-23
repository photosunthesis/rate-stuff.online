import { useId, type InputHTMLAttributes } from "react";
import { Check } from "lucide-react";

interface CheckboxProps
	extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
	label?: React.ReactNode;
	error?: string;
}

export function Checkbox({
	label,
	error,
	id,
	className = "",
	...props
}: CheckboxProps) {
	const generatedId = useId();
	const inputId = id || generatedId;
	const errorId = `${inputId}-error`;

	return (
		<div className="flex flex-col gap-1.5">
			<div className="flex items-center gap-3">
				<div className="relative flex items-center">
					<input
						type="checkbox"
						id={inputId}
						className={`
                            peer h-5 w-5 appearance-none rounded-md border 
                            bg-neutral-900 transition-all cursor-pointer
                            ${
															error
																? "border-red-400 focus:ring-red-400/40"
																: "border-neutral-800 checked:border-emerald-600 checked:bg-emerald-600 focus:ring-emerald-600/40"
														}
                            hover:border-neutral-700
                            focus:outline-none focus:ring-2
                            disabled:cursor-not-allowed disabled:opacity-50
                            ${className}
                        `}
						aria-invalid={!!error}
						aria-describedby={error ? errorId : undefined}
						{...props}
					/>
					<Check
						className="pointer-events-none absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition-opacity peer-checked:opacity-100"
						strokeWidth={3}
					/>
				</div>
				{label && (
					<label
						htmlFor={inputId}
						className="text-base font-medium text-neutral-300 cursor-pointer select-none"
					>
						{label}
					</label>
				)}
			</div>
			{error && (
				<p id={errorId} className="text-red-400 text-base">
					{error}
				</p>
			)}
		</div>
	);
}
