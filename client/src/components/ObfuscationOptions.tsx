import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface ObfuscationOptionsProps {
  obfuscateAssets: boolean;
  obfuscateDex: boolean;
  obfuscateLib: boolean;
  onAssetsChange: (checked: boolean) => void;
  onDexChange: (checked: boolean) => void;
  onLibChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function ObfuscationOptions({
  obfuscateAssets,
  obfuscateDex,
  obfuscateLib,
  onAssetsChange,
  onDexChange,
  onLibChange,
  disabled = false,
}: ObfuscationOptionsProps) {
  return (
    <div className="border-4 border-black p-8 space-y-6">
      <h3 className="text-2xl font-mono font-bold uppercase">Obfuscation Options</h3>

      <div className="space-y-4">
        <div className="flex items-center gap-4 p-4 border-b-2 border-black">
          <Checkbox
            id="assets"
            checked={obfuscateAssets}
            onCheckedChange={onAssetsChange}
            disabled={disabled}
            className="w-6 h-6 border-2 border-black"
          />
          <Label htmlFor="assets" className="flex-1 cursor-pointer">
            <div className="font-mono font-bold uppercase text-lg">Obfuscate Assets</div>
            <div className="text-sm opacity-75">Rename asset filenames with Arabic symbols</div>
          </Label>
        </div>

        <div className="flex items-center gap-4 p-4 border-b-2 border-black">
          <Checkbox
            id="dex"
            checked={obfuscateDex}
            onCheckedChange={onDexChange}
            disabled={disabled}
            className="w-6 h-6 border-2 border-black"
          />
          <Label htmlFor="dex" className="flex-1 cursor-pointer">
            <div className="font-mono font-bold uppercase text-lg">Obfuscate Classes.dex</div>
            <div className="text-sm opacity-75">Rename class and method identifiers</div>
          </Label>
        </div>

        <div className="flex items-center gap-4 p-4">
          <Checkbox
            id="lib"
            checked={obfuscateLib}
            onCheckedChange={onLibChange}
            disabled={disabled}
            className="w-6 h-6 border-2 border-black"
          />
          <Label htmlFor="lib" className="flex-1 cursor-pointer">
            <div className="font-mono font-bold uppercase text-lg">Obfuscate Libraries</div>
            <div className="text-sm opacity-75">Rename lib directory files and native libraries</div>
          </Label>
        </div>
      </div>

      <div className="pt-4 border-t-2 border-black text-xs opacity-75 font-mono">
        <p>All obfuscation uses small Arabic symbols (ۗۙۦ / ۗۘ) for maximum obscurity</p>
      </div>
    </div>
  );
}
