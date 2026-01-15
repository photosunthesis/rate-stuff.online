DROP INDEX IF EXISTS "ratings_slug_unique" CASCADE;--> statement-breakpoint
ALTER TABLE "ratings" DROP COLUMN "slug";