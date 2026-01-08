ALTER TABLE `users` ADD `username` text;--> statement-breakpoint
ALTER TABLE `users` ADD `avatar_url` text;--> statement-breakpoint
CREATE UNIQUE INDEX `username_idx` ON `users` (`username`);