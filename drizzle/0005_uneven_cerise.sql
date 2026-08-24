CREATE TABLE `request_rate_limits` (
	`id` text PRIMARY KEY NOT NULL,
	`subject_hash` text NOT NULL,
	`route_scope` text NOT NULL,
	`window_started_at` integer NOT NULL,
	`request_count` integer DEFAULT 1 NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `request_rate_limits_window_idx` ON `request_rate_limits` (`window_started_at`);--> statement-breakpoint
CREATE INDEX `request_rate_limits_scope_idx` ON `request_rate_limits` (`route_scope`,`window_started_at`);