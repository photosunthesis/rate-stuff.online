import { useState, useEffect, useCallback } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
	const [storedValue, setStoredValue] = useState<T>(() => {
		if (typeof window === "undefined") {
			return initialValue;
		}
		try {
			const item = window.localStorage.getItem(key);
			return item ? JSON.parse(item) : initialValue;
		} catch (error) {
			console.error(error);
			return initialValue;
		}
	});

	const setValue = useCallback(
		(value: T | ((val: T) => T)) => {
			try {
				setStoredValue((oldValue) => {
					const newValue = value instanceof Function ? value(oldValue) : value;
					if (typeof window !== "undefined") {
						window.localStorage.setItem(key, JSON.stringify(newValue));
					}
					return newValue;
				});
			} catch (error) {
				console.error(error);
			}
		},
		[key],
	);

	useEffect(() => {
		const handleStorageChange = (event: StorageEvent) => {
			if (event.key === key && event.newValue) {
				try {
					setStoredValue(JSON.parse(event.newValue));
				} catch (error) {
					console.error(error);
				}
			}
		};

		if (typeof window !== "undefined") {
			window.addEventListener("storage", handleStorageChange);
			return () => window.removeEventListener("storage", handleStorageChange);
		}
	}, [key]);

	return [storedValue, setValue] as const;
}
