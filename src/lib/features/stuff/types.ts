import type { RatingWithRelations } from "~/lib/features/display-ratings/types";

export type Stuff = {
	id: string;
	name: string;
	slug: string;
	createdAt: Date;
	updatedAt: Date;
};

export type StuffWithAggregates = Stuff & {
	averageRating: number;
	ratingCount: number;
	images: string[];
};

export type StuffRatingsPage = {
	ratings: RatingWithRelations[];
	nextCursor?: string;
};
