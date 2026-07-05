import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Download } from 'lucide-react';

export interface ObfuscationLog {
  id: number;
  jobId: number;
  fileType: 'asset' | 'class' | 'lib';
  originalName: string;
  obfuscatedName: string;
  filePath?: string | null;
  fileSize?: number | null;
  createdAt: Date;
}

interface ObfuscationLogsProps {
  logs: ObfuscationLog[];
  isLoading?: boolean;
}

export function ObfuscationLogs({ logs, isLoading = false }: ObfuscationLogsProps) {
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set(['asset', 'class', 'lib']));

  const toggleType = (type: string) => {
    const newExpanded = new Set(expandedTypes);
    if (newExpanded.has(type)) {
      newExpanded.delete(type);
    } else {
      newExpanded.add(type);
    }
    setExpandedTypes(newExpanded);
  };

  const groupedLogs = logs.reduce((acc, log) => {
    if (!acc[log.fileType]) {
      acc[log.fileType] = [];
    }
    acc[log.fileType].push(log);
    return acc;
  }, {} as Record<string, ObfuscationLog[]>);

  const typeLabels: Record<string, string> = {
    asset: 'Assets',
    class: 'Classes & Methods',
    lib: 'Libraries',
  };

  const typeDescriptions: Record<string, string> = {
    asset: 'Obfuscated asset filenames',
    class: 'Obfuscated class and method identifiers',
    lib: 'Obfuscated library files',
  };

  const exportLogs = () => {
    const csv = [
      ['File Type', 'Original Name', 'Obfuscated Name', 'File Path', 'Size (bytes)'],
      ...logs.map(log => [
        log.fileType,
        log.originalName,
        log.obfuscatedName,
        log.filePath || '',
        log.fileSize?.toString() || '',
      ]),
    ]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `obfuscation-logs-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading logs...</div>;
  }

  if (logs.length === 0) {
    return <div className="text-center py-8 text-gray-500">No obfuscation logs available</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-mono font-bold uppercase">Obfuscation Details</h3>
        <Button
          onClick={exportLogs}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Download size={16} />
          Export CSV
        </Button>
      </div>

      <div className="space-y-4">
        {Object.entries(groupedLogs).map(([type, typeLogs]) => (
          <div key={type} className="border-4 border-black">
            <button
              onClick={() => toggleType(type)}
              className="w-full px-6 py-4 bg-black text-white font-mono font-bold uppercase flex items-center justify-between hover:bg-gray-800 transition-colors"
            >
              <div className="text-left">
                <div className="text-lg">{typeLabels[type]}</div>
                <div className="text-xs font-normal text-gray-300">{typeDescriptions[type]}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">{typeLogs.length}</span>
                {expandedTypes.has(type) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
            </button>

            {expandedTypes.has(type) && (
              <div className="bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b-2 border-black">
                        <th className="px-4 py-3 text-left font-mono font-bold uppercase border-r-2 border-black">
                          Original
                        </th>
                        <th className="px-4 py-3 text-left font-mono font-bold uppercase border-r-2 border-black">
                          Obfuscated
                        </th>
                        {type === 'asset' && (
                          <th className="px-4 py-3 text-left font-mono font-bold uppercase border-r-2 border-black">
                            Path
                          </th>
                        )}
                        {type === 'asset' && (
                          <th className="px-4 py-3 text-left font-mono font-bold uppercase">Size</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {typeLogs.map((log, idx) => (
                        <tr
                          key={log.id}
                          className={`border-b border-gray-300 ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}
                        >
                          <td className="px-4 py-2 font-mono text-xs break-all border-r border-gray-300">
                            {log.originalName}
                          </td>
                          <td className="px-4 py-2 font-mono text-xs break-all border-r border-gray-300 text-red-600 font-bold">
                            {log.obfuscatedName}
                          </td>
                          {type === 'asset' && (
                            <td className="px-4 py-2 font-mono text-xs break-all border-r border-gray-300 text-gray-600">
                              {log.filePath}
                            </td>
                          )}
                          {type === 'asset' && (
                            <td className="px-4 py-2 font-mono text-xs text-gray-600">
                              {log.fileSize ? `${(log.fileSize / 1024).toFixed(2)} KB` : '-'}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-gray-100 p-4 border-2 border-black font-mono text-sm">
        <div className="font-bold mb-2">Summary</div>
        <div className="space-y-1 text-xs">
          <div>Total Files Obfuscated: {logs.length}</div>
          <div>Assets: {groupedLogs.asset?.length || 0}</div>
          <div>Classes/Methods: {groupedLogs.class?.length || 0}</div>
          <div>Libraries: {groupedLogs.lib?.length || 0}</div>
          {logs.some(l => l.fileSize) && (
            <div>
              Total Size: {(logs.reduce((sum, l) => sum + (l.fileSize || 0), 0) / 1024 / 1024).toFixed(2)} MB
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
