CREATE TABLE `provenance_events` (
	`id` text PRIMARY KEY NOT NULL,
	`artwork_id` text NOT NULL,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`occurred_on` text,
	`chapter_id` text,
	`organization_id` text,
	`actor_person_id` text,
	`source` text,
	`verified` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`created_by` text,
	`updated_by` text,
	`archived_at` text,
	FOREIGN KEY (`artwork_id`) REFERENCES `artworks`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`chapter_id`) REFERENCES `chapters`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`actor_person_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `ix_provenance_artwork` ON `provenance_events` (`artwork_id`,`occurred_on`);--> statement-breakpoint
CREATE INDEX `ix_provenance_kind` ON `provenance_events` (`kind`);