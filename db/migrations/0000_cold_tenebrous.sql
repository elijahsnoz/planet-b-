CREATE TABLE `artworks` (
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
	`title_variant` text,
	`artist_id` text,
	`chapter_id` text,
	`medium` text DEFAULT 'Discarded items assemblage',
	`dimensions` text DEFAULT '61cm x 61cm',
	`year` integer DEFAULT 2026,
	`statement` text,
	`significance` text,
	`materials` text DEFAULT '[]' NOT NULL,
	`primary_media` text,
	`exhibitor_role` text DEFAULT 'artist',
	FOREIGN KEY (`artist_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`chapter_id`) REFERENCES `chapters`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `artworks_registry_id_unique` ON `artworks` (`registry_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `artworks_slug_unique` ON `artworks` (`slug`);--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`actor` text,
	`action` text NOT NULL,
	`entity_type` text,
	`entity_id` text,
	`registry_id` text,
	`before` text,
	`after` text,
	`ip` text,
	`user_agent` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `ix_audit_actor` ON `audit_logs` (`actor`);--> statement-breakpoint
CREATE INDEX `ix_audit_entity` ON `audit_logs` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE TABLE `certificates` (
	`id` text PRIMARY KEY NOT NULL,
	`registry_id` text,
	`public_id` text NOT NULL,
	`person_id` text,
	`organization_id` text,
	`chapter_id` text,
	`role_at_issue` text NOT NULL,
	`artwork_id` text,
	`issued_on` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`verification_hash` text,
	`soulbound_ref` text,
	`note` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`person_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`chapter_id`) REFERENCES `chapters`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`artwork_id`) REFERENCES `artworks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `certificates_registry_id_unique` ON `certificates` (`registry_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `certificates_public_id_unique` ON `certificates` (`public_id`);--> statement-breakpoint
CREATE TABLE `chapters` (
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
	`name` text NOT NULL,
	`city` text,
	`country` text,
	`is_genesis` integer DEFAULT false NOT NULL,
	`immutable` integer DEFAULT false NOT NULL,
	`movement` text DEFAULT 'Because There Is No Planet B' NOT NULL,
	`theme` text,
	`event_name` text,
	`opened_on` text,
	`venue` text,
	`summary` text,
	`yoruba_proverbs` text,
	`hero_media` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `chapters_registry_id_unique` ON `chapters` (`registry_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `chapters_slug_unique` ON `chapters` (`slug`);--> statement-breakpoint
CREATE TABLE `entity_links` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`from_type` text NOT NULL,
	`from_id` text NOT NULL,
	`relation` text NOT NULL,
	`to_type` text NOT NULL,
	`to_id` text NOT NULL,
	`weight` integer DEFAULT 1,
	`metadata` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_edge` ON `entity_links` (`from_type`,`from_id`,`relation`,`to_type`,`to_id`);--> statement-breakpoint
CREATE INDEX `ix_edge_from` ON `entity_links` (`from_type`,`from_id`);--> statement-breakpoint
CREATE INDEX `ix_edge_to` ON `entity_links` (`to_type`,`to_id`);--> statement-breakpoint
CREATE TABLE `founding_council` (
	`id` text PRIMARY KEY NOT NULL,
	`person_id` text,
	`chapter_id` text,
	`council_category` text NOT NULL,
	`citation` text,
	`inducted_on` text,
	`is_charter_member` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0,
	`notes` text,
	FOREIGN KEY (`person_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`chapter_id`) REFERENCES `chapters`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `impact_metrics` (
	`id` text PRIMARY KEY NOT NULL,
	`chapter_id` text,
	`metric` text NOT NULL,
	`value` integer NOT NULL,
	`unit` text,
	`as_of` text,
	`source` text,
	`verified` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`chapter_id`) REFERENCES `chapters`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `media` (
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
	`kind` text DEFAULT 'image' NOT NULL,
	`title` text,
	`description` text,
	`storage_path` text,
	`master_path` text,
	`sha256` text,
	`bytes` integer,
	`mime` text,
	`width` integer,
	`height` integer,
	`duration_s` integer,
	`alt_text` text,
	`caption` text,
	`credit` text,
	`source` text,
	`license` text,
	`author` text,
	`copyright` text,
	`tags` text,
	`capture_date` text,
	`location` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `media_registry_id_unique` ON `media` (`registry_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `media_slug_unique` ON `media` (`slug`);--> statement-breakpoint
CREATE TABLE `organizations` (
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
	`name` text NOT NULL,
	`type` text,
	`role` text,
	`about` text,
	`website` text,
	`logo_media` text,
	`established` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `organizations_registry_id_unique` ON `organizations` (`registry_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `organizations_slug_unique` ON `organizations` (`slug`);--> statement-breakpoint
CREATE TABLE `people` (
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
	`full_name` text NOT NULL,
	`display_name` text,
	`honorific` text,
	`primary_role` text,
	`roles` text DEFAULT '[]' NOT NULL,
	`short_bio` text,
	`bio` text,
	`portrait_media` text,
	`consent_status` text DEFAULT 'pending' NOT NULL,
	`contact_public` integer DEFAULT false NOT NULL,
	`founding_council` text,
	`evolves` integer DEFAULT false NOT NULL,
	`note` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `people_registry_id_unique` ON `people` (`registry_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `people_slug_unique` ON `people` (`slug`);--> statement-breakpoint
CREATE TABLE `permissions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `permissions_key_unique` ON `permissions` (`key`);--> statement-breakpoint
CREATE TABLE `press` (
	`id` text PRIMARY KEY NOT NULL,
	`chapter_id` text,
	`outlet` text NOT NULL,
	`title` text,
	`url` text NOT NULL,
	`topic` text,
	`published_on` text,
	`excerpt` text,
	`archived_at` text,
	FOREIGN KEY (`chapter_id`) REFERENCES `chapters`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `registry_counters` (
	`kind` text PRIMARY KEY NOT NULL,
	`last_value` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `revisions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`registry_id` text,
	`version` integer NOT NULL,
	`snapshot` text NOT NULL,
	`change_summary` text,
	`created_by` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `ix_rev_entity` ON `revisions` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE TABLE `role_permissions` (
	`role_id` integer NOT NULL,
	`permission_id` integer NOT NULL,
	PRIMARY KEY(`role_id`, `permission_id`),
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `roles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text NOT NULL,
	`name` text NOT NULL,
	`rank` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `roles_key_unique` ON `roles` (`key`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `timeline_events` (
	`id` text PRIMARY KEY NOT NULL,
	`chapter_id` text,
	`sort_order` integer NOT NULL,
	`phase` text,
	`title` text NOT NULL,
	`event_date` text,
	`description` text,
	`verified` integer DEFAULT false NOT NULL,
	`note` text,
	`archived_at` text,
	FOREIGN KEY (`chapter_id`) REFERENCES `chapters`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user_roles` (
	`user_id` text NOT NULL,
	`role_id` integer NOT NULL,
	`chapter_id` text,
	`granted_by` text,
	`granted_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	PRIMARY KEY(`user_id`, `role_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`chapter_id`) REFERENCES `chapters`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`display_name` text,
	`password_hash` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`mfa_required` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`last_login_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);