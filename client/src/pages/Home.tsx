import { useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { UploadZone } from '@/components/UploadZone';
import { ObfuscationOptions } from '@/components/ObfuscationOptions';
import { ProgressIndicator } from '@/components/ProgressIndicator';
import { JobHistory } from '@/components/JobHistory';
import { trpc } from '@/lib/trpc';
import { getLoginUrl } from '@/const';
import { Loader2, LogOut } from 'lucide-react';
import { useCallback } from 'react';
import type { ObfuscationJob } from '@/types/obfuscation';

export default function Home() {
  const { user, isAuthenticated, logout } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [obfuscateAssets, setObfuscateAssets] = useState(true);
  const [obfuscateDex, setObfuscateDex] = useState(true);
  const [obfuscateLib, setObfuscateLib] = useState(true);
  const [currentJobId, setCurrentJobId] = useState<number | null>(null);
  const [isDownloading, setIsDownloading] = useState<Record<number, boolean>>({});

  // Queries
  const { data: currentJob, isLoading: isJobLoading, refetch: refetchJob } = trpc.obfuscation.getJob.useQuery(
    { jobId: currentJobId! },
    { enabled: !!currentJobId, refetchInterval: 1000 }
  );

  const { data: jobs = [], isLoading: isHistoryLoading, refetch: refetchHistory } = trpc.obfuscation.getHistory.useQuery(
    { limit: 50 },
    { enabled: isAuthenticated }
  );

  // Mutations
  const uploadMutation = trpc.obfuscation.uploadAndObfuscate.useMutation();
  const downloadQuery = trpc.obfuscation.getDownloadUrl.useQuery;
  const [downloadUrl, setDownloadUrl] = useState<{ url: string; fileName: string } | null>(null);

  const handleFileSelected = async (file: File) => {
    setSelectedFile(file);

    const buffer = await file.arrayBuffer();
    uploadMutation.mutate(
      {
        fileName: file.name,
        fileBuffer: Buffer.from(buffer),
        obfuscateAssets,
        obfuscateDex,
        obfuscateLib,
      },
      {
        onSuccess: (data) => {
          setCurrentJobId(data.jobId);
          setSelectedFile(null);
          setTimeout(() => refetchHistory(), 1000);
        },
      }
    );
  };

  const handleDownload = async (jobId: number) => {
    setIsDownloading((prev) => ({ ...prev, [jobId]: true }));
    try {
      // Fetch the download URL
      const response = await fetch(`/api/trpc/obfuscation.getDownloadUrl?input=${JSON.stringify({ jobId })}`).then(r => r.json());
      if (response.result?.data) {
        const { url, fileName } = response.result.data;
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsDownloading((prev) => ({ ...prev, [jobId]: false }));
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white text-black flex items-center justify-center p-4">
        <div className="max-w-2xl w-full space-y-8">
          <div className="space-y-4">
            <h1 className="text-6xl font-mono font-black uppercase leading-tight">
              APK<br />OBFUSCATOR
            </h1>
            <div className="h-1 w-32 bg-black" />
          </div>

          <p className="text-lg leading-relaxed max-w-md">
            Industrial-grade APK obfuscation using Arabic symbols. Rename assets, classes.dex, and libraries with precision and raw power.
          </p>

          <Button
            onClick={() => window.location.href = getLoginUrl()}
            className="border-4 border-black bg-black text-white hover:bg-white hover:text-black font-mono font-bold uppercase text-lg px-8 py-6 transition-all"
          >
            Sign In to Start
          </Button>
        </div>
      </div>
    );
  }

  const isProcessing = currentJob?.status === 'processing';
  const isComplete = currentJob?.status === 'completed';
  const isFailed = currentJob?.status === 'failed';

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Header */}
      <header className="border-b-4 border-black p-8">
        <div className="max-w-7xl mx-auto flex justify-between items-start">
          <div>
            <h1 className="text-5xl font-mono font-black uppercase">APK OBFUSCATOR</h1>
            <p className="text-sm font-mono mt-2 opacity-75">Brutalist APK Obfuscation Tool</p>
          </div>
          <Button
            onClick={logout}
            variant="outline"
            className="border-2 border-black font-mono text-xs uppercase"
          >
            <LogOut size={14} className="mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-8 space-y-12">
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Upload & Options */}
          <div className="lg:col-span-1 space-y-8">
            <div>
              <h2 className="text-3xl font-mono font-bold uppercase mb-6">Upload</h2>
              <UploadZone
                onFileSelected={handleFileSelected}
                isLoading={uploadMutation.isPending}
                disabled={isProcessing}
              />
            </div>

            {!isProcessing && (
              <div>
                <h2 className="text-3xl font-mono font-bold uppercase mb-6">Configure</h2>
                <ObfuscationOptions
                  obfuscateAssets={obfuscateAssets}
                  obfuscateDex={obfuscateDex}
                  obfuscateLib={obfuscateLib}
                  onAssetsChange={setObfuscateAssets}
                  onDexChange={setObfuscateDex}
                  onLibChange={setObfuscateLib}
                  disabled={isProcessing}
                />
              </div>
            )}
          </div>

          {/* Right Column - Progress or History */}
          <div className="lg:col-span-2">
            {isProcessing && currentJob ? (
              <div>
                <h2 className="text-3xl font-mono font-bold uppercase mb-6">Processing</h2>
                <ProgressIndicator
                  progress={currentJob.progress ?? 0}
                  currentStep={currentJob.currentStep ?? 'queued'}
                  message={(currentJob.currentStep ?? '') === 'completed' ? 'APK obfuscated successfully!' : 'Processing your APK...'}
                  isComplete={isComplete}
                  isError={isFailed}
                />
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-3xl font-mono font-bold uppercase">History</h2>
                  {!isHistoryLoading && jobs.length > 0 && (
                    <Button
                      onClick={() => refetchHistory()}
                      variant="outline"
                      size="sm"
                      className="border-2 border-black font-mono text-xs uppercase"
                    >
                      Refresh
                    </Button>
                  )}
                </div>
                <JobHistory
                  jobs={jobs as ObfuscationJob[]}
                  onDownload={handleDownload}
                  isDownloading={isDownloading}
                  isLoading={isHistoryLoading}
                />
              </div>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div className="border-4 border-black p-8 space-y-4">
          <h3 className="text-2xl font-mono font-bold uppercase">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <p className="font-mono font-bold uppercase text-sm">1. Upload</p>
              <p className="text-sm opacity-75">Select your APK file and choose which sections to obfuscate</p>
            </div>
            <div className="space-y-2">
              <p className="font-mono font-bold uppercase text-sm">2. Process</p>
              <p className="text-sm opacity-75">Server extracts, obfuscates, and repacks your APK with Arabic symbols</p>
            </div>
            <div className="space-y-2">
              <p className="font-mono font-bold uppercase text-sm">3. Download</p>
              <p className="text-sm opacity-75">Retrieve your obfuscated APK from persistent S3 storage</p>
            </div>
          </div>
        </div>

        {/* Technical Details */}
        <div className="border-4 border-black p-8 space-y-4">
          <h3 className="text-2xl font-mono font-bold uppercase">Obfuscation Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <p className="font-mono font-bold uppercase mb-2">Assets (A)</p>
              <p className="opacity-75">Renames all files in the assets/ directory using Arabic symbols</p>
            </div>
            <div>
              <p className="font-mono font-bold uppercase mb-2">Classes.dex (D)</p>
              <p className="opacity-75">Obfuscates class and method identifiers in the DEX bytecode</p>
            </div>
            <div>
              <p className="font-mono font-bold uppercase mb-2">Libraries (L)</p>
              <p className="opacity-75">Renames native libraries in lib/ directory including .so files</p>
            </div>
            <div>
              <p className="font-mono font-bold uppercase mb-2">Symbols Used</p>
              <p className="opacity-75 font-mono">ۗ ۙ ۦ ۘ ۗۙ ۗۦ ۙۦ ۗۘ ۦۗ ۘۗ ۙۗ ۦۙ</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-4 border-black mt-16 p-8 text-center text-xs font-mono opacity-50">
        <p>APK Obfuscator © 2026 | Raw. Industrial. Commanding.</p>
      </footer>
    </div>
  );
}
