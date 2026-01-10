ALTER TABLE `ratings` ADD `slug` text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `ratings_slug_unique` ON `ratings` (`slug`);