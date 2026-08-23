PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_applications` (
	`id` text PRIMARY KEY NOT NULL,
	`reference` text NOT NULL,
	`user_id` text NOT NULL,
	`organization_id` text,
	`catalog_listing_id` text,
	`application_type` text NOT NULL,
	`target_id` text NOT NULL,
	`stage` text DEFAULT 'INTERESTED' NOT NULL,
	`preparation_info` text,
	`private_notes` text,
	`submitted_at` text,
	`withdrawn_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`catalog_listing_id`) REFERENCES `catalog_listings`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_applications`("id", "reference", "user_id", "organization_id", "catalog_listing_id", "application_type", "target_id", "stage", "preparation_info", "private_notes", "submitted_at", "withdrawn_at", "created_at", "updated_at") SELECT "id", "reference", "user_id", "organization_id", NULL, "application_type", "target_id", "stage", "preparation_info", "private_notes", "submitted_at", "withdrawn_at", "created_at", "updated_at" FROM `applications`;--> statement-breakpoint
DROP TABLE `applications`;--> statement-breakpoint
ALTER TABLE `__new_applications` RENAME TO `applications`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `applications_reference_idx` ON `applications` (`reference`);--> statement-breakpoint
CREATE INDEX `applications_pipeline_idx` ON `applications` (`organization_id`,`application_type`,`stage`);
