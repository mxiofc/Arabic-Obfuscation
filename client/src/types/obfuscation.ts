export interface ObfuscationJob {
  id: number;
  userId: number;
  originalFileName: string;
  originalFileKey: string;
  originalFileUrl: string;
  obfuscatedFileKey: string | null;
  obfuscatedFileUrl: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  currentStep: string | null;
  progress: number | null;
  obfuscateAssets: number | null;
  obfuscateDex: number | null;
  obfuscateLib: number | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
}

export interface ProcessingStep {
  step: string;
  progress: number;
  message: string;
}

export interface ObfuscationStats {
  assetsObfuscated: number;
  classesObfuscated: number;
  methodsObfuscated: number;
  libsObfuscated: number;
  totalSize: number;
  obfuscatedSize: number;
}
