import {
	ErrorComponent,
	type ErrorComponentProps,
} from "@tanstack/react-router";
import { AlertCircle } from "lucide-react";

export function RouteError({ error, reset }: ErrorComponentProps) {
	return (
		<div className="flex flex-col items-center justify-center p-8 text-center text-neutral-400">
			<AlertCircle className="w-12 h-12 mb-4 text-red-500" />
			<h2 className="text-xl font-semibold mb-2 text-white">
				Something went wrong!
			</h2>
			<p className="mb-4 text-base max-w-md">
				{error.message ||
					"An unexpected error occurred while loading this content."}
			</p>
			<button
				type="button"
				onClick={reset}
				className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-md transition-colors text-base font-medium"
			>
				Try again
			</button>
			{process.env.NODE_ENV === "development" && (
				<div className="mt-8 w-full max-w-2xl text-left">
					<ErrorComponent error={error} />
				</div>
			)}
		</div>
	);
}
