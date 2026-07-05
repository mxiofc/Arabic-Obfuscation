/**
 * tRPC router for APK obfuscation operations
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { protectedProcedure, router } from './_core/trpc';
import {
  createObfuscationJob,
  getObfuscationJobById,
  getUserObfuscationJobs,
  updateObfuscationJob,
  getObfuscationLogsByJobId,
  bulkCreateObfuscationLogs,
} from './db';
import { storagePut, storageGet } from './storage';
import { processApkFile, ObfuscationOptions } from './apkProcessor';

export const obfuscationRouter = router({
  /**
   * Create a new obfuscation job and start processing
   */
  uploadAndObfuscate: protectedProcedure
    .input(
      z.object({
        fileName: z.string().min(1),
        fileBuffer: z.instanceof(Buffer),
        obfuscateAssets: z.boolean().default(true),
        obfuscateDex: z.boolean().default(true),
        obfuscateLib: z.boolean().default(true),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Step 1: Upload original APK to S3
        const originalUpload = await storagePut(
          `apk-obfuscator/original/${Date.now()}-${input.fileName}`,
          input.fileBuffer,
          'application/vnd.android.package-archive'
        );

        // Step 2: Create job record
        const job = await createObfuscationJob({
          userId: ctx.user.id,
          originalFileName: input.fileName,
          originalFileKey: originalUpload.key,
          originalFileUrl: originalUpload.url,
          status: 'processing',
          currentStep: 'queued',
          progress: 0,
          obfuscateAssets: input.obfuscateAssets ? 1 : 0,
          obfuscateDex: input.obfuscateDex ? 1 : 0,
          obfuscateLib: input.obfuscateLib ? 1 : 0,
        });

        // Step 3: Process APK asynchronously
        processApkAsync(job.id, input.fileBuffer, {
          obfuscateAssets: input.obfuscateAssets,
          obfuscateDex: input.obfuscateDex,
          obfuscateLib: input.obfuscateLib,
        }).catch(error => {
          console.error(`[Obfuscation] Job ${job.id} failed:`, error);
          updateObfuscationJob(job.id, {
            status: 'failed',
            errorMessage: error instanceof Error ? error.message : String(error),
          }).catch(e => console.error('Failed to update job status:', e));
        });

        return {
          jobId: job.id,
          status: job.status,
          message: 'Obfuscation job created and processing started',
        };
      } catch (error) {
        console.error('[Obfuscation] Upload failed:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create obfuscation job',
        });
      }
    }),

  /**
   * Get job details by ID
   */
  getJob: protectedProcedure
    .input(z.object({ jobId: z.number().int() }))
    .query(async ({ input, ctx }) => {
      const job = await getObfuscationJobById(input.jobId);

      if (!job) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Job not found',
        });
      }

      // Verify ownership
      if (job.userId !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Access denied',
        });
      }

      return job;
    }),

  /**
   * Get user's job history
   */
  getHistory: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(50) }))
    .query(async ({ input, ctx }) => {
      return getUserObfuscationJobs(ctx.user.id, input.limit);
    }),

  /**
   * Get download URL for obfuscated APK
   */
  getDownloadUrl: protectedProcedure
    .input(z.object({ jobId: z.number().int() }))
    .query(async ({ input, ctx }) => {
      const job = await getObfuscationJobById(input.jobId);

      if (!job) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Job not found',
        });
      }

      // Verify ownership
      if (job.userId !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Access denied',
        });
      }

      if (job.status !== 'completed' || !job.obfuscatedFileUrl) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'APK not ready for download',
        });
      }

      return {
        url: job.obfuscatedFileUrl,
        fileName: job.originalFileName.replace(/\.apk$/, '-obfuscated.apk'),
      };
    }),

  /**
   * Get obfuscation logs for a job
   */
  getLogs: protectedProcedure
    .input(z.object({ jobId: z.number().int() }))
    .query(async ({ input, ctx }) => {
      const job = await getObfuscationJobById(input.jobId);

      if (!job) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Job not found',
        });
      }

      // Verify ownership
      if (job.userId !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Access denied',
        });
      }

      return getObfuscationLogsByJobId(input.jobId);
    }),
});

/**
 * Process APK asynchronously
 */
async function processApkAsync(
  jobId: number,
  apkBuffer: Buffer,
  options: ObfuscationOptions
): Promise<void> {
  try {
    // Update job status to processing
    await updateObfuscationJob(jobId, {
      status: 'processing',
      currentStep: 'initializing',
      progress: 5,
    });

    // Process the APK
    const result = await processApkFile(apkBuffer, options);

    if (!result.success || !result.obfuscatedBuffer) {
      throw new Error(result.error || 'Processing failed');
    }

    // Update progress
    await updateObfuscationJob(jobId, {
      currentStep: 'uploading',
      progress: 90,
    });

    // Upload obfuscated APK to S3
    const obfuscatedUpload = await storagePut(
      `apk-obfuscator/obfuscated/${Date.now()}-obfuscated.apk`,
      result.obfuscatedBuffer,
      'application/vnd.android.package-archive'
    );

    // Save obfuscation logs
    if (result.fileLogs && result.fileLogs.length > 0) {
      const logs = result.fileLogs.map(log => ({
        jobId,
        fileType: log.fileType as 'asset' | 'class' | 'lib',
        originalName: log.originalName,
        obfuscatedName: log.obfuscatedName,
        filePath: log.filePath,
        fileSize: log.fileSize,
      }));
      await bulkCreateObfuscationLogs(logs);
    }

    // Mark job as completed
    await updateObfuscationJob(jobId, {
      status: 'completed',
      currentStep: 'completed',
      progress: 100,
      obfuscatedFileKey: obfuscatedUpload.key,
      obfuscatedFileUrl: obfuscatedUpload.url,
      completedAt: new Date(),
    });

    console.log(`[Obfuscation] Job ${jobId} completed successfully`);
  } catch (error) {
    console.error(`[Obfuscation] Job ${jobId} processing error:`, error);
    await updateObfuscationJob(jobId, {
      status: 'failed',
      errorMessage: error instanceof Error ? error.message : String(error),
    });
  }
}
