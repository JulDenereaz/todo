CREATE TABLE `activity` (
	`id` text PRIMARY KEY NOT NULL,
	`list_id` text NOT NULL,
	`task_id` text,
	`actor_id` text,
	`type` text NOT NULL,
	`summary` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`list_id`) REFERENCES `lists`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `activity_list_created_idx` ON `activity` (`list_id`,`created_at`);