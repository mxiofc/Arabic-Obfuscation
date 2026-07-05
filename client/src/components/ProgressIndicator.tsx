import { useEffect, useState } from 'react';

interface ProgressIndicatorProps {
  progress: number;
  currentStep: string;
  message: string;
  isComplete?: boolean;
  isError?: boolean;
}

const STEP_LABELS: Record<string, string> = {
  queued: 'Queued',
  initializing: 'Initializing',
  preparing: 'Preparing Workspace',
  extracting: 'Extracting APK',
  obfuscating_assets: 'Obfuscating Assets',
  obfuscating_dex: 'Obfuscating Classes.dex',
  obfuscating_lib: 'Obfuscating Libraries',
  repacking: 'Repacking APK',
  uploading: 'Uploading Result',
  cleanup: 'Cleaning Up',
  completed: 'Completed',
  error: 'Error',
};

export function ProgressIndicator({
  progress,
  currentStep,
  message,
  isComplete = false,
  isError = false,
}: ProgressIndicatorProps) {
  const [displayProgress, setDisplayProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayProgress(Math.min(progress, 100));
    }, 50);
    return () => clearTimeout(timer);
  }, [progress]);

  const stepLabel = STEP_LABELS[currentStep] || currentStep;

  return (
    <div className="w-full space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-baseline">
          <h3 className="text-xl font-mono font-bold uppercase">Processing</h3>
          <span className="text-sm font-mono font-bold">{displayProgress}%</span>
        </div>

        <div className="h-2 border-2 border-black overflow-hidden bg-white">
          <div
            className={`h-full transition-all duration-300 ${
              isError ? 'bg-red-600' : isComplete ? 'bg-black' : 'bg-black'
            }`}
            style={{ width: `${displayProgress}%` }}
          />
        </div>
      </div>

      {/* Current Step */}
      <div className="border-l-4 border-black pl-4 py-2">
        <p className="text-xs uppercase font-mono opacity-75">Current Step</p>
        <p className="text-lg font-mono font-bold uppercase mt-1">{stepLabel}</p>
      </div>

      {/* Message */}
      <div className={`p-4 border-2 ${isError ? 'border-red-600 bg-red-50' : 'border-black'}`}>
        <p className={`text-sm font-mono ${isError ? 'text-red-600' : 'text-black'}`}>
          {message}
        </p>
      </div>

      {/* Status Indicator */}
      <div className="flex items-center gap-3">
        <div
          className={`w-3 h-3 ${
            isError ? 'bg-red-600' : isComplete ? 'bg-black' : 'bg-black animate-pulse'
          }`}
        />
        <span className="text-xs font-mono uppercase">
          {isError ? 'Failed' : isComplete ? 'Complete' : 'Processing'}
        </span>
      </div>
    </div>
  );
}
