import { useState, useRef, useEffect, useId } from "react";
import { Search, Plus } from "lucide-react";
import { useDebounce } from "~/hooks/use-debounce";
import { useUmami } from "@danielgtmn/umami-react";
import { useStuffSearchQuery } from "~/domains/ratings/queries/create";

const useStuffSearch = (query: string) => {
	const debouncedQuery = useDebounce(query, 300);
	return { ...useStuffSearchQuery(debouncedQuery), debouncedQuery };
};

interface StuffSelectorProps {
	value?: { id?: string; name: string };
	onChange: (value: { id?: string; name: string } | null) => void;
	error?: string;
}

export function StuffSelector({ value, onChange, error }: StuffSelectorProps) {
	const inputId = useId();
	const [searchInput, setSearchInput] = useState("");
	const [isOpen, setIsOpen] = useState(false);
	const {
		data: searchResults,
		isLoading,
		debouncedQuery,
	} = useStuffSearch(searchInput);
	const containerRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	// Prevent immediate re-opening after programmatic close (reduces flicker)
	const suppressOpenRef = useRef(false);
	const suppressionTimeoutRef = useRef<number | null>(null);
	const umami = useUmami();

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
				// briefly suppress re-opening to avoid flicker if input regains focus
				suppressOpenRef.current = true;
				if (suppressionTimeoutRef.current) {
					window.clearTimeout(suppressionTimeoutRef.current);
				}
				suppressionTimeoutRef.current = window.setTimeout(() => {
					suppressOpenRef.current = false;
					suppressionTimeoutRef.current = null;
				}, 150);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
			if (suppressionTimeoutRef.current) {
				window.clearTimeout(suppressionTimeoutRef.current);
			}
		};
	}, []);

	// Track search queries (debounced)
	useEffect(() => {
		if (debouncedQuery && umami) {
			umami.track("search_stuff", { query: debouncedQuery });
		}
	}, [debouncedQuery, umami]);

	const handleSelect = (stuff: { id?: string; name: string }) => {
		onChange(stuff);
		setSearchInput("");
		setIsOpen(false);
		if (umami) umami.track("select_stuff", { name: stuff.name, id: stuff.id });

		// suppress immediate re-open from programmatic UI change
		suppressOpenRef.current = true;
		if (suppressionTimeoutRef.current) {
			window.clearTimeout(suppressionTimeoutRef.current);
		}
		suppressionTimeoutRef.current = window.setTimeout(() => {
			suppressOpenRef.current = false;
			suppressionTimeoutRef.current = null;
		}, 150);
	};

	const handleCreateNew = () => {
		if (searchInput.trim()) {
			onChange({ name: searchInput.trim() });
			setSearchInput("");
			setIsOpen(false);
			if (umami)
				umami.track("create_stuff_intent", { name: searchInput.trim() });

			// suppress immediate re-open from programmatic UI change
			suppressOpenRef.current = true;
			if (suppressionTimeoutRef.current) {
				window.clearTimeout(suppressionTimeoutRef.current);
			}
			suppressionTimeoutRef.current = window.setTimeout(() => {
				suppressOpenRef.current = false;
				suppressionTimeoutRef.current = null;
			}, 150);
		}
	};

	const handleClear = () => {
		onChange(null);
		setSearchInput("");
		// suppress immediate re-open when focusing input
		suppressOpenRef.current = true;
		if (suppressionTimeoutRef.current) {
			window.clearTimeout(suppressionTimeoutRef.current);
		}
		suppressionTimeoutRef.current = window.setTimeout(() => {
			suppressOpenRef.current = false;
			suppressionTimeoutRef.current = null;
		}, 150);

		setTimeout(() => inputRef.current?.focus(), 0);
	};

	const results = searchResults?.success ? searchResults.data : [];
	const hasExactMatch = results.some(
		(item: { id: string; name: string }) =>
			item.name.toLowerCase() === searchInput.toLowerCase(),
	);

	if (value?.name) {
		return (
			<div className="relative">
				<label
					htmlFor={inputId}
					className="block text-base font-medium text-neutral-300 mb-2"
				>
					Stuff to Rate
				</label>
				<div
					className={`p-4 bg-emerald-500/10 border ${error ? "border-red-400" : "border-emerald-500/50"} rounded-xl flex items-center justify-between`}
				>
					<div>
						<div className="font-medium text-emerald-600">{value.name}</div>
						<div className="text-xs text-emerald-500/70">
							{value.id ? "Existing Item" : "New Item"}
						</div>
					</div>
					<button
						type="button"
						onClick={handleClear}
						className="px-3 py-1.5 text-base font-medium text-emerald-600 hover:bg-emerald-600/10 rounded-lg transition-colors"
					>
						Change
					</button>
				</div>
				{error && <div className="mt-1 text-xs text-red-400">{error}</div>}
			</div>
		);
	}

	return (
		<div ref={containerRef} className="relative">
			<label
				htmlFor={inputId}
				className="block text-base font-medium text-neutral-300 mb-2"
			>
				Stuff to Rate
			</label>

			<div
				className={`relative px-4 py-3 bg-neutral-950 border ${
					error ? "border-red-400" : "border-neutral-800"
				} rounded-xl focus-within:border-emerald-600 focus-within:ring-1 focus-within:ring-emerald-600 transition-colors`}
			>
				<div className="flex items-center gap-2">
					<input
						id={inputId}
						ref={inputRef}
						type="text"
						value={searchInput}
						onChange={(e) => {
							setSearchInput(e.target.value);
							if (!suppressOpenRef.current) setIsOpen(true);
						}}
						onFocus={() => {
							if (!suppressOpenRef.current) setIsOpen(true);
						}}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								e.preventDefault();
								if (results.length > 0) {
									handleSelect(results[0]);
								} else if (searchInput.trim()) {
									handleCreateNew();
								}
							}
						}}
						placeholder="Type something to rate..."
						className="flex-1 bg-transparent text-white placeholder-neutral-500 focus:outline-none"
						autoComplete="off"
					/>
					<Search size={18} className="text-neutral-500" />
				</div>
			</div>
			{error && <div className="mt-1 text-xs text-red-400">{error}</div>}

			{isOpen && searchInput.trim().length > 0 && (
				<div className="absolute z-50 left-0 right-0 mt-2 bg-neutral-950 border border-neutral-800 rounded-xl shadow-xl overflow-hidden max-h-60">
					<div className="overflow-y-auto max-h-52">
						{results.length > 0 &&
							results.map((stuff: { id: string; name: string }) => (
								<button
									key={stuff.id}
									type="button"
									onClick={() => handleSelect(stuff)}
									className="w-full text-left px-4 py-3 hover:bg-neutral-800 transition-colors flex items-center justify-between group"
								>
									<span className="text-white group-hover:text-emerald-600 transition-colors">
										{stuff.name}
									</span>
									<span className="text-xs text-neutral-500">Select</span>
								</button>
							))}
					</div>

					{!hasExactMatch && !isLoading && (
						<button
							type="button"
							onClick={handleCreateNew}
							className="w-full text-left px-4 py-3 hover:bg-neutral-800 transition-colors flex items-center gap-2 text-emerald-600 border-t border-neutral-800"
						>
							<Plus size={16} />
							<span>Create "{searchInput}"</span>
						</button>
					)}

					{isLoading && (
						<div className="p-3 text-center text-neutral-500 text-base border-t border-neutral-800">
							Searching...
						</div>
					)}
				</div>
			)}
		</div>
	);
}
