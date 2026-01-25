export type UserInput = {
	id?: string;
	username?: string | null;
	name?: string | null;
	image?: string | null;
} | null;

export const mapToCurrentUser = (user: UserInput) => {
	if (!user) return undefined;

	return {
		id: user.id ?? "",
		username: user.username ?? "",
		name: user.name === user.username ? null : (user.name ?? null),
		image: user.image ?? "",
	};
};
