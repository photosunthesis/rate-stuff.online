ALTER TABLE `invite_codes` RENAME COLUMN "usedAt" TO "used_at";--> statement-breakpoint
ALTER TABLE `invite_codes` RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE `password_reset_tokens` RENAME COLUMN "expiresAt" TO "expires_at";--> statement-breakpoint
ALTER TABLE `password_reset_tokens` RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE `ratings` RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE `ratings` RENAME COLUMN "updatedAt" TO "updated_at";--> statement-breakpoint
ALTER TABLE `ratings` RENAME COLUMN "deletedAt" TO "deleted_at";--> statement-breakpoint
ALTER TABLE `sessions` RENAME COLUMN "expiresAt" TO "expires_at";--> statement-breakpoint
ALTER TABLE `sessions` RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE `stuff` RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE `stuff` RENAME COLUMN "updatedAt" TO "updated_at";--> statement-breakpoint
ALTER TABLE `stuff` RENAME COLUMN "deletedAt" TO "deleted_at";--> statement-breakpoint
ALTER TABLE `tags` RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE `tags` RENAME COLUMN "deletedAt" TO "deleted_at";--> statement-breakpoint
ALTER TABLE `users` RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE `users` RENAME COLUMN "updatedAt" TO "updated_at";--> statement-breakpoint
DROP INDEX `ratings_created_at_idx`;--> statement-breakpoint
DROP INDEX `ratings_user_created_idx`;--> statement-breakpoint
DROP INDEX `ratings_deleted_at_idx`;--> statement-breakpoint
CREATE INDEX `ratings_created_at_idx` ON `ratings` (`created_at`);--> statement-breakpoint
CREATE INDEX `ratings_user_created_idx` ON `ratings` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `ratings_deleted_at_idx` ON `ratings` (`deleted_at`);