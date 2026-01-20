DROP INDEX "ratings_created_at_idx";--> statement-breakpoint
DROP INDEX "ratings_user_created_idx";--> statement-breakpoint
DROP INDEX "comments_rating_created_idx";--> statement-breakpoint
DROP INDEX "comments_user_created_idx";--> statement-breakpoint
CREATE INDEX "ratings_created_at_idx" ON "ratings" USING btree ("created_at","id");--> statement-breakpoint
CREATE INDEX "ratings_user_created_idx" ON "ratings" USING btree ("user_id","created_at","id");--> statement-breakpoint
CREATE INDEX "comments_rating_created_idx" ON "comments" USING btree ("rating_id","created_at","id");--> statement-breakpoint
CREATE INDEX "comments_user_created_idx" ON "comments" USING btree ("user_id","created_at","id");