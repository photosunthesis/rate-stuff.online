CREATE INDEX `ratings_created_at_idx` ON `ratings` (`createdAt`);--> statement-breakpoint
CREATE INDEX `ratings_user_created_idx` ON `ratings` (`user_id`,`createdAt`);--> statement-breakpoint
CREATE INDEX `ratings_deleted_at_idx` ON `ratings` (`deletedAt`);--> statement-breakpoint
CREATE INDEX `ratings_to_tags_tag_idx` ON `ratings_to_tags` (`tag_id`);