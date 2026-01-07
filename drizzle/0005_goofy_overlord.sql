CREATE TABLE `ratings_to_tags` (
	`rating_id` text NOT NULL,
	`tag_id` text NOT NULL,
	PRIMARY KEY(`rating_id`, `tag_id`),
	FOREIGN KEY (`rating_id`) REFERENCES `ratings`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tags_name_unique` ON `tags` (`name`);