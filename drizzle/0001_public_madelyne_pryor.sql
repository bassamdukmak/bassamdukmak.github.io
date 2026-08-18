ALTER TABLE `leads` ADD `crm_attempts` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `leads` ADD `crm_last_attempt_at` text DEFAULT '' NOT NULL;