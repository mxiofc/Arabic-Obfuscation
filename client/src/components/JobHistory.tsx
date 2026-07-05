import { Download, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ObfuscationJob } from '@/types/obfuscation';
import { formatDistanceToNow } from 'date-fns';

interface JobHistoryProps {
  jobs: ObfuscationJob[];
  onDownload: (jobId: number) => void;
  isDownloading?: Record<number, boolean>;
  isLoading?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'opacity-50',
  processing: 'border-blue-600',
  completed: 'border-green-600',
  failed: 'border-red-600',
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Loader2 size={16} className="animate-spin" />,
  processing: <Loader2 size={16} className="animate-spin" />,
  completed: <CheckCircle size={16} />,
  failed: <AlertCircle size={16} />,
};

export function JobHistory({
  jobs,
  onDownload,
  isDownloading = {},
  isLoading = false,
}: JobHistoryProps) {
  if (isLoading) {
    return (
      <div className="border-4 border-black p-8 text-center">
        <Loader2 className="animate-spin mx-auto mb-4" size={32} />
        <p className="font-mono text-sm">Loading history...</p>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="border-4 border-black p-8 text-center">
        <p className="font-mono text-lg uppercase font-bold">No Jobs Yet</p>
        <p className="text-sm opacity-75 mt-2">Upload an APK to get started</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b-4 border-black">
            <th className="text-left p-4 font-mono font-bold uppercase text-sm">File Name</th>
            <th className="text-left p-4 font-mono font-bold uppercase text-sm">Status</th>
            <th className="text-left p-4 font-mono font-bold uppercase text-sm">Created</th>
            <th className="text-left p-4 font-mono font-bold uppercase text-sm">Options</th>
            <th className="text-center p-4 font-mono font-bold uppercase text-sm">Action</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr key={job.id} className="border-b-2 border-black hover:bg-black hover:text-white transition-colors">
              <td className="p-4 text-sm font-mono truncate max-w-xs">{job.originalFileName}</td>
              <td className="p-4">
                <div className="flex items-center gap-2">
                  {STATUS_ICONS[job.status]}
                  <span className="text-xs font-mono uppercase font-bold">{job.status}</span>
                </div>
              </td>
              <td className="p-4 text-xs font-mono opacity-75">
                {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
              </td>
              <td className="p-4 text-xs font-mono">
                <div className="flex gap-1">
                  {job.obfuscateAssets && <span className="px-2 py-1 border border-black">A</span>}
                  {job.obfuscateDex && <span className="px-2 py-1 border border-black">D</span>}
                  {job.obfuscateLib && <span className="px-2 py-1 border border-black">L</span>}
                </div>
              </td>
              <td className="p-4 text-center">
                {job.status === 'completed' && job.obfuscatedFileUrl ? (
                  <Button
                    onClick={() => onDownload(job.id)}
                    disabled={isDownloading[job.id]}
                    variant="outline"
                    size="sm"
                    className="border-2 border-black font-mono text-xs uppercase"
                  >
                    {isDownloading[job.id] ? (
                      <>
                        <Loader2 size={14} className="animate-spin mr-1" />
                        Downloading
                      </>
                    ) : (
                      <>
                        <Download size={14} className="mr-1" />
                        Download
                      </>
                    )}
                  </Button>
                ) : job.status === 'failed' ? (
                  <span className="text-xs font-mono text-red-600 uppercase">Failed</span>
                ) : (
                  <span className="text-xs font-mono opacity-50 uppercase">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
