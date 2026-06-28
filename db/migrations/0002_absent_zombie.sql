CREATE TABLE `contributions` (
	`id` text PRIMARY KEY NOT NULL,
	`registry_id` text,
	`person_id` text NOT NULL,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`occurred_on` text,
	`chapter_id` text,
	`source` text,
	`verified` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`created_by` text,
	`updated_by` text,
	`archived_at` text,
	FOREIGN KEY (`person_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`chapter_id`) REFERENCES `chapters`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `ix_contrib_person` ON `contributions` (`person_id`,`occurred_on`);--> statement-breakpoint
CREATE INDEX `ix_contrib_kind` ON `contributions` (`kind`);--> statement-breakpoint
CREATE TABLE `passport_claims` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`person_id` text NOT NULL,
	`claim_request_id` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`evidence` text,
	`reviewer` text,
	`review_note` text,
	`decided_at` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`person_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`claim_request_id`) REFERENCES `claim_requests`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reviewer`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `ix_pclaim_user` ON `passport_claims` (`user_id`);--> statement-breakpoint
CREATE INDEX `ix_pclaim_person` ON `passport_claims` (`person_id`);--> statement-breakpoint
CREATE TABLE `passports` (
	`id` text PRIMARY KEY NOT NULL,
	`registry_id` text,
	`passport_id` text NOT NULL,
	`person_id` text NOT NULL,
	`country` text,
	`passport_status` text DEFAULT 'unclaimed' NOT NULL,
	`institutional_note` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`created_by` text,
	`updated_by` text,
	`archived_at` text,
	FOREIGN KEY (`person_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `passports_registry_id_unique` ON `passports` (`registry_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `passports_passport_id_unique` ON `passports` (`passport_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `passports_person_id_unique` ON `passports` (`person_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `ux_passport_person` ON `passports` (`person_id`);--> statement-breakpoint
CREATE INDEX `ix_passport_status` ON `passports` (`passport_status`);