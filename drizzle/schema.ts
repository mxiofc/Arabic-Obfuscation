import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const obfuscationJobs = mysqlTable("obfuscation_jobs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  originalFileName: varchar("originalFileName", { length: 255 }).notNull(),
  originalFileKey: varchar("originalFileKey", { length: 255 }).notNull(),
  originalFileUrl: text("originalFileUrl").notNull(),
  obfuscatedFileKey: varchar("obfuscatedFileKey", { length: 255 }),
  obfuscatedFileUrl: text("obfuscatedFileUrl"),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  currentStep: varchar("currentStep", { length: 128 }).default("queued"),
  progress: int("progress").default(0),
  obfuscateAssets: int("obfuscateAssets").default(1),
  obfuscateDex: int("obfuscateDex").default(1),
  obfuscateLib: int("obfuscateLib").default(1),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type ObfuscationJob = typeof obfuscationJobs.$inferSelect;
export type InsertObfuscationJob = typeof obfuscationJobs.$inferInsert;

export const obfuscationLogs = mysqlTable("obfuscation_logs", {
  id: int("id").autoincrement().primaryKey(),
  jobId: int("jobId").notNull().references(() => obfuscationJobs.id),
  fileType: varchar("fileType", { length: 50 }).notNull(), // 'asset', 'class', 'lib'
  originalName: varchar("originalName", { length: 512 }).notNull(),
  obfuscatedName: varchar("obfuscatedName", { length: 512 }).notNull(),
  filePath: varchar("filePath", { length: 512 }),
  fileSize: int("fileSize"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ObfuscationLog = typeof obfuscationLogs.$inferSelect;
export type InsertObfuscationLog = typeof obfuscationLogs.$inferInsert;