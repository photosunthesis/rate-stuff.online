interface FormErrorProps {
	message: string;
}

export function FormError({ message }: FormErrorProps) {
	return (
		<div className="mb-4 p-3 bg-red-950 border border-red-900 rounded-xl text-red-200 text-sm">
			{message}
		</div>
	);
}
