CREATE TABLE `catalog_listings` (
	`id` text PRIMARY KEY NOT NULL,
	`reference` text NOT NULL,
	`slug` text NOT NULL,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`organization_name` text NOT NULL,
	`organization_id` text,
	`district` text NOT NULL,
	`division` text NOT NULL,
	`delivery_mode` text NOT NULL,
	`summary` text NOT NULL,
	`description` text NOT NULL,
	`category` text NOT NULL,
	`deadline` text,
	`salary` text,
	`accessibility` text DEFAULT '[]' NOT NULL,
	`eligibility` text DEFAULT '[]' NOT NULL,
	`contact` text NOT NULL,
	`featured` integer DEFAULT false NOT NULL,
	`status` text DEFAULT 'DRAFT' NOT NULL,
	`created_by_id` text,
	`submitted_at` text,
	`published_at` text,
	`closed_at` text,
	`archived_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `catalog_listings_reference_idx` ON `catalog_listings` (`reference`);--> statement-breakpoint
CREATE UNIQUE INDEX `catalog_listings_slug_idx` ON `catalog_listings` (`slug`);--> statement-breakpoint
CREATE INDEX `catalog_discovery_idx` ON `catalog_listings` (`status`,`kind`,`district`);--> statement-breakpoint
CREATE INDEX `catalog_management_idx` ON `catalog_listings` (`created_by_id`,`status`,`updated_at`);