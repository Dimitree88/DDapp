CREATE TABLE `character_history` (
	`id` text PRIMARY KEY NOT NULL,
	`character_id` text NOT NULL,
	`occurred_at` integer NOT NULL,
	`changes` text NOT NULL,
	FOREIGN KEY (`character_id`) REFERENCES `characters`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `character_history_character_time_idx` ON `character_history` (`character_id`,`occurred_at`);--> statement-breakpoint
CREATE TABLE `characters` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`pin_hash` text NOT NULL,
	`data` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `creatures` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`data` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `master_session_creatures` (
	`session_id` text NOT NULL,
	`creature_id` text NOT NULL,
	PRIMARY KEY(`session_id`, `creature_id`),
	FOREIGN KEY (`session_id`) REFERENCES `master_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`creature_id`) REFERENCES `creatures`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `master_session_events` (
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
CREATE INDEX `master_session_events_session_time_idx` ON `master_session_events` (`session_id`,`occurred_at`);--> statement-breakpoint
CREATE TABLE `master_session_participants` (
	`session_id` text NOT NULL,
	`character_id` text NOT NULL,
	PRIMARY KEY(`session_id`, `character_id`),
	FOREIGN KEY (`session_id`) REFERENCES `master_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`character_id`) REFERENCES `characters`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `master_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`local_date` text NOT NULL,
	`status` text NOT NULL,
	`created_at` integer NOT NULL,
	`closed_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `master_sessions_single_open_idx` ON `master_sessions` (`status`) WHERE "master_sessions"."status" = 'aperta';--> statement-breakpoint
CREATE INDEX `master_sessions_status_created_idx` ON `master_sessions` (`status`,`created_at`);