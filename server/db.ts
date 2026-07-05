import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, obfuscationJobs, ObfuscationJob, InsertObfuscationJob } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Obfuscation job helpers

export async function createObfuscationJob(job: InsertObfuscationJob): Promise<ObfuscationJob> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(obfuscationJobs).values(job);
  const jobId = (result as any).insertId;

  const created = await db.select().from(obfuscationJobs).where(eq(obfuscationJobs.id, jobId)).limit(1);
  return created[0];
}

export async function getObfuscationJobById(jobId: number): Promise<ObfuscationJob | undefined> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get job: database not available");
    return undefined;
  }

  const result = await db.select().from(obfuscationJobs).where(eq(obfuscationJobs.id, jobId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserObfuscationJobs(userId: number, limit: number = 50): Promise<ObfuscationJob[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get jobs: database not available");
    return [];
  }

  return db
    .select()
    .from(obfuscationJobs)
    .where(eq(obfuscationJobs.userId, userId))
    .orderBy(desc(obfuscationJobs.createdAt))
    .limit(limit);
}

export async function updateObfuscationJob(
  jobId: number,
  updates: Partial<ObfuscationJob>
): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const updateData: Record<string, unknown> = {
    ...updates,
    updatedAt: new Date(),
  };

  await db.update(obfuscationJobs).set(updateData).where(eq(obfuscationJobs.id, jobId));
}

export async function deleteObfuscationJob(jobId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.delete(obfuscationJobs).where(eq(obfuscationJobs.id, jobId));
}
