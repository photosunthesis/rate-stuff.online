import type { ErrorComponentProps } from "@tanstack/react-router";
import { ErrorOccurred } from "./error-occured";

export function RouteError({ error, reset }: ErrorComponentProps) {
	return <ErrorOccurred error={error} reset={reset} />;
}
