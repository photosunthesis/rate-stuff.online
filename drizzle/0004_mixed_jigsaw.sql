CREATE TABLE "rating_votes" (
	"rating_id" text NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ratings" ADD COLUMN "upvotes_count" real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "ratings" ADD COLUMN "downvotes_count" real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "rating_votes" ADD CONSTRAINT "rating_votes_rating_id_ratings_id_fk" FOREIGN KEY ("rating_id") REFERENCES "public"."ratings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rating_votes" ADD CONSTRAINT "rating_votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "rating_votes_rating_id_idx" ON "rating_votes" USING btree ("rating_id");--> statement-breakpoint
CREATE INDEX "rating_votes_user_id_idx" ON "rating_votes" USING btree ("user_id");