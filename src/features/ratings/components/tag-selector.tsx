import { useState, useRef, useEffect, useId } from "react";
import { Search, Plus, X } from "lucide-react";
import { useTagSearch } from "../hooks";

interface TagSelectorProps {
	selectedTags: string[];
	onChange: (tags: string[]) => void;
	error?: string;
	maxTags?: number;
}

export function TagSelector({
	selectedTags,
	onChange,
	error,
	maxTags = 10,
}: TagSelectorProps) {
	const inputId = useId();
	const [searchInput, setSearchInput] = useState("");
	const [isOpen, setIsOpen] = useState(false);
	const { data: searchResults, isLoading } = useTagSearch(searchInput);
	const containerRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const results = searchResults?.success ? searchResults.data : [];
	const filteredResults = results.filter(
		(tag) => !selectedTags.includes(tag.name),
	);
	const hasExactMatch = results.some(
		(item) => item.name.toLowerCase() === searchInput.toLowerCase(),
	);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const handleAddTag = (tagName: string) => {
		const normalizedTag = tagName.toLowerCase().trim();
		if (
			normalizedTag &&
			!selectedTags.includes(normalizedTag) &&
			selectedTags.length < maxTags
		) {
			onChange([...selectedTags, normalizedTag]);
		}
		setSearchInput("");
		setIsOpen(false);
		inputRef.current?.focus();
	};

	const handleRemoveTag = (tagToRemove: string) => {
		onChange(selectedTags.filter((tag) => tag !== tagToRemove));
	};

	return (
		<div ref={containerRef} className="space-y-3">
			<div className="flex justify-between items-center">
				<label
					htmlFor={inputId}
					className="block text-sm font-medium text-neutral-300"
				>
					Tags
				</label>
				<span className="text-xs text-neutral-500">
					{selectedTags.length}/{maxTags} tags
				</span>
			</div>

			<div className="flex flex-wrap gap-2 mb-2">
				{selectedTags.map((tag) => (
					<span
						key={tag}
						className="inline-flex items-center px-1.5 py-0.5 bg-neutral-800/50 text-neutral-500 hover:text-neutral-400 text-sm font-medium transition-colors rounded-md"
					>
						#{tag}
						<button
							type="button"
							onClick={() => handleRemoveTag(tag)}
							className="ml-1 p-0.5 hover:bg-neutral-700/50 rounded-full transition-colors"
						>
							<X size={12} />
							<span className="sr-only">Remove {tag}</span>
						</button>
					</span>
				))}
			</div>

			<div className="relative">
				<div
					className={`flex items-center gap-2 px-3 py-2 bg-neutral-900 border ${
						error ? "border-red-400" : "border-neutral-800"
					} rounded-xl focus-within:border-emerald-600 focus-within:ring-1 focus-within:ring-emerald-600 transition-colors`}
				>
					<Search size={16} className="text-neutral-500" />
					<input
						id={inputId}
						ref={inputRef}
						type="text"
						value={searchInput}
						onChange={(e) => {
							setSearchInput(e.target.value);
							setIsOpen(true);
						}}
						onFocus={() => setIsOpen(true)}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								e.preventDefault();

								if (searchInput.trim()) {
									handleAddTag(searchInput.trim());
								}
							} else if (
								e.key === "Backspace" &&
								!searchInput &&
								selectedTags.length > 0
							) {
								handleRemoveTag(selectedTags[selectedTags.length - 1]);
							}
						}}
						placeholder={
							selectedTags.length >= maxTags
								? "Max tags reached"
								: "Add a tag..."
						}
						disabled={selectedTags.length >= maxTags}
						className="flex-1 bg-transparent text-white placeholder-neutral-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
						autoComplete="off"
					/>
				</div>
				{error && <div className="mt-1 text-xs text-red-400">{error}</div>}

				{isOpen && searchInput && selectedTags.length < maxTags && (
					<div className="absolute z-50 left-0 right-0 mt-2 bg-neutral-900 border border-neutral-800 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto">
						{isLoading ? (
							<div className="p-4 text-center text-neutral-500 text-sm">
								Searching...
							</div>
						) : (
							<>
								{filteredResults.map((tag) => (
									<button
										key={tag.id}
										type="button"
										onClick={() => handleAddTag(tag.name)}
										className="w-full text-left px-4 py-2 hover:bg-neutral-800 transition-colors flex items-center justify-between"
									>
										<span className="text-white">#{tag.name}</span>
										<span className="text-xs text-neutral-500">Add</span>
									</button>
								))}

								{/* Always show option to create proper tag from input if it doesn't strictly exist or even if it does (for quick selection) */}
								{!hasExactMatch && (
									<button
										type="button"
										onClick={() => handleAddTag(searchInput)}
										className="w-full text-left px-4 py-2 hover:bg-neutral-800 transition-colors flex items-center gap-2 text-emerald-400 border-t border-neutral-800"
									>
										<Plus size={14} />
										<span>Create tag "#{searchInput}"</span>
									</button>
								)}
							</>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
