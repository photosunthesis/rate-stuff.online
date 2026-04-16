export const maskEmail = (email: string): string => {
	const [local, domain] = email.split("@");
	if (!local || !domain) return email;

	const maskedLocal =
		local.length > 2
			? `${local.slice(0, 2)}***${local.slice(-1)}`
			: `${local}***`;

	const [domainName, ...domainRest] = domain.split(".");
	const maskedDomainName =
		domainName.length > 2
			? `${domainName.slice(0, 1)}***${domainName.slice(-1)}`
			: `${domainName}***`;

	return `${maskedLocal}@${[maskedDomainName, ...domainRest].join(".")}`;
};
