ALTER TABLE `invite_codes` ADD `usedAt` integer;--> statement-breakpoint
ALTER TABLE `invite_codes` ADD `createdAt` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `invite_codes` DROP COLUMN `used_at`;--> statement-breakpoint
ALTER TABLE `invite_codes` DROP COLUMN `created_at`;--> statement-breakpoint
ALTER TABLE `password_reset_tokens` ADD `expiresAt` integer;--> statement-breakpoint
ALTER TABLE `password_reset_tokens` ADD `createdAt` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `password_reset_tokens` DROP COLUMN `expires_at`;--> statement-breakpoint
ALTER TABLE `password_reset_tokens` DROP COLUMN `created_at`;--> statement-breakpoint
ALTER TABLE `ratings` ADD `createdAt` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `ratings` ADD `updatedAt` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `ratings` ADD `deletedAt` integer;--> statement-breakpoint
ALTER TABLE `ratings` DROP COLUMN `created_at`;--> statement-breakpoint
ALTER TABLE `ratings` DROP COLUMN `updated_at`;--> statement-breakpoint
ALTER TABLE `ratings` DROP COLUMN `deleted_at`;--> statement-breakpoint
ALTER TABLE `sessions` ADD `expiresAt` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `sessions` ADD `createdAt` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `sessions` DROP COLUMN `expires_at`;--> statement-breakpoint
ALTER TABLE `sessions` DROP COLUMN `created_at`;--> statement-breakpoint
ALTER TABLE `stuff` ADD `createdAt` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `stuff` ADD `updatedAt` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `stuff` ADD `deletedAt` integer;--> statement-breakpoint
ALTER TABLE `stuff` DROP COLUMN `created_at`;--> statement-breakpoint
ALTER TABLE `stuff` DROP COLUMN `updated_at`;--> statement-breakpoint
ALTER TABLE `stuff` DROP COLUMN `deleted_at`;--> statement-breakpoint
ALTER TABLE `tags` ADD `createdAt` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `tags` ADD `deletedAt` integer;--> statement-breakpoint
ALTER TABLE `tags` DROP COLUMN `created_at`;--> statement-breakpoint
ALTER TABLE `users` ADD `createdAt` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `updatedAt` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `created_at`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `updated_at`;