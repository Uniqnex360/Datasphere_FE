import { Sparkles, RefreshCw, FileText, X } from 'lucide-react';

interface BulkOperationsBarProps {
  selectedCount: number;
  onOperation: (operation: string) => void;
  onClear: () => void;
}

export default function BulkOperationsBar({ selectedCount, onOperation, onClear }: BulkOperationsBarProps) {
  const operations = [
    { id: 'normalize', label: 'Normalize All', icon: RefreshCw },
    { id: 'enrich', label: 'Enrich All', icon: Sparkles },
    { id: 'completeness-score', label: 'Score All', icon: FileText },
  ];

  return (
    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-purple-900">
          {selectedCount} product{selectedCount !== 1 ? 's' : ''} selected
        </span>
        <div className="flex gap-2">
          {operations.map((op) => {
            const Icon = op.icon;
            return (
              <button
                key={op.id}
                onClick={() => onOperation(op.id)}
                className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 text-sm"
              >
                <Icon className="w-4 h-4" />
                {op.label}
              </button>
            );
          })}
        </div>
      </div>
      <button
        onClick={onClear}
        className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg"
        title="Clear selection"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}
