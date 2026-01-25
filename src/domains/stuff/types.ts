import type { ratings, stuff } from "~/db/schema";

export type Stuff = typeof stuff.$inferSelect;

export type StuffWithAggregates = Stuff & {
	averageRating: number;
	ratingCount: number;
	images: string[];
};

export type StuffRating = typeof ratings.$inferSelect & {
	stuff: typeof stuff.$inferSelect | null;
	user: {
		id: string;
		name: string | null;
		username: string | null;
		image: string | null;
	} | null;
	tags: string[];
	userVote: "up" | "down" | null;
};

export type StuffRatingsPage = {
	ratings: StuffRating[];
	nextCursor?: string;
};
