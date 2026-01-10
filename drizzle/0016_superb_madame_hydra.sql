ALTER TABLE `stuff` ADD `slug` text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `stuff_slug_unique` ON `stuff` (`slug`);