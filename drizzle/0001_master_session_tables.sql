CREATE TABLE IF NOT EXISTS `master_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`local_date` text NOT NULL,
	`status` text NOT NULL,
	`created_at` integer NOT NULL,
	`closed_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `master_sessions_single_open_idx` ON `master_sessions` (`status`) WHERE `master_sessions`.`status` = 'aperta';
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `master_sessions_status_created_idx` ON `master_sessions` (`status`,`created_at`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `master_session_participants` (
	`session_id` text NOT NULL,
	`character_id` text NOT NULL,
	PRIMARY KEY(`session_id`, `character_id`),
	FOREIGN KEY (`session_id`) REFERENCES `master_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`character_id`) REFERENCES `characters`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `master_session_creatures` (
	`session_id` text NOT NULL,
	`creature_id` text NOT NULL,
	PRIMARY KEY(`session_id`, `creature_id`),
	FOREIGN KEY (`session_id`) REFERENCES `master_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`creature_id`) REFERENCES `creatures`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `master_session_events` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`character_id` text,
	`creature_id` text,
	`type` text NOT NULL,
	`occurred_at` integer NOT NULL,
	`payload` text NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `master_sessions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`character_id`) REFERENCES `characters`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`creature_id`) REFERENCES `creatures`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `master_session_events_session_time_idx` ON `master_session_events` (`session_id`,`occurred_at`);
