export const numberWithCommas = (x: number): string => {
	return x.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");
};

export const formatCompactNumber = (num: number): string => {
	return Intl.NumberFormat("en-US", {
		notation: "compact",
		maximumFractionDigits: 1,
	}).format(num);
};
