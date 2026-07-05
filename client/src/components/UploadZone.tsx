import { useRef, useState } from 'react';
import { Upload, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UploadZoneProps {
  onFileSelected: (file: File) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function UploadZone({ onFileSelected, isLoading = false, disabled = false }: UploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): boolean => {
    if (!file.name.toLowerCase().endsWith('.apk')) {
      setError('Only .apk files are supported');
      return false;
    }

    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      setError('File size must be less than 500MB');
      return false;
    }

    setError(null);
    return true;
  };

  const handleFileSelect = (file: File) => {
    if (validateFile(file)) {
      onFileSelected(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isLoading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled || isLoading) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-4 border-black p-12 transition-all duration-200
          ${isDragging ? 'bg-black text-white scale-[0.98]' : 'bg-white text-black'}
          ${disabled || isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-black hover:text-white'}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".apk"
          onChange={handleInputChange}
          disabled={disabled || isLoading}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center gap-6">
          <Upload size={64} strokeWidth={1.5} />

          <div className="text-center">
            <h3 className="text-2xl font-bold uppercase mb-2">
              {isDragging ? 'DROP APK HERE' : 'UPLOAD APK'}
            </h3>
            <p className="text-sm opacity-75">
              Drag and drop your APK file or click to browse
            </p>
          </div>

          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isLoading}
            variant="default"
            className="uppercase font-mono font-bold border-2 border-black bg-black text-white hover:bg-white hover:text-black transition-all"
          >
            {isLoading ? 'Processing...' : 'Select File'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-3 border-l-4 border-black pl-4">
          <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
          <p className="text-sm font-mono">{error}</p>
        </div>
      )}
    </div>
  );
}
