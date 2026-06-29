CREATE TABLE `stories` (
	`id` text PRIMARY KEY NOT NULL,
	`registry_id` text,
	`slug` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`verified` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`created_by` text,
	`updated_by` text,
	`archived_at` text,
	`title` text NOT NULL,
	`subtitle` text,
	`dek` text,
	`body` text,
	`cover_media` text,
	`chapter_id` text,
	`kind` text DEFAULT 'feature' NOT NULL,
	FOREIGN KEY (`chapter_id`) REFERENCES `chapters`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `stories_registry_id_unique` ON `stories` (`registry_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `stories_slug_unique` ON `stories` (`slug`);--> statement-breakpoint
CREATE INDEX `ix_story_status` ON `stories` (`status`);--> statement-breakpoint
CREATE INDEX `ix_story_kind` ON `stories` (`kind`);