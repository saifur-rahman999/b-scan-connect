PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_referrals` (
	`id` text PRIMARY KEY NOT NULL,
	`reference` text NOT NULL,
	`user_id` text NOT NULL,
	`service_id` text,
	`catalog_listing_id` text,
	`organization_id` text,
	`assigned_officer_id` text,
	`status` text DEFAULT 'SUBMITTED' NOT NULL,
	`request_summary` text NOT NULL,
	`cancelled_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`catalog_listing_id`) REFERENCES `catalog_listings`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assigned_officer_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_referrals`("id", "reference", "user_id", "service_id", "catalog_listing_id", "organization_id", "assigned_officer_id", "status", "request_summary", "cancelled_at", "created_at", "updated_at") SELECT "id", "reference", "user_id", "service_id", NULL, "organization_id", "assigned_officer_id", "status", "request_summary", "cancelled_at", "created_at", "updated_at" FROM `referrals`;--> statement-breakpoint
DROP TABLE `referrals`;--> statement-breakpoint
ALTER TABLE `__new_referrals` RENAME TO `referrals`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `referrals_reference_idx` ON `referrals` (`reference`);--> statement-breakpoint
CREATE INDEX `referrals_queue_idx` ON `referrals` (`status`,`assigned_officer_id`,`updated_at`);
