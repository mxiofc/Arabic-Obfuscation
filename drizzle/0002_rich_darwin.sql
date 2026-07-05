CREATE TABLE `obfuscation_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobId` int NOT NULL,
	`fileType` varchar(50) NOT NULL,
	`originalName` varchar(512) NOT NULL,
	`obfuscatedName` varchar(512) NOT NULL,
	`filePath` varchar(512),
	`fileSize` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `obfuscation_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `obfuscation_logs` ADD CONSTRAINT `obfuscation_logs_jobId_obfuscation_jobs_id_fk` FOREIGN KEY (`jobId`) REFERENCES `obfuscation_jobs`(`id`) ON DELETE no action ON UPDATE no action;