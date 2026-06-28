CREATE TABLE `chain_anchors` (
	`id` text PRIMARY KEY NOT NULL,
	`anchor_id` text NOT NULL,
	`merkle_root` text NOT NULL,
	`member_count` integer NOT NULL,
	`provider` text,
	`tx_ref` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`anchored_at` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `chain_anchors_anchor_id_unique` ON `chain_anchors` (`anchor_id`);--> statement-breakpoint
CREATE INDEX `ix_anchor_status` ON `chain_anchors` (`status`);--> statement-breakpoint
CREATE TABLE `claim_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`file_ref` text,
	`ocr_text` text,
	`ocr_confidence` real,
	`parsed_fields` text,
	`submitted_public_id` text,
	`matched_certificate_id` text,
	`confidence` real,
	`status` text DEFAULT 'uploaded' NOT NULL,
	`submitted_by` text,
	`reviewer` text,
	`review_note` text,
	`decided_at` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`matched_certificate_id`) REFERENCES `certificates`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`submitted_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reviewer`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `ix_claimreq_status` ON `claim_requests` (`status`);--> statement-breakpoint
CREATE INDEX `ix_claimreq_cert` ON `claim_requests` (`matched_certificate_id`);--> statement-breakpoint
CREATE INDEX `ix_claimreq_user` ON `claim_requests` (`submitted_by`);--> statement-breakpoint
CREATE TABLE `onchain_refs` (
	`id` text PRIMARY KEY NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`provider` text,
	`token_ref` text,
	`kind` text NOT NULL,
	`anchor_id` text,
	`minted_at` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`anchor_id`) REFERENCES `chain_anchors`(`anchor_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `ix_onchain_entity` ON `onchain_refs` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE INDEX `ix_onchain_anchor` ON `onchain_refs` (`anchor_id`);--> statement-breakpoint
CREATE TABLE `verification_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`event_type` text NOT NULL,
	`entity_type` text,
	`entity_id` text,
	`actor` text,
	`result` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `ix_vev_entity` ON `verification_events` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE INDEX `ix_vev_type` ON `verification_events` (`event_type`,`created_at`);