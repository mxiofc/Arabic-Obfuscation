import { useEffect, useState } from 'react';
import { useRoute } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { ObfuscationLogs } from '@/components/ObfuscationLogs';
import { trpc } from '@/lib/trpc';
import { ArrowLeft, Download } from 'lucide-react';
import type { ObfuscationJob } from '@/types/obfuscation';

export default function JobDetail() {
  const { user } = useAuth();
  const [, params] = useRoute('/job/:jobId');
  const jobId = params?.jobId ? parseInt(params.jobId, 10) : null;

  const { data: job, isLoading: jobLoading } = trpc.obfuscation.getJob.useQuery(
    { jobId: jobId! },
    { enabled: !!jobId && !!user }
  );

  const { data: logs, isLoading: logsLoading } = trpc.obfuscation.getLogs.useQuery(
    { jobId: jobId! },
    { enabled: !!jobId && !!user && job?.status === 'completed' }
  );

  const handleDownload = async () => {
    if (!job?.obfuscatedFileUrl) return;

    try {
      const link = document.createElement('a');
      link.href = job.obfuscatedFileUrl;
      link.download = job.originalFileName.replace(/\.apk$/, '-obfuscated.apk');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  if (!jobId) {
    return <div className="p-8">Invalid job ID</div>;
  }

  if (jobLoading) {
    return <div className="p-8">Loading job details...</div>;
  }

  if (!job) {
    return <div className="p-8">Job not found</div>;
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container py-12">
        {/* Header */}
        <div className="mb-12">
          <Button
            variant="ghost"
            className="mb-6 flex items-center gap-2 font-mono text-sm"
            onClick={() => window.history.back()}
          >
            <ArrowLeft size={16} />
            Back to History
          </Button>

          <div className="space-y-4">
            <h1 className="text-4xl font-mono font-bold uppercase break-all">{job.originalFileName}</h1>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="border-2 border-black p-4">
                <div className="text-xs font-mono uppercase text-gray-600 mb-1">Status</div>
                <div className="font-mono font-bold text-lg uppercase">
                  {job.status === 'completed' ? '✓ Completed' : job.status}
                </div>
              </div>

              <div className="border-2 border-black p-4">
                <div className="text-xs font-mono uppercase text-gray-600 mb-1">Progress</div>
                <div className="font-mono font-bold text-lg">{job.progress}%</div>
              </div>

              <div className="border-2 border-black p-4">
                <div className="text-xs font-mono uppercase text-gray-600 mb-1">Created</div>
                <div className="font-mono font-bold text-sm">
                  {new Date(job.createdAt).toLocaleDateString()}
                </div>
              </div>

              <div className="border-2 border-black p-4">
                <div className="text-xs font-mono uppercase text-gray-600 mb-1">Completed</div>
                <div className="font-mono font-bold text-sm">
                  {job.completedAt ? new Date(job.completedAt).toLocaleDateString() : '-'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Obfuscation Options */}
        <div className="mb-12 border-4 border-black">
          <div className="bg-black text-white px-6 py-4 font-mono font-bold uppercase">
            Obfuscation Options
          </div>
          <div className="p-6 space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={job.obfuscateAssets === 1}
                disabled
                className="w-5 h-5"
              />
              <span className="font-mono">Assets Obfuscated</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={job.obfuscateDex === 1}
                disabled
                className="w-5 h-5"
              />
              <span className="font-mono">Classes.dex Obfuscated</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={job.obfuscateLib === 1}
                disabled
                className="w-5 h-5"
              />
              <span className="font-mono">Libraries Obfuscated</span>
            </div>
          </div>
        </div>

        {/* Download Button */}
        {job.status === 'completed' && job.obfuscatedFileUrl && (
          <div className="mb-12">
            <Button
              onClick={handleDownload}
              className="w-full md:w-auto px-8 py-4 bg-black text-white font-mono font-bold uppercase text-lg flex items-center gap-3 hover:bg-gray-800"
            >
              <Download size={20} />
              Download Obfuscated APK
            </Button>
          </div>
        )}

        {/* Obfuscation Logs */}
        {job.status === 'completed' && (
          <div className="mt-12">
            <ObfuscationLogs
              logs={(logs || []).map(log => ({
                ...log,
                fileType: log.fileType as 'asset' | 'class' | 'lib',
              }))}
              isLoading={logsLoading}
            />
          </div>
        )}

        {job.status !== 'completed' && (
          <div className="text-center py-12 text-gray-500">
            <p className="font-mono">Obfuscation logs will be available when processing is complete.</p>
          </div>
        )}
      </div>
    </div>
  );
}
