CREATE TABLE `obfuscation_jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`originalFileName` varchar(255) NOT NULL,
	`originalFileKey` varchar(255) NOT NULL,
	`originalFileUrl` text NOT NULL,
	`obfuscatedFileKey` varchar(255),
	`obfuscatedFileUrl` text,
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`currentStep` varchar(128) DEFAULT 'queued',
	`progress` int DEFAULT 0,
	`obfuscateAssets` int DEFAULT 1,
	`obfuscateDex` int DEFAULT 1,
	`obfuscateLib` int DEFAULT 1,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`completedAt` timestamp,
	CONSTRAINT `obfuscation_jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `obfuscation_jobs` ADD CONSTRAINT `obfuscation_jobs_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;