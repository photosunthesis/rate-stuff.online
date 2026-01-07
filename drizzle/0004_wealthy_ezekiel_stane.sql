ALTER TABLE `reviews` RENAME TO `ratings`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_ratings` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`stuff_id` text NOT NULL,
	`title` text NOT NULL,
	`score` real NOT NULL,
	`content` text NOT NULL,
	`images` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`stuff_id`) REFERENCES `stuff`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_ratings`("id", "user_id", "stuff_id", "title", "score", "content", "images", "created_at", "updated_at", "deleted_at") SELECT "id", "user_id", "stuff_id", "title", "score", "content", "images", "created_at", "updated_at", "deleted_at" FROM `ratings`;--> statement-breakpoint
DROP TABLE `ratings`;--> statement-breakpoint
ALTER TABLE `__new_ratings` RENAME TO `ratings`;--> statement-breakpoint
PRAGMA foreign_keys=ON;