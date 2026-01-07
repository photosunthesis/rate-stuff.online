PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_ratings` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`stuff_id` text NOT NULL,
	`title` text NOT NULL,
	`score` real NOT NULL,
	`content` text NOT NULL,
	`images` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`stuff_id`) REFERENCES `stuff`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_ratings`("id", "user_id", "stuff_id", "title", "score", "content", "images", "created_at", "updated_at", "deleted_at") SELECT "id", "user_id", "stuff_id", "title", "score", "content", "images", "created_at", "updated_at", "deleted_at" FROM `ratings`;--> statement-breakpoint
DROP TABLE `ratings`;--> statement-breakpoint
ALTER TABLE `__new_ratings` RENAME TO `ratings`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_stuff` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
INSERT INTO `__new_stuff`("id", "name", "created_at", "updated_at", "deleted_at") SELECT "id", "name", "created_at", "updated_at", "deleted_at" FROM `stuff`;--> statement-breakpoint
DROP TABLE `stuff`;--> statement-breakpoint
ALTER TABLE `__new_stuff` RENAME TO `stuff`;--> statement-breakpoint
CREATE UNIQUE INDEX `stuff_name_unique` ON `stuff` (`name`);--> statement-breakpoint
CREATE TABLE `__new_users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password` text NOT NULL,
	`name` text,
	`role` text DEFAULT 'user' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_users`("id", "email", "password", "name", "role", "created_at", "updated_at") SELECT "id", "email", "password", "name", "role", "created_at", "updated_at" FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `email_idx` ON `users` (`email`);